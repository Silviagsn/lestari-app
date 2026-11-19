import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { createUser, getDatabase } from '../../../database/store.mjs';
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
  const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
  if (role !== 'jobseeker' && role !== 'company') {
    return NextResponse.json({ error: 'Pilih Pencari Kerja atau Perusahaan.' }, { status: 400 });
  }
  if (!isAccountEmail(email)) {
    return NextResponse.json({ error: 'Masukkan alamat email yang valid.' }, { status: 400 });
  }
  if (!isAccountPassword(data.password)) {
    return NextResponse.json({
      error: `Gunakan kata sandi ${minimumPasswordLength}–${maximumPasswordLength} karakter.`,
    }, { status: 400 });
  }

  try {
    if (!(await reserveSignupAttempt(request))) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }, {
        status: 429,
        headers: { 'Retry-After': String(signupWindowSeconds) },
      });
    }
    if (!(await createUser(email, role, data.password))) {
      return NextResponse.json({ error: 'Email sudah terdaftar. Masuk dengan akun tersebut atau gunakan email lain.' }, {
        status: 409,
      });
    }
    return NextResponse.json({ email, role }, { status: 201 });
  } catch (error) {
    console.error('Pendaftaran Lestari gagal.', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'Pendaftaran sedang tidak tersedia. Coba lagi sebentar.' }, { status: 503 });
  }
}
