function relativeGap(a, b) {
  const mid = (a + b) / 2
  if (mid <= 0) return 1
  return Math.abs(a - b) / mid
}

function computeResult({ lastCandidate, lastHr, targetValue, minimumAcceptable, initialOffer }) {
  const lo = Math.min(lastCandidate, lastHr)
  const hi = Math.max(lastCandidate, lastHr)
  const mid = (lo + hi) / 2

  const finalRange = {
    min: Math.round(lo),
    max: Math.round(hi),
  }

  const bestCase = finalRange.max
  const worstCase = Math.round(Math.min(bestCase, Math.max(lo, minimumAcceptable)))
  const average = Math.round((bestCase + worstCase + mid) / 3)

  const gapToTarget = Math.max(0, targetValue - mid)
  const span =
    Math.max(initialOffer, targetValue, minimumAcceptable) -
    Math.min(initialOffer, targetValue, minimumAcceptable)
  const normalized = span > 0 ? gapToTarget / span : 0

  let riskLevel = 'low'
  if (normalized > 0.35 || mid < minimumAcceptable * 1.02) riskLevel = 'high'
  else if (normalized > 0.18 || relativeGap(lastCandidate, lastHr) > 0.12) riskLevel = 'medium'

  return {
    bestCase,
    worstCase,
    average,
    finalRange,
    riskLevel,
  }
}

module.exports = { computeResult, relativeGap }
