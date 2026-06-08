import { request } from './api';
import type { Favorite, FavoriteWithItem, WantedItem, ArrivalNotice, ArrivalNoticeWithItem, Category } from '../types';

export interface CreateWantedItemData {
  userId: number;
  title: string;
  description: string;
  category?: Category;
  keywords: string[];
}

export const favoriteService = {
  async addFavorite(userId: number, itemId: number): Promise<Favorite | null> {
    const result = await request<Favorite>('post', '/favorites', { userId, itemId });
    return result.success && result.data ? result.data : null;
  },

  async removeFavorite(userId: number, itemId: number): Promise<boolean> {
    const result = await request('delete', '/favorites', { userId, itemId });
    return result.success;
  },

  async checkFavoriteStatus(userId: number, itemId: number): Promise<boolean> {
    const result = await request<{ isFavorited: boolean }>('get', '/favorites/check', undefined, { userId, itemId });
    return result.success && result.data?.isFavorited || false;
  },

  async getUserFavorites(userId: number): Promise<FavoriteWithItem[]> {
    const result = await request<FavoriteWithItem[]>('get', `/favorites/user/${userId}`);
    return result.success && Array.isArray(result.data) ? result.data : [];
  },

  async createWantedItem(data: CreateWantedItemData): Promise<WantedItem | null> {
    const result = await request<WantedItem>('post', '/favorites/wanted', data);
    return result.success && result.data ? result.data : null;
  },

  async getUserWantedItems(userId: number): Promise<WantedItem[]> {
    const result = await request<WantedItem[]>('get', `/favorites/wanted/user/${userId}`);
    return result.success && Array.isArray(result.data) ? result.data : [];
  },

  async updateWantedItemStatus(id: number, isActive: boolean): Promise<WantedItem | null> {
    const result = await request<WantedItem>('put', `/favorites/wanted/${id}/status`, { isActive });
    return result.success && result.data ? result.data : null;
  },

  async deleteWantedItem(id: number): Promise<boolean> {
    const result = await request('delete', `/favorites/wanted/${id}`);
    return result.success;
  },

  async getArrivalNotices(userId: number, isRead?: boolean): Promise<ArrivalNoticeWithItem[]> {
    const params: Record<string, unknown> = { userId };
    if (isRead !== undefined) {
      params.isRead = isRead;
    }
    const result = await request<ArrivalNoticeWithItem[]>('get', '/favorites/notices', undefined, params);
    return result.success && Array.isArray(result.data) ? result.data : [];
  },

  async markNoticeAsRead(id: number): Promise<boolean> {
    const result = await request('put', `/favorites/notices/${id}/read`);
    return result.success;
  },
};
