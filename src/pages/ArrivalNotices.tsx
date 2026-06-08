import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, Check, ChevronRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '../components/Layout';
import Empty from '../components/Empty';
import { useAuthStore } from '../store/authStore';
import { favoriteService } from '../services/favorite';
import { formatDateTime, formatPrice } from '../utils/format';
import { ITEM_STATUS_COLORS } from '../utils/constants';
import type { ArrivalNoticeWithItem } from '../types';

export default function ArrivalNotices() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [notices, setNotices] = useState<ArrivalNoticeWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    fetchNotices();
  }, [currentUser]);

  const fetchNotices = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await favoriteService.getArrivalNotices(currentUser.id);
      setNotices(data);
    } catch (error) {
      console.error('Failed to fetch arrival notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingId(id);
    try {
      const success = await favoriteService.markNoticeAsRead(id);
      if (success) {
        setNotices((prev) =>
          prev.map((notice) =>
            notice.id === id ? { ...notice, isRead: true } : notice
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notice as read:', error);
    } finally {
      setMarkingId(null);
    }
  };

  const handleItemClick = (itemId: number) => {
    navigate(`/item/${itemId}`);
  };

  const unreadCount = notices.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center relative">
                <Bell className="w-5 h-5 text-amber-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">到货提醒</h1>
                <p className="text-sm text-text-secondary">
                  共 {notices.length} 条通知，{unreadCount} 条未读
                </p>
              </div>
            </div>
          </div>
        </div>

        {notices.length === 0 ? (
          <Empty
            title="暂无到货提醒"
            description="发布求物信息后，当有匹配的物品上架时会收到提醒"
            icon={<Bell className="w-8 h-8 text-gray-400" />}
          />
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => handleItemClick(notice.matchedItem.id)}
                className={cn(
                  'bg-surface rounded-card shadow-card overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg',
                  !notice.isRead && 'ring-2 ring-primary-200'
                )}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0">
                    <img
                      src={notice.matchedItem.images[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(notice.matchedItem.title)}&background=F59E0B&color=fff&size=256`}
                      alt={notice.matchedItem.title}
                      className="w-full h-full object-cover"
                    />
                    {!notice.isRead && (
                      <div className="absolute top-3 left-3">
                        <span className="w-3 h-3 bg-red-500 rounded-full block" />
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          ITEM_STATUS_COLORS[notice.matchedItem.status]
                        )}
                      >
                        {notice.matchedItem.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-text-primary text-lg truncate">
                            {notice.matchedItem.title}
                          </h3>
                        </div>
                        <p className="text-lg font-bold text-primary-500 mb-2">
                          {formatPrice(notice.matchedItem.price)}
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 text-sm text-amber-700">
                            <Bell className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">匹配您的求物：</span>
                            <span className="truncate">{notice.wantedItem.title}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-auto">
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(notice.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {notice.isRead ? (
                            <>
                              <Check className="w-3 h-3 text-green-500" />
                              <span className="text-green-600">已读</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>未读</span>
                            </>
                          )}
                        </div>
                      </div>

                      {!notice.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notice.id, e)}
                          disabled={markingId === notice.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
                        >
                          {markingId === notice.id ? (
                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              标记已读
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
