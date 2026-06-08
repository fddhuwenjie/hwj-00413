import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import Empty from '@/components/Empty';
import { useAuthStore } from '@/store/authStore';
import { exchangeService } from '@/services/exchange';
import { itemService } from '@/services/item';
import { EXCHANGE_STATUS_COLORS } from '@/utils/constants';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Exchange, Item } from '@/types';

type TabType = 'initiator' | 'responder';

interface ExchangeWithItems extends Exchange {
  initiatorItem?: Item | null;
  responderItem?: Item | null;
}

export default function ExchangeList() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('initiator');
  const [exchanges, setExchanges] = useState<ExchangeWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetchExchanges();
  }, [currentUser, activeTab]);

  const fetchExchanges = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const data = await exchangeService.getExchanges({
        userId: currentUser.id,
        role: activeTab,
      });

      const exchangesWithItems = await Promise.all(
        data.map(async (exchange) => {
          const [initiatorItem, responderItem] = await Promise.all([
            itemService.getItemById(exchange.itemId),
            exchange.targetItemId ? itemService.getItemById(exchange.targetItemId) : null,
          ]);
          return {
            ...exchange,
            initiatorItem,
            responderItem,
          };
        })
      );

      setExchanges(exchangesWithItems);
    } catch (error) {
      console.error('Failed to fetch exchanges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getItemImage = (item: Item | null | undefined): string => {
    if (item?.images?.[0]) return item.images[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.title || '物品')}&background=FF6B35&color=fff&size=400`;
  };

  const handleViewDetail = (exchangeId: number) => {
    navigate(`/exchange/${exchangeId}`);
  };

  const handleChat = (exchangeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${exchangeId}`);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-6">交换记录</h1>

        <div className="flex bg-surface rounded-lg p-1 mb-6 shadow-card">
          <button
            onClick={() => setActiveTab('initiator')}
            className={cn(
              'flex-1 py-3 px-4 rounded-md font-medium transition-all',
              activeTab === 'initiator'
                ? 'bg-primary-500 text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            我发起的
          </button>
          <button
            onClick={() => setActiveTab('responder')}
            className={cn(
              'flex-1 py-3 px-4 rounded-md font-medium transition-all',
              activeTab === 'responder'
                ? 'bg-primary-500 text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            收到的请求
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : exchanges.length === 0 ? (
          <Empty
            title={activeTab === 'initiator' ? '暂无发起的交换' : '暂无收到的请求'}
            description={activeTab === 'initiator' ? '去发现页面找心仪的物品发起交换吧' : '等待其他用户向您发起交换请求'}
          />
        ) : (
          <div className="space-y-4">
            {exchanges.map((exchange) => (
              <div
                key={exchange.id}
                onClick={() => handleViewDetail(exchange.id)}
                className="bg-surface rounded-card shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={getItemImage(exchange.initiatorItem)}
                        alt={exchange.initiatorItem?.title || '物品'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <ArrowRight className="w-5 h-5 text-text-muted" />
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={getItemImage(exchange.responderItem)}
                        alt={exchange.responderItem?.title || '物品'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          EXCHANGE_STATUS_COLORS[exchange.status]
                        )}
                      >
                        {exchange.status}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatDate(exchange.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary line-clamp-1">
                      {exchange.initiatorItem?.title || '物品'} → {exchange.responderItem?.title || '物品'}
                    </p>
                    <p className="text-xs text-text-secondary line-clamp-1 mt-1">
                      {exchange.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleChat(exchange.id, e)}
                      className="p-2 text-text-muted hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <ArrowRight className="w-5 h-5 text-text-muted" />
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
