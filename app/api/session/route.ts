import { NextRequest, NextResponse } from 'next/server';
import {
  createSession, deleteSession, getDatabase, getSessionUser, roles,
  sessionCookie, sessionLifetime, verifyPassword,
} from '../../../database/store.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  return NextResponse.json({ role: user?.role ?? null }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json().catch(() => null);
  if (typeof data?.identifier !== 'string' || typeof data.password !== 'string' ||
      !roles.includes(data.role) || data.identifier.length > 254 ||
      !data.password || data.password.length > 256) {
    return NextResponse.json({ error: 'Data login tidak valid.' }, { status: 400 });
  }

  const identifier = data.identifier.trim().toLowerCase();
  const { rows: [user] } = await getDatabase().query(`
    SELECT id, role, password_hash FROM users
    WHERE role = $1 AND (email = $2 OR ($1 = 'company' AND phone = $3))
  `, [data.role, identifier, identifier.replace(/[\s()-]/g, '')]);
  if (!(await verifyPassword(data.password, user?.password_hash)) || !user) {
    return NextResponse.json({ error: 'Email, nomor telepon, kata sandi, atau peran tidak cocok.' }, { status: 401 });
  }

  const token = await createSession(user.id, request.cookies.get(sessionCookie)?.value);
  const response = NextResponse.json({ role: user.role });
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https',
    path: '/',
    maxAge: sessionLifetime,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  await deleteSession(request.cookies.get(sessionCookie)?.value);
  const response = NextResponse.json({ role: null });
  response.cookies.delete(sessionCookie);
  return response;
}
