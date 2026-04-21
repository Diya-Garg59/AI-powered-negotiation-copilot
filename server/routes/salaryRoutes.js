const { Router } = require('express')
const { body, validationResult } = require('express-validator')
const { authMiddleware } = require('../middleware/authMiddleware')
const { success, fail } = require('../utils/apiResponse')
const { benchmarkSalary } = require('../services/ai/salaryBenchmark')

const router = Router()
router.use(authMiddleware)

const validators = [
  body('role').isString().trim().isLength({ min: 2, max: 80 }).withMessage('role is required'),
  body('experience').isString().trim().isLength({ min: 2, max: 40 }).withMessage('experience is required'),
  body('location').optional().isString().trim().isLength({ min: 2, max: 60 }),
  body('offeredSalary').isFloat({ gt: 0 }).withMessage('offeredSalary must be a positive number'),
]

router.post('/benchmark', validators, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return fail(res, 'Validation failed', 422, errors.array())
    }
    const out = await benchmarkSalary(req.body)
    return success(res, out)
  } catch (e) {
    next(e)
  }
})

module.exports = router

