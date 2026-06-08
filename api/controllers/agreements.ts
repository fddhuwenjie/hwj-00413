import type { Request, Response } from 'express'
import path from 'path'
import { readJSON, writeJSON, getNextId, getDataPath } from '../utils/file.js'
import type { ExchangeAgreement, Exchange, User, Item, LogisticsRecord, LogisticsEvent } from '../types/index.js'
import { LOGISTICS_STATUSES } from '../types/index.js'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

function generateAgreementContent(
  exchange: Exchange,
  initiator: User,
  responder: User,
  initiatorItem: Item | null,
  responderItem: Item | null,
): string {
  const exchangeDate = new Date().toLocaleDateString('zh-CN')
  const initiatorItemTitle = initiatorItem?.title || '现金'
  const responderItemTitle = responderItem?.title || '现金'
  const amount = exchange.amount ? `，差价补偿：${exchange.amount}元` : ''

  return `
二手物品交换协议

协议编号：AG-${exchange.id}-${Date.now()}
签署日期：${exchangeDate}

一、协议双方
甲方（发起方）：
  姓名：${initiator.username}
  联系方式：${initiator.phone}
  联系地址：${initiator.address}

乙方（响应方）：
  姓名：${responder.username}
  联系方式：${responder.phone}
  联系地址：${responder.address}

二、交换物品信息
甲方提供物品：${initiatorItemTitle}${amount}
乙方提供物品：${responderItemTitle}

三、交换条款
1. 双方确认所提供物品的所有权清晰，无任何产权纠纷。
2. 双方确认已充分了解交换物品的实际状况，包括但不限于成色、功能、瑕疵等。
3. 交换完成后，双方对交换物品的质量问题互不承担责任，除非有证据证明一方存在故意隐瞒或欺诈行为。
4. 物品交换过程中产生的物流费用由双方协商承担。

四、免责条款
1. 本平台仅提供信息发布和交换撮合服务，不对交换物品的质量、真实性、合法性承担任何担保责任。
2. 交换过程中发生的任何纠纷，由双方自行协商解决；协商不成的，可向平台申请调解或通过法律途径解决。
3. 因不可抗力因素导致交换无法完成的，双方互不承担违约责任。

五、协议生效
本协议自双方签署之日起生效，一式两份，双方各执一份，具有同等法律效力。

六、其他约定
${exchange.message ? `交换备注：${exchange.message}` : '无'}

协议内容确认无误，双方自愿签署。
  `
}

export async function createOrGetAgreement(req: Request, res: Response): Promise<void> {
  try {
    const { exchangeId } = req.params
    const exchangeIdNum = parseInt(exchangeId, 10)

    if (isNaN(exchangeIdNum)) {
      res.status(400).json({
        success: false,
        error: '无效的交换ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))
    const exchange = exchanges.find((e) => e.id === exchangeIdNum)

    if (!exchange) {
      res.status(404).json({
        success: false,
        error: '交换记录不存在',
      } as ApiResponse)
      return
    }

    if (!['已确认', '进行中'].includes(exchange.status)) {
      res.status(400).json({
        success: false,
        error: '该交换状态无法生成协议',
      } as ApiResponse)
      return
    }

    const agreements = await readJSON<ExchangeAgreement[]>(path.join(dataPath, 'exchangeAgreements.json'))
    let agreement = agreements.find((a) => a.exchangeId === exchangeIdNum)

    if (!agreement) {
      const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))
      const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))

      const initiator = users.find((u) => u.id === exchange.initiatorId)
      const responder = users.find((u) => u.id === exchange.responderId)
      const initiatorItem = items.find((i) => i.id === exchange.itemId) || null
      const responderItem = exchange.targetItemId
        ? items.find((i) => i.id === exchange.targetItemId) || null
        : null

      if (!initiator || !responder) {
        res.status(500).json({
          success: false,
          error: '用户信息不完整',
        } as ApiResponse)
        return
      }

      const content = generateAgreementContent(exchange, initiator, responder, initiatorItem, responderItem)

      agreement = {
        id: getNextId(agreements),
        exchangeId: exchangeIdNum,
        initiatorSignature: false,
        responderSignature: false,
        initiatorSignedAt: null,
        responderSignedAt: null,
        content,
        createdAt: new Date().toISOString(),
        effectiveAt: null,
      }

      agreements.push(agreement)
      await writeJSON(path.join(dataPath, 'exchangeAgreements.json'), agreements)
    }

    res.status(200).json({
      success: true,
      data: agreement,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取协议失败',
    } as ApiResponse)
  }
}

export async function signAgreement(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { userId } = req.body
    const agreementId = parseInt(id, 10)

    if (isNaN(agreementId) || !userId) {
      res.status(400).json({
        success: false,
        error: '无效的参数',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const agreements = await readJSON<ExchangeAgreement[]>(path.join(dataPath, 'exchangeAgreements.json'))
    const agreementIndex = agreements.findIndex((a) => a.id === agreementId)

    if (agreementIndex === -1) {
      res.status(404).json({
        success: false,
        error: '协议不存在',
      } as ApiResponse)
      return
    }

    const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))
    const exchange = exchanges.find((e) => e.id === agreements[agreementIndex].exchangeId)

    if (!exchange) {
      res.status(404).json({
        success: false,
        error: '交换记录不存在',
      } as ApiResponse)
      return
    }

    const isInitiator = userId === exchange.initiatorId
    const isResponder = userId === exchange.responderId

    if (!isInitiator && !isResponder) {
      res.status(403).json({
        success: false,
        error: '您无权签署此协议',
      } as ApiResponse)
      return
    }

    const now = new Date().toISOString()

    if (isInitiator) {
      if (agreements[agreementIndex].initiatorSignature) {
        res.status(400).json({
          success: false,
          error: '您已签署此协议',
        } as ApiResponse)
        return
      }
      agreements[agreementIndex].initiatorSignature = true
      agreements[agreementIndex].initiatorSignedAt = now
    } else {
      if (agreements[agreementIndex].responderSignature) {
        res.status(400).json({
          success: false,
          error: '您已签署此协议',
        } as ApiResponse)
        return
      }
      agreements[agreementIndex].responderSignature = true
      agreements[agreementIndex].responderSignedAt = now
    }

    if (agreements[agreementIndex].initiatorSignature && agreements[agreementIndex].responderSignature) {
      agreements[agreementIndex].effectiveAt = now
    }

    await writeJSON(path.join(dataPath, 'exchangeAgreements.json'), agreements)

    res.status(200).json({
      success: true,
      data: agreements[agreementIndex],
      message: '协议签署成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '签署协议失败',
    } as ApiResponse)
  }
}

export async function getAgreementByExchangeId(req: Request, res: Response): Promise<void> {
  try {
    const { exchangeId } = req.params
    const exchangeIdNum = parseInt(exchangeId, 10)

    if (isNaN(exchangeIdNum)) {
      res.status(400).json({
        success: false,
        error: '无效的交换ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const agreements = await readJSON<ExchangeAgreement[]>(path.join(dataPath, 'exchangeAgreements.json'))
    const agreement = agreements.find((a) => a.exchangeId === exchangeIdNum)

    if (!agreement) {
      res.status(404).json({
        success: false,
        error: '协议不存在',
      } as ApiResponse)
      return
    }

    res.status(200).json({
      success: true,
      data: agreement,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取协议失败',
    } as ApiResponse)
  }
}

export async function createLogistics(req: Request, res: Response): Promise<void> {
  try {
    const { exchangeId, trackingNumber, company, senderId, receiverId } = req.body

    if (!exchangeId || !trackingNumber || !company || !senderId || !receiverId) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
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

    if (!['已确认', '进行中'].includes(exchange.status)) {
      res.status(400).json({
        success: false,
        error: '该交换状态无法添加物流信息',
      } as ApiResponse)
      return
    }

    const logisticsRecords = await readJSON<LogisticsRecord[]>(path.join(dataPath, 'logisticsRecords.json'))

    const existingLogistics = logisticsRecords.find((l) => l.exchangeId === exchangeId)
    if (existingLogistics) {
      res.status(400).json({
        success: false,
        error: '该交换已有物流记录',
      } as ApiResponse)
      return
    }

    const initialTimeline: LogisticsEvent[] = [
      {
        status: '待发货',
        description: '等待发货',
        time: new Date().toISOString(),
      },
    ]

    const newLogistics: LogisticsRecord = {
      id: getNextId(logisticsRecords),
      exchangeId,
      trackingNumber,
      company,
      status: '待发货',
      senderId,
      receiverId,
      senderConfirmed: false,
      receiverConfirmed: false,
      timeline: initialTimeline,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    logisticsRecords.push(newLogistics)
    await writeJSON(path.join(dataPath, 'logisticsRecords.json'), logisticsRecords)

    res.status(201).json({
      success: true,
      data: newLogistics,
      message: '物流信息添加成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '添加物流信息失败',
    } as ApiResponse)
  }
}

export async function updateLogisticsStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { status, description, userId } = req.body
    const logisticsId = parseInt(id, 10)

    if (isNaN(logisticsId) || !status || !userId) {
      res.status(400).json({
        success: false,
        error: '无效的参数',
      } as ApiResponse)
      return
    }

    if (!LOGISTICS_STATUSES.includes(status as typeof LOGISTICS_STATUSES[number])) {
      res.status(400).json({
        success: false,
        error: '无效的物流状态',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const logisticsRecords = await readJSON<LogisticsRecord[]>(path.join(dataPath, 'logisticsRecords.json'))
    const logisticsIndex = logisticsRecords.findIndex((l) => l.id === logisticsId)

    if (logisticsIndex === -1) {
      res.status(404).json({
        success: false,
        error: '物流记录不存在',
      } as ApiResponse)
      return
    }

    const logistics = logisticsRecords[logisticsIndex]
    const isSender = userId === logistics.senderId
    const isReceiver = userId === logistics.receiverId

    if (!isSender && !isReceiver) {
      res.status(403).json({
        success: false,
        error: '您无权修改此物流信息',
      } as ApiResponse)
      return
    }

    if (status === '已发出' && !isSender) {
      res.status(403).json({
        success: false,
        error: '只有发货方可以标记已发出',
      } as ApiResponse)
      return
    }

    if (status === '已签收' && !isReceiver) {
      res.status(403).json({
        success: false,
        error: '只有收货方可以标记已签收',
      } as ApiResponse)
      return
    }

    const now = new Date().toISOString()
    const newEvent: LogisticsEvent = {
      status,
      description: description || getDefaultStatusDescription(status),
      time: now,
    }

    logisticsRecords[logisticsIndex].status = status
    logisticsRecords[logisticsIndex].timeline.push(newEvent)
    logisticsRecords[logisticsIndex].updatedAt = now

    if (status === '已签收') {
      if (isReceiver) {
        logisticsRecords[logisticsIndex].receiverConfirmed = true
      }
      if (isSender) {
        logisticsRecords[logisticsIndex].senderConfirmed = true
      }
    }

    if (status === '已发出' && isSender) {
      logisticsRecords[logisticsIndex].senderConfirmed = true
    }

    const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))
    const exchangeIndex = exchanges.findIndex((e) => e.id === logistics.exchangeId)

    if (status === '已签收' && logisticsRecords[logisticsIndex].senderConfirmed && logisticsRecords[logisticsIndex].receiverConfirmed) {
      if (exchangeIndex !== -1 && exchanges[exchangeIndex].status !== '已完成') {
        exchanges[exchangeIndex].status = '已完成'
        exchanges[exchangeIndex].completedAt = now

        const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
        const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))

        const itemIndex = items.findIndex((i) => i.id === exchanges[exchangeIndex].itemId)
        if (itemIndex !== -1) {
          items[itemIndex].status = '已交换'
        }

        if (exchanges[exchangeIndex].targetItemId) {
          const targetItemIndex = items.findIndex(
            (i) => i.id === exchanges[exchangeIndex].targetItemId,
          )
          if (targetItemIndex !== -1) {
            items[targetItemIndex].status = '已交换'
          }
        }

        const initiatorIndex = users.findIndex((u) => u.id === exchanges[exchangeIndex].initiatorId)
        const responderIndex = users.findIndex((u) => u.id === exchanges[exchangeIndex].responderId)
        if (initiatorIndex !== -1) {
          users[initiatorIndex].exchangeCount += 1
        }
        if (responderIndex !== -1) {
          users[responderIndex].exchangeCount += 1
        }

        await writeJSON(path.join(dataPath, 'items.json'), items)
        await writeJSON(path.join(dataPath, 'users.json'), users)
        await writeJSON(path.join(dataPath, 'exchanges.json'), exchanges)
      }
    }

    await writeJSON(path.join(dataPath, 'logisticsRecords.json'), logisticsRecords)

    res.status(200).json({
      success: true,
      data: logisticsRecords[logisticsIndex],
      message: '物流状态更新成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '更新物流状态失败',
    } as ApiResponse)
  }
}

function getDefaultStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    '待发货': '等待卖家发货',
    '已发出': '卖家已发货，包裹正在运输途中',
    '运输中': '包裹正在运输中',
    '已签收': '包裹已成功签收',
  }
  return descriptions[status] || '物流状态更新'
}

export async function getLogisticsByExchangeId(req: Request, res: Response): Promise<void> {
  try {
    const { exchangeId } = req.params
    const exchangeIdNum = parseInt(exchangeId, 10)

    if (isNaN(exchangeIdNum)) {
      res.status(400).json({
        success: false,
        error: '无效的交换ID',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const logisticsRecords = await readJSON<LogisticsRecord[]>(path.join(dataPath, 'logisticsRecords.json'))
    const logistics = logisticsRecords.find((l) => l.exchangeId === exchangeIdNum)

    if (!logistics) {
      res.status(404).json({
        success: false,
        error: '物流记录不存在',
      } as ApiResponse)
      return
    }

    res.status(200).json({
      success: true,
      data: logistics,
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '获取物流信息失败',
    } as ApiResponse)
  }
}

export async function confirmDelivery(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { userId } = req.body
    const logisticsId = parseInt(id, 10)

    if (isNaN(logisticsId) || !userId) {
      res.status(400).json({
        success: false,
        error: '无效的参数',
      } as ApiResponse)
      return
    }

    const dataPath = getDataPath()
    const logisticsRecords = await readJSON<LogisticsRecord[]>(path.join(dataPath, 'logisticsRecords.json'))
    const logisticsIndex = logisticsRecords.findIndex((l) => l.id === logisticsId)

    if (logisticsIndex === -1) {
      res.status(404).json({
        success: false,
        error: '物流记录不存在',
      } as ApiResponse)
      return
    }

    const logistics = logisticsRecords[logisticsIndex]
    const isSender = userId === logistics.senderId
    const isReceiver = userId === logistics.receiverId

    if (!isSender && !isReceiver) {
      res.status(403).json({
        success: false,
        error: '您无权确认此物流信息',
      } as ApiResponse)
      return
    }

    const now = new Date().toISOString()

    if (isSender) {
      logisticsRecords[logisticsIndex].senderConfirmed = true
    }

    if (isReceiver) {
      logisticsRecords[logisticsIndex].receiverConfirmed = true
    }

    logisticsRecords[logisticsIndex].updatedAt = now

    if (logisticsRecords[logisticsIndex].senderConfirmed && logisticsRecords[logisticsIndex].receiverConfirmed) {
      const exchanges = await readJSON<Exchange[]>(path.join(dataPath, 'exchanges.json'))
      const exchangeIndex = exchanges.findIndex((e) => e.id === logistics.exchangeId)

      if (exchangeIndex !== -1 && exchanges[exchangeIndex].status !== '已完成') {
        exchanges[exchangeIndex].status = '已完成'
        exchanges[exchangeIndex].completedAt = now

        const items = await readJSON<Item[]>(path.join(dataPath, 'items.json'))
        const users = await readJSON<User[]>(path.join(dataPath, 'users.json'))

        const itemIndex = items.findIndex((i) => i.id === exchanges[exchangeIndex].itemId)
        if (itemIndex !== -1) {
          items[itemIndex].status = '已交换'
        }

        if (exchanges[exchangeIndex].targetItemId) {
          const targetItemIndex = items.findIndex(
            (i) => i.id === exchanges[exchangeIndex].targetItemId,
          )
          if (targetItemIndex !== -1) {
            items[targetItemIndex].status = '已交换'
          }
        }

        const initiatorIndex = users.findIndex((u) => u.id === exchanges[exchangeIndex].initiatorId)
        const responderIndex = users.findIndex((u) => u.id === exchanges[exchangeIndex].responderId)
        if (initiatorIndex !== -1) {
          users[initiatorIndex].exchangeCount += 1
        }
        if (responderIndex !== -1) {
          users[responderIndex].exchangeCount += 1
        }

        await writeJSON(path.join(dataPath, 'items.json'), items)
        await writeJSON(path.join(dataPath, 'users.json'), users)
        await writeJSON(path.join(dataPath, 'exchanges.json'), exchanges)
      }
    }

    await writeJSON(path.join(dataPath, 'logisticsRecords.json'), logisticsRecords)

    res.status(200).json({
      success: true,
      data: logisticsRecords[logisticsIndex],
      message: '确认成功',
    } as ApiResponse)
  } catch {
    res.status(500).json({
      success: false,
      error: '确认失败',
    } as ApiResponse)
  }
}
