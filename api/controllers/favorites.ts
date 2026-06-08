import type { Request, Response } from 'express'
import path from 'path'
import { readJSON, writeJSON, getNextId, getDataPath } from '../utils/file.js'
import type { Favorite, Item, User, WantedItem, ArrivalNotice } from '../types/index.js'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export async function addFavorite(req: Request, res: Response): Promise<void> {
  try {
    const { userId, itemId } = req.body

    if (!userId || !itemId) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
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
    const itemExists = items.some((i) => i.id === itemId)

    if (!itemExists) {
      res.status(404).json({
        success: false,
        error: '物品不存在',
      } as ApiResponse)
      return
    }

    const favorites = await readJSON<Favorite[]>(path.join(dataPath, 'favorites.json'))

    const existingFavorite = favorites.find(
      (f) => f.userId === userId && f.itemId === itemId,
    )

    if (existingFavorite) {
      res.status(400).json({
        success: false,
        error: '该物品已在收藏列表中',
      } as ApiResponse)
      return
    }

    const newFavorite: Favorite = {
      id: getNextId(favorites),
      userId,
      itemId,
      createdAt: new Date().toISOString(),
    }

    favorites.push(newFavorite)
    await writeJSON(path.join(dataPath, 'favorites.json'), favorites)

    const itemIndex = items.findIndex((i) => i.id === itemId)
    if (itemIndex !== -1) {
      items[itemIndex].likeCount += 1
      await writeJSON(path.join(dataPath, 'items.json'), items)
    }

    res.status(201).json({
      success: true,
      data: newFavorite,
      message: '收藏成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '收藏失败',
    } as ApiResponse)
  }
}

export async function removeFavorite(req: Request, res: Response): Promise<void> {
  try {
    const { userId, itemId } = req.body

    if (!userId || !itemId) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const favorites = await readJSON<Favorite[]>(path.join(dataPath, 'favorites.json'))

    const favoriteIndex = favorites.findIndex(
      (f) => f.userId === userId && f.itemId === itemId,
    )

    if (favoriteIndex === -1) {
      res.status(404).json({
        success: false,
        error: '收藏记录不存在',
      } as ApiResponse)
      return
    }

    favorites.splice(favoriteIndex, 1)
    await writeJSON(path.join(dataPath, 'favorites.json'), favorites)

    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
    const itemIndex = items.findIndex((i) => i.id === itemId)
    if (itemIndex !== -1 && items[itemIndex].likeCount > 0) {
      items[itemIndex].likeCount -= 1
      await writeJSON(path.join(dataPath, 'items.json'), items)
    }

    res.status(200).json({
      success: true,
      message: '取消收藏成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '取消收藏失败',
    } as ApiResponse)
  }
}

export async function getUserFavorites(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '缺少用户ID',
      } as ApiResponse)
      return
    }

    const userIdNum = parseInt(userId, 10)
    const dataPath = getDataPath()
    const favorites = await readJSON<Favorite[]>(path.join(dataPath, 'favorites.json'))
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))

    const userFavorites = favorites.filter((f) => f.userId === userIdNum)
    userFavorites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const favoritesWithItems = userFavorites.map((favorite) => {
      const item = items.find((i) => i.id === favorite.itemId)
      return {
        ...favorite,
        item,
      }
    })

    res.status(200).json({
      success: true,
      data: favoritesWithItems,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取收藏列表失败',
    } as ApiResponse)
  }
}

export async function checkFavoriteStatus(req: Request, res: Response): Promise<void> {
  try {
    const { userId, itemId } = req.query

    if (!userId || !itemId) {
      res.status(400).json({
        success: false,
        error: '缺少必填参数',
      } as ApiResponse)
      return
    }

    const userIdNum = parseInt(userId as string, 10)
    const itemIdNum = parseInt(itemId as string, 10)

    const dataPath = getDataPath()
    const favorites = await readJSON<Favorite[]>(path.join(dataPath, 'favorites.json'))

    const isFavorited = favorites.some(
      (f) => f.userId === userIdNum && f.itemId === itemIdNum,
    )

    res.status(200).json({
      success: true,
      data: { isFavorited },
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '检查收藏状态失败',
    } as ApiResponse)
  }
}

export async function createWantedItem(req: Request, res: Response): Promise<void> {
  try {
    const { userId, title, description, category, keywords } = req.body

    if (!userId || !title || !description) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
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

    const wantedItems = await readJSON<WantedItem[]>(path.join(dataPath, 'wantedItems.json'))

    const keywordArray = Array.isArray(keywords) ? keywords : (keywords as string).split(/[,，]/).filter(Boolean)

    const newWantedItem: WantedItem = {
      id: getNextId(wantedItems),
      userId,
      title,
      description,
      category,
      keywords: keywordArray,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    wantedItems.push(newWantedItem)
    await writeJSON(path.join(dataPath, 'wantedItems.json'), wantedItems)

    res.status(201).json({
      success: true,
      data: newWantedItem,
      message: '求物发布成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '发布求物失败',
    } as ApiResponse)
  }
}

export async function getUserWantedItems(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '缺少用户ID',
      } as ApiResponse)
      return
    }

    const userIdNum = parseInt(userId, 10)
    const dataPath = getDataPath()
    const wantedItems = await readJSON<WantedItem[]>(path.join(dataPath, 'wantedItems.json'))

    const userWantedItems = wantedItems.filter((w) => w.userId === userIdNum)
    userWantedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.status(200).json({
      success: true,
      data: userWantedItems,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取求物列表失败',
    } as ApiResponse)
  }
}

export async function updateWantedItemStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { isActive } = req.body
    const wantedItemId = parseInt(id, 10)

    if (isNaN(wantedItemId)) {
      res.status(400).json({
        success: false,
        error: '无效的求物ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const wantedItems = await readJSON<WantedItem[]>(path.join(dataPath, 'wantedItems.json'))
    const wantedItemIndex = wantedItems.findIndex((w) => w.id === wantedItemId)

    if (wantedItemIndex === -1) {
      res.status(404).json({
        success: false,
        error: '求物记录不存在',
      } as ApiResponse)
      return
    }

    wantedItems[wantedItemIndex].isActive = isActive
    await writeJSON(path.join(dataPath, 'wantedItems.json'), wantedItems)

    res.status(200).json({
      success: true,
      data: wantedItems[wantedItemIndex],
      message: '求物状态更新成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '更新求物状态失败',
    } as ApiResponse)
  }
}

export async function checkMatchAndNotify(itemId: number): Promise<void> {
  try {
    const dataPath = getDataPath()
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
    const item = items.find((i) => i.id === itemId)

    if (!item || item.status !== '已上架') return

    const wantedItems = await readJSON<WantedItem[]>(path.join(dataPath, 'wantedItems.json'))
    const arrivalNotices = await readJSON<ArrivalNotice[]>(path.join(dataPath, 'arrivalNotices.json'))

    const activeWantedItems = wantedItems.filter((w) => w.isActive)

    for (const wanted of activeWantedItems) {
      const itemText = `${item.title} ${item.description}`.toLowerCase()
      const hasMatch = wanted.keywords.some(
        (keyword) => itemText.includes(keyword.toLowerCase()),
      )

      if (hasMatch) {
        const existingNotice = arrivalNotices.some(
          (n) => n.wantedItemId === wanted.id && n.matchedItemId === itemId,
        )

        if (!existingNotice) {
          const newNotice: ArrivalNotice = {
            id: getNextId(arrivalNotices),
            userId: wanted.userId,
            wantedItemId: wanted.id,
            matchedItemId: itemId,
            isRead: false,
            createdAt: new Date().toISOString(),
          }
          arrivalNotices.push(newNotice)
        }
      }
    }

    await writeJSON(path.join(dataPath, 'arrivalNotices.json'), arrivalNotices)
  } catch (error) {
    console.error('Failed to check match and notify:', error)
  }
}

export async function getArrivalNotices(req: Request, res: Response): Promise<void> {
  try {
    const { userId, isRead } = req.query

    if (!userId) {
      res.status(400).json({
        success: false,
        error: '缺少用户ID',
      } as ApiResponse)
      return
    }

    const userIdNum = parseInt(userId as string, 10)
    const dataPath = getDataPath()
    const notices = await readJSON<ArrivalNotice[]>(path.join(dataPath, 'arrivalNotices.json'))
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
    const wantedItems = await readJSON<WantedItem[]>(path.join(dataPath, 'wantedItems.json'))

    let userNotices = notices.filter((n) => n.userId === userIdNum)

    if (isRead !== undefined) {
      const isReadBool = isRead === 'true'
      userNotices = userNotices.filter((n) => n.isRead === isReadBool)
    }

    userNotices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const noticesWithDetails = userNotices.map((notice) => {
      const matchedItem = items.find((i) => i.id === notice.matchedItemId)
      const wantedItem = wantedItems.find((w) => w.id === notice.wantedItemId)
      return {
        ...notice,
        matchedItem,
        wantedItem,
      }
    })

    res.status(200).json({
      success: true,
      data: noticesWithDetails,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获得到货提醒失败',
    } as ApiResponse)
  }
}

export async function markNoticeAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const noticeId = parseInt(id, 10)

    if (isNaN(noticeId)) {
      res.status(400).json({
        success: false,
        error: '无效的通知ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const notices = await readJSON<ArrivalNotice[]>(path.join(dataPath, 'arrivalNotices.json'))
    const noticeIndex = notices.findIndex((n) => n.id === noticeId)

    if (noticeIndex === -1) {
      res.status(404).json({
        success: false,
        error: '通知不存在',
      } as ApiResponse)
      return
    }

    notices[noticeIndex].isRead = true
    await writeJSON(path.join(dataPath, 'arrivalNotices.json'), notices)

    res.status(200).json({
      success: true,
      message: '标记已读成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '标记已读失败',
    } as ApiResponse)
  }
}

export async function deleteWantedItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const wantedItemId = parseInt(id, 10)

    if (isNaN(wantedItemId)) {
      res.status(400).json({
        success: false,
        error: '无效的求物ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const wantedItems = await readJSON<WantedItem[]>(path.join(dataPath, 'wantedItems.json'))
    const wantedItemIndex = wantedItems.findIndex((w) => w.id === wantedItemId)

    if (wantedItemIndex === -1) {
      res.status(404).json({
        success: false,
        error: '求物记录不存在',
      } as ApiResponse)
      return
    }

    wantedItems.splice(wantedItemIndex, 1)
    await writeJSON(path.join(dataPath, 'wantedItems.json'), wantedItems)

    res.status(200).json({
      success: true,
      message: '求物删除成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '删除求物失败',
    } as ApiResponse)
  }
}
