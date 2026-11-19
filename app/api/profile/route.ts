import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getSessionUser, sessionCookie } from '../../../database/store.mjs';
import { editableProfile, type Profile } from '../../utils/profile';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'private, no-store' };
const unauthorized = () => NextResponse.json({ error: 'Silakan masuk kembali.' }, { status: 401, headers });

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  if (!user) return unauthorized();
  const { rows: [profile] } = await getDatabase().query(`
    SELECT users.email, users.role,
           coalesce(p.display_name, '') AS "displayName",
           coalesce(p.headline, '') AS headline, coalesce(p.location, '') AS location,
           coalesce(p.about, '') AS about, coalesce(p.communication, '') AS communication,
           coalesce(p.details, '{}'::jsonb) AS details, coalesce(p.is_demo, false) AS "isDemo",
           avatar.version AS "avatarVersion"
    FROM users LEFT JOIN user_profiles p ON p.user_id = users.id
    LEFT JOIN profile_avatars avatar ON avatar.user_id = users.id
    WHERE users.id = $1
  `, [user.id]);
  if (!profile) return unauthorized();
  return NextResponse.json(profile as Profile, { headers });
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(sessionCookie)?.value);
  if (!user) return unauthorized();
  const input = await request.json().catch(() => null);
  const profile = editableProfile(input, user.role);
  if (!profile) {
    return NextResponse.json({ error: 'Periksa nama dan isian profilmu.' }, { status: 400, headers });
  }

  const { rows: [saved] } = await getDatabase().query(`
    INSERT INTO user_profiles (user_id, display_name, headline, location, about, communication, details)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id) DO UPDATE
    SET display_name = excluded.display_name, headline = excluded.headline,
        location = excluded.location, about = excluded.about,
        communication = excluded.communication, details = excluded.details
    RETURNING is_demo AS "isDemo"
  `, [
    user.id, profile.displayName, profile.headline, profile.location, profile.about,
    profile.communication, JSON.stringify(profile.details),
  ]);
  return NextResponse.json({ ...profile, role: user.role, isDemo: saved.isDemo }, { headers });
}
