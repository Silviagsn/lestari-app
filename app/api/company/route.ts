import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getSessionUser, sessionCookie } from '../../../database/store.mjs';
import { applicantStatuses, jobTextItems, readJobDraft } from '../../utils/recruitment';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'private, no-store' };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });
const validId = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2147483647;
const companyUser = (request: NextRequest) => getSessionUser(request.cookies.get(sessionCookie)?.value);

export async function GET(request: NextRequest) {
  const user = await companyUser(request);
  if (!user) return error('Silakan masuk kembali.', 401);
  if (user.role !== 'company') return error('Portal ini khusus akun perusahaan.', 403);

  const db = getDatabase();
  const [profile, jobs, applicants] = await Promise.all([
    db.query('SELECT display_name FROM user_profiles WHERE user_id = $1', [user.id]),
    db.query(`
      SELECT j.id, j.details, j.status, j.created_at AS "createdAt",
             coalesce(j.deadline < (now() AT TIME ZONE 'Asia/Jakarta')::date, false) AS expired,
             (SELECT count(*)::integer FROM applications a WHERE a.job_id = j.id) AS applicants
      FROM jobs j WHERE j.company_user_id = $1 ORDER BY j.created_at DESC, j.id DESC
    `, [user.id]),
    db.query(`
      SELECT a.job_id AS "jobId", a.user_id AS "applicantId", a.name, a.email, a.phone,
             a.cover_letter AS "coverLetter", a.communication_preference AS "communicationPreference",
             a.availability_date::text AS "availabilityDate", a.salary_expectation AS "salaryExpectation",
             a.status, a.applied_at AS "appliedAt"
      FROM applications a JOIN jobs j ON j.id = a.job_id
      WHERE j.company_user_id = $1 ORDER BY a.applied_at DESC
    `, [user.id]),
  ]);
  return NextResponse.json({
    companyName: profile.rows[0]?.display_name ?? '',
    jobs: jobs.rows.map(({ details, ...job }: { details: Record<string, unknown> }) => ({ ...details, ...job })),
    applicants: applicants.rows,
  }, { headers });
}

export async function POST(request: NextRequest) {
  const user = await companyUser(request);
  if (!user) return error('Silakan masuk kembali.', 401);
  if (user.role !== 'company') return error('Portal ini khusus akun perusahaan.', 403);
  const data = await request.json().catch(() => null);
  const db = getDatabase();

  if (data?.action === 'applicant-status' && validId(data.jobId) && validId(data.applicantId) &&
      typeof data.status === 'string' && Object.hasOwn(applicantStatuses, data.status)) {
    const result = await db.query(`
      UPDATE applications a SET status = $1, updated_at = now()
      FROM jobs j WHERE a.job_id = j.id AND j.company_user_id = $2 AND a.job_id = $3 AND a.user_id = $4
    `, [data.status, user.id, data.jobId, data.applicantId]);
    return result.rowCount ? NextResponse.json({ ok: true }, { headers }) : error('Lamaran tidak ditemukan.', 404);
  }

  if (data?.action === 'close-job' && validId(data.id)) {
    const result = await db.query("UPDATE jobs SET status = 'closed' WHERE id = $1 AND company_user_id = $2 AND status <> 'draft'", [data.id, user.id]);
    return result.rowCount ? NextResponse.json({ ok: true }, { headers }) : error('Lowongan tidak ditemukan.', 404);
  }

  if (data?.action !== 'save-job' || (data.id != null && !validId(data.id)) ||
      (data.status !== 'draft' && data.status !== 'published' && data.status !== 'closed') ||
      (data.id == null && data.status === 'closed')) {
    return error('Tindakan tidak valid.', 400);
  }
  const draft = readJobDraft(data.job);
  if (!draft) return error('Periksa judul dan isian lowongan.', 400);

  const { rows: [company] } = await db.query(`
    SELECT p.display_name AS name, ($2::date < (now() AT TIME ZONE 'Asia/Jakarta')::date) AS expired
    FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.id = $1
  `, [user.id, draft.deadline || null]);
  if (data.status === 'published') {
    if (!company?.name) return error('Lengkapi nama perusahaan di Profil Perusahaan sebelum menerbitkan lowongan.', 400);
    if (!draft.location || !draft.description || !draft.requirementsText || !draft.contactEmail || !draft.accessibilityOptions.length) {
      return error('Isi lokasi, deskripsi, persyaratan, email kontak, dan setidaknya satu dukungan aksesibilitas.', 400);
    }
    if (company.expired) return error('Batas lamaran sudah lewat.', 400);
  }

  const skills = jobTextItems(draft.skillsText);
  const details = JSON.stringify({
    ...draft,
    company: company?.name || 'Perusahaan',
    companyEmail: draft.contactEmail,
    requirements: jobTextItems(draft.requirementsText),
    responsibilities: jobTextItems(draft.responsibilitiesText),
    skills,
    benefits: jobTextItems(draft.benefitsText),
    accessibility: draft.accessibilityOptions.join(', '),
    isRemote: draft.arrangement === 'Remote',
    applicationDeadline: draft.deadline,
    tags: [...new Set([...skills, ...draft.accessibilityOptions])],
    urgency: 'low',
    isAccessibilityVerified: false,
    deafFriendlyScore: 0,
    companyListing: true,
  });
  const result = data.id == null
    ? await db.query(`
        WITH new_job AS (SELECT nextval(pg_get_serial_sequence('jobs', 'id'))::integer AS id)
        INSERT INTO jobs (id, company_user_id, status, deadline, published_at, details)
        SELECT id, $1::integer, $2::text, $3::date, CASE WHEN $2 = 'published' THEN now() ELSE null END,
               $4::jsonb || jsonb_build_object('id', id)
        FROM new_job RETURNING id
      `, [user.id, data.status, draft.deadline || null, details])
    : await db.query(`
        UPDATE jobs SET status = $3, deadline = $4,
          published_at = CASE WHEN $3 = 'published' THEN coalesce(published_at, now()) ELSE published_at END,
          details = $5::jsonb || jsonb_build_object('id', id)
        WHERE id = $1 AND company_user_id = $2 AND ($3 = 'published' OR status = $3) RETURNING id
      `, [data.id, user.id, data.status, draft.deadline || null, details]);
  return result.rowCount ? NextResponse.json({ id: result.rows[0].id }, { headers }) : error('Lowongan tidak ditemukan.', 404);
}
