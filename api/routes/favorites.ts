import { Router } from 'express'
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavoriteStatus,
  createWantedItem,
  getUserWantedItems,
  updateWantedItemStatus,
  getArrivalNotices,
  markNoticeAsRead,
  deleteWantedItem,
} from '../controllers/favorites.js'

const router = Router()

router.post('/', addFavorite)
router.delete('/', removeFavorite)
router.get('/check', checkFavoriteStatus)
router.get('/user/:userId', getUserFavorites)

router.post('/wanted', createWantedItem)
router.get('/wanted/user/:userId', getUserWantedItems)
router.put('/wanted/:id/status', updateWantedItemStatus)
router.delete('/wanted/:id', deleteWantedItem)

router.get('/notices', getArrivalNotices)
router.put('/notices/:id/read', markNoticeAsRead)

export default router
