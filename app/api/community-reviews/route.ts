import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getSessionUser, sessionCookie } from '../../../database/store.mjs';
import { maskedReviewName, reviewLimits, type OwnCommunityReview } from '../../utils/communityReviews';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const columns = 'id, display_name AS "displayName", comment, rating, updated_at AS "updatedAt"';
const headers = { 'Cache-Control': 'private, no-store' };
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const session = (request: NextRequest) => getSessionUser(request.cookies.get(sessionCookie)?.value);

async function profileName(userId: number): Promise<string | null> {
  const { rows: [profile] } = await getDatabase().query(
    'SELECT display_name FROM user_profiles WHERE user_id = $1', [userId],
  );
  return profile?.display_name.trim() || null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await session(request);
    const [{ rows }, authorName] = await Promise.all([
      getDatabase().query(`
        SELECT ${columns}, mask_name AS "maskName", user_id = $1 AS own
        FROM community_reviews
        WHERE user_id = $1 OR id IN (
          SELECT id FROM community_reviews ORDER BY updated_at DESC, id DESC LIMIT $2
        )
        ORDER BY updated_at DESC, id DESC
      `, [user?.id ?? null, reviewLimits.latest]),
      user?.role === 'jobseeker' ? profileName(user.id) : null,
    ]);
    const entries = rows as (OwnCommunityReview & { own: boolean | null })[];
    const publicReviews = entries.map(({ own, maskName, ...review }) => review);
    const ownIndex = entries.findIndex(entry => entry.own);
    const own = ownIndex < 0 ? null : { ...publicReviews[ownIndex], maskName: entries[ownIndex].maskName };
    return respond({ items: publicReviews.slice(0, reviewLimits.latest), own, authorName });
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
    const comment = typeof input?.comment === 'string' ? input.comment.trim() : '';
    const { rating, maskName } = input ?? {};
    if (!comment || comment.length > reviewLimits.comment || comment.includes('\0') ||
      typeof maskName !== 'boolean' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return respond({ error: 'invalid_review' }, 400);
    }

    const authorName = await profileName(user.id);
    if (!authorName) return respond({ error: 'profile_name_required' }, 422);
    const name = maskName ? maskedReviewName(authorName) : authorName;
    const { rows: [review] } = await getDatabase().query(`
      INSERT INTO community_reviews (user_id, display_name, comment, rating, mask_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name,
        comment = EXCLUDED.comment, rating = EXCLUDED.rating, mask_name = EXCLUDED.mask_name, updated_at = now()
      RETURNING ${columns}, mask_name AS "maskName"
    `, [user.id, name, comment, rating, maskName]);
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
