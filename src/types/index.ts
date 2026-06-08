export const CATEGORIES = [
  '数码产品',
  '书籍',
  '服装',
  '家具',
  '运动器材',
  '美妆护肤',
  '母婴用品',
] as const;

export const CONDITIONS = [
  '全新',
  '几乎全新',
  '轻微使用',
  '明显使用',
  '有瑕疵',
] as const;

export const EXCHANGE_STATUSES = [
  '待确认',
  '已确认',
  '进行中',
  '已完成',
  '已取消',
  '已拒绝',
] as const;

export const ITEM_STATUSES = [
  '待审核',
  '已上架',
  '已下架',
  '已交换',
  '审核不通过',
] as const;

export type Category = typeof CATEGORIES[number];
export type Condition = typeof CONDITIONS[number];
export type ExchangeStatus = typeof EXCHANGE_STATUSES[number];
export type ItemStatus = typeof ITEM_STATUSES[number];

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  phone: string;
  address: string;
  creditScore: number;
  exchangeCount: number;
  createdAt: string;
}

export interface Item {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: Category;
  condition: Condition;
  price: number;
  images: string[];
  status: ItemStatus;
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

export interface Exchange {
  id: number;
  initiatorId: number;
  responderId: number;
  itemId: number;
  targetItemId: number | null;
  amount: number | null;
  status: ExchangeStatus;
  message: string;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
}

export interface Message {
  id: number;
  exchangeId: number;
  senderId: number;
  receiverId: number;
  content: string;
  type: 'text' | 'image';
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: number;
  reviewerId: number;
  revieweeId: number;
  exchangeId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ItemFilters {
  category?: Category;
  condition?: Condition;
  sort?: 'latest' | 'popular';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface StatsOverview {
  totalItems: number;
  todayNewItems: number;
  completedExchanges: number;
  ongoingExchanges: number;
}

export interface CategoryDistribution {
  category: Category;
  count: number;
  percentage: number;
}

export interface WeeklyTrend {
  week: string;
  count: number;
}

export interface PopularItem {
  id: number;
  title: string;
  viewCount: number;
  category: Category;
}
