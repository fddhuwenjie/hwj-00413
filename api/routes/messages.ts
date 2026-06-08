import { Router } from 'express'
import { getMessages, getMessagesByExchange, sendMessage, markMessagesAsRead, getUnreadCount } from '../controllers/messages.js'

const router = Router()

router.get('/', getMessages)
router.get('/exchange/:exchangeId', getMessagesByExchange)
router.post('/', sendMessage)
router.put('/read/:exchangeId', markMessagesAsRead)
router.get('/unread/:userId', getUnreadCount)

export default router
