import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '../components/Layout';
import Empty from '../components/Empty';
import { useAuthStore } from '../store/authStore';
import { favoriteService } from '../services/favorite';
import { formatDateTime, formatPrice } from '../utils/format';
import { ITEM_STATUS_COLORS } from '../utils/constants';
import type { FavoriteWithItem } from '../types';

const INVALID_STATUSES = ['已下架', '已交换'];

export default function Favorites() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [favorites, setFavorites] = useState<FavoriteWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    fetchFavorites();
  }, [currentUser]);

  const fetchFavorites = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await favoriteService.getUserFavorites(currentUser.id);
      setFavorites(data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setRemovingId(itemId);
    try {
      const success = await favoriteService.removeFavorite(currentUser.id, itemId);
      if (success) {
        setFavorites((prev) => prev.filter((f) => f.itemId !== itemId));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleItemClick = (itemId: number, isInvalid: boolean) => {
    if (!isInvalid) {
      navigate(`/item/${itemId}`);
    }
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-500 fill-primary-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">我的收藏</h1>
              <p className="text-sm text-text-secondary">共 {favorites.length} 件收藏物品</p>
            </div>
          </div>
        </div>

        {favorites.length === 0 ? (
          <Empty
            title="暂无收藏"
            description="浏览物品时点击爱心即可收藏"
            icon={<Heart className="w-8 h-8 text-gray-400" />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map((favorite) => {
              const isInvalid = INVALID_STATUSES.includes(favorite.item.status);
              return (
                <div
                  key={favorite.id}
                  className={cn(
                    'bg-surface rounded-card shadow-card overflow-hidden transition-all duration-200',
                    isInvalid ? 'opacity-60' : 'hover:shadow-lg cursor-pointer'
                  )}
                  onClick={() => handleItemClick(favorite.item.id, isInvalid)}
                >
                  <div className="relative">
                    <img
                      src={favorite.item.images[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(favorite.item.title)}&background=FF6B35&color=fff&size=256`}
                      alt={favorite.item.title}
                      className="w-full h-48 object-cover"
                    />
                    {isInvalid && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-gray-800/80 text-white px-3 py-1.5 rounded-full">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">已失效</span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={(e) => handleRemoveFavorite(favorite.itemId, e)}
                      disabled={removingId === favorite.itemId}
                      className={cn(
                        'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                        removingId === favorite.itemId
                          ? 'bg-gray-200'
                          : 'bg-white/90 hover:bg-red-50 group'
                      )}
                    >
                      {removingId === favorite.itemId ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                      )}
                    </button>
                    <div className="absolute bottom-3 left-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          ITEM_STATUS_COLORS[favorite.item.status]
                        )}
                      >
                        {favorite.item.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className={cn(
                      'font-medium text-text-primary mb-2 line-clamp-1',
                      isInvalid && 'text-gray-500'
                    )}>
                      {favorite.item.title}
                    </h3>
                    <p className="text-lg font-bold text-primary-500 mb-3">
                      {formatPrice(favorite.item.price)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Clock className="w-3 h-3" />
                      <span>收藏于 {formatDateTime(favorite.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
