const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const User = require('../models/User')
const { AppError } = require('../utils/AppError')
const { success, fail } = require('../utils/apiResponse')

function signToken(userId) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return jwt.sign({ userId: String(userId) }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return fail(res, 'Validation failed', 422, errors.array())
    }
    const { name, email, password } = req.body
    const existing = await User.findOne({ email })
    if (existing) {
      return fail(res, 'Email already registered', 409)
    }
    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, password: hashed })
    const token = signToken(user._id)
    return success(
      res,
      {
        token,
        user: { id: user._id, name: user.name, email: user.email },
      },
      201,
    )
  } catch (e) {
    if (e && (e.code === 11000 || e.code === '11000')) {
      return fail(res, 'This email is already registered. Try logging in instead.', 409)
    }
    next(e)
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return fail(res, 'Validation failed', 422, errors.array())
    }
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      throw new AppError('Invalid email or password', 401)
    }
    const token = signToken(user._id)
    return success(res, {
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (e) {
    next(e)
  }
}

module.exports = { register, login }
