import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '../components/Layout';
import Empty from '../components/Empty';
import { useAuthStore } from '../store/authStore';
import { exchangeService } from '../services/exchange';
import { itemService } from '../services/item';
import { userService } from '../services/user';
import { reviewService } from '../services/review';
import { getInitials } from '../utils/format';
import type { Exchange, Item, User } from '../types';

export default function Review() {
  const { exchangeId } = useParams<{ exchangeId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [initiatorItem, setInitiatorItem] = useState<Item | null>(null);
  const [responderItem, setResponderItem] = useState<Item | null>(null);
  const [reviewee, setReviewee] = useState<User | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!exchangeId || !currentUser) return;

    const fetchExchangeData = async () => {
      setLoading(true);
      try {
        const exchangeData = await exchangeService.getExchangeById(parseInt(exchangeId, 10));
        if (!exchangeData) {
          setError('交换记录不存在');
          setLoading(false);
          return;
        }

        if (exchangeData.status !== '已完成') {
          setError('只有已完成的交换才能评价');
          setLoading(false);
          return;
        }

        const isInitiator = exchangeData.initiatorId === currentUser.id;
        const revieweeId = isInitiator ? exchangeData.responderId : exchangeData.initiatorId;

        if (exchangeData.initiatorId !== currentUser.id && exchangeData.responderId !== currentUser.id) {
          setError('您无权评价此交换');
          setLoading(false);
          return;
        }

        const existingReviews = await reviewService.getExchangeReviews(exchangeData.id);
        const hasReviewed = existingReviews.some((r) => r.reviewerId === currentUser.id);
        if (hasReviewed) {
          setError('您已经评价过此交换');
          setLoading(false);
          return;
        }

        const [initItem, respItem, revieweeData] = await Promise.all([
          itemService.getItemById(exchangeData.itemId),
          exchangeData.targetItemId ? itemService.getItemById(exchangeData.targetItemId) : Promise.resolve(null),
          userService.getUserById(revieweeId),
        ]);

        setExchange(exchangeData);
        setInitiatorItem(initItem);
        setResponderItem(respItem);
        setReviewee(revieweeData);
      } catch (err) {
        console.error('Failed to fetch exchange data:', err);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeData();
  }, [exchangeId, currentUser]);

  const handleSubmit = async () => {
    if (!exchange || !currentUser || !reviewee || rating === 0) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await reviewService.createReview({
        reviewerId: currentUser.id,
        revieweeId: reviewee.id,
        exchangeId: exchange.id,
        rating,
        comment: comment.trim(),
      });

      if (result) {
        setSubmitted(true);
        setTimeout(() => {
          navigate(`/profile/${currentUser.id}`);
        }, 1500);
      } else {
        setError('提交失败，请稍后重试');
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getItemImage = (item: Item | null) => {
    if (!item) return '';
    return item.images[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=FF6B35&color=fff&size=200`;
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

  if (error || !exchange) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <Empty title={error || '无法评价'} description="" />
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">评价提交成功</h2>
            <p className="text-text-secondary mb-4">感谢您的评价，正在跳转到个人中心...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <div className="bg-surface rounded-card shadow-card p-6">
          <h1 className="text-2xl font-bold text-text-primary mb-6">评价交换</h1>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h2 className="text-sm font-medium text-text-secondary mb-4">交换物品</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <img
                  src={getItemImage(initiatorItem)}
                  alt={initiatorItem?.title || '物品'}
                  className="w-24 h-24 rounded-lg object-cover mb-2"
                />
                <p className="text-sm font-medium text-text-primary text-center max-w-[120px] line-clamp-2">
                  {initiatorItem?.title || '物品已删除'}
                </p>
              </div>

              <div className="text-2xl text-text-muted">↔</div>

              <div className="flex flex-col items-center">
                {responderItem ? (
                  <>
                    <img
                      src={getItemImage(responderItem)}
                      alt={responderItem.title}
                      className="w-24 h-24 rounded-lg object-cover mb-2"
                    />
                    <p className="text-sm font-medium text-text-primary text-center max-w-[120px] line-clamp-2">
                      {responderItem.title}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-gray-400">¥</span>
                    </div>
                    <p className="text-sm font-medium text-text-primary">
                      {exchange.amount ? `¥${exchange.amount}` : '补差价'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-text-secondary mb-4">评价对象</h2>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {reviewee?.avatar ? (
                <img
                  src={reviewee.avatar}
                  alt={reviewee.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                  {reviewee ? getInitials(reviewee.username) : '?'}
                </div>
              )}
              <div>
                <p className="font-medium text-text-primary">{reviewee?.username || '未知用户'}</p>
                <p className="text-sm text-text-secondary">信用分：{reviewee?.creditScore || 0}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-text-secondary mb-4">
              评分 <span className="text-red-500">*</span>
            </h2>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-10 h-10 transition-colors',
                      (hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-text-secondary">
                  {rating === 1 && '非常差'}
                  {rating === 2 && '较差'}
                  {rating === 3 && '一般'}
                  {rating === 4 && '满意'}
                  {rating === 5 && '非常满意'}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-text-secondary mb-4">文字评价</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="请输入您对本次交换的评价..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-all"
              maxLength={500}
            />
            <p className="text-xs text-text-muted text-right mt-1">{comment.length}/500</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
              rating === 0 || submitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.98]'
            )}
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                提交评价
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
