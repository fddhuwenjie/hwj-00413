import { Router } from 'express'
import { getItems, getItemById, createItem, incrementViews } from '../controllers/items.js'

const router = Router()

router.get('/', getItems)
router.get('/:id', getItemById)
router.post('/', createItem)
router.put('/:id/views', incrementViews)

export default router
