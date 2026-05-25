import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { connectDB } from './db.js'
import ticketRoutes from './routes/tickets.js'

dotenv.config()

const app = express()

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin is not allowed by CORS.'))
    },
  }),
)

app.use(express.json({ limit: '1mb' }))

app.use('/api', async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (error) {
    next(error)
  }
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'support-crm-api' })
})

app.use('/api/tickets', ticketRoutes)

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' })
})

app.use((error, req, res, _next) => {
  const statusCode = error.statusCode || 500
  const message =
    statusCode === 500 ? 'Something went wrong. Please try again.' : error.message

  if (statusCode === 500) {
    console.error(error)
  }

  res.status(statusCode).json({
    error: message,
    code: error.code,
  })
})

export default app
