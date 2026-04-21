const { completeJson } = require('./openaiClient')
const { isOpenAITransportOrQuotaError } = require('../../utils/openaiErrors')
const { nextBestActionSystemPrompt, nextBestActionUserPrompt } = require('./prompts')

function toTitleRisk(v, fallback = 'Medium') {
  const low = String(v || fallback).trim().toLowerCase()
  if (low === 'low') return 'Low'
  if (low === 'high') return 'High'
  return 'Medium'
}

function formatInrRange(min, max) {
  return `₹${Math.round(min).toLocaleString('en-IN')} – ₹${Math.round(max).toLocaleString('en-IN')}`
}

function fallbackNextBestAction(input) {
  const gap = Math.max(0, input.finalCandidateCounter - input.finalHROffer)
  const mid = (input.finalCandidateCounter + input.finalHROffer) / 2
  const gapRatio = gap / Math.max(mid, 1)
  const gainMin = Math.max(0, Math.round(gap * 0.25))
  const gainMax = Math.max(gainMin + 1, Math.round(gap * 0.55))

  let recommendedOption = 'Accept Offer'
  if (gapRatio > 0.06 && gap > input.candidateTarget * 0.02) {
    recommendedOption = 'Negotiate Once More'
  } else if (gapRatio > 0.03) {
    recommendedOption = 'Ask for Bonus / Alternative'
  }

  return {
    options: [
      {
        title: 'Accept Offer',
        description:
          `Your latest range is already close to closure, with HR at ₹${Math.round(input.finalHROffer).toLocaleString('en-IN')}. ` +
          'Accepting now reduces uncertainty and secures momentum. This is practical when risk of delay matters.',
        riskLevel: gapRatio <= 0.05 ? 'Low' : 'Medium',
      },
      {
        title: 'Negotiate Once More',
        description:
          `There is still visible room between your last counter and HR's offer (${formatInrRange(input.finalHROffer, input.finalCandidateCounter)}). ` +
          'One concise value-based push can work if framed around impact and market parity.',
        riskLevel: gapRatio > 0.08 ? 'High' : 'Medium',
        potentialGain: formatInrRange(gainMin, gainMax),
      },
      {
        title: 'Ask for Bonus / Alternative',
        description:
          'If base salary is fixed, shift to structure: joining bonus, 6-month performance review, or role-specific perks. ' +
          'This often protects goodwill while improving your total package.',
        riskLevel: 'Low',
        successProbability: gapRatio <= 0.06 ? 'High' : 'Medium',
      },
    ],
    recommendedOption,
  }
}

function sanitizeOutput(raw, fallbackInput) {
  const fallback = fallbackNextBestAction(fallbackInput)
  if (!raw || typeof raw !== 'object') return fallback
  if (!Array.isArray(raw.options) || raw.options.length !== 3) return fallback

  const options = raw.options.map((o, idx) => {
    const titleDefaults = ['Accept Offer', 'Negotiate Once More', 'Ask for Bonus / Alternative']
    const base = {
      title: titleDefaults[idx],
      description: typeof o?.description === 'string' ? o.description : fallback.options[idx].description,
      riskLevel: toTitleRisk(o?.riskLevel, fallback.options[idx].riskLevel),
    }

    if (idx === 1) {
      return {
        ...base,
        title: 'Negotiate Once More',
        potentialGain:
          typeof o?.potentialGain === 'string' && o.potentialGain.trim()
            ? o.potentialGain
            : fallback.options[idx].potentialGain,
      }
    }

    if (idx === 2) {
      return {
        ...base,
        title: 'Ask for Bonus / Alternative',
        successProbability: toTitleRisk(o?.successProbability, fallback.options[idx].successProbability),
      }
    }

    return { ...base, title: 'Accept Offer' }
  })

  const validTitles = new Set(options.map((o) => o.title))
  const preferred =
    typeof raw.recommendedOption === 'string' && validTitles.has(raw.recommendedOption)
      ? raw.recommendedOption
      : fallback.recommendedOption

  return { options, recommendedOption: preferred }
}

function buildConversationSummary(messages) {
  return (messages || [])
    .slice(-8)
    .map((m) => `${m.sender.toUpperCase()}: ${m.amount} | ${m.message}`)
    .join('\n')
}

async function generateNextBestAction(input) {
  const fallback = fallbackNextBestAction(input)
  try {
    const user = nextBestActionUserPrompt({
      ...input,
      finalRange: formatInrRange(input.finalRange.min, input.finalRange.max),
      conversationSummary: buildConversationSummary(input.messages),
    })
    const raw = await completeJson({
      system: nextBestActionSystemPrompt(),
      user,
    })
    const parsed = JSON.parse(raw)
    return sanitizeOutput(parsed, input)
  } catch (err) {
    if (!isOpenAITransportOrQuotaError(err)) {
      console.warn('[next-best-action] Invalid AI output, using fallback:', err.message || err)
      return fallback
    }
    console.warn('[next-best-action] AI unavailable, using fallback:', err.message || err)
    return fallback
  }
}

module.exports = { generateNextBestAction, fallbackNextBestAction }
