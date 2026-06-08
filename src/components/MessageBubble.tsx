import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '../types';
import { formatDateTime } from '../utils/format';
import { useAuthStore } from '../store/authStore';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  avatarUrl?: string;
}

export default function MessageBubble({ message, showAvatar, avatarUrl }: MessageBubbleProps) {
  const { currentUser } = useAuthStore();
  const isOwn = currentUser?.id === message.senderId;

  return (
    <div
      className={cn(
        'flex gap-3 mb-3',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {showAvatar && (
        <div className="flex-shrink-0">
          <img
            src={avatarUrl || `https://ui-avatars.com/api/?name=${message.senderId}&background=FF6B35&color=fff`}
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
        </div>
      )}
      {!showAvatar && <div className="w-9 flex-shrink-0" />}

      <div
        className={cn(
          'flex flex-col max-w-[75%]',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'relative px-4 py-2.5 rounded-2xl break-words',
            isOwn
              ? 'bg-primary-500 text-white rounded-tr-sm'
              : 'bg-gray-100 text-text-primary rounded-tl-sm'
          )}
        >
          {message.type === 'image' ? (
            <div className="min-w-[120px] min-h-[120px]">
              <img
                src={message.content}
                alt="message image"
                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.content, '_blank')}
              />
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5 mt-1 px-1',
            isOwn ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="text-xs text-text-muted">
            {formatDateTime(message.createdAt)}
          </span>
          {isOwn && (
            message.isRead ? (
              <CheckCheck className="w-3.5 h-3.5 text-primary-400" />
            ) : (
              <Check className="w-3.5 h-3.5 text-text-muted" />
            )
          )}
          {!isOwn && !message.isRead && (
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
}
