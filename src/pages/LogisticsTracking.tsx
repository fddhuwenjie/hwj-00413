import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Truck,
  Check,
  Loader2,
  Clock,
  Package,
  Send,
  MapPin,
  User,
  ChevronDown,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { agreementService } from '@/services/agreement';
import { exchangeService } from '@/services/exchange';
import { userService } from '@/services/user';
import { LOGISTICS_STATUS_COLORS, LOGISTICS_COMPANIES } from '@/utils/constants';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { LogisticsRecord, LogisticsStatus, Exchange, User as UserType } from '@/types';

interface TimelineEvent {
  status: LogisticsStatus;
  time: string | null;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

export default function LogisticsTracking() {
  const { exchangeId } = useParams<{ exchangeId: string }>();
  const { currentUser } = useAuthStore();

  const [logistics, setLogistics] = useState<LogisticsRecord | null>(null);
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [sender, setSender] = useState<UserType | null>(null);
  const [receiver, setReceiver] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [trackingNumber, setTrackingNumber] = useState('');
  const [company, setCompany] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  useEffect(() => {
    if (!exchangeId) return;
    fetchLogisticsData(Number(exchangeId));
  }, [exchangeId]);

  const fetchLogisticsData = async (id: number) => {
    setIsLoading(true);
    try {
      const [logisticsData, exchangeData] = await Promise.all([
        agreementService.getLogisticsByExchangeId(id),
        exchangeService.getExchangeById(id),
      ]);

      setLogistics(logisticsData);
      setExchange(exchangeData);

      if (logisticsData) {
        const [senderData, receiverData] = await Promise.all([
          userService.getUserById(logisticsData.senderId),
          userService.getUserById(logisticsData.receiverId),
        ]);
        setSender(senderData);
        setReceiver(receiverData);
        setTrackingNumber(logisticsData.trackingNumber);
        setCompany(logisticsData.company);
      }
    } catch (error) {
      console.error('Failed to fetch logistics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLogistics = async () => {
    if (!exchange || !currentUser || !trackingNumber || !company) return;
    setActionLoading('create');
    try {
      const isSender = currentUser.id === exchange.initiatorId;
      const created = await agreementService.createLogistics({
        exchangeId: Number(exchangeId),
        trackingNumber,
        company,
        senderId: isSender ? exchange.initiatorId : exchange.responderId,
        receiverId: isSender ? exchange.responderId : exchange.initiatorId,
      });
      if (created) {
        setLogistics(created);
        const [senderData, receiverData] = await Promise.all([
          userService.getUserById(created.senderId),
          userService.getUserById(created.receiverId),
        ]);
        setSender(senderData);
        setReceiver(receiverData);
      }
    } catch (error) {
      console.error('Failed to create logistics:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (status: LogisticsStatus, description?: string) => {
    if (!logistics || !currentUser) return;
    setActionLoading(status);
    try {
      const updated = await agreementService.updateLogisticsStatus(logistics.id, {
        status,
        description,
        userId: currentUser.id,
      });
      if (updated) {
        setLogistics(updated);
      }
    } catch (error) {
      console.error('Failed to update logistics status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!logistics || !currentUser || !exchange) return;
    setActionLoading('confirm');
    try {
      const updated = await agreementService.confirmDelivery(logistics.id, currentUser.id);
      if (updated) {
        setLogistics(updated);
        if (updated.senderConfirmed && updated.receiverConfirmed) {
          await exchangeService.updateStatus(exchange.id, '已完成');
          const updatedExchange = await exchangeService.getExchangeById(exchange.id);
          setExchange(updatedExchange);
        }
      }
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getTimeline = (): TimelineEvent[] => {
    if (!logistics) return [];

    const events: TimelineEvent[] = [
      {
        status: '待发货',
        time: logistics.createdAt,
        label: '待发货',
        icon: <Package className="w-5 h-5" />,
      },
    ];

    const sentEvent = logistics.timeline.find((e) => e.status === '已发出');
    if (sentEvent) {
      events.push({
        status: '已发出',
        time: sentEvent.time,
        label: '已发出',
        icon: <Send className="w-5 h-5" />,
        description: sentEvent.description,
      });
    }

    const transitEvent = logistics.timeline.find((e) => e.status === '运输中');
    if (transitEvent) {
      events.push({
        status: '运输中',
        time: transitEvent.time,
        label: '运输中',
        icon: <Truck className="w-5 h-5" />,
        description: transitEvent.description,
      });
    }

    const deliveredEvent = logistics.timeline.find((e) => e.status === '已签收');
    if (deliveredEvent) {
      events.push({
        status: '已签收',
        time: deliveredEvent.time,
        label: '已签收',
        icon: <MapPin className="w-5 h-5" />,
        description: deliveredEvent.description,
      });
    }

    return events;
  };

  const isSender = currentUser?.id === exchange?.initiatorId;
  const isReceiver = currentUser?.id === exchange?.responderId;
  const hasLogistics = logistics !== null;
  const allConfirmed = logistics?.senderConfirmed && logistics?.receiverConfirmed;

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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Truck className="w-8 h-8 text-primary-500" />
          <h1 className="text-2xl font-bold text-text-primary">物流追踪</h1>
        </div>

        {!hasLogistics ? (
          <div className="bg-surface rounded-card shadow-card p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">录入物流信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  物流公司
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-left flex items-center justify-between"
                  >
                    <span className={cn(!company ? 'text-text-muted' : 'text-text-primary')}>
                      {company || '请选择物流公司'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                  </button>
                  {showCompanyDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {LOGISTICS_COMPANIES.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setCompany(c);
                            setShowCompanyDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 text-text-primary"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  快递单号
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="请输入快递单号"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                onClick={handleCreateLogistics}
                disabled={!company || !trackingNumber || actionLoading !== null}
                className="w-full py-3 bg-primary-500 text-white rounded-button font-medium hover:bg-primary-600 transition-all shadow-button flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === 'create' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                确认录入
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-card shadow-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">物流信息</h2>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    LOGISTICS_STATUS_COLORS[logistics.status]
                  )}
                >
                  {logistics.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-text-secondary mb-1">物流公司</p>
                  <p className="font-medium text-text-primary">{logistics.company}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-text-secondary mb-1">快递单号</p>
                  <p className="font-medium text-text-primary">{logistics.trackingNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">发货方</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={sender?.avatar}
                      alt={sender?.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-text-primary text-sm">{sender?.username}</p>
                      {logistics.senderConfirmed && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> 已确认签收
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">收货方</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={receiver?.avatar}
                      alt={receiver?.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-text-primary text-sm">{receiver?.username}</p>
                      {logistics.receiverConfirmed && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> 已确认签收
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-card shadow-card p-6 mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">物流进度</h2>
              <div className="relative">
                {timeline.map((event, index) => (
                  <div key={event.status} className="flex gap-4 mb-6 last:mb-0">
                    <div className="relative">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          LOGISTICS_STATUS_COLORS[event.status]
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
                      {event.description && (
                        <p className="text-sm text-text-secondary mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isSender && logistics.status === '待发货' && (
              <button
                onClick={() => handleUpdateStatus('已发出', '物品已发出')}
                disabled={actionLoading !== null}
                className="w-full py-3 bg-primary-500 text-white rounded-button font-medium hover:bg-primary-600 transition-all shadow-button flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
              >
                {actionLoading === '已发出' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                标记已发出
              </button>
            )}

            {isSender && logistics.status === '已发出' && (
              <button
                onClick={() => handleUpdateStatus('运输中', '物品正在运输中')}
                disabled={actionLoading !== null}
                className="w-full py-3 bg-primary-500 text-white rounded-button font-medium hover:bg-primary-600 transition-all shadow-button flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
              >
                {actionLoading === '运输中' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Truck className="w-5 h-5" />
                )}
                标记运输中
              </button>
            )}

            {isReceiver && logistics.status === '运输中' && (
              <button
                onClick={() => handleUpdateStatus('已签收', '物品已签收')}
                disabled={actionLoading !== null}
                className="w-full py-3 bg-primary-500 text-white rounded-button font-medium hover:bg-primary-600 transition-all shadow-button flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
              >
                {actionLoading === '已签收' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
                标记已签收
              </button>
            )}

            {logistics.status === '已签收' && !allConfirmed && (isSender || isReceiver) && (
              <button
                onClick={handleConfirmDelivery}
                disabled={actionLoading !== null}
                className="w-full py-3 bg-green-500 text-white rounded-button font-medium hover:bg-green-600 transition-all shadow-button flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === 'confirm' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                确认已收到物品
              </button>
            )}

            {allConfirmed && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                  <Check className="w-5 h-5" />
                  双方已确认签收，交换已完成
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
