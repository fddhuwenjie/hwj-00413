import { request } from './api';
import type { Item, ItemFilters, PaginatedResponse } from '../types';

export const itemService = {
  async getItems(filters?: ItemFilters): Promise<PaginatedResponse<Item>> {
    const result = await request<PaginatedResponse<Item>>('get', '/items', undefined, filters as Record<string, unknown>);
    return result.success && result.data
      ? result.data
      : { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async getItemById(id: number): Promise<Item | null> {
    const result = await request<Item>('get', `/items/${id}`);
    return result.success && result.data ? result.data : null;
  },

  async createItem(
    data: Omit<Item, 'id' | 'viewCount' | 'likeCount' | 'createdAt' | 'status'>
  ): Promise<Item | null> {
    const result = await request<Item>('post', '/items', {
      ...data,
      status: '已上架',
    });
    return result.success && result.data ? result.data : null;
  },

  async incrementViews(id: number): Promise<void> {
    await request('put', `/items/${id}/views`);
  },

  async getUserItems(userId: number): Promise<Item[]> {
    const result = await request<Item[]>('get', '/items', undefined, { userId });
    return result.success && Array.isArray(result.data) ? result.data : [];
  },
};
