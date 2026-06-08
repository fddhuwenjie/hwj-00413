/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import itemsRoutes from './routes/items.js'
import exchangesRoutes from './routes/exchanges.js'
import messagesRoutes from './routes/messages.js'
import reviewsRoutes from './routes/reviews.js'
import statsRoutes from './routes/stats.js'
import { seed } from './mock/seed.js'

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

seed().catch((err) => {
  console.error('Failed to seed data on startup:', err)
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/items', itemsRoutes)
app.use('/api/exchanges', exchangesRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/stats', statsRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: Request, res: Response, next) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
