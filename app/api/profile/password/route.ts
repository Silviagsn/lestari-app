import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getSessionUser, hashPassword, replacePassword, sessionCookie, verifyPassword } from '../../../../database/store.mjs';
import { isAccountPassword, maximumPasswordLength } from '../../../utils/accountPolicy.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const response = (data: object, status = 200) => NextResponse.json(data, {
  status,
  headers: { 'Cache-Control': 'private, no-store' },
});

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  if (!user) return response({ error: 'session_expired' }, 401);
  const { rows: [account] } = await getDatabase().query('SELECT password_hash IS NOT NULL AS "hasPassword" FROM users WHERE id = $1', [user.id]);
  if (!account) return response({ error: 'session_expired' }, 401);
  return response({ hasPassword: account.hasPassword });
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get(sessionCookie)?.value;
  const user = await getSessionUser(token);
  if (!user) return response({ error: 'session_expired' }, 401);
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return response({ error: 'invalid_password' }, 415);
  }

  const data = await request.json().catch(() => null);
  const current = data?.currentPassword;
  const next = data?.newPassword;
  if (typeof current !== 'string' || !current || current.length > maximumPasswordLength || !isAccountPassword(next)) {
    return response({ error: 'invalid_password' }, 400);
  }
  if (current === next) return response({ error: 'same_password' }, 400);
  const { rows: [account] } = await getDatabase().query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
  if (!account) return response({ error: 'session_expired' }, 401);
  if (!account.password_hash) return response({ error: 'google_only' }, 409);
  if (!await verifyPassword(current, account.password_hash)) return response({ error: 'wrong_password' }, 400);

  const changed = await replacePassword(user.id, token, account.password_hash, await hashPassword(next));
  return changed ? response({ ok: true }) : response({ error: 'session_changed' }, 409);
}
