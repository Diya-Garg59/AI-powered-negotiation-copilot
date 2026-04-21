const jwt = require('jsonwebtoken')
const { AppError } = require('../utils/AppError')

function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401)
    }
    const token = header.slice(7)
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET is not configured')
    }
    const decoded = jwt.verify(token, secret)
    if (!decoded?.userId) {
      throw new AppError('Invalid token', 401)
    }
    req.userId = decoded.userId
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401))
    }
    next(err)
  }
}

module.exports = { authMiddleware }
