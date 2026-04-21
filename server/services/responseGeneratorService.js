const { completeJson } = require('./ai/openaiClient')
const { buildFallbackResponses } = require('./ai/fallbackResponses')
const { responseGeneratorSystem, responseGeneratorUser } = require('./ai/prompts')
const { isOpenAITransportOrQuotaError } = require('../utils/openaiErrors')

/**
 * @param {object} params
 * @param {'formal'|'confident'|'assertive'} params.tone
 * @param {object} params.summary — negotiation outcome + last amounts, etc.
 */
async function generateNegotiationResponse({ tone, summary }) {
  if (process.env.USE_MOCK_AI === 'true') {
    return buildFallbackResponses({ tone, summary })
  }

  try {
    const raw = await completeJson({
      system: responseGeneratorSystem(),
      user: responseGeneratorUser({ tone, summary }),
    })
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      throw new Error('Invalid JSON from response generator')
    }
    const emailSubject = typeof data.emailSubject === 'string' ? data.emailSubject.trim() : ''
    const emailBody = typeof data.emailBody === 'string' ? data.emailBody.trim() : ''
    const chatReply = typeof data.chatReply === 'string' ? data.chatReply.trim() : ''
    if (!emailSubject || !emailBody || !chatReply) {
      throw new Error('Incomplete response generator output')
    }
    return { emailSubject, emailBody, chatReply, tone }
  } catch (err) {
    if (!isOpenAITransportOrQuotaError(err)) {
      throw err
    }
    console.warn('[responses] AI provider unavailable, using template responses:', err.message || err)
    return buildFallbackResponses({ tone, summary })
  }
}

module.exports = { generateNegotiationResponse }
