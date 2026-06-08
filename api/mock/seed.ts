import path from 'path'
import {
  type User,
  type Item,
  type Exchange,
  type Message,
  type Review,
  CATEGORIES,
  CONDITIONS,
  EXCHANGE_STATUSES,
  ITEM_STATUSES,
} from '../types/index.js'
import { readJSON, writeJSON, getDataPath } from '../utils/file.js'

const dataPath = getDataPath()
const usersFile = path.join(dataPath, 'users.json')
const itemsFile = path.join(dataPath, 'items.json')
const exchangesFile = path.join(dataPath, 'exchanges.json')
const messagesFile = path.join(dataPath, 'messages.json')
const reviewsFile = path.join(dataPath, 'reviews.json')

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString()
}

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateUsers(): User[] {
  return [
    {
      id: 1,
      username: '张小明',
      email: 'zhangxiaoming@example.com',
      password: '123456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
      phone: '13800138001',
      address: '北京市朝阳区建国路88号',
      creditScore: 4.8,
      exchangeCount: 15,
      createdAt: randomDate(new Date('2024-01-01'), new Date('2024-03-01')),
    },
    {
      id: 2,
      username: '李思思',
      email: 'lisisi@example.com',
      password: '123456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
      phone: '13800138002',
      address: '上海市浦东新区陆家嘴环路100号',
      creditScore: 4.5,
      exchangeCount: 8,
      createdAt: randomDate(new Date('2024-02-01'), new Date('2024-04-01')),
    },
    {
      id: 3,
      username: '王大伟',
      email: 'wangdawei@example.com',
      password: '123456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      phone: '13800138003',
      address: '广州市天河区珠江新城华夏路1号',
      creditScore: 4.9,
      exchangeCount: 23,
      createdAt: randomDate(new Date('2024-01-15'), new Date('2024-03-15')),
    },
    {
      id: 4,
      username: '刘芳芳',
      email: 'liufangfang@example.com',
      password: '123456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu',
      phone: '13800138004',
      address: '深圳市南山区科技园南路2号',
      creditScore: 4.2,
      exchangeCount: 5,
      createdAt: randomDate(new Date('2024-03-01'), new Date('2024-05-01')),
    },
    {
      id: 5,
      username: '赵小六',
      email: 'zhaoxiaoliu@example.com',
      password: '123456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
      phone: '13800138005',
      address: '杭州市西湖区文三路99号',
      creditScore: 2.5,
      exchangeCount: 2,
      createdAt: randomDate(new Date('2024-04-01'), new Date('2024-06-01')),
    },
  ]
}

export function generateItems(users: User[]): Item[] {
  const itemTitles: Record<string, string[]> = {
    '数码产品': [
      'iPhone 13 Pro 256G 国行',
      'MacBook Air M1 8+256',
      'iPad Air 5代 64G WiFi',
      '索尼 WH-1000XM4 降噪耳机',
      '任天堂 Switch OLED 版本',
      '大疆 Osmo Mobile 6 云台',
    ],
    '书籍': [
      '《人类简史》精装版',
      '《三体》全集套装',
      '《原则》瑞·达利欧',
      '《活着》余华 经典版',
      '《百年孤独》加西亚·马尔克斯',
      '《思考，快与慢》丹尼尔·卡尼曼',
    ],
    '服装': [
      '优衣库 羽绒服 男款 L码',
      'Nike Air Max 运动鞋 42码',
      'ZARA 风衣 女款 M码',
      'Levis 501 牛仔裤 32码',
      'Uniqlo U 系列T恤 三件装',
      'Adidas 三叶草 卫衣',
    ],
    '家具': [
      '宜家 双人沙发 灰色',
      '实木餐桌 1.4米 带4椅',
      '懒人沙发 豆袋 米白色',
      '书架 五层 铁艺',
      '办公椅 人体工学椅',
      '床头柜 简约现代风格',
    ],
    '运动器材': [
      'Keep 瑜伽垫 加厚款',
      '哑铃 5kg*2 可调节',
      '迪卡侬 帐篷 3-4人',
      '骑行头盔 公路车款',
      '羽毛球拍 胜利 双拍套装',
      '健身环大冒险 Switch',
    ],
    '美妆护肤': [
      'SK-II 神仙水 230ml',
      '兰蔻 小黑瓶精华 50ml',
      '雅诗兰黛 眼霜 15ml',
      '植村秀 卸妆油 450ml',
      'YSL 口红 21号色',
      '资生堂 红腰子精华 75ml',
    ],
    '母婴用品': [
      '婴儿推车 轻便折叠款',
      '安全座椅 0-4岁 双向安装',
      '吸奶器 电动双边',
      '婴儿床 实木 带蚊帐',
      '学步车 防O型腿',
      '恒温调奶器 1.2L',
    ],
  }

  const descriptions: string[] = [
    '使用非常爱惜，无划痕无磕碰，功能完好。因为闲置所以转售，希望能找到有缘人。',
    '入手半年，使用频率不高，外观9成新，配件齐全，包装盒都在。',
    '几乎全新，买了之后发现用不上，一直放着，转给需要的朋友。',
    '正常使用痕迹，功能一切正常，性价比很高，适合新手入门。',
    '买了之后发现尺寸不合适，只用过一两次，和新的没区别。',
  ]

  const userIds = users.map((u) => u.id)
  const items: Item[] = []
  let id = 1

  for (const category of CATEGORIES) {
    const titles = itemTitles[category]
    const count = Math.floor(30 / CATEGORIES.length) + (category === '数码产品' ? 2 : 0)

    for (let i = 0; i < count && id <= 30; i++) {
      const title = titles[i % titles.length]
      const item: Item = {
        id,
        userId: userIds[randomInt(0, userIds.length - 1)],
        title,
        description: descriptions[randomInt(0, descriptions.length - 1)],
        category,
        condition: randomPick(CONDITIONS),
        price: randomInt(50, 2000),
        images: [
          `https://picsum.photos/seed/item${id}-1/400/300`,
          `https://picsum.photos/seed/item${id}-2/400/300`,
        ],
        status: randomPick(ITEM_STATUSES.filter((s) => s !== '审核不通过')),
        viewCount: randomInt(10, 500),
        likeCount: randomInt(0, 50),
        createdAt: randomDate(new Date('2024-05-01'), new Date('2024-06-01')),
      }
      items.push(item)
      id++
    }
  }

  return items.slice(0, 30)
}

export function generateExchanges(users: User[], items: Item[]): Exchange[] {
  const exchanges: Exchange[] = []
  const statuses = [...EXCHANGE_STATUSES]
  const messages = [
    '我对您的物品很感兴趣，可以交换吗？',
    '愿意用我的物品加钱换，希望能成交。',
    '看了您的描述，东西很适合我，约个时间面交？',
    '可以包邮吗？我这边是顺丰到付也可以。',
    '物品还在吗？我想要，怎么交易比较方便？',
  ]

  for (let i = 1; i <= 10; i++) {
    const initiatorId = users[randomInt(0, users.length - 1)].id
    let responderId = users[randomInt(0, users.length - 1)].id
    while (responderId === initiatorId) {
      responderId = users[randomInt(0, users.length - 1)].id
    }

    const availableItems = items.filter((item) => item.userId === responderId)
    const itemId = availableItems.length > 0
      ? availableItems[randomInt(0, availableItems.length - 1)].id
      : items[randomInt(0, items.length - 1)].id

    const initiatorItems = items.filter((item) => item.userId === initiatorId)
    const targetItemId = Math.random() > 0.3 && initiatorItems.length > 0
      ? initiatorItems[randomInt(0, initiatorItems.length - 1)].id
      : null

    const status = statuses[(i - 1) % statuses.length]
    const createdAt = randomDate(new Date('2024-05-10'), new Date('2024-06-05'))
    const confirmedAt = ['已确认', '进行中', '已完成'].includes(status)
      ? randomDate(new Date(createdAt), new Date('2024-06-07'))
      : null
    const completedAt = status === '已完成'
      ? randomDate(new Date(confirmedAt!), new Date('2024-06-08'))
      : null

    exchanges.push({
      id: i,
      initiatorId,
      responderId,
      itemId,
      targetItemId,
      amount: targetItemId ? null : randomInt(50, 500),
      status,
      message: messages[randomInt(0, messages.length - 1)],
      createdAt,
      confirmedAt,
      completedAt,
    })
  }

  return exchanges
}

export function generateMessages(users: User[], exchanges: Exchange[]): Message[] {
  const messages: Message[] = []
  const contents = [
    '您好，请问物品还在吗？',
    '在的，您有什么想了解的？',
    '可以再便宜一点吗？',
    '已经是最低价了，不议价哦~',
    '那好吧，我要了，怎么交易？',
    '我们走平台吧，安全可靠。',
    '好的，我拍下了，请尽快发货。',
    '收到，明天就给您发顺丰。',
    '快递单号麻烦发我一下，谢谢！',
    'SF1234567890，请注意查收。',
    '收到货了，东西很好，谢谢！',
    '不客气，希望您满意，记得确认收货哦~',
  ]

  let id = 1

  for (const exchange of exchanges.slice(0, 5)) {
    const count = randomInt(3, 6)
    const startTime = new Date(exchange.createdAt)

    for (let i = 0; i < count; i++) {
      const isSenderInitiator = i % 2 === 0
      messages.push({
        id,
        exchangeId: exchange.id,
        senderId: isSenderInitiator ? exchange.initiatorId : exchange.responderId,
        receiverId: isSenderInitiator ? exchange.responderId : exchange.initiatorId,
        content: contents[(id - 1) % contents.length],
        type: 'text' as const,
        isRead: i < count - 1,
        createdAt: new Date(startTime.getTime() + i * 3600000).toISOString(),
      })
      id++
    }
  }

  return messages
}

export function generateReviews(users: User[], exchanges: Exchange[]): Review[] {
  const reviews: Review[] = []
  const completedExchanges = exchanges.filter((e) => e.status === '已完成')
  const comments = [
    '交易非常愉快，卖家很耐心，物品描述真实。',
    '发货速度快，包装仔细，东西很满意。',
    '面交的，卖家守时，物品和描述一致，推荐！',
    '沟通顺畅，交易过程很顺利，下次还会来。',
    '信用很好的买家，付款及时，合作愉快。',
    '人很好，说话客气，有机会再合作。',
  ]

  let id = 1
  for (const exchange of completedExchanges) {
    reviews.push({
      id,
      reviewerId: exchange.initiatorId,
      revieweeId: exchange.responderId,
      exchangeId: exchange.id,
      rating: randomInt(3, 5),
      comment: comments[randomInt(0, comments.length - 1)],
      createdAt: randomDate(new Date(exchange.completedAt!), new Date('2024-06-08')),
    })
    id++

    reviews.push({
      id,
      reviewerId: exchange.responderId,
      revieweeId: exchange.initiatorId,
      exchangeId: exchange.id,
      rating: randomInt(3, 5),
      comment: comments[randomInt(0, comments.length - 1)],
      createdAt: randomDate(new Date(exchange.completedAt!), new Date('2024-06-08')),
    })
    id++
  }

  return reviews
}

export async function seed(): Promise<void> {
  try {
    const existingUsers = await readJSON<User[]>(usersFile)
    if (existingUsers.length > 0) {
      console.log('Data already exists, skipping seed.')
      return
    }

    console.log('Seeding mock data...')

    const users = generateUsers()
    await writeJSON(usersFile, users)
    console.log(`Generated ${users.length} users`)

    const items = generateItems(users)
    await writeJSON(itemsFile, items)
    console.log(`Generated ${items.length} items`)

    const exchanges = generateExchanges(users, items)
    await writeJSON(exchangesFile, exchanges)
    console.log(`Generated ${exchanges.length} exchanges`)

    const messages = generateMessages(users, exchanges)
    await writeJSON(messagesFile, messages)
    console.log(`Generated ${messages.length} messages`)

    const reviews = generateReviews(users, exchanges)
    await writeJSON(reviewsFile, reviews)
    console.log(`Generated ${reviews.length} reviews`)

    console.log('Seed completed successfully!')
  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
