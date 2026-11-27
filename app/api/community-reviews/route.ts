import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getSessionUser, sessionCookie } from '../../../database/store.mjs';
import { reviewLimits, type CommunityReview } from '../../utils/communityReviews';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const columns = 'id, display_name AS "displayName", comment, rating, updated_at AS "updatedAt"';
const headers = { 'Cache-Control': 'private, no-store' };
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const session = (request: NextRequest) => getSessionUser(request.cookies.get(sessionCookie)?.value);

export async function GET(request: NextRequest) {
  try {
    const user = await session(request);
    const { rows } = await getDatabase().query(`
      SELECT ${columns}, user_id = $1 AS own
      FROM community_reviews
      WHERE user_id = $1 OR id IN (
        SELECT id FROM community_reviews ORDER BY updated_at DESC, id DESC LIMIT $2
      )
      ORDER BY updated_at DESC, id DESC
    `, [user?.id ?? null, reviewLimits.latest]);
    const entries = rows as (CommunityReview & { own: boolean | null })[];
    const reviews = entries.map(({ own, ...review }) => review);
    return respond({ items: reviews.slice(0, reviewLimits.latest), own: reviews[entries.findIndex(entry => entry.own)] ?? null });
  } catch {
    return respond({ error: 'unavailable' }, 503);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await session(request);
    if (!user) return respond({ error: 'sign_in_required' }, 401);
    if (user.role !== 'jobseeker') return respond({ error: 'forbidden' }, 403);

    const input = await request.json().catch(() => null);
    const name = typeof input?.displayName === 'string' ? input.displayName.trim() : '';
    const comment = typeof input?.comment === 'string' ? input.comment.trim() : '';
    const rating = input?.rating;
    if (!name || name.length > reviewLimits.name || !comment || comment.length > reviewLimits.comment ||
      name.includes('\0') || comment.includes('\0') || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return respond({ error: 'invalid_review' }, 400);
    }

    const { rows: [review] } = await getDatabase().query(`
      INSERT INTO community_reviews (user_id, display_name, comment, rating)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name,
        comment = EXCLUDED.comment, rating = EXCLUDED.rating, updated_at = now()
      RETURNING ${columns}
    `, [user.id, name, comment, rating]);
    return respond(review);
  } catch {
    return respond({ error: 'unavailable' }, 503);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await session(request);
    if (!user) return respond({ error: 'sign_in_required' }, 401);
    if (user.role !== 'jobseeker') return respond({ error: 'forbidden' }, 403);
    await getDatabase().query('DELETE FROM community_reviews WHERE user_id = $1', [user.id]);
    return respond({ removed: true });
  } catch {
    return respond({ error: 'unavailable' }, 503);
  }
}
