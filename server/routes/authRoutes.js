const { Router } = require('express')
const { body } = require('express-validator')
const rateLimit = require('express-rate-limit')
const { register, login } = require('../controllers/authController')

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
})

const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]

const loginValidators = [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

router.post('/register', authLimiter, registerValidators, register)
router.post('/login', authLimiter, loginValidators, login)

module.exports = router
