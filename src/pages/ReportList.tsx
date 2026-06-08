import { useState, useEffect } from 'react';
import {
  Flag,
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Loader2,
  X,
  Send,
  AlertTriangle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Empty from '@/components/Empty';
import { useAuthStore } from '@/store/authStore';
import { reportService } from '@/services/report';
import { REPORT_STATUS_COLORS, REPORT_TYPE_COLORS } from '@/utils/constants';
import { formatDateTime, getInitials } from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  REPORT_TYPES,
  REPORT_STATUSES,
  type ReportType,
  type ReportStatus,
} from '@/types';
import type { ReportWithDetails } from '@/services/report';

interface HandleModalState {
  isOpen: boolean;
  reportId: number | null;
  action: 'approve' | 'reject' | null;
}

export default function ReportList() {
  const { currentUser } = useAuthStore();
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [handleModal, setHandleModal] = useState<HandleModalState>({
    isOpen: false,
    reportId: null,
    action: null,
  });
  const [handleNote, setHandleNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const filters = {
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      };
      const data = await reportService.getReports(filters);
      setReports(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openHandleModal = (reportId: number, action: 'approve' | 'reject') => {
    setHandleModal({ isOpen: true, reportId, action });
    setHandleNote('');
    setError('');
  };

  const closeHandleModal = () => {
    setHandleModal({ isOpen: false, reportId: null, action: null });
    setHandleNote('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!handleModal.reportId || !handleModal.action || !currentUser) return;
    if (!handleNote.trim()) {
      setError('请输入处理备注');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const status: ReportStatus =
        handleModal.action === 'approve' ? '已通过' : '已驳回';
      const result = await reportService.handleReport(handleModal.reportId, {
        handlerId: currentUser.id,
        status,
        handleNote: handleNote.trim(),
      });

      if (result) {
        closeHandleModal();
        fetchReports();
      } else {
        setError('处理失败，请稍后重试');
      }
    } catch (err) {
      console.error('Failed to handle report:', err);
      setError('处理失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetImage = (report: ReportWithDetails): string => {
    if (report.target?.images?.[0]) return report.target.images[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(report.target?.title || '物品')}&background=FF6B35&color=fff&size=400`;
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">举报管理</h1>
          <p className="text-text-secondary">审核和处理平台举报内容</p>
        </div>

        <div className="bg-surface rounded-card shadow-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">筛选条件</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-text-secondary mb-2 block">按状态</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    statusFilter === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  )}
                >
                  全部
                </button>
                {REPORT_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      statusFilter === status
                        ? REPORT_STATUS_COLORS[status]
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-text-secondary mb-2 block">按类型</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    typeFilter === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  )}
                >
                  全部
                </button>
                {REPORT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      typeFilter === type
                        ? REPORT_TYPE_COLORS[type]
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <Empty
            title="暂无举报记录"
            description="当前没有符合条件的举报内容"
          />
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-surface rounded-card shadow-card p-5 hover:shadow-card-hover transition-all"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={getTargetImage(report)}
                      alt={report.target?.title || '物品'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            REPORT_TYPE_COLORS[report.type]
                          )}
                        >
                          {report.type}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            REPORT_STATUS_COLORS[report.status]
                          )}
                        >
                          {report.status}
                        </span>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(report.createdAt)}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-medium text-text-primary mb-1 line-clamp-1">
                      {report.target?.title || '物品已删除'}
                    </h3>

                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                      {report.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <User className="w-4 h-4" />
                        <span className="flex items-center gap-1.5">
                          {report.reporter?.avatar ? (
                            <img
                              src={report.reporter.avatar}
                              alt={report.reporter.username}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                              {report.reporter
                                ? getInitials(report.reporter.username)
                                : '?'}
                            </div>
                          )}
                          {report.reporter?.username || '未知用户'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Package className="w-4 h-4" />
                        <span>
                          {report.targetType === 'item' ? '物品' : '交换'} #
                          {report.targetId}
                        </span>
                      </div>
                    </div>

                    {report.handler && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-text-secondary">
                          <span className="font-medium">处理人：</span>
                          {report.handler.username}
                          <span className="mx-2">|</span>
                          <span className="font-medium">处理时间：</span>
                          {report.handledAt && formatDateTime(report.handledAt)}
                        </p>
                        {report.handleNote && (
                          <p className="text-xs text-text-muted mt-1">
                            <span className="font-medium">处理备注：</span>
                            {report.handleNote}
                          </p>
                        )}
                      </div>
                    )}

                    {report.status === '待处理' && currentUser && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                        <button
                          onClick={() => openHandleModal(report.id, 'approve')}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-medium text-sm transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          通过
                        </button>
                        <button
                          onClick={() => openHandleModal(report.id, 'reject')}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          驳回
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {handleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeHandleModal}
          />
          <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    handleModal.action === 'approve'
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  )}
                >
                  {handleModal.action === 'approve' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {handleModal.action === 'approve' ? '通过举报' : '驳回举报'}
                </h2>
              </div>
              <button
                onClick={closeHandleModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div
                className={cn(
                  'p-3 rounded-lg',
                  handleModal.action === 'approve'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                )}
              >
                <p
                  className={cn(
                    'text-sm',
                    handleModal.action === 'approve'
                      ? 'text-green-700'
                      : 'text-red-700'
                  )}
                >
                  {handleModal.action === 'approve'
                    ? '确认通过该举报？举报内容将被标记为有效，并对被举报对象采取相应措施。'
                    : '确认驳回该举报？举报内容将被标记为无效。'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">
                  处理备注 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={handleNote}
                  onChange={(e) => setHandleNote(e.target.value)}
                  placeholder="请输入处理备注，说明处理原因..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-all"
                  maxLength={200}
                />
                <p className="text-xs text-text-muted text-right mt-1">
                  {handleNote.length}/200
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button
                onClick={closeHandleModal}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-text-secondary bg-gray-100 hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all',
                  submitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : handleModal.action === 'approve'
                    ? 'bg-green-500 text-white hover:bg-green-600 active:scale-[0.98]'
                    : 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]'
                )}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                确认{handleModal.action === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
