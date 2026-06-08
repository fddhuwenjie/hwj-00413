import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon, Package, X } from 'lucide-react';
import Layout from '../components/Layout';
import MessageBubble from '../components/MessageBubble';
import { messageService } from '../services/message';
import { exchangeService } from '../services/exchange';
import { useAuthStore } from '../store/authStore';
import { useMessageStore } from '../store/messageStore';
import type { Message, Exchange } from '../types';

interface ChatUser {
  id: number;
  username: string;
  avatar: string;
}

interface ChatItem {
  id: number;
  title: string;
  images: string[];
}

export default function Chat() {
  const { exchangeId } = useParams<{ exchangeId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { messages, addMessage, markAsRead, fetchMessages } = useMessageStore();
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [item, setItem] = useState<ChatItem | null>(null);
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const exchangeIdNum = exchangeId ? parseInt(exchangeId, 10) : 0;
  const currentMessages = messages[exchangeIdNum] || [];

  useEffect(() => {
    if (exchangeIdNum && currentUser) {
      loadChatData();
    }
  }, [exchangeIdNum, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const loadChatData = async () => {
    if (!exchangeIdNum || !currentUser) return;
    try {
      setLoading(true);
      const [messagesData, exchangeData] = await Promise.all([
        messageService.getMessages(exchangeIdNum),
        exchangeService.getExchangeById(exchangeIdNum),
      ]);

      if (exchangeData) {
        setExchange(exchangeData);
        const otherUserId =
          exchangeData.initiatorId === currentUser.id
            ? exchangeData.responderId
            : exchangeData.initiatorId;

        const userResponse = await fetch(`/api/users/${otherUserId}`);
        const userResult = await userResponse.json();
        if (userResult.success && userResult.data) {
          setOtherUser(userResult.data);
        }

        const itemResponse = await fetch(`/api/items/${exchangeData.itemId}`);
        const itemResult = await itemResponse.json();
        if (itemResult.success && itemResult.data) {
          setItem(itemResult.data);
        }
      }

      fetchMessages(exchangeIdNum);
      await messageService.markAsRead(exchangeIdNum, currentUser.id);
      await markAsRead(exchangeIdNum, currentUser.id);
    } catch (error) {
      console.error('加载聊天数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !imageUrl.trim()) || !currentUser || !otherUser || sending) return;

    const content = imageUrl.trim() || inputText.trim();
    const type = imageUrl.trim() ? ('image' as const) : ('text' as const);

    try {
      setSending(true);
      const sentMessage = await messageService.sendMessage({
        exchangeId: exchangeIdNum,
        senderId: currentUser.id,
        receiverId: otherUser.id,
        content,
        type,
      });

      if (sentMessage) {
        addMessage(sentMessage);
      }

      setInputText('');
      setImageUrl('');
      setShowImageInput(false);
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const shouldShowAvatar = (index: number, message: Message) => {
    if (index === 0) return true;
    const prevMessage = currentMessages[index - 1];
    return prevMessage.senderId !== message.senderId;
  };

  const getMessageAnimation = (index: number, isOwn: boolean) => {
    if (index === currentMessages.length - 1) {
      return isOwn ? 'animate-slide-in-right' : 'animate-slide-in-left';
    }
    return '';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-120px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-primary" />
            </button>

            {otherUser && (
              <div className="flex items-center gap-3 flex-1">
                <img
                  src={
                    otherUser.avatar ||
                    `https://ui-avatars.com/api/?name=${otherUser.username}&background=FF6B35&color=fff`
                  }
                  alt={otherUser.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-text-primary truncate">
                    {otherUser.username}
                  </h2>
                  {item && (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Package className="w-3 h-3" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {exchange && (
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  exchange.status === '已完成'
                    ? 'bg-green-100 text-green-700'
                    : exchange.status === '进行中'
                    ? 'bg-blue-100 text-blue-700'
                    : exchange.status === '待确认'
                    ? 'bg-yellow-100 text-yellow-700'
                    : exchange.status === '已取消' || exchange.status === '已拒绝'
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {exchange.status}
              </span>
            )}
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50"
        >
          {currentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Send className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-base font-medium text-text-primary mb-1">开始聊天吧</h3>
              <p className="text-sm text-text-muted">和对方聊聊物品详情和交换方式</p>
            </div>
          ) : (
            <div className="space-y-1">
              {currentMessages.map((message, index) => (
                <div
                  key={message.id}
                  className={getMessageAnimation(
                    index,
                    currentUser?.id === message.senderId
                  )}
                >
                  <MessageBubble
                    message={message}
                    showAvatar={shouldShowAvatar(index, message)}
                    avatarUrl={
                      currentUser?.id !== message.senderId
                        ? otherUser?.avatar
                        : currentUser?.avatar
                    }
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {showImageInput && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="请输入图片URL"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm input-focus bg-white"
                  onKeyPress={handleKeyPress}
                />
              </div>
              <button
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl('');
                }}
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 px-4 py-3 bg-white">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowImageInput(!showImageInput)}
              className={`p-2.5 rounded-full transition-colors ${
                showImageInput
                  ? 'bg-primary-100 text-primary-500'
                  : 'hover:bg-gray-100 text-text-muted'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="输入消息..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none input-focus max-h-32"
                rows={1}
                onKeyPress={handleKeyPress}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={
                (!inputText.trim() && !imageUrl.trim()) ||
                sending ||
                !currentUser ||
                !otherUser
              }
              className="p-2.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
