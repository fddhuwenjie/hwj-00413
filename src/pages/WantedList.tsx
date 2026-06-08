import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Clock, Tag, ToggleLeft, ToggleRight, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '../components/Layout';
import Empty from '../components/Empty';
import { useAuthStore } from '../store/authStore';
import { favoriteService } from '../services/favorite';
import { formatDateTime } from '../utils/format';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../utils/constants';
import { CATEGORIES } from '../types';
import type { WantedItem, Category } from '../types';

export default function WantedList() {
  const { currentUser } = useAuthStore();
  const [wantedItems, setWantedItems] = useState<WantedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    fetchWantedItems();
  }, [currentUser]);

  const fetchWantedItems = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await favoriteService.getUserWantedItems(currentUser.id);
      setWantedItems(data);
    } catch (error) {
      console.error('Failed to fetch wanted items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 10) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim()) return;

    try {
      const newItem = await favoriteService.createWantedItem({
        userId: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        category: category || undefined,
        keywords,
      });
      if (newItem) {
        setWantedItems((prev) => [newItem, ...prev]);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create wanted item:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setKeywordInput('');
    setKeywords([]);
    setShowForm(false);
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    setActionId(id);
    try {
      const updated = await favoriteService.updateWantedItemStatus(id, !isActive);
      if (updated) {
        setWantedItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      }
    } catch (error) {
      console.error('Failed to update wanted item status:', error);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条求物信息吗？')) return;
    setActionId(id);
    try {
      const success = await favoriteService.deleteWantedItem(id);
      if (success) {
        setWantedItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete wanted item:', error);
    } finally {
      setActionId(null);
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-surface rounded-card shadow-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">我的求物</h1>
                <p className="text-sm text-text-secondary">共 {wantedItems.length} 条求物信息</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              发布求物
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-surface rounded-card shadow-card p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">发布新求物</h2>
              <button
                onClick={resetForm}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入您想要求购的物品标题"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="详细描述您的需求，包括期望的品相、价格范围等"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  分类
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between text-left"
                  >
                    <span className={category ? 'text-text-primary' : 'text-text-muted'}>
                      {category ? CATEGORY_LABELS[category] : '选择分类（可选）'}
                    </span>
                    <ChevronDown className={cn(
                      'w-4 h-4 text-gray-400 transition-transform',
                      showCategoryDropdown && 'rotate-180'
                    )} />
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setCategory('');
                          setShowCategoryDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors',
                          !category && 'bg-primary-50 text-primary-600'
                        )}
                      >
                        不限分类
                      </button>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setShowCategoryDropdown(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors',
                            category === cat && 'bg-primary-50 text-primary-600'
                          )}
                        >
                          {CATEGORY_LABELS[cat]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  关键词
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入关键词后按回车添加，最多10个"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    disabled={!keywordInput.trim() || keywords.length >= 10}
                    className="px-4 py-2 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    添加
                  </button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3" />
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-1 hover:text-primary-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发布
                </button>
              </div>
            </form>
          </div>
        )}

        {wantedItems.length === 0 ? (
          <Empty
            title="暂无求物信息"
            description="发布求物信息，让其他用户知道您的需求"
            icon={<Search className="w-8 h-8 text-gray-400" />}
          />
        ) : (
          <div className="space-y-4">
            {wantedItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'bg-surface rounded-card shadow-card p-5 transition-all duration-200',
                  !item.isActive && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={cn(
                        'font-semibold text-text-primary text-lg',
                        !item.isActive && 'text-gray-500'
                      )}>
                        {item.title}
                      </h3>
                      {item.category && (
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          CATEGORY_COLORS[item.category]
                        )}>
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            <Tag className="w-3 h-3" />
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full font-medium',
                        item.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      )}>
                        {item.isActive ? '启用中' : '已停用'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(item.id, item.isActive)}
                      disabled={actionId === item.id}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title={item.isActive ? '停用' : '启用'}
                    >
                      {actionId === item.id ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      ) : item.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={actionId === item.id}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 group"
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                    </button>
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
