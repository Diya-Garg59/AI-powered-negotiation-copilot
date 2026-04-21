const { computeResult } = require('./negotiationResult')

const PAIRS = 6

/**
 * Deterministic multi-step negotiation when OpenAI is unavailable (quota, network, etc.).
 */
function buildFallbackNegotiation(input) {
  const {
    type,
    initialOffer,
    targetValue,
    minimumAcceptable,
    strategy,
    experienceLevel,
  } = input

  const mid = (initialOffer + targetValue) / 2
  const messages = []
  let lastCandidate = targetValue
  let lastHr = initialOffer

  const candLines = [
    'Thank you for the context. I am aligned on the role and would like to align compensation with market and impact.',
    'I hear your constraints. If we can move meaningfully on base, I can be flexible on start date and onboarding.',
    'To commit quickly, I need the package closer to my target. What flexibility do you have on base or review timing?',
    'If we can document a review at 12 months with clear criteria, I can accept a modest concession on base.',
    'That works directionally—please confirm the numbers in writing so I can review with counsel.',
    'Appreciate the partnership tone. Let us lock the band we discussed and finalize paperwork.',
  ]

  const hrLines = [
    'Thanks for sharing your expectations. Our approved band is anchored near our opening number, with standard review cycles.',
    'We have limited headroom, but we can discuss a signing component and a structured review at twelve months.',
    'We can stretch modestly on base if we align on start date and a performance framework.',
    'We can meet in the middle of the band if bonus and review milestones are explicit in the offer.',
    'Agreed—we will reflect those terms in the revised letter for your review.',
    'Great—we will send the updated terms today for signature.',
  ]

  for (let i = 0; i < PAIRS; i++) {
    const p = (i + 1) / PAIRS
    lastCandidate = Math.round(
      Math.max(
        minimumAcceptable,
        targetValue -
          (targetValue - mid) * p * 0.55 -
          (strategy === 'aggressive' ? 0 : strategy === 'conservative' ? mid * 0.02 * p : mid * 0.01 * p),
      ),
    )
    lastHr = Math.round(initialOffer + (mid - initialOffer) * p * 0.78)

    if (lastHr > lastCandidate) {
      lastHr = Math.round(lastCandidate - Math.max(1, (lastCandidate - initialOffer) * 0.05))
    }

    messages.push({
      sender: 'candidate',
      amount: lastCandidate,
      message: `${candLines[i] || candLines[candLines.length - 1]} (${type} · ${experienceLevel} · ${strategy} posture)`,
      timestamp: new Date(),
    })
    messages.push({
      sender: 'hr',
      amount: lastHr,
      message: hrLines[i] || hrLines[hrLines.length - 1],
      timestamp: new Date(),
    })
  }

  const lastC = messages.filter((m) => m.sender === 'candidate').pop().amount
  const lastH = messages.filter((m) => m.sender === 'hr').pop().amount

  const result = computeResult({
    lastCandidate: lastC,
    lastHr: lastH,
    targetValue,
    minimumAcceptable,
    initialOffer,
  })

  return { messages, result }
}

module.exports = { buildFallbackNegotiation, PAIRS }
