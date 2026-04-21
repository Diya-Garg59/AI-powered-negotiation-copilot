const { Router } = require('express')
const { body, param, validationResult } = require('express-validator')
const { authMiddleware } = require('../middleware/authMiddleware')
const {
  startNegotiation,
  getHistory,
  getById,
  generateResponse,
} = require('../controllers/negotiationController')

const router = Router()

router.use(authMiddleware)

const startValidators = [
  body('type').isIn(['salary', 'freelance']).withMessage('type must be salary or freelance'),
  body('currency').optional().trim().isLength({ min: 2, max: 8 }),
  body('initialOffer').isFloat({ gt: 0 }).withMessage('initialOffer must be a positive number'),
  body('targetValue').isFloat({ gt: 0 }).withMessage('targetValue must be a positive number'),
  body('minimumAcceptable').isFloat({ gt: 0 }).withMessage('minimumAcceptable must be a positive number'),
  body('strategy')
    .isIn(['aggressive', 'balanced', 'conservative'])
    .withMessage('invalid strategy'),
  body('experienceLevel').isIn(['fresher', 'junior', 'mid']).withMessage('invalid experienceLevel'),
  body().custom((_, { req }) => {
    if (Number(req.body.minimumAcceptable) > Number(req.body.targetValue)) {
      throw new Error('minimumAcceptable cannot be greater than targetValue')
    }
    return true
  }),
]

function handleValidation(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() })
  }
  next()
}

async function validateGenerate(req, res, next) {
  const checks = [
    body('tone').isIn(['formal', 'confident', 'assertive']),
    body('negotiationId').optional().isMongoId(),
    body('result').optional().isObject(),
    body('type').optional().isIn(['salary', 'freelance']),
    body('currency').optional().trim(),
    body('initialOffer').optional().isFloat({ gt: 0 }),
    body('targetValue').optional().isFloat({ gt: 0 }),
    body('minimumAcceptable').optional().isFloat({ gt: 0 }),
  ]
  await Promise.all(checks.map((c) => c.run(req)))
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() })
  }

  if (!req.body.negotiationId && !req.body.result) {
    return res.status(422).json({ success: false, message: 'Provide negotiationId or result' })
  }

  if (!req.body.negotiationId) {
    const r = req.body.result
    const ok =
      r &&
      r.finalRange &&
      Number(r.finalRange.min) > 0 &&
      Number(r.finalRange.max) > 0 &&
      ['low', 'medium', 'high'].includes(r.riskLevel) &&
      Number(r.bestCase) > 0 &&
      Number(r.worstCase) > 0 &&
      Number(r.average) > 0
    if (!ok) {
      return res.status(422).json({
        success: false,
        message: 'result must include bestCase, worstCase, average, finalRange {min,max}, riskLevel',
      })
    }
  }
  next()
}

router.post('/start', startValidators, handleValidation, startNegotiation)
router.get('/history', getHistory)
router.get('/:id', param('id').isMongoId(), handleValidation, getById)
router.post('/generate-response', validateGenerate, generateResponse)

module.exports = router
