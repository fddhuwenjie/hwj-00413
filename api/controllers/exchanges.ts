import type { Request, Response } from 'express'
import path from 'path'
import { readJSON, writeJSON, getNextId, getDataPath } from '../utils/file.js'
import type { Exchange, Item, User } from '../types/index.js'
import { EXCHANGE_STATUSES } from '../types/index.js'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export async function getExchanges(req: Request, res: Response): Promise<void> {
  try {
    const { userId, status } = req.query

    const dataPath = getDataPath()
    let exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))

    if (userId) {
      const userIdNum = parseInt(userId as string, 10)
      exchanges = exchanges.filter(
        (e) => e.initiatorId === userIdNum || e.responderId === userIdNum,
      )
    }

    if (status && EXCHANGE_STATUSES.includes(status as typeof EXCHANGE_STATUSES[number])) {
      exchanges = exchanges.filter((e) => e.status === status)
    }

    exchanges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.status(200).json({
      success: true,
      data: exchanges,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取交换记录列表失败',
    } as ApiResponse)
  }
}

export async function getExchangeById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const exchangeId = parseInt(id, 10)

    if (isNaN(exchangeId)) {
      res.status(400).json({
        success: false,
        error: '无效的交换记录ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))
    const exchange = exchanges.find((e) => e.id === exchangeId)

    if (!exchange) {
      res.status(404).json({
        success: false,
        error: '交换记录不存在',
      } as ApiResponse)
      return
    }

    res.status(200).json({
      success: true,
      data: exchange,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取交换详情失败',
    } as ApiResponse)
  }
}

export async function createExchange(req: Request, res: Response): Promise<void> {
  try {
    const { initiatorId, responderId, itemId, targetItemId, amount, message } = req.body

    if (!initiatorId || !responderId || !itemId) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      } as ApiResponse)
      return
    }

    if (initiatorId === responderId) {
      res.status(400).json({
        success: false,
        error: '不能与自己进行交换',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const initiatorExists = users.some((u) => u.id === initiatorId)
    const responderExists = users.some((u) => u.id === responderId)

    if (!initiatorExists || !responderExists) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      } as ApiResponse)
      return
    }

    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
    const itemExists = items.some((i) => i.id === itemId && i.status === '已上架')

    if (!itemExists) {
      res.status(404).json({
        success: false,
        error: '物品不存在或未上架',
      } as ApiResponse)
      return
    }

    if (targetItemId) {
      const targetItemExists = items.some((i) => i.id === targetItemId && i.status === '已上架')
      if (!targetItemExists) {
        res.status(404).json({
          success: false,
          error: '目标物品不存在或未上架',
        } as ApiResponse)
        return
      }
    }

    const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))
    const newExchange: Exchange = {
      id: getNextId(exchanges),
      initiatorId,
      responderId,
      itemId,
      targetItemId: targetItemId || null,
      amount: amount ? parseFloat(amount) : null,
      status: '待确认',
      message: message || '',
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      completedAt: null,
    }

    exchanges.push(newExchange)
    await writeJSON(path.join(dataPath, 'exchanges.json'), exchanges)

    res.status(201).json({
      success: true,
      data: newExchange,
      message: '交换请求发起成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '发起交换请求失败',
    } as ApiResponse)
  }
}

export async function updateExchangeStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { status } = req.body
    const exchangeId = parseInt(id, 10)

    if (isNaN(exchangeId)) {
      res.status(400).json({
        success: false,
        error: '无效的交换记录ID',
      } as ApiResponse)
      return
    }

    if (!status || !EXCHANGE_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        error: '无效的交换状态',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))
    const exchangeIndex = exchanges.findIndex((e) => e.id === exchangeId)

    if (exchangeIndex === -1) {
      res.status(404).json({
        success: false,
        error: '交换记录不存在',
      } as ApiResponse)
      return
    }

    const oldStatus = exchanges[exchangeIndex].status

    if (oldStatus === '已完成' || oldStatus === '已取消' || oldStatus === '已拒绝') {
      res.status(400).json({
        success: false,
        error: '该交换状态不可修改',
      } as ApiResponse)
      return
    }

    exchanges[exchangeIndex].status = status

    if (status === '已确认' || status === '进行中') {
      exchanges[exchangeIndex].confirmedAt = new Date().toISOString()
    }

    if (status === '已完成') {
      exchanges[exchangeIndex].completedAt = new Date().toISOString()

      const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
      const itemIndex = items.findIndex((i) => i.id === exchanges[exchangeIndex].itemId)
      if (itemIndex !== -1) {
        items[itemIndex].status = '已交换'
        await writeJSON(path.join(dataPath, 'items.json'), items)
      }

      if (exchanges[exchangeIndex].targetItemId) {
        const targetItemIndex = items.findIndex(
          (i) => i.id === exchanges[exchangeIndex].targetItemId,
        )
        if (targetItemIndex !== -1) {
          items[targetItemIndex].status = '已交换'
          await writeJSON(path.join(dataPath, 'items.json'), items)
        }
      }

      const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
      const initiatorIndex = users.findIndex((u) => u.id === exchanges[exchangeIndex].initiatorId)
      const responderIndex = users.findIndex((u) => u.id === exchanges[exchangeIndex].responderId)
      if (initiatorIndex !== -1) {
        users[initiatorIndex].exchangeCount += 1
      }
      if (responderIndex !== -1) {
        users[responderIndex].exchangeCount += 1
      }
      await writeJSON(path.join(dataPath, 'users.json'), users)
    }

    await writeJSON(path.join(dataPath, 'exchanges.json'), exchanges)

    res.status(200).json({
      success: true,
      data: exchanges[exchangeIndex],
      message: '交换状态更新成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '更新交换状态失败',
    } as ApiResponse)
  }
}
