export const reviewLimits = { name: 60, comment: 600, latest: 12 } as const;

export type CommunityReview = {
  id: number;
  displayName: string;
  comment: string;
  rating: number;
  updatedAt: string;
};

export type CommunityReviews = {
  items: CommunityReview[];
  own: CommunityReview | null;
};
