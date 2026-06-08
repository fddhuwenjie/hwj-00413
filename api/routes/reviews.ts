import { Router } from 'express'
import { createReview, getUserReviews, updateCreditScore } from '../controllers/reviews.js'

const router = Router()

router.post('/', createReview)
router.get('/user/:userId', getUserReviews)
router.put('/credit-score/:userId', updateCreditScore)

export default router
