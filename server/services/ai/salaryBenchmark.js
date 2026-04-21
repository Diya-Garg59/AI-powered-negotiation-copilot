const { completeJson } = require('./openaiClient')
const { isOpenAITransportOrQuotaError } = require('../../utils/openaiErrors')
const { salaryBenchmarkSystemPrompt, salaryBenchmarkUserPrompt } = require('./prompts')

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function formatInr(n) {
  const v = Math.round(Number(n) || 0)
  return `₹${v.toLocaleString('en-IN')}`
}

function formatLakhRange(min, max) {
  const lo = Math.round(min / 10000) / 100
  const hi = Math.round(max / 10000) / 100
  return `₹${lo}L – ₹${hi}L`
}

function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normalizeExperience(exp) {
  return String(exp || '').trim().toLowerCase()
}

function estimateRangeIndia({ role, experience, location }) {
  const r = normalizeRole(role)
  const e = normalizeExperience(experience)
  const loc = String(location || 'India').trim().toLowerCase()

  // Baselines are annual CTC-ish ranges in INR, pragmatic & conservative.
  let baseMin = 450000
  let baseMax = 750000

  if (r.includes('data scientist') || r.includes('ml') || r.includes('machine learning')) {
    baseMin = 650000
    baseMax = 1200000
  } else if (r.includes('frontend') || r.includes('front-end') || r.includes('react')) {
    baseMin = 500000
    baseMax = 900000
  } else if (r.includes('backend') || r.includes('back-end') || r.includes('node') || r.includes('java')) {
    baseMin = 520000
    baseMax = 950000
  } else if (r.includes('full stack') || r.includes('full-stack')) {
    baseMin = 550000
    baseMax = 1000000
  } else if (r.includes('devops') || r.includes('sre')) {
    baseMin = 700000
    baseMax = 1300000
  } else if (r.includes('qa') || r.includes('test') || r.includes('automation')) {
    baseMin = 420000
    baseMax = 750000
  } else if (r.includes('product manager') || r.includes('pm')) {
    baseMin = 900000
    baseMax = 1700000
  } else if (r.includes('designer') || r.includes('ui') || r.includes('ux')) {
    baseMin = 450000
    baseMax = 850000
  }

  // Experience multipliers.
  let mult = 1
  if (e.includes('fresher') || e.includes('0')) mult = 0.9
  else if (e.includes('1–2') || e.includes('1-2') || e.includes('1 to 2')) mult = 1.05
  else if (e.includes('3–5') || e.includes('3-5') || e.includes('3 to 5')) mult = 1.35
  else if (e.includes('6–8') || e.includes('6-8') || e.includes('6 to 8')) mult = 1.7
  else if (e.includes('9+') || e.includes('9 +') || e.includes('10')) mult = 2.05

  // Location adjustments (India baseline).
  let locMult = 1
  if (/(bangalore|bengaluru|mumbai|gurgaon|gurugram|noida|hyderabad|pune)/.test(loc)) locMult = 1.12
  if (/(remote)/.test(loc)) locMult = 1.05

  const min = Math.round(baseMin * mult * locMult)
  const max = Math.round(baseMax * mult * locMult)
  const avg = Math.round((min + max) / 2)
  return { min, max, avg }
}

function computeComparison(offered, min, max, avg) {
  if (offered < avg * 0.92 || offered < min) return 'Below Average'
  if (offered > avg * 1.08 || offered > max) return 'Above Average'
  return 'Fair'
}

function fallbackBenchmark(input) {
  const { role, experience, location, offeredSalary } = input
  const offered = Number(offeredSalary) || 0
  const { min, max, avg } = estimateRangeIndia({ role, experience, location })
  const comparison = computeComparison(offered, min, max, avg)

  const recLo =
    comparison === 'Below Average' ? Math.round(avg * 0.98) : comparison === 'Fair' ? Math.round(avg * 1.02) : Math.round(offered * 1.03)
  const recHi =
    comparison === 'Below Average' ? Math.round(avg * 1.08) : comparison === 'Fair' ? Math.round(avg * 1.1) : Math.round(offered * 1.08)

  const insight =
    comparison === 'Below Average'
      ? `Your offer (${formatInr(offered)}) is slightly under the typical market band for ${role} in ${location}. There is room to negotiate if the role scope matches your skills.`
      : comparison === 'Above Average'
        ? `Your offer (${formatInr(offered)}) is strong relative to the market band for ${role} in ${location}. Focus on role growth, review cycle, and variable components.`
        : `Your offer (${formatInr(offered)}) sits close to the current market average for ${role} in ${location}. A small optimization is possible with a clean value-based ask.`

  return {
    marketRange: formatLakhRange(min, max),
    averageSalary: formatLakhRange(avg, avg).replace(' – ', ''), // "₹X L"
    userSalary: formatInr(offered),
    comparison,
    insight,
    recommendedRange: formatLakhRange(recLo, recHi),
    confidence: 'Medium',
  }
}

function safeString(v) {
  return typeof v === 'string' ? v : ''
}

function safeConfidence(v) {
  const s = safeString(v).trim()
  if (s === 'High' || s === 'Medium' || s === 'Low') return s
  return 'Medium'
}

function sanitizeBenchmark(raw, input) {
  const fb = fallbackBenchmark(input)
  if (!raw || typeof raw !== 'object') return fb
  const comparison = safeString(raw.comparison).trim()
  const okComp = comparison === 'Below Average' || comparison === 'Fair' || comparison === 'Above Average'
  return {
    marketRange: safeString(raw.marketRange) || fb.marketRange,
    averageSalary: safeString(raw.averageSalary) || fb.averageSalary,
    userSalary: safeString(raw.userSalary) || fb.userSalary,
    comparison: okComp ? comparison : fb.comparison,
    insight: safeString(raw.insight) || fb.insight,
    recommendedRange: safeString(raw.recommendedRange) || fb.recommendedRange,
    confidence: safeConfidence(raw.confidence),
  }
}

async function benchmarkSalary(input) {
  const base = {
    role: String(input.role || '').trim(),
    experience: String(input.experience || '').trim(),
    location: String(input.location || 'India').trim(),
    offeredSalary: Number(input.offeredSalary) || 0,
  }
  const fb = fallbackBenchmark(base)

  try {
    const raw = await completeJson({
      system: salaryBenchmarkSystemPrompt(),
      user: salaryBenchmarkUserPrompt(base),
    })
    const parsed = JSON.parse(raw)
    return sanitizeBenchmark(parsed, base)
  } catch (err) {
    if (isOpenAITransportOrQuotaError(err)) {
      console.warn('[salary-benchmark] AI unavailable, using fallback:', err.message || err)
    } else {
      console.warn('[salary-benchmark] Invalid AI output, using fallback:', err.message || err)
    }
    return fb
  }
}

module.exports = { benchmarkSalary, fallbackBenchmark }

