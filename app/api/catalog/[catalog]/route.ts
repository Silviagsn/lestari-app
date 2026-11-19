import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getSessionUser, sessionCookie } from '../../../../database/store.mjs';

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
  applied_at AS "appliedDate", updated_at AS "lastUpdate"`;
const enrollmentColumns = `workshop_id AS "workshopId", status, progress,
  enrolled_at AS "enrolledDate", last_activity AS "lastActivity"`;

function isOptionalDate(value: unknown): value is string {
  if (value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request: NextRequest, { params: { catalog } }: Context) {
  if (!isCatalog(catalog)) return error('Katalog tidak ditemukan.', 404);
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  if (!user) return error('Silakan masuk kembali.', 401);

  const db = getDatabase();
  const { saved, id } = catalogs[catalog];
  const [items, savedItems, activity] = await Promise.all([
    db.query(`SELECT details FROM ${catalog} ORDER BY id`),
    db.query(`SELECT ${id} AS id FROM ${saved} WHERE user_id = $1 ORDER BY ${id}`, [user.id]),
    catalog === 'jobs'
      ? db.query(`SELECT ${applicationColumns} FROM applications WHERE user_id = $1 ORDER BY applied_at DESC`, [user.id])
      : db.query(`SELECT ${enrollmentColumns} FROM enrollments WHERE user_id = $1 ORDER BY enrolled_at DESC`, [user.id]),
  ]);
  return NextResponse.json({
    items: items.rows.map((row: { details: unknown }) => row.details),
    savedIds: savedItems.rows.map((row: { id: number }) => row.id),
    activity: activity.rows,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest, { params: { catalog } }: Context) {
  if (!isCatalog(catalog)) return error('Katalog tidak ditemukan.', 404);
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  if (!user) return error('Silakan masuk kembali.', 401);

  const data = await request.json().catch(() => null);
  if (!Number.isInteger(data?.id) || data.id < 1 || data.id > 2147483647) return error('ID tidak valid.', 400);
  const db = getDatabase();
  const item = await db.query(`SELECT 1 FROM ${catalog} WHERE id = $1`, [data.id]);
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
      INSERT INTO applications (
        user_id, job_id, name, email, phone, cover_letter, communication_preference,
        availability_date, salary_expectation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING
    `, [user.id, data.id, name.trim(), email.trim(), phone.trim(), coverLetter.trim(),
      communicationPreference, availabilityDate || null, salaryExpectation.trim()]);
    const { rows: [activity] } = await db.query(`
      SELECT ${applicationColumns} FROM applications WHERE user_id = $1 AND job_id = $2
    `, [user.id, data.id]);
    return NextResponse.json({ activity });
  }
  return error('Tindakan tidak valid.', 400);
}
