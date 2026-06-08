import { request } from './api';
import type { Exchange, ExchangeStatus } from '../types';

export const exchangeService = {
  async getExchanges(filters?: {
    userId?: number;
    status?: ExchangeStatus;
    role?: 'initiator' | 'responder';
  }): Promise<Exchange[]> {
    const result = await request<Exchange[]>('get', '/exchanges', undefined, filters);
    return result.success && result.data ? result.data : [];
  },

  async getExchangeById(id: number): Promise<Exchange | null> {
    const result = await request<Exchange>('get', `/exchanges/${id}`);
    return result.success && result.data ? result.data : null;
  },

  async createExchange(data: {
    initiatorId: number;
    responderId: number;
    itemId: number;
    targetItemId?: number;
    message: string;
  }): Promise<Exchange | null> {
    const result = await request<Exchange>('post', '/exchanges', {
      ...data,
      status: '待确认',
    });
    return result.success && result.data ? result.data : null;
  },

  async updateStatus(id: number, status: ExchangeStatus): Promise<Exchange | null> {
    const result = await request<Exchange>('put', `/exchanges/${id}/status`, { status });
    return result.success && result.data ? result.data : null;
  },
};
