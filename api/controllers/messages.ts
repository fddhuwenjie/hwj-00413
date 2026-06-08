import type { Request, Response } from 'express'
import path from 'path'
import { readJSON, writeJSON, getNextId, getDataPath } from '../utils/file.js'
import type { Message, User } from '../types/index.js'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.query

    const dataPath = getDataPath()
    let messages = await readJSON<Message[]>(path.join(dataPath, 'messages.json'))

    if (userId) {
      const userIdNum = parseInt(userId as string, 10)
      messages = messages.filter(
        (m) => m.senderId === userIdNum || m.receiverId === userIdNum,
      )
    }

    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.status(200).json({
      success: true,
      data: messages,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取消息列表失败',
    } as ApiResponse)
  }
}

export async function getMessagesByExchange(req: Request, res: Response): Promise<void> {
  try {
    const { exchangeId } = req.params
    const exchangeIdNum = parseInt(exchangeId, 10)

    if (isNaN(exchangeIdNum)) {
      res.status(400).json({
        success: false,
        error: '无效的交换记录ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const messages = await readJSON<Message[]>(path.join(dataPath, 'messages.json'))

    const exchangeMessages = messages.filter(
      (m) => m.exchangeId === exchangeIdNum,
    )

    exchangeMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    res.status(200).json({
      success: true,
      data: exchangeMessages,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取交换消息失败',
    } as ApiResponse)
  }
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const { senderId, receiverId, content, exchangeId } = req.body

    if (!senderId || !receiverId || !content) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      } as ApiResponse)
      return
    }

    if (senderId === receiverId) {
      res.status(400).json({
        success: false,
        error: '不能给自己发送消息',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const senderExists = users.some((u) => u.id === senderId)
    const receiverExists = users.some((u) => u.id === receiverId)

    if (!senderExists || !receiverExists) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      } as ApiResponse)
      return
    }

    const messages = await readJSON<Message[]>(path.join(dataPath, 'messages.json'))
    const newMessage: Message = {
      id: getNextId(messages),
      exchangeId: exchangeId || 0,
      senderId,
      receiverId,
      content,
      type: (req.body.type as 'text' | 'image') || 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
    }

    messages.push(newMessage)
    await writeJSON(path.join(dataPath, 'messages.json'), messages)

    res.status(201).json({
      success: true,
      data: newMessage,
      message: '消息发送成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '发送消息失败',
    } as ApiResponse)
  }
}

export async function markMessagesAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { exchangeId } = req.params
    const { userId } = req.query
    const exchangeIdNum = parseInt(exchangeId, 10)
    const userIdNum = parseInt(userId as string, 10)

    if (isNaN(exchangeIdNum)) {
      res.status(400).json({
        success: false,
        error: '无效的交换记录ID',
      } as ApiResponse)
      return
    }

    if (isNaN(userIdNum)) {
      res.status(400).json({
        success: false,
        error: '缺少或无效的用户ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const messages = await readJSON<Message[]>(path.join(dataPath, 'messages.json'))

    let updatedCount = 0
    const updatedMessages = messages.map((m) => {
      if (
        m.exchangeId === exchangeIdNum &&
        m.receiverId === userIdNum &&
        !m.isRead
      ) {
        updatedCount++
        return { ...m, isRead: true }
      }
      return m
    })

    await writeJSON(path.join(dataPath, 'messages.json'), updatedMessages)

    res.status(200).json({
      success: true,
      data: { updatedCount },
      message: `已标记 ${updatedCount} 条消息为已读`,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '标记消息已读失败',
    } as ApiResponse)
  }
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params
    const userIdNum = parseInt(userId, 10)

    if (isNaN(userIdNum)) {
      res.status(400).json({
        success: false,
        error: '无效的用户ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const messages = await readJSON<Message[]>(path.join(dataPath, 'messages.json'))

    const unreadCount = messages.filter(
      (m) => m.receiverId === userIdNum && !m.isRead,
    ).length

    res.status(200).json({
      success: true,
      data: { count: unreadCount },
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取未读消息数失败',
    } as ApiResponse)
  }
}
