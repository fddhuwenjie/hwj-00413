import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  AlertTriangle,
  X,
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '../components/Layout';
import { itemService } from '../services/item';
import { userService } from '../services/user';
import { exchangeService } from '../services/exchange';
import { useAuthStore } from '../store/authStore';
import {
  CATEGORY_COLORS,
  CONDITION_COLORS,
  DEFAULT_USER_ID,
} from '../utils/constants';
import { formatDate, getInitials, formatPrice } from '../utils/format';
import type { Item, User } from '../types';

const LOW_CREDIT_THRESHOLD = 60;

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [item, setItem] = useState<Item | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const itemId = parseInt(id);
        const fetchedItem = await itemService.getItemById(itemId);
        if (fetchedItem) {
          setItem(fetchedItem);
          await itemService.incrementViews(itemId);
          const fetchedOwner = await userService.getUserById(fetchedItem.userId);
          setOwner(fetchedOwner);
        }
      } catch (error) {
        console.error('Failed to fetch item:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  useEffect(() => {
    const fetchUserItems = async () => {
      if (showExchangeModal && currentUser) {
        const items = await itemService.getUserItems(currentUser.id);
        const availableItems = items.filter(
          (i) => i.status === '已上架' && i.id !== item?.id
        );
        setUserItems(availableItems);
      }
    };
    fetchUserItems();
  }, [showExchangeModal, currentUser, item?.id]);

  const handlePrevImage = () => {
    if (!item) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? item.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!item) return;
    setCurrentImageIndex((prev) =>
      prev === item.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const handleExchangeClick = () => {
    if (!currentUser) {
      useAuthStore.getState().login(DEFAULT_USER_ID);
      return;
    }
    if (currentUser.id === item?.userId) {
      alert('不能交换自己发布的物品');
      return;
    }
    setShowExchangeModal(true);
  };

  const handleSubmitExchange = async () => {
    if (!item || !owner || !currentUser || selectedItemId === null) return;

    setSubmitting(true);
    try {
      const exchange = await exchangeService.createExchange({
        initiatorId: currentUser.id,
        responderId: item.userId,
        itemId: selectedItemId,
        targetItemId: item.id,
        message: message.trim(),
      });

      if (exchange) {
        setShowExchangeModal(false);
        navigate(`/exchange/${exchange.id}`);
      } else {
        alert('交换申请提交失败，请重试');
      }
    } catch (error) {
      console.error('Failed to create exchange:', error);
      alert('交换申请提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getFallbackImage = (title: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=FF6B35&color=fff&size=800`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="aspect-video bg-gray-200 rounded-card" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertTriangle className="w-16 h-16 text-warning-500 mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            物品不存在
          </h3>
          <p className="text-text-secondary mb-4">
            该物品可能已被删除或不存在
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary-500 text-white rounded-button hover:bg-primary-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </Layout>
    );
  }

  const isLowCredit = owner && owner.creditScore < LOW_CREDIT_THRESHOLD;

  return (
    <Layout>
      <div className="animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-primary-500 transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          返回
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-card bg-gray-100">
              {item.images.length > 0 ? (
                <>
                  <img
                    src={
                      imageErrors.has(currentImageIndex)
                        ? getFallbackImage(item.title)
                        : item.images[currentImageIndex]
                    }
                    alt={item.title}
                    onError={() => handleImageError(currentImageIndex)}
                    className="w-full h-full object-cover"
                  />
                  {item.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {item.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={cn(
                              'w-2 h-2 rounded-full transition-all',
                              currentImageIndex === index
                                ? 'bg-white w-6'
                                : 'bg-white/50 hover:bg-white/80'
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <img
                  src={getFallbackImage(item.title)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {item.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {item.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                      currentImageIndex === index
                        ? 'border-primary-500'
                        : 'border-transparent hover:border-primary-300'
                    )}
                  >
                    <img
                      src={imageErrors.has(index) ? getFallbackImage(item.title) : img}
                      alt={`${item.title} ${index + 1}`}
                      onError={() => handleImageError(index)}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    CATEGORY_COLORS[item.category]
                  )}
                >
                  {item.category}
                </span>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    CONDITION_COLORS[item.condition]
                  )}
                >
                  {item.condition}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {item.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{item.viewCount} 次浏览</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-primary-500">
                {formatPrice(item.price)}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                物品描述
              </h3>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            <div className="p-4 bg-surface rounded-card shadow-card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                发布者信息
              </h3>
              <div className="flex items-center gap-4">
                {owner?.avatar ? (
                  <img
                    src={owner.avatar}
                    alt={owner.username}
                    className={cn(
                      'w-14 h-14 rounded-full object-cover',
                      isLowCredit && 'ring-2 ring-warning-400'
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-white bg-primary-500',
                      isLowCredit && 'ring-2 ring-warning-400 bg-warning-500'
                    )}
                  >
                    {owner ? getInitials(owner.username) : '?'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      {owner?.username || '未知用户'}
                    </span>
                    {isLowCredit && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-warning-500 text-white rounded-full text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        低信用
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span className="text-text-secondary">
                      信用分：
                      <span
                        className={cn(
                          'font-semibold',
                          isLowCredit ? 'text-warning-500' : 'text-text-primary'
                        )}
                      >
                        {owner?.creditScore ?? 0}
                      </span>
                    </span>
                    <span className="text-text-secondary">
                      已交换 {owner?.exchangeCount ?? 0} 次
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleExchangeClick}
              className="w-full py-4 btn-gradient rounded-button text-lg font-semibold"
            >
              发起交换
            </button>
          </div>
        </div>
      </div>

      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card w-full max-w-lg max-h-[90vh] overflow-hidden animate-bounce-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-text-primary">发起交换</h3>
              <button
                onClick={() => setShowExchangeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              <div>
                <h4 className="font-semibold text-text-primary mb-3">
                  选择你要交换的物品
                </h4>
                {userItems.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    你还没有可交换的物品
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userItems.map((userItem) => (
                      <label
                        key={userItem.id}
                        className={cn(
                          'flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all',
                          selectedItemId === userItem.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        )}
                      >
                        <input
                          type="radio"
                          name="userItem"
                          value={userItem.id}
                          checked={selectedItemId === userItem.id}
                          onChange={() => setSelectedItemId(userItem.id)}
                          className="sr-only"
                        />
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={
                              userItem.images[0] ||
                              getFallbackImage(userItem.title)
                            }
                            alt={userItem.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">
                            {userItem.title}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {formatPrice(userItem.price)}
                          </p>
                        </div>
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                            selectedItemId === userItem.id
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          )}
                        >
                          {selectedItemId === userItem.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-3">
                  给对方留言
                </h4>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="写下你想对对方说的话，比如交换原因、期望的交换时间等..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm input-focus transition-all resize-none h-32"
                    maxLength={500}
                  />
                </div>
                <p className="text-right text-xs text-text-muted mt-1">
                  {message.length}/500
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={handleSubmitExchange}
                disabled={selectedItemId === null || submitting}
                className={cn(
                  'w-full py-3 rounded-button font-semibold transition-all flex items-center justify-center gap-2',
                  selectedItemId === null || submitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-gradient'
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    发送交换申请
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
