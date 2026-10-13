require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')

const authRoutes = require('./routes/auth')
const studentRoutes = require('./routes/student')
const verifyRoutes = require('./routes/verify')

const app = express()
const PORT = process.env.PORT || 5000

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}))

// Allowed browser origins. Localhost (dev) is always allowed; add your
// deployed frontend origin(s) via CORS_ORIGINS in the server .env, e.g.
//   CORS_ORIGINS=https://lords.digiicampus.vercel.app,https://yourdomain.com
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean),
]

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients (curl, server-to-server) that send no Origin,
    // plus any explicitly allowed origin.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// General rate limit: 100 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please slow down.' }
}))

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// ─── Static Files ──────────────────────────────────────────────────────────────
// QR images are public (they're just QR codes)
app.use('/uploads/qr', express.static(path.join(__dirname, 'uploads/qr')))

// Student photos served ONLY via /api/verify route (controlled), not directly
// Direct /uploads/photos access blocked below

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/verify', verifyRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Block ALL direct uploads access except qr (already served above)
app.use('/uploads', (req, res) => {
  res.status(403).json({ message: 'Access denied.' })
})

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' })
})

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message
  })
})

// ─── Connect DB & Start ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })
