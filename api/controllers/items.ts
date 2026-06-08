import type { Request, Response } from 'express'
import path from 'path'
import { readJSON, writeJSON, getNextId, getDataPath } from '../utils/file.js'
import type { Item, User } from '../types/index.js'
import { CATEGORIES, CONDITIONS } from '../types/index.js'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface GetItemsQuery {
  category?: string
  condition?: string
  sort?: 'latest' | 'popular'
  search?: string
  page?: string
  pageSize?: string
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getItems(req: Request, res: Response): Promise<void> {
  try {
    const { category, condition, sort = 'latest', search, page = '1', pageSize = '10' } = req.query as GetItemsQuery

    const dataPath = getDataPath()
    let items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))

    items = items.filter((item) => item.status === '已上架')

    if (category && CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      items = items.filter((item) => item.category === category)
    }

    if (condition && CONDITIONS.includes(condition as typeof CONDITIONS[number])) {
      items = items.filter((item) => item.condition === condition)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower),
      )
    }

    if (sort === 'latest') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sort === 'popular') {
      items.sort((a, b) => b.viewCount + b.likeCount - (a.viewCount + a.likeCount))
    }

    const pageNum = parseInt(page, 10)
    const pageSizeNum = parseInt(pageSize, 10)
    const total = items.length
    const totalPages = Math.ceil(total / pageSizeNum)
    const startIndex = (pageNum - 1) * pageSizeNum
    const paginatedItems = items.slice(startIndex, startIndex + pageSizeNum)

    res.status(200).json({
      success: true,
      data: {
        items: paginatedItems,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages,
      } as PaginatedResponse<Item>,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取物品列表失败',
    } as ApiResponse)
  }
}

export async function getItemById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const itemId = parseInt(id, 10)

    if (isNaN(itemId)) {
      res.status(400).json({
        success: false,
        error: '无效的物品ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
    const item = items.find((i) => i.id === itemId)

    if (!item) {
      res.status(404).json({
        success: false,
        error: '物品不存在',
      } as ApiResponse)
      return
    }

    res.status(200).json({
      success: true,
      data: item,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取物品详情失败',
    } as ApiResponse)
  }
}

export async function createItem(req: Request, res: Response): Promise<void> {
  try {
    const { userId, title, description, category, condition, price, images } = req.body

    if (!userId || !title || !description || !category || !condition || price === undefined) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      } as ApiResponse)
      return
    }

    if (!CATEGORIES.includes(category)) {
      res.status(400).json({
        success: false,
        error: '无效的分类',
      } as ApiResponse)
      return
    }

    if (!CONDITIONS.includes(condition)) {
      res.status(400).json({
        success: false,
        error: '无效的新旧程度',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const userExists = users.some((u) => u.id === userId)

    if (!userExists) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      } as ApiResponse)
      return
    }

    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
    const newItem: Item = {
      id: getNextId(items),
      userId,
      title,
      description,
      category,
      condition,
      price: parseFloat(price),
      images: images || [],
      status: '已上架',
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    }

    items.push(newItem)
    await writeJSON(path.join(dataPath, 'items.json'), items)

    res.status(201).json({
      success: true,
      data: newItem,
      message: '物品发布成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '发布物品失败',
    } as ApiResponse)
  }
}

export async function incrementViews(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const itemId = parseInt(id, 10)

    if (isNaN(itemId)) {
      res.status(400).json({
        success: false,
        error: '无效的物品ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
    const itemIndex = items.findIndex((i) => i.id === itemId)

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        error: '物品不存在',
      } as ApiResponse)
      return
    }

    items[itemIndex].viewCount += 1
    await writeJSON(path.join(dataPath, 'items.json'), items)

    res.status(200).json({
      success: true,
      data: { viewCount: items[itemIndex].viewCount },
      message: '浏览量增加成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '增加浏览量失败',
    } as ApiResponse)
  }
}
