import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { createSession, getDatabase, hashPassword, sessionCookie } from '../../../database/store.mjs';
import { getGoogleSignup, googleSignupCookie } from '../../server/google';
import { setSessionCookie } from '../../server/session';
import { isSignupRole, signupProfile } from '../../utils/signup';
import {
  isAccountEmail, isAccountPassword, maximumPasswordLength, minimumPasswordLength,
} from '../../utils/accountPolicy.mjs';

export const runtime = 'nodejs';

const rateLimit = 6;
const signupWindowSeconds = 15 * 60;

async function reserveSignupAttempt(request: NextRequest) {
  const forwardedIp = process.env.RAILWAY_ENVIRONMENT_ID ? request.headers.get('x-real-ip') : request.ip;
  const ip = forwardedIp && isIP(forwardedIp) ? forwardedIp : '127.0.0.1';
  const db = getDatabase();
  await db.query('DELETE FROM signup_rate_limits WHERE expires_at <= now()');
  const result = await db.query(`
    INSERT INTO signup_rate_limits (client_ip, attempts, expires_at)
    VALUES ($1, 1, now() + $2 * interval '1 second')
    ON CONFLICT (client_ip) DO UPDATE SET
      attempts = signup_rate_limits.attempts + 1
    WHERE signup_rate_limits.attempts < $3
  `, [ip, signupWindowSeconds, rateLimit]);
  return result.rowCount === 1;
}

export async function POST(request: NextRequest) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return NextResponse.json({ error: 'Format pendaftaran tidak valid.' }, { status: 415 });
  }
  const data = await request.json().catch(() => null);
  const role = data?.role;
  if (!isSignupRole(role)) {
    return NextResponse.json({ error: 'Pilih Pencari Kerja atau Perusahaan.' }, { status: 400 });
  }
  if (data.method !== 'password' && data.method !== 'google') {
    return NextResponse.json({ error: 'Pilih cara mendaftar.' }, { status: 400 });
  }
  const usingGoogle = data.method === 'google';
  const google = usingGoogle ? getGoogleSignup(request.cookies.get(googleSignupCookie)?.value) : null;
  if (usingGoogle && google?.role !== role) {
    return NextResponse.json({ error: 'Sesi Google berakhir. Mulai lagi dari tombol Google.' }, { status: 401 });
  }
  const email = google?.email ?? (typeof data.email === 'string' ? data.email.trim().toLowerCase() : '');
  if (!isAccountEmail(email)) {
    return NextResponse.json({ error: 'Masukkan alamat email yang valid.' }, { status: 400 });
  }
  if (!usingGoogle && !isAccountPassword(data.password)) {
    return NextResponse.json({
      error: `Gunakan kata sandi ${minimumPasswordLength}–${maximumPasswordLength} karakter.`,
    }, { status: 400 });
  }
  const profile = signupProfile(data.profile, role);
  if (!profile) return NextResponse.json({ error: 'Periksa dan lengkapi isian profil wajib.' }, { status: 400 });

  try {
    if (!(await reserveSignupAttempt(request))) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }, {
        status: 429,
        headers: { 'Retry-After': String(signupWindowSeconds) },
      });
    }
    const passwordHash = usingGoogle ? null : await hashPassword(data.password);
    const { rows: [created] } = await getDatabase().query(`
      WITH new_account AS (
        INSERT INTO users (email, role, password_hash, google_sub)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id
      )
      INSERT INTO user_profiles (user_id, display_name, headline, location, about, communication, details)
      SELECT id, $5, $6, $7, $8, $9, $10 FROM new_account
      RETURNING user_id
    `, [
      email, role, passwordHash, google?.sub ?? null, profile.displayName, profile.headline, profile.location,
      profile.about, profile.communication, JSON.stringify(profile.details),
    ]);
    if (!created) {
      return NextResponse.json({ error: 'Email sudah terdaftar. Masuk dengan akun tersebut atau gunakan email lain.' }, {
        status: 409,
      });
    }
    const response = NextResponse.json({ email, role }, { status: 201 });
    if (usingGoogle) {
      const token = await createSession(created.user_id, request.cookies.get(sessionCookie)?.value);
      setSessionCookie(response, token, request.nextUrl.protocol === 'https:' ||
        request.headers.get('x-forwarded-proto') === 'https');
      response.cookies.delete(googleSignupCookie);
    }
    return response;
  } catch (error) {
    console.error('Pendaftaran Lestari gagal.', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'Pendaftaran sedang tidak tersedia. Coba lagi sebentar.' }, { status: 503 });
  }
}
