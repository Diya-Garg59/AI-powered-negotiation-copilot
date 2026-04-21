const mongoose = require('mongoose')

const DEFAULT_DEV_URI = 'mongodb://127.0.0.1:27017/negotiation-copilot'

function resolveMongoUri() {
  if (process.env.MONGODB_URI?.trim()) {
    return process.env.MONGODB_URI.trim()
  }
  if (process.env.NODE_ENV !== 'production') {
    return DEFAULT_DEV_URI
  }
  return null
}

async function connectDb() {
  const uri = resolveMongoUri()
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy server/.env.example to server/.env and set MONGODB_URI.',
    )
  }
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  if (process.env.NODE_ENV !== 'production') {
    const { host, port, name } = mongoose.connection
    console.log(`[db] Connected — ${name} @ ${host}:${port}`)
  }
  return mongoose.connection
}

module.exports = { connectDb }
