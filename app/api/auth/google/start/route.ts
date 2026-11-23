import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createGoogleFlow, googleConfig, googleFlowCookie, randomOAuthValue, setGoogleBrowserCookie, type GoogleFlow } from '../../../../server/google';
import { isSignupRole, signupPath } from '../../../../utils/signup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role');
  const intent = request.nextUrl.searchParams.get('intent');
  if (!isSignupRole(role) || (intent !== 'login' && intent !== 'signup')) {
    return NextResponse.json({ error: 'Peran atau tujuan Google tidak valid.' }, { status: 400 });
  }
  const config = googleConfig();
  if (!config) {
    const destination = intent === 'signup' ? signupPath[role] : '/masuk';
    return NextResponse.redirect(new URL(`${destination}?google=unavailable&role=${role}`, request.url));
  }
  const flow: GoogleFlow = { role, intent, verifier: randomOAuthValue(), nonce: randomOAuthValue() };
  let registration;
  try {
    registration = await createGoogleFlow(flow, request.cookies.get(googleFlowCookie)?.value);
  } catch (error) {
    console.error('Gagal memulai sesi Google.', error instanceof Error ? error.name : 'UnknownError');
    const destination = intent === 'signup' ? signupPath[role] : '/masuk';
    const response = NextResponse.redirect(new URL(`${destination}?google=failed&role=${role}`, config.origin));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorization.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email',
    state: registration.state,
    nonce: flow.nonce,
    code_challenge: createHash('sha256').update(flow.verifier).digest('base64url'),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  const response = NextResponse.redirect(authorization);
  response.headers.set('Cache-Control', 'no-store');
  setGoogleBrowserCookie(response, config, registration.browserToken);
  return response;
}
