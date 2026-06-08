import { request } from './api';
import type { User, Review } from '../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const result = await request<User[]>('get', '/users');
    return result.success && result.data ? result.data : [];
  },

  async getUserById(id: number): Promise<User | null> {
    const result = await request<User>('get', `/users/${id}`);
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
};
