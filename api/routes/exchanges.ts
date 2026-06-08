import { Router } from 'express'
import { getExchanges, getExchangeById, createExchange, updateExchangeStatus } from '../controllers/exchanges.js'

const router = Router()

router.get('/', getExchanges)
router.get('/:id', getExchangeById)
router.post('/', createExchange)
router.put('/:id/status', updateExchangeStatus)

export default router
