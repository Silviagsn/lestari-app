import { NextResponse } from 'next/server';
import { getDatabase } from '../../../database/store.mjs';
import { openListings } from '../catalog/openListings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const { rows: [counts] } = await getDatabase().query(`
      SELECT
        (SELECT count(*)::int FROM jobs WHERE ${openListings}) AS jobs,
        (SELECT count(*)::int FROM users WHERE role IN ('jobseeker', 'company')) AS accounts,
        (SELECT count(*)::int FROM enrollments) AS enrollments,
        (SELECT count(*)::int FROM workshops) AS workshops
    `);
    return NextResponse.json(counts, { headers });
  } catch {
    return NextResponse.json({ error: 'stats_unavailable' }, { status: 503, headers });
  }
}
