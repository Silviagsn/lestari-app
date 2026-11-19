import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import type { NextResponse } from 'next/server';
import { isAccountEmail } from '../utils/accountPolicy.mjs';
import { isSignupRole, type SignupRole } from '../utils/signup';

export const googleFlowCookie = 'lestari_google_flow';
const flowLifetime = 10 * 60;
const idTokenVerifier = new OAuth2Client();

export type GoogleFlow = {
  role: SignupRole;
  intent: 'login' | 'signup';
  state: string;
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

function signature(secret: string, purpose: string, body: string) {
  return createHmac('sha256', secret).update(`lestari:${purpose}:${body}`).digest();
}

function writeCookie(response: NextResponse, config: Config, name: string, data: GoogleFlow, maxAge: number) {
  const body = Buffer.from(JSON.stringify({ ...data, expiresAt: Date.now() + maxAge * 1000 })).toString('base64url');
  const signed = signature(config.clientSecret, name, body).toString('base64url');
  response.cookies.set(name, `${body}.${signed}`, { httpOnly: true, sameSite: 'lax', secure: config.secure, path: '/', maxAge });
}

function readCookie(config: Config, name: string, value: string | undefined) {
  if (!value || value.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) return null;
  const [body, proof] = value.split('.');
  const actual = Buffer.from(proof, 'base64url');
  const expected = signature(config.clientSecret, name, body);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return data.expiresAt > Date.now() && isSignupRole(data.role) ? data : null;
  } catch {
    return null;
  }
}

export const randomOAuthValue = () => randomBytes(32).toString('base64url');

export function setGoogleFlow(response: NextResponse, config: Config, flow: GoogleFlow) {
  writeCookie(response, config, googleFlowCookie, flow, flowLifetime);
}

export function getGoogleFlow(config: Config, value: string | undefined): GoogleFlow | null {
  return readCookie(config, googleFlowCookie, value);
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
