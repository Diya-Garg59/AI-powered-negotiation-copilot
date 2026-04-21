const { Router } = require('express')
const multer = require('multer')
const { PDFParse } = require('pdf-parse')
const { authMiddleware } = require('../middleware/authMiddleware')
const { success, fail } = require('../utils/apiResponse')
const { analyzeOfferLetter } = require('../services/ai/offerAnalyzer')

const router = Router()
router.use(authMiddleware)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
})

router.post('/analyze', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file
    if (!file) return fail(res, 'Please upload a PDF offer letter (file).', 422)
    if (!String(file.mimetype || '').includes('pdf')) {
      return fail(res, 'Only PDF files are supported.', 422)
    }

    const parser = new PDFParse({ data: file.buffer })
    let parsed
    try {
      parsed = await parser.getText()
    } finally {
      await parser.destroy().catch(() => {})
    }
    const text = String(parsed?.text || '').trim()
    if (!text) return fail(res, 'Could not extract text from the PDF.', 422)

    const analysis = await analyzeOfferLetter({ offerText: text })
    return success(res, { analysis })
  } catch (e) {
    next(e)
  }
})

module.exports = router

