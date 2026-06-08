import { Router } from 'express'
import {
  createOrGetAgreement,
  signAgreement,
  getAgreementByExchangeId,
  createLogistics,
  updateLogisticsStatus,
  getLogisticsByExchangeId,
  confirmDelivery,
} from '../controllers/agreements.js'

const router = Router()

router.get('/exchange/:exchangeId', createOrGetAgreement)
router.get('/:exchangeId/agreement', getAgreementByExchangeId)
router.put('/:id/sign', signAgreement)

router.post('/logistics', createLogistics)
router.get('/logistics/exchange/:exchangeId', getLogisticsByExchangeId)
router.put('/logistics/:id/status', updateLogisticsStatus)
router.put('/logistics/:id/confirm', confirmDelivery)

export default router
