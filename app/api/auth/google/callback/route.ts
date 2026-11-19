import { NextRequest, NextResponse } from 'next/server';
import { createSession, getDatabase, sessionCookie } from '../../../../../database/store.mjs';
import {
  getGoogleFlow, googleConfig, googleFlowCookie, googleIdentity,
} from '../../../../server/google';
import { setSessionCookie } from '../../../../server/session';
import { signupPath } from '../../../../utils/signup';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const config = googleConfig();
  const flow = config && getGoogleFlow(config, request.cookies.get(googleFlowCookie)?.value);
  const redirect = (location: string) => {
    const response = NextResponse.redirect(new URL(location, config?.origin ?? request.url));
    response.headers.set('Cache-Control', 'no-store');
    response.cookies.delete(googleFlowCookie);
    return response;
  };
  const failure = (reason: string) => {
    const destination = flow?.intent === 'signup' ? signupPath[flow.role] : '/';
    return redirect(`${destination}?google=${reason}&role=${flow?.role ?? 'jobseeker'}`);
  };
  if (!config) return failure('unavailable');
  if (!flow || request.nextUrl.searchParams.get('state') !== flow.state) return failure('expired');
  if (request.nextUrl.searchParams.has('error')) return failure('canceled');
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return failure('expired');

  try {
    const identity = await googleIdentity(config, flow, code);
    if (!identity) return failure('unverified');
    const db = getDatabase();
    const findAccount = async () =>
      (await db.query('SELECT id, role FROM users WHERE google_sub = $1', [identity.sub])).rows[0];
    let account = await findAccount();

    if (!account && flow.intent === 'signup') {
      const { rows } = await db.query(`
        INSERT INTO users (email, role, google_sub) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        RETURNING id, role
      `, [identity.email, flow.role, identity.sub]);
      // A parallel signup might have inserted this Google account first.
      account = rows[0] ?? await findAccount();
    }

    if (!account) {
      const { rowCount } = await db.query('SELECT 1 FROM users WHERE email = $1', [identity.email]);
      if (rowCount) return failure('usePassword');
      return redirect(`${signupPath[flow.role]}?google=notRegistered`);
    }
    if (account.role !== flow.role) return failure('wrongRole');
    const token = await createSession(account.id, request.cookies.get(sessionCookie)?.value);
    const response = redirect('/');
    setSessionCookie(response, token, config.secure);
    return response;
  } catch (error) {
    console.error('Login Google gagal.', error instanceof Error ? error.name : 'UnknownError');
    return failure('failed');
  }
}
