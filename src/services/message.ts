import { request } from './api';
import type { Message } from '../types';

export const messageService = {
  async getMessages(exchangeId: number): Promise<Message[]> {
    const result = await request<Message[]>('get', `/messages/exchange/${exchangeId}`);
    return result.success && result.data ? result.data : [];
  },

  async sendMessage(data: {
    exchangeId: number;
    senderId: number;
    receiverId: number;
    content: string;
    type?: 'text' | 'image';
  }): Promise<Message | null> {
    const result = await request<Message>('post', '/messages', {
      ...data,
      type: data.type || 'text',
      isRead: false,
    });
    return result.success && result.data ? result.data : null;
  },

  async markAsRead(exchangeId: number, userId: number): Promise<void> {
    await request('put', `/messages/read/${exchangeId}`, undefined, { userId });
  },

  async getUnreadCount(userId: number): Promise<number> {
    const result = await request<{ count: number }>('get', `/messages/unread/${userId}`);
    return result.success && result.data ? result.data.count : 0;
  },

  async getConversations(userId: number): Promise<
    {
      exchangeId: number;
      otherUser: { id: number; username: string; avatar: string };
      lastMessage: Message;
      unreadCount: number;
      item: { id: number; title: string; images: string[] };
    }[]
  > {
    const result = await request('get', '/messages', undefined, { userId, conversations: true });
    return result.success && result.data ? (result.data as unknown as []) : [];
  },
};
