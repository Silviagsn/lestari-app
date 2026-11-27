export const reviewLimits = { comment: 600, latest: 12 } as const;

export function maskedReviewName(name: string): string {
  return name.trim().split(/\s+/u).slice(0, 2)
    .map(word => `${word.match(/[\p{L}\p{N}]/u)?.[0] ?? ''}***`)
    .join(' ');
}

export type CommunityReview = {
  id: number;
  displayName: string;
  comment: string;
  rating: number;
  updatedAt: string;
};

export type CommunityReviews = {
  items: CommunityReview[];
  own: OwnCommunityReview | null;
  authorName: string | null;
};

export type OwnCommunityReview = CommunityReview & { maskName: boolean | null };
