import { request } from './api';
import type { Review } from '../types';

export const reviewService = {
  async createReview(data: {
    reviewerId: number;
    revieweeId: number;
    exchangeId: number;
    rating: number;
    comment: string;
  }): Promise<Review | null> {
    const result = await request<Review>('post', '/reviews', data);
    return result.success && result.data ? result.data : null;
  },

  async getUserReviews(userId: number): Promise<{ reviews: Review[]; averageRating: number }> {
    const result = await request<{ reviews: Review[]; averageRating: number }>(
      'get',
      `/reviews/user/${userId}`
    );
    return result.success && result.data
      ? result.data
      : { reviews: [], averageRating: 0 };
  },

  async getExchangeReviews(exchangeId: number): Promise<Review[]> {
    const result = await request<Review[]>('get', '/reviews', undefined, { exchangeId });
    return result.success && result.data ? result.data : [];
  },
};
