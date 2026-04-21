const { completeJson } = require('./openaiClient')
const { isOpenAITransportOrQuotaError } = require('../../utils/openaiErrors')
const { offerAnalyzerSystemPrompt, offerAnalyzerUserPrompt } = require('./prompts')

function safeString(v) {
  return typeof v === 'string' ? v : ''
}

function notSpecified(v) {
  const s = safeString(v).trim()
  return s && s.toUpperCase() !== 'NA' ? s : 'Not specified'
}

function safeConfidence(v) {
  const s = safeString(v).trim()
  if (s === 'High' || s === 'Medium' || s === 'Low') return s
  return 'Medium'
}

function fallbackOfferAnalysis(offerText) {
  const hasBonus = /(bonus|joining bonus|signing|variable pay|incentive)/i.test(offerText)
  const hasProbation = /(probation)/i.test(offerText)
  const hasNotice = /(notice period|notice)/i.test(offerText)
  const hasReview = /(review cycle|performance review|appraisal)/i.test(offerText)

  return {
    context: {
      company: 'Not specified',
      role: 'Not specified',
      location: 'Not specified',
      startDate: 'Not specified',
      employmentType: 'Not specified',
    },
    salary: {
      base: 'Not specified',
      verdict: 'Average',
      bonus: hasBonus ? 'Mentioned' : 'Not Mentioned',
      other: 'Not specified',
    },
    keyTerms: {
      noticePeriod: hasNotice ? 'Not specified (needs confirmation) (Risky)' : 'Not specified (Average)',
      probation: hasProbation ? 'Not specified (needs confirmation)' : 'Not specified',
      reviewCycle: hasReview ? 'Not specified (needs confirmation)' : 'Not specified',
    },
    confidence: {
      overall: 'Low',
      salary: 'Low',
      keyTerms: 'Low',
    },
    redFlags: [
      'Verify base salary breakdown and fixed vs variable components.',
      'Confirm notice period, probation terms, and any clawback clauses.',
    ],
    positives: [
      'Offer letter appears to include standard employment structure (verify specifics).',
      'You can negotiate terms if key fields are not clearly stated.',
    ],
    suggestions: [
      'Ask HR to clarify compensation breakup (base, bonus, allowances, CTC).',
      'Request the notice period/probation/review cycle details in writing.',
    ],
    finalVerdict:
      'This offer needs clarification on key components. Ask for a clear compensation breakup and confirm notice/probation terms before accepting. Negotiate if base or terms are not aligned with your expectations.',
  }
}

function sanitizeOfferAnalysis(raw, offerText) {
  const fallback = fallbackOfferAnalysis(offerText)
  if (!raw || typeof raw !== 'object') return fallback

  const context = raw.context && typeof raw.context === 'object' ? raw.context : {}
  const salary = raw.salary && typeof raw.salary === 'object' ? raw.salary : {}
  const keyTerms = raw.keyTerms && typeof raw.keyTerms === 'object' ? raw.keyTerms : {}
  const confidence = raw.confidence && typeof raw.confidence === 'object' ? raw.confidence : {}

  const verdict = safeString(salary.verdict)
  const safeVerdict = verdict === 'Good' || verdict === 'Average' || verdict === 'Low' ? verdict : fallback.salary.verdict
  const bonus = safeString(salary.bonus)
  const safeBonus = bonus === 'Mentioned' || bonus === 'Not Mentioned' ? bonus : fallback.salary.bonus

  const out = {
    context: {
      company: notSpecified(context.company),
      role: notSpecified(context.role),
      location: notSpecified(context.location),
      startDate: notSpecified(context.startDate),
      employmentType: notSpecified(context.employmentType),
    },
    salary: {
      base: notSpecified(salary.base) || fallback.salary.base,
      verdict: safeVerdict,
      bonus: safeBonus,
      other: notSpecified(salary.other) || fallback.salary.other,
    },
    keyTerms: {
      noticePeriod: notSpecified(keyTerms.noticePeriod) || fallback.keyTerms.noticePeriod,
      probation: notSpecified(keyTerms.probation) || fallback.keyTerms.probation,
      reviewCycle: notSpecified(keyTerms.reviewCycle) || fallback.keyTerms.reviewCycle,
    },
    confidence: {
      overall: safeConfidence(confidence.overall),
      salary: safeConfidence(confidence.salary),
      keyTerms: safeConfidence(confidence.keyTerms),
    },
    redFlags: Array.isArray(raw.redFlags) ? raw.redFlags.map((x) => safeString(x)).filter(Boolean).slice(0, 8) : fallback.redFlags,
    positives: Array.isArray(raw.positives) ? raw.positives.map((x) => safeString(x)).filter(Boolean).slice(0, 8) : fallback.positives,
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions.map((x) => safeString(x)).filter(Boolean).slice(0, 8) : fallback.suggestions,
    finalVerdict: safeString(raw.finalVerdict) || fallback.finalVerdict,
  }

  if (!out.redFlags.length) out.redFlags = fallback.redFlags
  if (!out.positives.length) out.positives = fallback.positives
  if (!out.suggestions.length) out.suggestions = fallback.suggestions
  return out
}

async function analyzeOfferLetter({ offerText }) {
  const trimmed = String(offerText || '').trim()
  const clipped = trimmed.length > 24000 ? trimmed.slice(0, 24000) : trimmed

  try {
    const raw = await completeJson({
      system: offerAnalyzerSystemPrompt(),
      user: offerAnalyzerUserPrompt({ offerText: clipped }),
    })
    const parsed = JSON.parse(raw)
    return sanitizeOfferAnalysis(parsed, clipped)
  } catch (err) {
    if (isOpenAITransportOrQuotaError(err)) {
      console.warn('[offer-analyzer] AI unavailable, using fallback:', err.message || err)
    } else {
      console.warn('[offer-analyzer] Invalid AI output, using fallback:', err.message || err)
    }
    return fallbackOfferAnalysis(clipped)
  }
}

module.exports = { analyzeOfferLetter }

