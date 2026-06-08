import type { Request, Response } from 'express'
import path from 'path'
import { readJSON, writeJSON, getNextId, getDataPath } from '../utils/file.js'
import type { Report, Item, User, Exchange } from '../types/index.js'
import { REPORT_TYPES, REPORT_STATUSES } from '../types/index.js'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export async function createReport(req: Request, res: Response): Promise<void> {
  try {
    const { reporterId, targetType, targetId, type, description } = req.body

    if (!reporterId || !targetType || !targetId || !type || !description) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      } as ApiResponse)
      return
    }

    if (!['item', 'exchange'].includes(targetType)) {
      res.status(400).json({
        success: false,
        error: '无效的举报目标类型',
      } as ApiResponse)
      return
    }

    if (!REPORT_TYPES.includes(type as typeof REPORT_TYPES[number])) {
      res.status(400).json({
        success: false,
        error: '无效的举报类型',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const reporterExists = users.some((u) => u.id === reporterId)

    if (!reporterExists) {
      res.status(404).json({
        success: false,
        error: '举报用户不存在',
      } as ApiResponse)
      return
    }

    if (targetType === 'item') {
      const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
      const itemExists = items.some((i) => i.id === targetId)
      if (!itemExists) {
        res.status(404).json({
          success: false,
          error: '被举报物品不存在',
        } as ApiResponse)
        return
      }
    } else {
      const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))
      const exchangeExists = exchanges.some((e) => e.id === targetId)
      if (!exchangeExists) {
        res.status(404).json({
          success: false,
          error: '被举报交换记录不存在',
        } as ApiResponse)
        return
      }
    }

    const reports = await readJSON<Report[]>(path.join(dataPath, 'reports.json'))

    const existingReport = reports.find(
      (r) =>
        r.reporterId === reporterId &&
        r.targetType === targetType &&
        r.targetId === targetId &&
        r.status === '待处理',
    )

    if (existingReport) {
      res.status(400).json({
        success: false,
        error: '您已对该目标发起过举报，正在处理中',
      } as ApiResponse)
      return
    }

    const newReport: Report = {
      id: getNextId(reports),
      reporterId,
      targetType,
      targetId,
      type,
      description,
      status: '待处理',
      handlerId: null,
      handledAt: null,
      handleNote: null,
      createdAt: new Date().toISOString(),
    }

    reports.push(newReport)
    await writeJSON(path.join(dataPath, 'reports.json'), reports)

    if (targetType === 'item') {
      const itemReports = reports.filter(
        (r) => r.targetType === 'item' && r.targetId === targetId && r.status !== '已驳回',
      )
      if (itemReports.length >= 3) {
        const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
        const itemIndex = items.findIndex((i) => i.id === targetId)
        if (itemIndex !== -1 && items[itemIndex].status === '已上架') {
          items[itemIndex].status = '已冻结'
          await writeJSON(path.join(dataPath, 'items.json'), items)
        }
      }
    }

    res.status(201).json({
      success: true,
      data: newReport,
      message: '举报提交成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '提交举报失败',
    } as ApiResponse)
  }
}

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const { status, targetType, reporterId } = req.query

    const dataPath = getDataPath()
    let reports = await readJSON<Report[]>(path.join(dataPath, 'reports.json'))

    if (status && REPORT_STATUSES.includes(status as typeof REPORT_STATUSES[number])) {
      reports = reports.filter((r) => r.status === status)
    }

    if (targetType && ['item', 'exchange'].includes(targetType as string)) {
      reports = reports.filter((r) => r.targetType === targetType)
    }

    if (reporterId) {
      const reporterIdNum = parseInt(reporterId as string, 10)
      reports = reports.filter((r) => r.reporterId === reporterIdNum)
    }

    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))

    const reportsWithDetails = reports.map((report) => {
      const reporter = users.find((u) => u.id === report.reporterId)
      const handler = report.handlerId ? users.find((u) => u.id === report.handlerId) : null
      let targetInfo: Record<string, unknown> | null = null

      if (report.targetType === 'item') {
        const item = items.find((i) => i.id === report.targetId)
        if (item) {
          targetInfo = {
            id: item.id,
            title: item.title,
            images: item.images,
            status: item.status,
          }
        }
      }

      return {
        ...report,
        reporter: reporter
          ? { id: reporter.id, username: reporter.username, avatar: reporter.avatar }
          : null,
        handler: handler
          ? { id: handler.id, username: handler.username }
          : null,
        target: targetInfo,
      }
    })

    res.status(200).json({
      success: true,
      data: reportsWithDetails,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取举报列表失败',
    } as ApiResponse)
  }
}

export async function handleReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { handlerId, status, handleNote } = req.body
    const reportId = parseInt(id, 10)

    if (isNaN(reportId)) {
      res.status(400).json({
        success: false,
        error: '无效的举报ID',
      } as ApiResponse)
      return
    }

    if (!handlerId || !status) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      } as ApiResponse)
      return
    }

    if (!REPORT_STATUSES.includes(status as typeof REPORT_STATUSES[number]) || status === '待处理') {
      res.status(400).json({
        success: false,
        error: '无效的处理状态',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const handlerExists = users.some((u) => u.id === handlerId)

    if (!handlerExists) {
      res.status(404).json({
        success: false,
        error: '处理用户不存在',
      } as ApiResponse)
      return
    }

    const reports = await readJSON<Report[]>(path.join(dataPath, 'reports.json'))
    const reportIndex = reports.findIndex((r) => r.id === reportId)

    if (reportIndex === -1) {
      res.status(404).json({
        success: false,
        error: '举报记录不存在',
      } as ApiResponse)
      return
    }

    if (reports[reportIndex].status !== '待处理') {
      res.status(400).json({
        success: false,
        error: '该举报已被处理',
      } as ApiResponse)
      return
    }

    reports[reportIndex].status = status
    reports[reportIndex].handlerId = handlerId
    reports[reportIndex].handledAt = new Date().toISOString()
    reports[reportIndex].handleNote = handleNote || null

    if (status === '已通过' && reports[reportIndex].targetType === 'item') {
      const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
      const itemIndex = items.findIndex((i) => i.id === reports[reportIndex].targetId)

      if (itemIndex !== -1) {
        items[itemIndex].status = '已下架'
        await writeJSON(path.join(dataPath, 'items.json'), items)

        const itemUserId = items[itemIndex].userId
        const userIndex = users.findIndex((u) => u.id === itemUserId)
        if (userIndex !== -1) {
          users[userIndex].creditScore = Math.max(0, users[userIndex].creditScore - 15)
          await writeJSON(path.join(dataPath, 'users.json'), users)
        }
      }
    }

    await writeJSON(path.join(dataPath, 'reports.json'), reports)

    res.status(200).json({
      success: true,
      data: reports[reportIndex],
      message: '举报处理成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '处理举报失败',
    } as ApiResponse)
  }
}

export async function getReportById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const reportId = parseInt(id, 10)

    if (isNaN(reportId)) {
      res.status(400).json({
        success: false,
        error: '无效的举报ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const reports = await readJSON<Report[]>(path.join(dataPath, 'reports.json'))
    const report = reports.find((r) => r.id === reportId)

    if (!report) {
      res.status(404).json({
        success: false,
        error: '举报记录不存在',
      } as ApiResponse)
      return
    }

    const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
    const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))

    const reporter = users.find((u) => u.id === report.reporterId)
    const handler = report.handlerId ? users.find((u) => u.id === report.handlerId) : null
    let targetInfo: Record<string, unknown> | null = null

    if (report.targetType === 'item') {
      const item = items.find((i) => i.id === report.targetId)
      if (item) {
        targetInfo = {
          id: item.id,
          title: item.title,
          images: item.images,
          status: item.status,
          userId: item.userId,
          user: users.find((u) => u.id === item.userId),
        }
      }
    }

    const reportWithDetails = {
      ...report,
      reporter: reporter
        ? { id: reporter.id, username: reporter.username, avatar: reporter.avatar }
        : null,
      handler: handler
        ? { id: handler.id, username: handler.username }
        : null,
      target: targetInfo,
    }

    res.status(200).json({
      success: true,
      data: reportWithDetails,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取举报详情失败',
    } as ApiResponse)
  }
}
