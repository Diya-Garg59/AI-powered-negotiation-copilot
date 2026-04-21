const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env')
const envExamplePath = path.join(__dirname, '.env.example')
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath)
  console.log('[config] Created server/.env from .env.example (edit XAI_API_KEY & JWT_SECRET as needed).')
}

// Parent .env (e.g. repo root) then server/.env — server wins for duplicate keys
const rootEnvPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath })
}
require('dotenv').config({ path: envPath, override: true })

const { getLlmApiKey, isLlmConfigured } = require('./utils/env')

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { connectDb } = require('./config/db')
const { errorHandler } = require('./middleware/errorHandler')
const authRoutes = require('./routes/authRoutes')
const negotiationRoutes = require('./routes/negotiationRoutes')
const offerRoutes = require('./routes/offerRoutes')
const salaryRoutes = require('./routes/salaryRoutes')

const app = express()
const PORT = Number(process.env.PORT) || 5000

app.set('trust proxy', 1)

app.use(helmet())
app.use(
  cors({
    // In dev, reflect request origin so any localhost port (5173, 5174, …) works with direct API calls.
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL || true
        : true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '512kb' }))

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', apiLimiter)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } })
})

app.get('/api/health/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      aiConfigured: isLlmConfigured(),
      mongoUriSet: Boolean(process.env.MONGODB_URI?.trim()),
      port: PORT,
    },
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/negotiation', negotiationRoutes)
app.use('/api/offer', offerRoutes)
app.use('/api/salary', salaryRoutes)

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' })
})

app.use(errorHandler)

async function main() {
  await connectDb()
  const key = getLlmApiKey()
  if (!key) {
    console.warn(
      '[config] AI API key is missing or empty. Add XAI_API_KEY (or GROK_API_KEY) to server/.env, then restart.',
    )
  } else {
    console.log(`[config] AI API key loaded (${key.length} characters)`)
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Negotiation Copilot API listening on http://127.0.0.1:${PORT} (and LAN)`)
  })
}

main().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
