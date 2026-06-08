import { request } from './api';
import type { StatsOverview, CategoryDistribution, WeeklyTrend, PopularItem } from '../types';

export const statsService = {
  async getOverview(): Promise<StatsOverview> {
    const result = await request<StatsOverview>('get', '/stats/overview');
    return result.success && result.data
      ? result.data
      : { totalItems: 0, todayNewItems: 0, completedExchanges: 0, ongoingExchanges: 0 };
  },

  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const result = await request<CategoryDistribution[]>('get', '/stats/category-distribution');
    return result.success && result.data ? result.data : [];
  },

  async getWeeklyTrend(): Promise<WeeklyTrend[]> {
    const result = await request<WeeklyTrend[]>('get', '/stats/weekly-trend');
    if (result.success && Array.isArray(result.data)) {
      return result.data.map((item: any) => ({
        week: item.week || item.date || '',
        count: item.count || 0,
      }));
    }
    return [];
  },

  async getPopularItems(): Promise<PopularItem[]> {
    const result = await request<PopularItem[]>('get', '/stats/popular-items');
    return result.success && result.data ? result.data : [];
  },
};
