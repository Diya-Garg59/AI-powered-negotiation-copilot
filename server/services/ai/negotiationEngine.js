const { completeJson } = require('./openaiClient')
const { buildFallbackNegotiation } = require('./fallbackNegotiation')
const { computeResult, relativeGap } = require('./negotiationResult')
const { isOpenAITransportOrQuotaError } = require('../../utils/openaiErrors')
const {
  candidateSystemPrompt,
  candidateUserPrompt,
  hrSystemPrompt,
  hrUserPrompt,
} = require('./prompts')

const MIN_ROUNDS = 5
const MAX_ROUNDS = 8
const REL_GAP_STOP = 0.025
const ABS_GAP_FLOOR = 1

function parseAgentJson(raw, role) {
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error(`Invalid JSON from ${role} agent`)
  }
  const amount = Number(data.amount)
  const message = typeof data.message === 'string' ? data.message.trim() : ''
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid amount from ${role} agent`)
  }
  if (!message) {
    throw new Error(`Empty message from ${role} agent`)
  }
  return { amount, message }
}

function transcriptFromMessages(messages) {
  return messages.map((m) => ({
    sender: m.sender,
    amount: m.amount,
    message: m.message,
  }))
}

async function runOpenAINegotiationSimulation(input) {
  const {
    type,
    currency = 'INR',
    initialOffer,
    targetValue,
    minimumAcceptable,
    strategy,
    experienceLevel,
  } = input

  if (minimumAcceptable > targetValue) {
    throw new Error('minimumAcceptable cannot exceed targetValue')
  }
  if (initialOffer <= 0 || targetValue <= 0) {
    throw new Error('Offers must be positive numbers')
  }

  const messages = []
  let lastCandidateAmount = Math.max(targetValue, minimumAcceptable)
  let lastHrAmount = initialOffer

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const transcript = transcriptFromMessages(messages)
    const ctx = {
      type,
      currency,
      initialOffer,
      targetValue,
      minimumAcceptable,
      strategy,
      experienceLevel,
      transcript,
      lastHrAmount,
    }

    const candRaw = await completeJson({
      system: candidateSystemPrompt(),
      user: candidateUserPrompt(ctx),
    })
    const cand = parseAgentJson(candRaw, 'candidate')
    messages.push({
      sender: 'candidate',
      amount: cand.amount,
      message: cand.message,
      timestamp: new Date(),
    })
    lastCandidateAmount = cand.amount

    const hrCtx = {
      ...ctx,
      transcript: transcriptFromMessages(messages),
      lastCandidateAmount,
    }
    const hrRaw = await completeJson({
      system: hrSystemPrompt(),
      user: hrUserPrompt(hrCtx),
    })
    const hr = parseAgentJson(hrRaw, 'hr')
    messages.push({
      sender: 'hr',
      amount: hr.amount,
      message: hr.message,
      timestamp: new Date(),
    })
    lastHrAmount = hr.amount

    const pairsCompleted = round + 1
    if (pairsCompleted >= MIN_ROUNDS) {
      const gap = relativeGap(lastCandidateAmount, lastHrAmount)
      const abs = Math.abs(lastCandidateAmount - lastHrAmount)
      if (gap < REL_GAP_STOP || abs <= ABS_GAP_FLOOR) {
        break
      }
    }
  }

  const result = computeResult({
    lastCandidate: lastCandidateAmount,
    lastHr: lastHrAmount,
    targetValue,
    minimumAcceptable,
    initialOffer,
  })

  return { messages, result }
}

/**
 * Prefer live AI; on quota/network/key errors use offline simulation so the product keeps working.
 */
async function runNegotiationSimulation(input) {
  if (process.env.USE_MOCK_AI === 'true') {
    return buildFallbackNegotiation(input)
  }

  try {
    return await runOpenAINegotiationSimulation(input)
  } catch (err) {
    if (!isOpenAITransportOrQuotaError(err)) {
      throw err
    }
    console.warn('[negotiation] AI provider unavailable, using offline simulation:', err.message || err)
    return buildFallbackNegotiation(input)
  }
}

module.exports = {
  runNegotiationSimulation,
  runOpenAINegotiationSimulation,
  computeResult,
  relativeGap,
  MIN_ROUNDS,
  MAX_ROUNDS,
}
