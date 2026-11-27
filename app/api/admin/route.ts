import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getSessionUser, sessionCookie } from '../../../database/store.mjs';
import { adminFilters, adminPageSize, type AdminDiagnostics, type AdminSection } from '../../utils/admin';
import { externalJobLimits, jobStreetUrl, type ExternalJobFields } from '../../utils/externalJobs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'private, no-store' };
const respond = (data: object, status = 200) => NextResponse.json(data, { status, headers });

const jobRows = `
  SELECT j.id, coalesce(j.details->>'title', '') AS title,
         coalesce(j.details->>'company', '') AS subtitle,
         CASE WHEN j.status = 'published' AND j.deadline < (now() AT TIME ZONE 'Asia/Jakarta')::date
              THEN 'closed' ELSE j.status END AS status,
         j.created_at AS date, j.external_url AS "externalUrl", coalesce(j.details->>'location', '') AS location
  FROM jobs j WHERE j.deleted_at IS NULL
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

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
    if (!user) return respond({ error: 'unauthenticated' }, 401);
    if (user.role !== 'admin') return respond({ error: 'forbidden' }, 403);

    const input = await request.json().catch(() => null);
    const id = input?.id;
    if (id != null && (!Number.isInteger(id) || id < 1 || id > 2147483647)) return respond({ error: 'invalid_fields' }, 400);
    const db = getDatabase();
    if (input?.action === 'external-status' && id != null && ['published', 'closed'].includes(input.status)) {
      const result = await db.query(`
        UPDATE jobs SET status = $2, published_at = CASE
          WHEN $2 = 'published' AND status = 'closed' THEN now() ELSE published_at END
        WHERE id = $1 AND external_url IS NOT NULL RETURNING id
      `, [id, input.status]);
      return result.rowCount ? respond({ id }) : respond({ error: 'not_found' }, 404);
    }
    if (input?.action !== 'save-external-job') return respond({ error: 'invalid_fields' }, 400);
    const url = typeof input.url === 'string' ? jobStreetUrl(input.url) : null;
    if (!url) return respond({ error: 'invalid_url' }, 400);

    const fields = {} as Omit<ExternalJobFields, 'url'>;
    for (const field of Object.keys(externalJobLimits) as (keyof typeof externalJobLimits)[]) {
      const value = typeof input[field] === 'string' ? input[field].trim() : '';
      if (!value || value.length > externalJobLimits[field] || value.includes('\0')) return respond({ error: 'invalid_fields' }, 400);
      fields[field] = value;
    }
    const details = JSON.stringify({
      ...fields, category: 'External', type: '', salary: '', experienceLevel: '', tags: [], requirements: [], deafFriendlyScore: 0,
    });
    const result = id == null ? await db.query(`
      WITH new_job AS (SELECT nextval(pg_get_serial_sequence('jobs', 'id'))::integer AS id)
      INSERT INTO jobs (id, external_url, status, published_at, details)
      SELECT id, $1, 'published', now(), $2::jsonb || jsonb_build_object('id', id) FROM new_job
      RETURNING id
    `, [url, details]) : await db.query(`
      UPDATE jobs SET external_url = $2, details = $3::jsonb || jsonb_build_object('id', id)
      WHERE id = $1 AND external_url IS NOT NULL RETURNING id
    `, [id, url, details]);
    return result.rowCount ? respond({ id: result.rows[0].id }, id == null ? 201 : 200) : respond({ error: 'not_found' }, 404);
  } catch (failure) {
    const error = failure as { code?: string; constraint?: string };
    if (error.code === '23505' && error.constraint === 'jobs_external_url_idx') return respond({ error: 'duplicate_url' }, 409);
    console.error('External listing unavailable:', error.code ?? 'unknown');
    return respond({ error: 'unavailable' }, 500);
  }
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
                 (SELECT count(*)::int FROM jobs WHERE deleted_at IS NULL AND status = 'published' AND (deadline IS NULL OR deadline >= (now() AT TIME ZONE 'Asia/Jakarta')::date)) AS published,
                 (SELECT count(*)::int FROM jobs WHERE deleted_at IS NULL AND status = 'draft') AS drafts,
                 (SELECT count(*)::int FROM jobs WHERE deleted_at IS NULL AND (status = 'closed' OR (status = 'published' AND deadline < (now() AT TIME ZONE 'Asia/Jakarta')::date))) AS closed,
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
