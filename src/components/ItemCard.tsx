import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Item, User } from '../types';
import { CATEGORY_COLORS, CONDITION_COLORS } from '../utils/constants';
import { formatDate, getInitials } from '../utils/format';
import { userService } from '../services/user';
import { itemService } from '../services/item';

interface ItemCardProps {
  item: Item;
}

const LOW_CREDIT_THRESHOLD = 60;

export default function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate();
  const [owner, setOwner] = useState<User | null>(null);
  const [isLowCredit, setIsLowCredit] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchOwner = async () => {
      const user = await userService.getUserById(item.userId);
      if (user) {
        setOwner(user);
        setIsLowCredit(user.creditScore < LOW_CREDIT_THRESHOLD);
      }
    };
    fetchOwner();
  }, [item.userId]);

  const handleClick = async () => {
    await itemService.incrementViews(item.id);
    navigate(`/item/${item.id}`);
  };

  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=FF6B35&color=fff&size=400`;

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group bg-surface rounded-card overflow-hidden shadow-card cursor-pointer transition-all duration-300 card-hover',
        isLowCredit && 'ring-2 ring-warning-400 ring-offset-2'
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {!imageError ? (
          <img
            src={item.images[0] || fallbackImage}
            alt={item.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <img
            src={fallbackImage}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              CATEGORY_COLORS[item.category]
            )}
          >
            {item.category}
          </span>
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              CONDITION_COLORS[item.condition]
            )}
          >
            {item.condition}
          </span>
        </div>

        {isLowCredit && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-warning-500 text-white rounded-full text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              低信用
            </div>
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 text-white rounded-full text-xs">
          <Eye className="w-3.5 h-3.5" />
          {item.viewCount}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-text-primary line-clamp-2 min-h-[3rem] mb-3 group-hover:text-primary-500 transition-colors">
          {item.title}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {owner?.avatar ? (
              <img
                src={owner.avatar}
                alt={owner.username}
                className={cn(
                  'w-7 h-7 rounded-full object-cover',
                  isLowCredit && 'ring-2 ring-warning-400'
                )}
              />
            ) : (
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-primary-500',
                  isLowCredit && 'ring-2 ring-warning-400 bg-warning-500'
                )}
              >
                {owner ? getInitials(owner.username) : '?'}
              </div>
            )}
            <span className="text-sm text-text-secondary truncate max-w-[100px]">
              {owner?.username || '未知用户'}
            </span>
          </div>

          <span className="text-xs text-text-muted">
            {formatDate(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
