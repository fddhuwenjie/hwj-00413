import type { Request, Response } from 'express'
import path from 'path'
import { readJSON, writeJSON, getNextId, getDataPath } from '../utils/file.js'
import type { Review, User, Exchange } from '../types/index.js'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const { reviewerId, revieweeId, exchangeId, rating, comment } = req.body

    if (!reviewerId || !revieweeId || !exchangeId || rating === undefined) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      } as ApiResponse)
      return
    }

    if (reviewerId === revieweeId) {
      res.status(400).json({
        success: false,
        error: '不能评价自己',
      } as ApiResponse)
      return
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: '评分必须在1-5之间',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const reviewerExists = users.some((u) => u.id === reviewerId)
    const revieweeExists = users.some((u) => u.id === revieweeId)

    if (!reviewerExists || !revieweeExists) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      } as ApiResponse)
      return
    }

    const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))
    const exchange = exchanges.find((e) => e.id === exchangeId)

    if (!exchange) {
      res.status(404).json({
        success: false,
        error: '交换记录不存在',
      } as ApiResponse)
      return
    }

    if (exchange.status !== '已完成') {
      res.status(400).json({
        success: false,
        error: '只能评价已完成的交换',
      } as ApiResponse)
      return
    }

    if (exchange.initiatorId !== reviewerId && exchange.responderId !== reviewerId) {
      res.status(403).json({
        success: false,
        error: '无权评价此交换',
      } as ApiResponse)
      return
    }

    if (exchange.initiatorId !== revieweeId && exchange.responderId !== revieweeId) {
      res.status(400).json({
        success: false,
        error: '被评价用户与交换无关',
      } as ApiResponse)
      return
    }

    const reviews = await readJSON<Review[]>(path.join(dataPath, 'reviews.json'))
    const existingReview = reviews.find(
      (r) => r.reviewerId === reviewerId && r.exchangeId === exchangeId,
    )

    if (existingReview) {
      res.status(400).json({
        success: false,
        error: '您已对此交换进行过评价',
      } as ApiResponse)
      return
    }

    const newReview: Review = {
      id: getNextId(reviews),
      reviewerId,
      revieweeId,
      exchangeId,
      rating: parseInt(rating, 10),
      comment: comment || '',
      createdAt: new Date().toISOString(),
    }

    reviews.push(newReview)
    await writeJSON(path.join(dataPath, 'reviews.json'), reviews)

    await updateUserCreditScore(revieweeId)

    res.status(201).json({
      success: true,
      data: newReview,
      message: '评价提交成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '提交评价失败',
    } as ApiResponse)
  }
}

export async function getUserReviews(req: Request, res: Response): Promise<void> {
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
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const userExists = users.some((u) => u.id === userIdNum)

    if (!userExists) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      } as ApiResponse)
      return
    }

    const reviews = await readJSON<Review[]>(path.join(dataPath, 'reviews.json'))
    const userReviews = reviews.filter((r) => r.revieweeId === userIdNum)

    userReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const averageRating =
      userReviews.length > 0
        ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
        : 0

    res.status(200).json({
      success: true,
      data: {
        reviews: userReviews,
        total: userReviews.length,
        averageRating: parseFloat(averageRating.toFixed(1)),
      },
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取用户评价失败',
    } as ApiResponse)
  }
}

async function updateUserCreditScore(userId: number): Promise<void> {
  const dataPath = getDataPath()
  const reviews = await readJSON<Review[]>(path.join(dataPath, 'reviews.json'))
  const userReviews = reviews.filter((r) => r.revieweeId === userId)

  const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex !== -1 && userReviews.length > 0) {
    const averageRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
    const baseScore = 50
    const ratingBonus = (averageRating - 3) * 10
    const countBonus = Math.min(userReviews.length * 2, 20)
    const newCreditScore = Math.min(100, Math.max(0, Math.round(baseScore + ratingBonus + countBonus)))

    users[userIndex].creditScore = newCreditScore
    await writeJSON(path.join(dataPath, 'users.json'), users)
  }
}

export async function updateCreditScore(req: Request, res: Response): Promise<void> {
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
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const userIndex = users.findIndex((u) => u.id === userIdNum)

    if (userIndex === -1) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      } as ApiResponse)
      return
    }

    await updateUserCreditScore(userIdNum)

    const updatedUsers = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const updatedUser = updatedUsers.find((u) => u.id === userIdNum)

    res.status(200).json({
      success: true,
      data: { creditScore: updatedUser?.creditScore },
      message: '信用分更新成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '更新信用分失败',
    } as ApiResponse)
  }
}
