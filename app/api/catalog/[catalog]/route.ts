import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getSessionUser, sessionCookie } from '../../../../database/store.mjs';
import { isOptionalDate } from '../../../utils/recruitment';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: { catalog: string } };

const catalogs = {
  jobs: { saved: 'saved_jobs', id: 'job_id' },
  workshops: { saved: 'saved_workshops', id: 'workshop_id' },
} as const;

function isCatalog(value: string): value is keyof typeof catalogs {
  return value === 'jobs' || value === 'workshops';
}

const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

const applicationColumns = `job_id AS "jobId", status,
  applied_at AS "appliedDate", updated_at AS "lastUpdate",
  (SELECT details->>'title' FROM jobs WHERE jobs.id = applications.job_id) AS title`;
const enrollmentColumns = `workshop_id AS "workshopId", status, progress,
  enrolled_at AS "enrolledDate", last_activity AS "lastActivity"`;

const openListings = "deleted_at IS NULL AND status = 'published' AND (deadline IS NULL OR deadline >= (now() AT TIME ZONE 'Asia/Jakarta')::date)";

export async function GET(request: NextRequest, { params: { catalog } }: Context) {
  if (!isCatalog(catalog)) return error('Katalog tidak ditemukan.', 404);
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);

  const db = getDatabase();
  const { saved, id } = catalogs[catalog];
  const [items, account] = await Promise.all([
    catalog === 'jobs'
      ? db.query(`
          SELECT (CASE WHEN $1::boolean THEN details
            ELSE details - ARRAY['companyEmail', 'contactEmail', 'externalUrl'] END) || CASE
            WHEN external_url IS NOT NULL THEN jsonb_build_object('externalListing', true, 'posted', to_char(published_at, 'DD Mon YYYY'))
              || CASE WHEN $1::boolean THEN jsonb_build_object('externalUrl', external_url) ELSE '{}'::jsonb END
            WHEN company_user_id IS NOT NULL THEN jsonb_build_object('posted', to_char(published_at, 'DD Mon YYYY'))
            ELSE '{}'::jsonb END AS details
          FROM jobs WHERE ${openListings} ORDER BY published_at DESC NULLS LAST, id
        `, [Boolean(user)])
      : db.query('SELECT details FROM workshops ORDER BY id'),
    user ? Promise.all([
      catalog === 'jobs'
        ? db.query('SELECT s.job_id AS id FROM saved_jobs s JOIN jobs j ON j.id = s.job_id WHERE s.user_id = $1 AND j.deleted_at IS NULL ORDER BY s.job_id', [user.id])
        : db.query(`SELECT ${id} AS id FROM ${saved} WHERE user_id = $1 ORDER BY ${id}`, [user.id]),
      catalog === 'jobs'
        ? db.query(`SELECT ${applicationColumns} FROM applications WHERE user_id = $1 ORDER BY applied_at DESC`, [user.id])
        : db.query(`SELECT ${enrollmentColumns} FROM enrollments WHERE user_id = $1 ORDER BY enrolled_at DESC`, [user.id]),
    ]) : null,
  ]);
  return NextResponse.json({
    items: items.rows.map((row: { details: unknown }) => row.details),
    savedIds: account?.[0].rows.map((row: { id: number }) => row.id) ?? [],
    activity: account?.[1].rows ?? [],
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest, { params: { catalog } }: Context) {
  if (!isCatalog(catalog)) return error('Katalog tidak ditemukan.', 404);
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  if (!user) return error('Silakan masuk kembali.', 401);

  const data = await request.json().catch(() => null);
  if (!Number.isInteger(data?.id) || data.id < 1 || data.id > 2147483647) return error('ID tidak valid.', 400);
  const db = getDatabase();
  const item = await db.query(`SELECT ${catalog === 'jobs' ? 'external_url' : '1'} FROM ${catalog} WHERE id = $1${catalog === 'jobs' ? ` AND ${openListings}` : ''}`, [data.id]);
  if (!item.rowCount) {
    return error('Item tidak ditemukan.', 404);
  }
  const { saved, id } = catalogs[catalog];
  if (data.action === 'save' && typeof data.saved === 'boolean') {
    if (data.saved) {
      await db.query(`
        INSERT INTO ${saved} (user_id, ${id}) VALUES ($1, $2) ON CONFLICT DO NOTHING
      `, [user.id, data.id]);
    } else {
      await db.query(`DELETE FROM ${saved} WHERE user_id = $1 AND ${id} = $2`, [user.id, data.id]);
    }
    return NextResponse.json({ saved: data.saved });
  }

  if (catalog === 'workshops' && data.action === 'enroll') {
    await db.query(`
      INSERT INTO enrollments (user_id, workshop_id) VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [user.id, data.id]);
    const { rows: [activity] } = await db.query(`
      SELECT ${enrollmentColumns} FROM enrollments WHERE user_id = $1 AND workshop_id = $2
    `, [user.id, data.id]);
    return NextResponse.json({ activity });
  }
  if (catalog === 'jobs' && data.action === 'apply') {
    if (user.role !== 'jobseeker') return error('Gunakan akun pencari kerja untuk melamar.', 403);
    if (item.rows[0].external_url) return error('Lamaran lowongan eksternal dikirim melalui halaman sumber.', 409);
    const { name, email, phone, coverLetter, communicationPreference, availabilityDate, salaryExpectation } =
      data.application ?? {};
    if (typeof name !== 'string' || !name.trim() || name.length > 160 ||
        typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof phone !== 'string' || phone.length > 50 ||
        typeof coverLetter !== 'string' || coverLetter.length > 10000 ||
        !['email', 'text', 'video-asl', 'written-chat'].includes(communicationPreference) ||
        !isOptionalDate(availabilityDate) ||
        typeof salaryExpectation !== 'string' || salaryExpectation.length > 160) {
      return error('Periksa nama, email, dan isian lamaran.', 400);
    }
    await db.query(`
      WITH open_job AS (SELECT id FROM jobs WHERE id = $2 AND external_url IS NULL AND ${openListings} FOR SHARE)
      INSERT INTO applications (
        user_id, job_id, name, email, phone, cover_letter, communication_preference,
        availability_date, salary_expectation
      ) SELECT $1, id, $3, $4, $5, $6, $7, $8, $9 FROM open_job ON CONFLICT DO NOTHING
    `, [user.id, data.id, name.trim(), email.trim(), phone.trim(), coverLetter.trim(),
      communicationPreference, availabilityDate || null, salaryExpectation.trim()]);
    const { rows: [activity] } = await db.query(`
      SELECT ${applicationColumns} FROM applications WHERE user_id = $1 AND job_id = $2
    `, [user.id, data.id]);
    return activity ? NextResponse.json({ activity }) : error('Lowongan sudah tidak menerima lamaran.', 409);
  }
  return error('Tindakan tidak valid.', 400);
}
