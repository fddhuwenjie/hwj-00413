import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Package } from 'lucide-react';
import Layout from '../components/Layout';
import { messageService } from '../services/message';
import { useAuthStore } from '../store/authStore';
import { useMessageStore } from '../store/messageStore';
import { formatDate, truncateText } from '../utils/format';

interface Conversation {
  exchangeId: number;
  otherUser: { id: number; username: string; avatar: string };
  lastMessage: {
    id: number;
    content: string;
    type: 'text' | 'image';
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
  item: { id: number; title: string; images: string[] };
}

export default function MessageList() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { unreadCount, setUnreadCount } = useMessageStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  const loadConversations = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await messageService.getConversations(currentUser.id);
      const sorted = data.sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
      );
      setConversations(sorted);
      const totalUnread = sorted.reduce((sum, c) => sum + c.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('加载会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (exchangeId: number) => {
    navigate(`/chat/${exchangeId}`);
  };

  const getMessagePreview = (message: Conversation['lastMessage']) => {
    if (message.type === 'image') {
      return '[图片]';
    }
    const isOwn = currentUser?.id === message.senderId;
    const prefix = isOwn ? '我: ' : '';
    return prefix + truncateText(message.content, 30);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-7 h-7 text-primary-500" />
          <h1 className="text-2xl font-bold text-text-primary">消息</h1>
          {unreadCount > 0 && (
            <span className="bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full animate-pulse-soft">
              {unreadCount}
            </span>
          )}
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">暂无消息</h3>
            <p className="text-text-muted text-sm">去逛逛，找到感兴趣的物品开始交换吧</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.exchangeId}
                onClick={() => handleClick(conversation.exchangeId)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer card-hover"
              >
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        conversation.otherUser.avatar ||
                        `https://ui-avatars.com/api/?name=${conversation.otherUser.username}&background=FF6B35&color=fff`
                      }
                      alt={conversation.otherUser.username}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    {conversation.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-medium min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center animate-pulse-soft">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-text-primary truncate">
                          {conversation.otherUser.username}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted flex-shrink-0">
                        {formatDate(conversation.lastMessage.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-2">
                      <Package className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <span className="text-sm text-text-muted truncate">
                        {conversation.item.title}
                      </span>
                    </div>

                    <p className="text-sm text-text-muted truncate">
                      {getMessagePreview(conversation.lastMessage)}
                    </p>
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
