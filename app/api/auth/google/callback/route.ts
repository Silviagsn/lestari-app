import { NextRequest, NextResponse } from 'next/server';
import { createSession, getDatabase, sessionCookie } from '../../../../../database/store.mjs';
import {
  consumeGoogleFlow, googleConfig, googleFlowCookie, googleIdentity, type GoogleFlow,
} from '../../../../server/google';
import { setSessionCookie } from '../../../../server/session';
import { signupPath } from '../../../../utils/signup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const config = googleConfig();
  let flow: GoogleFlow | null = null;
  const redirect = (location: string) => {
    const response = NextResponse.redirect(new URL(location, config?.origin ?? request.url));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  };
  const failure = (reason: string) => {
    const destination = flow?.intent === 'signup' ? signupPath[flow.role] : '/masuk';
    return redirect(`${destination}?google=${reason}&role=${flow?.role ?? 'jobseeker'}`);
  };
  if (!config) return failure('unavailable');
  try {
    const state = request.nextUrl.searchParams.get('state');
    const browserToken = request.cookies.get(googleFlowCookie)?.value;
    flow = await consumeGoogleFlow(state, browserToken);
    if (!flow) {
      console.warn('Sesi Google tidak cocok.', { hasState: Boolean(state), hasBrowserCookie: Boolean(browserToken) });
      return failure('expired');
    }
    if (request.nextUrl.searchParams.has('error')) return failure('canceled');
    const code = request.nextUrl.searchParams.get('code');
    if (!code) return failure('expired');
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
    if (!token) return failure('failed');
    const response = redirect('/');
    setSessionCookie(response, token, config.secure);
    return response;
  } catch (error) {
    console.error('Login Google gagal.', error instanceof Error ? error.name : 'UnknownError');
    return failure('failed');
  }
}
