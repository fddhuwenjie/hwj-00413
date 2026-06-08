import type { Request, Response } from 'express'
import path from 'path'
import { readJSON, getDataPath } from '../utils/file.js'
import type { User } from '../types/index.js'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const dataPath = getDataPath()
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const usersWithoutPassword = users.map(({ password, ...user }) => user)

    res.status(200).json({
      success: true,
      data: usersWithoutPassword,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取用户列表失败',
    } as ApiResponse)
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const userId = parseInt(id, 10)

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: '无效的用户ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const user = users.find((u) => u.id === userId)

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      } as ApiResponse)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取用户详情失败',
    } as ApiResponse)
  }
}
