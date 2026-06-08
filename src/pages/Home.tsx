import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '../components/Layout';
import FilterBar from '../components/FilterBar';
import ItemCard from '../components/ItemCard';
import { itemService } from '../services/item';
import type { Item, ItemFilters } from '../types';

const PAGE_SIZE = 12;

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ItemFilters>({
    page: 1,
    pageSize: PAGE_SIZE,
    sort: 'latest',
  });
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  const fetchItems = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await itemService.getItems(filters);
      
      if (isLoadMore) {
        setItems((prev) => [...prev, ...response.items]);
      } else {
        setItems(response.items);
        setVisibleItems(new Set());
      }
      
      setTotal(response.total);
      setHasMore(response.page * response.pageSize < response.total);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      items.forEach((item, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => new Set(prev).add(item.id));
        }, index * 50);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [items]);

  const handleFilterChange = (newFilters: ItemFilters) => {
    setFilters(newFilters);
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
      fetchItems(true);
    }
  }, [loadingMore, hasMore, fetchItems]);

  const handleScroll = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - 200) {
      handleLoadMore();
    }
  }, [loadingMore, hasMore, handleLoadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="masonry-item">
        <div className="bg-surface rounded-card overflow-hidden shadow-card animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-200 rounded-full" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">发现好物</h1>
          <p className="text-text-secondary">探索 {total} 件物品，找到你想要的</p>
        </div>

        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        {loading ? (
          <div className="masonry">{renderSkeletons()}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 mb-4 text-text-muted">
              <Search className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">暂无物品</h3>
            <p className="text-text-secondary text-center max-w-md">
              没有找到符合条件的物品，试试调整筛选条件或搜索其他关键词
            </p>
          </div>
        ) : (
          <>
            <div className="masonry">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'masonry-item transition-all duration-500',
                    visibleItems.has(item.id)
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4'
                  )}
                >
                  <ItemCard item={item} />
                </div>
              ))}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>加载中...</span>
                </div>
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <div className="text-center py-8 text-text-muted">
                已加载全部 {total} 件物品
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

