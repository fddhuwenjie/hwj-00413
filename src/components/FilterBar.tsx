import { useState } from 'react';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES, CONDITIONS, type Category, type Condition, type ItemFilters } from '../types';

interface FilterBarProps {
  filters: ItemFilters;
  onFilterChange: (filters: ItemFilters) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleCategoryChange = (category: Category | undefined) => {
    onFilterChange({ ...filters, category, page: 1 });
  };

  const handleConditionChange = (condition: Condition | undefined) => {
    onFilterChange({ ...filters, condition, page: 1 });
  };

  const handleSortChange = (sort: 'latest' | 'popular') => {
    onFilterChange({ ...filters, sort, page: 1 });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchInput.trim() || undefined, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onFilterChange({ ...filters, search: undefined, page: 1 });
  };

  const handleResetAll = () => {
    setSearchInput('');
    onFilterChange({
      category: undefined,
      condition: undefined,
      sort: 'latest',
      search: undefined,
      page: 1,
    });
  };

  const hasActiveFilters =
    filters.category || filters.condition || filters.search || filters.sort === 'popular';

  return (
    <div className="bg-surface rounded-card shadow-card p-4 mb-6">
      <form onSubmit={handleSearch} className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="搜索物品名称或描述..."
          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm input-focus transition-all"
        />
        {searchInput && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        )}
      </form>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">分类</label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                !filters.category
                  ? 'bg-primary-500 text-white shadow-button'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              )}
            >
              全部
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  filters.category === category
                    ? 'bg-primary-500 text-white shadow-button'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">新旧程度</label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => handleConditionChange(undefined)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                !filters.condition
                  ? 'bg-primary-500 text-white shadow-button'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              )}
            >
              全部
            </button>
            {CONDITIONS.map((condition) => (
              <button
                key={condition}
                onClick={() => handleConditionChange(condition)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  filters.condition === condition
                    ? 'bg-primary-500 text-white shadow-button'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                )}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">排序：</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleSortChange('latest')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  filters.sort === 'latest' || !filters.sort
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Clock className="w-4 h-4" />
                最新
              </button>
              <button
                onClick={() => handleSortChange('popular')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  filters.sort === 'popular'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <TrendingUp className="w-4 h-4" />
                热度
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetAll}
              className="text-sm text-text-muted hover:text-primary-500 transition-colors"
            >
              重置筛选
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
