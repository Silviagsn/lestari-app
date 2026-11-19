import type { NextResponse } from 'next/server';
import { sessionCookie, sessionLifetime } from '../../database/store.mjs';

export function setSessionCookie(response: NextResponse, token: string, secure: boolean) {
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: sessionLifetime,
  });
}
