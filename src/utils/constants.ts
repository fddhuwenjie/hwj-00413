export const CATEGORY_LABELS: Record<string, string> = {
  '数码产品': '电子',
  '书籍': '书籍',
  '服装': '服装',
  '家具': '家具',
  '运动器材': '运动',
  '美妆护肤': '美妆',
  '母婴用品': '母婴',
};

export const CATEGORY_COLORS: Record<string, string> = {
  '数码产品': 'bg-blue-100 text-blue-700',
  '书籍': 'bg-amber-100 text-amber-700',
  '服装': 'bg-pink-100 text-pink-700',
  '家具': 'bg-orange-100 text-orange-700',
  '运动器材': 'bg-green-100 text-green-700',
  '美妆护肤': 'bg-purple-100 text-purple-700',
  '母婴用品': 'bg-rose-100 text-rose-700',
};

export const CONDITION_COLORS: Record<string, string> = {
  '全新': 'bg-secondary-100 text-secondary-700',
  '几乎全新': 'bg-primary-100 text-primary-700',
  '轻微使用': 'bg-gray-100 text-gray-700',
  '明显使用': 'bg-yellow-100 text-yellow-700',
  '有瑕疵': 'bg-red-100 text-red-700',
};

export const EXCHANGE_STATUS_COLORS: Record<string, string> = {
  '待确认': 'bg-yellow-100 text-yellow-700',
  '已确认': 'bg-blue-100 text-blue-700',
  '进行中': 'bg-orange-100 text-orange-700',
  '已完成': 'bg-green-100 text-green-700',
  '已取消': 'bg-gray-100 text-gray-700',
  '已拒绝': 'bg-red-100 text-red-700',
};

export const REPORT_STATUS_COLORS: Record<string, string> = {
  '待处理': 'bg-yellow-100 text-yellow-700',
  '已通过': 'bg-green-100 text-green-700',
  '已驳回': 'bg-gray-100 text-gray-700',
};

export const REPORT_TYPE_COLORS: Record<string, string> = {
  '虚假物品': 'bg-red-100 text-red-700',
  '诈骗行为': 'bg-orange-100 text-orange-700',
  '违禁品': 'bg-purple-100 text-purple-700',
};

export const LOGISTICS_STATUS_COLORS: Record<string, string> = {
  '待发货': 'bg-gray-100 text-gray-700',
  '已发出': 'bg-blue-100 text-blue-700',
  '运输中': 'bg-orange-100 text-orange-700',
  '已签收': 'bg-green-100 text-green-700',
};

export const ITEM_STATUS_COLORS: Record<string, string> = {
  '待审核': 'bg-yellow-100 text-yellow-700',
  '已上架': 'bg-green-100 text-green-700',
  '已下架': 'bg-gray-100 text-gray-700',
  '已交换': 'bg-blue-100 text-blue-700',
  '审核不通过': 'bg-red-100 text-red-700',
  '已冻结': 'bg-purple-100 text-purple-700',
};

export const LOGISTICS_COMPANIES = [
  '顺丰速运',
  '京东物流',
  '中通快递',
  '圆通速递',
  '申通快递',
  '韵达快递',
  '极兔速递',
  '邮政EMS',
];

export const DEFAULT_USER_ID = 1;
