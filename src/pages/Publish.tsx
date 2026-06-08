import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { itemService } from '@/services/item';
import { CATEGORIES, CONDITIONS } from '@/types';
import { cn } from '@/lib/utils';
import type { Category, Condition } from '@/types';

export default function Publish() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as Category | '',
    condition: '' as Condition | '',
    images: [] as string[],
    exchangeDesire: '',
    price: 0,
  });

  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入物品标题';
    } else if (formData.title.length < 2) {
      newErrors.title = '标题至少2个字符';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入物品描述';
    } else if (formData.description.length < 10) {
      newErrors.description = '描述至少10个字符';
    }

    if (!formData.category) {
      newErrors.category = '请选择物品分类';
    }

    if (!formData.condition) {
      newErrors.condition = '请选择新旧程度';
    }

    if (formData.images.length === 0) {
      newErrors.images = '请至少添加一张图片';
    }

    if (!formData.exchangeDesire.trim()) {
      newErrors.exchangeDesire = '请输入期望交换描述';
    } else if (formData.exchangeDesire.length < 5) {
      newErrors.exchangeDesire = '期望交换描述至少5个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;

    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(imageUrl)) {
      setErrors((prev) => ({ ...prev, images: '请输入有效的图片URL' }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, imageUrl.trim()],
    }));
    setImageUrl('');
    setErrors((prev) => {
      const { images, ...rest } = prev;
      return rest;
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!currentUser) return;

    setIsSubmitting(true);

    try {
      const item = await itemService.createItem({
        userId: currentUser.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as Category,
        condition: formData.condition as Condition,
        images: formData.images,
        price: formData.price,
      });

      if (item) {
        navigate(`/item/${item.id}`);
      } else {
        setErrors((prev) => ({ ...prev, submit: '发布失败，请重试' }));
      }
    } catch (error) {
      console.error('Publish failed:', error);
      setErrors((prev) => ({ ...prev, submit: '发布失败，请重试' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-6">发布物品</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface rounded-card shadow-card p-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              物品标题 <span className="text-warning-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="请输入物品标题"
              className={cn(
                'w-full px-4 py-3 rounded-lg border transition-colors',
                errors.title
                  ? 'border-warning-500 focus:ring-warning-500'
                  : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-warning-500">{errors.title}</p>
            )}
          </div>

          <div className="bg-surface rounded-card shadow-card p-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              物品描述 <span className="text-warning-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="请详细描述物品的使用情况、购买时间等信息"
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
                errors.description
                  ? 'border-warning-500 focus:ring-warning-500'
                  : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-warning-500">{errors.description}</p>
            )}
          </div>

          <div className="bg-surface rounded-card shadow-card p-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              物品分类 <span className="text-warning-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as Category }))}
              className={cn(
                'w-full px-4 py-3 rounded-lg border transition-colors bg-white',
                errors.category
                  ? 'border-warning-500 focus:ring-warning-500'
                  : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
              )}
            >
              <option value="">请选择分类</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-warning-500">{errors.category}</p>
            )}
          </div>

          <div className="bg-surface rounded-card shadow-card p-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              新旧程度 <span className="text-warning-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {CONDITIONS.map((cond) => (
                <label
                  key={cond}
                  className={cn(
                    'px-4 py-2 rounded-full border cursor-pointer transition-all',
                    formData.condition === cond
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-gray-200 text-text-secondary hover:border-primary-300'
                  )}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={cond}
                    checked={formData.condition === cond}
                    onChange={(e) => setFormData((prev) => ({ ...prev, condition: e.target.value as Condition }))}
                    className="sr-only"
                  />
                  {cond}
                </label>
              ))}
            </div>
            {errors.condition && (
              <p className="mt-2 text-sm text-warning-500">{errors.condition}</p>
            )}
          </div>

          <div className="bg-surface rounded-card shadow-card p-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              物品图片 <span className="text-warning-500">*</span>
            </label>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                placeholder="请输入图片URL"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                添加
              </button>
            </div>

            {errors.images && (
              <p className="mb-3 text-sm text-warning-500">{errors.images}</p>
            )}

            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={img}
                      alt={`图片 ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Image+${index + 1}&background=FF6B35&color=fff&size=400`;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.images.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted text-sm">输入图片URL并点击添加按钮</p>
                <p className="text-text-muted text-xs mt-1">支持添加多张图片</p>
              </div>
            )}
          </div>

          <div className="bg-surface rounded-card shadow-card p-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              期望交换描述 <span className="text-warning-500">*</span>
            </label>
            <textarea
              value={formData.exchangeDesire}
              onChange={(e) => setFormData((prev) => ({ ...prev, exchangeDesire: e.target.value }))}
              placeholder="描述您期望交换的物品类型、品牌、条件等"
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
                errors.exchangeDesire
                  ? 'border-warning-500 focus:ring-warning-500'
                  : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
              )}
            />
            {errors.exchangeDesire && (
              <p className="mt-1 text-sm text-warning-500">{errors.exchangeDesire}</p>
            )}
          </div>

          <div className="bg-surface rounded-card shadow-card p-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              参考价格
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">¥</span>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">选填，仅供参考，实际交换以双方协商为准</p>
          </div>

          {errors.submit && (
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-warning-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full py-4 rounded-button font-medium text-white transition-all flex items-center justify-center gap-2',
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 shadow-button'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                发布中...
              </>
            ) : (
              '立即发布'
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
