import { request } from './api';
import type { Report, ReportType, ReportStatus } from '../types';

export interface CreateReportData {
  reporterId: number;
  targetType: 'item' | 'exchange';
  targetId: number;
  type: ReportType;
  description: string;
}

export interface HandleReportData {
  handlerId: number;
  status: ReportStatus;
  handleNote?: string;
}

export interface ReportWithDetails extends Report {
  reporter: {
    id: number;
    username: string;
    avatar: string;
  } | null;
  handler: {
    id: number;
    username: string;
  } | null;
  target: {
    id: number;
    title: string;
    images: string[];
    status: string;
  } | null;
}

export const reportService = {
  async createReport(data: CreateReportData): Promise<Report | null> {
    const result = await request<Report>('post', '/reports', data);
    return result.success && result.data ? result.data : null;
  },

  async getReports(filters?: {
    status?: ReportStatus;
    targetType?: 'item' | 'exchange';
    reporterId?: number;
  }): Promise<ReportWithDetails[]> {
    const result = await request<ReportWithDetails[]>('get', '/reports', undefined, filters as Record<string, unknown>);
    return result.success && Array.isArray(result.data) ? result.data : [];
  },

  async getReportById(id: number): Promise<ReportWithDetails | null> {
    const result = await request<ReportWithDetails>('get', `/reports/${id}`);
    return result.success && result.data ? result.data : null;
  },

  async handleReport(id: number, data: HandleReportData): Promise<Report | null> {
    const result = await request<Report>('put', `/reports/${id}/handle`, data);
    return result.success && result.data ? result.data : null;
  },
};
