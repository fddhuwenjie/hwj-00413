import { request } from './api';
import type { ExchangeAgreement, LogisticsRecord, LogisticsStatus } from '../types';

export interface CreateLogisticsData {
  exchangeId: number;
  trackingNumber: string;
  company: string;
  senderId: number;
  receiverId: number;
}

export interface UpdateLogisticsStatusData {
  status: LogisticsStatus;
  description?: string;
  userId: number;
}

export const agreementService = {
  async createOrGetAgreement(exchangeId: number): Promise<ExchangeAgreement | null> {
    const result = await request<ExchangeAgreement>('get', `/agreements/exchange/${exchangeId}`);
    return result.success && result.data ? result.data : null;
  },

  async getAgreementByExchangeId(exchangeId: number): Promise<ExchangeAgreement | null> {
    const result = await request<ExchangeAgreement>('get', `/agreements/${exchangeId}/agreement`);
    return result.success && result.data ? result.data : null;
  },

  async signAgreement(agreementId: number, userId: number): Promise<ExchangeAgreement | null> {
    const result = await request<ExchangeAgreement>('put', `/agreements/${agreementId}/sign`, { userId });
    return result.success && result.data ? result.data : null;
  },

  async createLogistics(data: CreateLogisticsData): Promise<LogisticsRecord | null> {
    const result = await request<LogisticsRecord>('post', '/agreements/logistics', data);
    return result.success && result.data ? result.data : null;
  },

  async getLogisticsByExchangeId(exchangeId: number): Promise<LogisticsRecord | null> {
    const result = await request<LogisticsRecord>('get', `/agreements/logistics/exchange/${exchangeId}`);
    return result.success && result.data ? result.data : null;
  },

  async updateLogisticsStatus(
    logisticsId: number,
    data: UpdateLogisticsStatusData
  ): Promise<LogisticsRecord | null> {
    const result = await request<LogisticsRecord>('put', `/agreements/logistics/${logisticsId}/status`, data);
    return result.success && result.data ? result.data : null;
  },

  async confirmDelivery(logisticsId: number, userId: number): Promise<LogisticsRecord | null> {
    const result = await request<LogisticsRecord>('put', `/agreements/logistics/${logisticsId}/confirm`, { userId });
    return result.success && result.data ? result.data : null;
  },
};
