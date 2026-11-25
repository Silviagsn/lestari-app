import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getSessionUser, sessionCookie } from '../../../database/store.mjs';
import { adminFilters, adminPageSize, type AdminDiagnostics, type AdminSection } from '../../utils/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'private, no-store' };
const respond = (data: object, status = 200) => NextResponse.json(data, { status, headers });

const jobRows = `
  SELECT j.id, coalesce(j.details->>'title', '') AS title,
         coalesce(j.details->>'company', '') AS subtitle,
         CASE WHEN j.status = 'published' AND j.deadline < (now() AT TIME ZONE 'Asia/Jakarta')::date
              THEN 'closed' ELSE j.status END AS status,
         j.created_at AS date
  FROM jobs j
`;

const lists: Record<AdminSection, string> = {
  accounts: `
    SELECT u.id, coalesce(p.display_name, '') AS title, u.email AS subtitle, u.role AS status, u.created_at AS date
    FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id
  `,
  jobs: jobRows,
  workshops: `
    SELECT w.id, coalesce(w.details->>'title', '') AS title, coalesce(w.details->>'instructor', '') AS subtitle,
           coalesce(w.details->>'category', '') AS status
    FROM workshops w
  `,
};

async function readDiagnostics(db: ReturnType<typeof getDatabase>): Promise<AdminDiagnostics> {
  const started = performance.now();
  const { rows: [engine] } = await db.query("SELECT current_setting('server_version') AS version");
  const latencyMs = Math.round((performance.now() - started) * 10) / 10;
  const { rows: [snapshot] } = await db.query(`
    SELECT pg_database_size(current_database())::float8 AS size,
           (SELECT count(*)::int FROM schema_migrations) AS migrations,
           jsonb_build_object(
             'users', (SELECT count(*) FROM users),
             'profiles', (SELECT count(*) FROM user_profiles),
             'photos', (SELECT count(*) FROM profile_avatars),
             'jobs', (SELECT count(*) FROM jobs),
             'applications', (SELECT count(*) FROM applications),
             'workshops', (SELECT count(*) FROM workshops),
             'enrollments', (SELECT count(*) FROM enrollments),
             'savedJobs', (SELECT count(*) FROM saved_jobs),
             'savedWorkshops', (SELECT count(*) FROM saved_workshops)
           ) AS records
  `);
  const { heapUsed, rss } = process.memoryUsage();
  return {
    checkedAt: new Date().toISOString(),
    database: { version: engine.version, latencyMs, sizeBytes: snapshot.size, migrations: snapshot.migrations },
    records: snapshot.records,
    runtime: {
      version: process.version, platform: process.platform, architecture: process.arch,
      mode: process.env.NODE_ENV ?? 'unknown', uptimeSeconds: Math.floor(process.uptime()),
      heapBytes: heapUsed, rssBytes: rss,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
    if (!user) return respond({ error: 'unauthenticated' }, 401);
    if (user.role !== 'admin') return respond({ error: 'forbidden' }, 403);

    const db = getDatabase();
    const params = request.nextUrl.searchParams;
    const section = params.get('section') ?? 'overview';
    if (section === 'diagnostics') return respond(await readDiagnostics(db));
    if (section === 'pipeline') {
      const { rows } = await db.query('SELECT status, count(*)::int AS total FROM applications GROUP BY status');
      return respond({ counts: Object.fromEntries(rows.map(({ status, total }: { status: string; total: number }) => [status, total])) });
    }
    if (section === 'overview') {
      const [counts, recent] = await Promise.all([
        db.query(`
          SELECT (SELECT count(*)::int FROM users WHERE role = 'jobseeker') AS jobseekers,
                 (SELECT count(*)::int FROM users WHERE role = 'company') AS companies,
                 (SELECT count(*)::int FROM users WHERE role = 'admin') AS admins,
                 (SELECT count(*)::int FROM jobs WHERE status = 'published' AND (deadline IS NULL OR deadline >= (now() AT TIME ZONE 'Asia/Jakarta')::date)) AS published,
                 (SELECT count(*)::int FROM jobs WHERE status = 'draft') AS drafts,
                 (SELECT count(*)::int FROM jobs WHERE status = 'closed' OR (status = 'published' AND deadline < (now() AT TIME ZONE 'Asia/Jakarta')::date)) AS closed,
                 (SELECT count(*)::int FROM applications) AS applications,
                 (SELECT count(*)::int FROM workshops) AS workshops,
                 (SELECT count(*)::int FROM enrollments) AS enrollments
        `),
        db.query(`${jobRows} ORDER BY j.created_at DESC, j.id DESC LIMIT 5`),
      ]);
      return respond({ ...counts.rows[0], recentJobs: recent.rows });
    }

    if (!Object.hasOwn(lists, section)) return respond({ error: 'invalid_section' }, 400);
    const view = section as AdminSection;
    const query = (params.get('q') ?? '').trim().slice(0, 100);
    const filter = params.get('status') ?? '';
    const page = Number(params.get('page') ?? '1');
    if ((filter && !(adminFilters[view] as readonly string[]).includes(filter)) ||
        !Number.isInteger(page) || page < 1 || page > 1_000_000 || query.includes('\0')) {
      return respond({ error: 'invalid_filter' }, 400);
    }

    const { rows } = await db.query(`
      SELECT results.* ${view === 'jobs' ? ', (SELECT count(*)::int FROM applications a WHERE a.job_id = results.id) AS total' :
        view === 'workshops' ? ', (SELECT count(*)::int FROM enrollments e WHERE e.workshop_id = results.id) AS total' : ''}
      FROM (${lists[view]}) results
      WHERE ($1 = '' OR strpos(lower(results.title), lower($1)) > 0 OR strpos(lower(results.subtitle), lower($1)) > 0)
        AND ($2 = '' OR results.status = $2)
      ORDER BY ${view === 'workshops' ? 'lower(results.title), results.id' : 'results.date DESC, results.id DESC'}
      LIMIT $3 OFFSET $4
    `, [query, filter, adminPageSize + 1, (page - 1) * adminPageSize]);
    return respond({ items: rows.slice(0, adminPageSize), hasMore: rows.length > adminPageSize });
  } catch (failure) {
    console.error('Admin dashboard unavailable:', (failure as { code?: string })?.code ?? 'unknown');
    return respond({ error: 'unavailable' }, 500);
  }
}
