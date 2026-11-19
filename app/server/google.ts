import { createHash, randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import type { NextResponse } from 'next/server';
import { isAccountEmail } from '../utils/accountPolicy.mjs';
import type { SignupRole } from '../utils/signup';
import { getDatabase } from '../../database/store.mjs';

export const googleFlowCookie = 'lestari_google_flow';
const flowLifetime = 10 * 60;
const idTokenVerifier = new OAuth2Client();

export type GoogleFlow = {
  role: SignupRole;
  intent: 'login' | 'signup';
  verifier: string;
  nonce: string;
};
type GoogleIdentity = { sub: string; email: string };

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
  try {
    const url = new URL(process.env.LESTARI_AUTH_ORIGIN || (railwayDomain ? `https://${railwayDomain}` : 'http://localhost:3000'));
    const local = url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    if ((!local && url.protocol !== 'https:') || (railwayDomain && local) || url.username || url.password) return null;
    return { clientId, clientSecret, origin: url.origin, redirectUri: url.origin + '/api/auth/google/callback', secure: !local };
  } catch {
    return null;
  }
}

type Config = NonNullable<ReturnType<typeof googleConfig>>;

export const randomOAuthValue = () => randomBytes(32).toString('base64url');
const hashOAuthValue = (value: string) => createHash('sha256').update(value).digest('hex');
const validOAuthState = (value: string | null): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
const validBrowserToken = (value: string | undefined): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

export async function createGoogleFlow(flow: GoogleFlow, previousToken: string | undefined) {
  const browserToken = validBrowserToken(previousToken) ? previousToken : randomBytes(32).toString('hex');
  const state = randomOAuthValue();
  const db = getDatabase();
  await db.query('DELETE FROM google_oauth_flows WHERE expires_at <= now()');
  await db.query(`
    INSERT INTO google_oauth_flows (state_hash, browser_hash, role, intent, verifier, nonce, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, now() + $7 * interval '1 second')
  `, [hashOAuthValue(state), hashOAuthValue(browserToken), flow.role, flow.intent, flow.verifier, flow.nonce, flowLifetime]);
  return { state, browserToken };
}

export function setGoogleBrowserCookie(response: NextResponse, config: Config, browserToken: string) {
  response.cookies.set(googleFlowCookie, browserToken, {
    httpOnly: true, sameSite: 'lax', secure: config.secure, path: '/', maxAge: flowLifetime,
  });
}

export async function consumeGoogleFlow(state: string | null, browserToken: string | undefined): Promise<GoogleFlow | null> {
  if (!validOAuthState(state) || !validBrowserToken(browserToken)) return null;
  const { rows } = await getDatabase().query(`
    DELETE FROM google_oauth_flows
    WHERE state_hash = $1 AND browser_hash = $2 AND expires_at > now()
    RETURNING role, intent, verifier, nonce
  `, [hashOAuthValue(state), hashOAuthValue(browserToken)]);
  return rows[0] ?? null;
}

export async function googleIdentity(config: Config, flow: GoogleFlow, code: string): Promise<GoogleIdentity | null> {
  const exchange = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: flow.verifier,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!exchange.ok) throw new Error('Google token exchange failed');
  const { id_token: idToken } = await exchange.json();
  if (typeof idToken !== 'string') throw new Error('Google ID token missing');
  const ticket = await idTokenVerifier.verifyIdToken({ idToken, audience: config.clientId });
  const identity = ticket.getPayload();
  if (identity?.nonce !== flow.nonce) throw new Error('Google nonce mismatch');
  const email = identity.email?.trim().toLowerCase();
  if (identity.email_verified !== true || !isAccountEmail(email) || !email ||
      typeof identity.sub !== 'string' || !identity.sub || identity.sub.length > 255) return null;
  return { sub: identity.sub, email };
}
