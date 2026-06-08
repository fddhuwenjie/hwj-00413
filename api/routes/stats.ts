import { Router } from 'express'
import { getOverview, getCategoryDistribution, getWeeklyTrend, getPopularItems } from '../controllers/stats.js'

const router = Router()

router.get('/overview', getOverview)
router.get('/category-distribution', getCategoryDistribution)
router.get('/weekly-trend', getWeeklyTrend)
router.get('/popular-items', getPopularItems)

export default router
