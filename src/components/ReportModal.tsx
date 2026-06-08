import { useState } from 'react';
import { X, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REPORT_TYPES, type ReportType } from '@/types';
import { REPORT_TYPE_COLORS } from '@/utils/constants';
import { reportService } from '@/services/report';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'item' | 'exchange';
  targetId: number;
  reporterId: number;
  onSuccess?: () => void;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  reporterId,
  onSuccess,
}: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setSelectedType(null);
    setDescription('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('请选择举报类型');
      return;
    }
    if (!description.trim()) {
      setError('请输入举报说明');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await reportService.createReport({
        reporterId,
        targetType,
        targetId,
        type: selectedType,
        description: description.trim(),
      });

      if (result) {
        handleClose();
        onSuccess?.();
      } else {
        setError('提交失败，请稍后重试');
      }
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">举报</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              举报类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedType === type
                      ? REPORT_TYPE_COLORS[type]
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              举报说明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述举报原因，以便我们更好地处理..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-all"
              maxLength={500}
            />
            <p className="text-xs text-text-muted text-right mt-1">
              {description.length}/500
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              温馨提示：请确保举报内容真实有效，恶意举报可能会影响您的信用分。
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={handleClose}
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
                : 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]'
            )}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            提交举报
          </button>
        </div>
      </div>
    </div>
  );
}
