import type { Request, Response } from 'express'
import path from 'path'
import { readJSON, getDataPath } from '../utils/file.js'
import type { Item, Exchange } from '../types/index.js'
import { CATEGORIES } from '../types/index.js'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export async function getOverview(req: Request, res: Response): Promise<void> {
  try {
    const dataPath = getDataPath()
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
    const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalItems = items.length
    const todayNewItems = items.filter((item) => new Date(item.createdAt) >= today).length
    const completedExchanges = exchanges.filter((e) => e.status === '已完成').length
    const ongoingExchanges = exchanges.filter(
      (e) => e.status === '待确认' || e.status === '已确认' || e.status === '进行中',
    ).length

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        todayNewItems,
        completedExchanges,
        ongoingExchanges,
      },
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取统计概览失败',
    } as ApiResponse)
  }
}

export async function getCategoryDistribution(req: Request, res: Response): Promise<void> {
  try {
    const dataPath = getDataPath()
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))

    const distribution: Record<string, number> = {}
    CATEGORIES.forEach((cat) => {
      distribution[cat] = 0
    })

    items.forEach((item) => {
      if (distribution[item.category] !== undefined) {
        distribution[item.category]++
      }
    })

    const result = CATEGORIES.map((category) => ({
      category,
      count: distribution[category],
      percentage: items.length > 0 ? parseFloat(((distribution[category] / items.length) * 100).toFixed(1)) : 0,
    }))

    res.status(200).json({
      success: true,
      data: result,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取分类分布失败',
    } as ApiResponse)
  }
}

export async function getWeeklyTrend(req: Request, res: Response): Promise<void> {
  try {
    const dataPath = getDataPath()
    const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weeks: { week: string; count: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const weekCount = exchanges.filter((e) => {
        const exchangeDate = new Date(e.createdAt)
        return exchangeDate >= weekStart && exchangeDate < weekEnd
      }).length

      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`

      weeks.push({
        week: weekLabel,
        count: weekCount,
      })
    }

    res.status(200).json({
      success: true,
      data: weeks,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取每周交换趋势失败',
    } as ApiResponse)
  }
}

export async function getPopularItems(req: Request, res: Response): Promise<void> {
  try {
    const dataPath = getDataPath()
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))

    const availableItems = items.filter((item) => item.status === '已上架')

    const sortedItems = availableItems.sort(
      (a, b) => b.viewCount + b.likeCount - (a.viewCount + a.likeCount),
    )

    const top10 = sortedItems.slice(0, 10).map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      viewCount: item.viewCount,
      likeCount: item.likeCount,
      popularity: item.viewCount + item.likeCount,
      images: item.images,
    }))

    res.status(200).json({
      success: true,
      data: top10,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取热门物品失败',
    } as ApiResponse)
  }
}
