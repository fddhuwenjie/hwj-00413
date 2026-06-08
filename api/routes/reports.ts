import { Router } from 'express'
import { createReport, getReports, handleReport, getReportById } from '../controllers/reports.js'

const router = Router()

router.post('/', createReport)
router.get('/', getReports)
router.get('/:id', getReportById)
router.put('/:id/handle', handleReport)

export default router
