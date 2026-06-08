import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Star,
  Check,
  X,
  Loader2,
  Clock,
  ArrowRight,
  Handshake,
  Package,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { exchangeService } from '@/services/exchange';
import { itemService } from '@/services/item';
import { EXCHANGE_STATUS_COLORS } from '@/utils/constants';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Exchange, Item, ExchangeStatus } from '@/types';

interface TimelineEvent {
  status: ExchangeStatus;
  time: string | null;
  label: string;
  icon: React.ReactNode;
}

export default function ExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [initiatorItem, setInitiatorItem] = useState<Item | null>(null);
  const [responderItem, setResponderItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchExchangeDetail(Number(id));
  }, [id]);

  const fetchExchangeDetail = async (exchangeId: number) => {
    setIsLoading(true);
    try {
      const [exchangeData, initiatorItemData, responderItemData] = await Promise.all([
        exchangeService.getExchangeById(exchangeId),
        null,
        null,
      ]);

      if (exchangeData) {
        setExchange(exchangeData);
        const [item1, item2] = await Promise.all([
          itemService.getItemById(exchangeData.itemId),
          exchangeData.targetItemId ? itemService.getItemById(exchangeData.targetItemId) : null,
        ]);
        setInitiatorItem(item1);
        setResponderItem(item2);
      }
    } catch (error) {
      console.error('Failed to fetch exchange detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (status: ExchangeStatus) => {
    if (!exchange) return;
    setActionLoading(status);
    try {
      const updated = await exchangeService.updateStatus(exchange.id, status);
      if (updated) {
        setExchange(updated);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getItemImage = (item: Item | null): string => {
    if (item?.images?.[0]) return item.images[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.title || '物品')}&background=FF6B35&color=fff&size=400`;
  };

  const isInitiator = currentUser?.id === exchange?.initiatorId;
  const isResponder = currentUser?.id === exchange?.responderId;

  const getTimeline = (): TimelineEvent[] => {
    if (!exchange) return [];

    const events: TimelineEvent[] = [
      {
        status: '待确认',
        time: exchange.createdAt,
        label: '发起交换请求',
        icon: <Package className="w-5 h-5" />,
      },
    ];

    if (exchange.confirmedAt) {
      events.push({
        status: '已确认',
        time: exchange.confirmedAt,
        label: '双方确认交换',
        icon: <Check className="w-5 h-5" />,
      });
    }

    if (exchange.completedAt) {
      events.push({
        status: '已完成',
        time: exchange.completedAt,
        label: '交换完成',
        icon: <Handshake className="w-5 h-5" />,
      });
    }

    if (exchange.status === '已拒绝') {
      events.push({
        status: '已拒绝',
        time: exchange.createdAt,
        label: '交换被拒绝',
        icon: <X className="w-5 h-5" />,
      });
    }

    if (exchange.status === '已取消') {
      events.push({
        status: '已取消',
        time: exchange.createdAt,
        label: '交换已取消',
        icon: <X className="w-5 h-5" />,
      });
    }

    return events;
  };

  const getActionButtons = () => {
    if (!exchange || !currentUser) return null;

    const buttons: JSX.Element[] = [];

    if (exchange.status === '待确认') {
      if (isResponder) {
        buttons.push(
          <button
            key="accept"
            onClick={() => handleStatusUpdate('已确认')}
            disabled={actionLoading !== null}
            className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-button font-medium hover:bg-primary-600 transition-all shadow-button flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading === '已确认' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            接受交换
          </button>
        );
        buttons.push(
          <button
            key="reject"
            onClick={() => handleStatusUpdate('已拒绝')}
            disabled={actionLoading !== null}
            className="flex-1 py-3 px-4 bg-gray-100 text-text-secondary rounded-button font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading === '已拒绝' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <X className="w-5 h-5" />
            )}
            拒绝
          </button>
        );
      }
      if (isInitiator) {
        buttons.push(
          <button
            key="cancel"
            onClick={() => handleStatusUpdate('已取消')}
            disabled={actionLoading !== null}
            className="flex-1 py-3 px-4 bg-gray-100 text-text-secondary rounded-button font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading === '已取消' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <X className="w-5 h-5" />
            )}
            取消请求
          </button>
        );
      }
      buttons.push(
        <button
          key="chat"
          onClick={() => navigate(`/chat/${exchange.id}`)}
          className="flex-1 py-3 px-4 border border-primary-500 text-primary-500 rounded-button font-medium hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          发消息沟通
        </button>
      );
    }

    if (exchange.status === '已确认') {
      buttons.push(
        <button
          key="chat"
          onClick={() => navigate(`/chat/${exchange.id}`)}
          className="flex-1 py-3 px-4 border border-primary-500 text-primary-500 rounded-button font-medium hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          发消息沟通
        </button>
      );
      buttons.push(
        <button
          key="complete"
          onClick={() => handleStatusUpdate('已完成')}
          disabled={actionLoading !== null}
          className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-button font-medium hover:bg-primary-600 transition-all shadow-button flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {actionLoading === '已完成' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          确认完成
        </button>
      );
    }

    if (exchange.status === '进行中') {
      buttons.push(
        <button
          key="chat"
          onClick={() => navigate(`/chat/${exchange.id}`)}
          className="flex-1 py-3 px-4 border border-primary-500 text-primary-500 rounded-button font-medium hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          发消息沟通
        </button>
      );
      buttons.push(
        <button
          key="complete"
          onClick={() => handleStatusUpdate('已完成')}
          disabled={actionLoading !== null}
          className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-button font-medium hover:bg-primary-600 transition-all shadow-button flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {actionLoading === '已完成' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          确认完成
        </button>
      );
    }

    if (exchange.status === '已完成') {
      buttons.push(
        <button
          key="review"
          onClick={() => navigate(`/review/${exchange.id}`)}
          className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-button font-medium hover:bg-primary-600 transition-all shadow-button flex items-center justify-center gap-2"
        >
          <Star className="w-5 h-5" />
          去评价
        </button>
      );
    }

    return buttons.length > 0 ? buttons : null;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!exchange) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-text-secondary">交换记录不存在</p>
        </div>
      </Layout>
    );
  }

  const timeline = getTimeline();
  const actionButtons = getActionButtons();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-6">交换详情</h1>

        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">交换物品</h2>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                EXCHANGE_STATUS_COLORS[exchange.status]
              )}
            >
              {exchange.status}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img
                  src={getItemImage(initiatorItem)}
                  alt={initiatorItem?.title || '物品'}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium text-text-primary text-center">
                {initiatorItem?.title || '物品'}
              </h3>
              <p className="text-sm text-text-secondary text-center mt-1">
                {isInitiator ? '我的物品' : '对方物品'}
              </p>
            </div>

            <div className="flex-shrink-0">
              <ArrowRight className="w-8 h-8 text-text-muted" />
            </div>

            <div className="flex-1">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img
                  src={getItemImage(responderItem)}
                  alt={responderItem?.title || '物品'}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium text-text-primary text-center">
                {responderItem?.title || '物品'}
              </h3>
              <p className="text-sm text-text-secondary text-center mt-1">
                {isResponder ? '我的物品' : '对方物品'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">交换留言</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-text-primary">{exchange.message}</p>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">交换进度</h2>
          <div className="relative">
            {timeline.map((event, index) => (
              <div key={event.status} className="flex gap-4 mb-6 last:mb-0">
                <div className="relative">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      EXCHANGE_STATUS_COLORS[event.status]
                    )}
                  >
                    {event.icon}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{event.label}</span>
                    {event.time && (
                      <span className="text-sm text-text-muted flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDateTime(event.time)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {actionButtons && (
          <div className="flex gap-3">
            {actionButtons}
          </div>
        )}
      </div>
    </Layout>
  );
}
