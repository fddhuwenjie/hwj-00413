import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Package, History, MessageSquare, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '../components/Layout';
import ItemCard from '../components/ItemCard';
import Empty from '../components/Empty';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/user';
import { itemService } from '../services/item';
import { exchangeService } from '../services/exchange';
import { reviewService } from '../services/review';
import { formatDate, formatDateTime, getInitials } from '../utils/format';
import { EXCHANGE_STATUS_COLORS } from '../utils/constants';
import type { User, Item, Exchange, Review } from '../types';

type TabType = 'items' | 'exchanges' | 'reviews';

const LOW_CREDIT_THRESHOLD = 60;

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [exchangeItems, setExchangeItems] = useState<Map<number, Item>>(new Map());
  const [exchangeUsers, setExchangeUsers] = useState<Map<number, User>>(new Map());
  const [reviewUsers, setReviewUsers] = useState<Map<number, User>>(new Map());
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  const targetUserId = userId ? parseInt(userId, 10) : currentUser?.id;
  const isOwnProfile = currentUser?.id === targetUserId;

  useEffect(() => {
    if (!targetUserId) return;

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [user, userItems, userExchanges, userReviews] = await Promise.all([
          userService.getUserById(targetUserId),
          itemService.getUserItems(targetUserId),
          exchangeService.getExchanges({ userId: targetUserId }),
          reviewService.getUserReviews(targetUserId),
        ]);

        setProfileUser(user);
        setItems(Array.isArray(userItems) ? userItems : []);
        setExchanges(userExchanges);
        setReviews(userReviews.reviews);
        setAverageRating(userReviews.averageRating);

        const itemIds = new Set<number>();
        const userIds = new Set<number>();

        userExchanges.forEach((exchange) => {
          if (exchange.itemId) itemIds.add(exchange.itemId);
          if (exchange.targetItemId) itemIds.add(exchange.targetItemId);
          const otherUserId = exchange.initiatorId === targetUserId
            ? exchange.responderId
            : exchange.initiatorId;
          userIds.add(otherUserId);
        });

        userReviews.reviews.forEach((review) => {
          userIds.add(review.reviewerId);
        });

        const [itemsMap, usersMap, reviewersMap] = await Promise.all([
          fetchItemsMap(Array.from(itemIds)),
          fetchUsersMap(Array.from(userIds)),
          fetchUsersMap(userReviews.reviews.map((r) => r.reviewerId)),
        ]);

        setExchangeItems(itemsMap);
        setExchangeUsers(usersMap);
        setReviewUsers(reviewersMap);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUserId]);

  const fetchItemsMap = async (ids: number[]): Promise<Map<number, Item>> => {
    const map = new Map<number, Item>();
    const results = await Promise.all(ids.map((id) => itemService.getItemById(id)));
    results.forEach((item) => {
      if (item) map.set(item.id, item);
    });
    return map;
  };

  const fetchUsersMap = async (ids: number[]): Promise<Map<number, User>> => {
    const map = new Map<number, User>();
    const uniqueIds = [...new Set(ids)];
    const results = await Promise.all(uniqueIds.map((id) => userService.getUserById(id)));
    results.forEach((user) => {
      if (user) map.set(user.id, user);
    });
    return map;
  };

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              size,
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  const getOtherUser = (exchange: Exchange): User | undefined => {
    const otherUserId = exchange.initiatorId === targetUserId
      ? exchange.responderId
      : exchange.initiatorId;
    return exchangeUsers.get(otherUserId);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        <Empty title="用户不存在" description="该用户可能已被删除或不存在" />
      </Layout>
    );
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'items', label: '发布的物品', icon: <Package className="w-4 h-4" /> },
    { key: 'exchanges', label: '交换历史', icon: <History className="w-4 h-4" /> },
    { key: 'reviews', label: '收到的评价', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              {profileUser.avatar ? (
                <img
                  src={profileUser.avatar}
                  alt={profileUser.username}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg">
                  {getInitials(profileUser.username)}
                </div>
              )}
              {profileUser.creditScore < LOW_CREDIT_THRESHOLD && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  低信用
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {profileUser.username}
                {isOwnProfile && (
                  <span className="ml-2 text-sm font-normal text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
                    我
                  </span>
                )}
              </h1>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                <div className="flex items-center gap-2 text-text-secondary">
                  <CreditCard className="w-4 h-4" />
                  <span>信用分：</span>
                  <span
                    className={cn(
                      'font-semibold',
                      profileUser.creditScore < LOW_CREDIT_THRESHOLD ? 'text-red-500' : 'text-text-primary'
                    )}
                  >
                    {profileUser.creditScore}
                  </span>
                </div>

                {averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    {renderStars(Math.round(averageRating))}
                    <span className="text-text-secondary text-sm">{averageRating.toFixed(1)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-text-secondary">
                  <Package className="w-4 h-4" />
                  <span>交换次数：</span>
                  <span className="font-semibold text-text-primary">{profileUser.exchangeCount}</span>
                </div>

                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar className="w-4 h-4" />
                  <span>注册时间：</span>
                  <span className="font-medium text-text-primary">{formatDate(profileUser.createdAt)}</span>
                </div>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={() => navigate(`/chat/${profileUser.id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  发送消息
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card overflow-hidden">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-50/50'
                    : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.key === 'items' && <span className="text-xs">({items.length})</span>}
                {tab.key === 'exchanges' && <span className="text-xs">({exchanges.length})</span>}
                {tab.key === 'reviews' && <span className="text-xs">({reviews.length})</span>}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'items' && (
              <div>
                {items.length === 0 ? (
                  <Empty title="暂无物品" description="该用户还没有发布任何物品" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exchanges' && (
              <div>
                {exchanges.length === 0 ? (
                  <Empty title="暂无交换记录" description="该用户还没有任何交换记录" />
                ) : (
                  <div className="space-y-4">
                    {exchanges.map((exchange) => {
                      const otherUser = getOtherUser(exchange);
                      const item = exchangeItems.get(exchange.itemId);
                      const targetItem = exchange.targetItemId ? exchangeItems.get(exchange.targetItemId) : null;
                      const isInitiator = exchange.initiatorId === targetUserId;

                      return (
                        <div
                          key={exchange.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => navigate(`/exchange/${exchange.id}`)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex -space-x-2">
                              {item && (
                                <img
                                  src={item.images[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=FF6B35&color=fff&size=64`}
                                  alt={item.title}
                                  className="w-14 h-14 rounded-lg object-cover border-2 border-white shadow"
                                />
                              )}
                              {targetItem && (
                                <img
                                  src={targetItem.images[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetItem.title)}&background=3B82F6&color=fff&size=64`}
                                  alt={targetItem.title}
                                  className="w-14 h-14 rounded-lg object-cover border-2 border-white shadow"
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-text-muted">
                                  {isInitiator ? '我发起' : '收到请求'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-text-muted" />
                                {otherUser?.avatar ? (
                                  <img
                                    src={otherUser.avatar}
                                    alt={otherUser.username}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                                    {otherUser ? getInitials(otherUser.username) : '?'}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-text-primary truncate">
                                  {otherUser?.username || '未知用户'}
                                </span>
                              </div>
                              <p className="text-sm text-text-secondary truncate">
                                {item?.title || '物品已删除'}
                                {targetItem && ` ↔ ${targetItem.title}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                EXCHANGE_STATUS_COLORS[exchange.status]
                              )}
                            >
                              {exchange.status}
                            </span>
                            <span className="text-xs text-text-muted whitespace-nowrap">
                              {formatDateTime(exchange.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <Empty title="暂无评价" description="该用户还没有收到任何评价" />
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const reviewer = reviewUsers.get(review.reviewerId);

                      return (
                        <div
                          key={review.id}
                          className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                        >
                          {reviewer?.avatar ? (
                            <img
                              src={reviewer.avatar}
                              alt={reviewer.username}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                              {reviewer ? getInitials(reviewer.username) : '?'}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-medium text-text-primary">
                                {reviewer?.username || '匿名用户'}
                              </span>
                              {renderStars(review.rating)}
                              <span className="text-xs text-text-muted ml-auto">
                                {formatDateTime(review.createdAt)}
                              </span>
                            </div>
                            <p className="text-text-secondary text-sm leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
