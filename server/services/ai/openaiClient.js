const OpenAI = require('openai')
const { getLlmApiKey } = require('../../utils/env')

let client

function inferProvider(apiKey) {
  const explicitBase = String(process.env.LLM_BASE_URL || process.env.XAI_BASE_URL || process.env.GROQ_BASE_URL || '').toLowerCase()
  if (explicitBase.includes('groq')) return 'groq'
  if (explicitBase.includes('x.ai')) return 'xai'
  if (String(apiKey).startsWith('gsk_')) return 'groq'
  return 'xai'
}

function getBaseUrl(apiKey) {
  return (
    process.env.LLM_BASE_URL ||
    process.env.XAI_BASE_URL ||
    process.env.GROQ_BASE_URL ||
    (inferProvider(apiKey) === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.x.ai/v1')
  )
}

function getOpenAI() {
  const apiKey = getLlmApiKey()
  if (!apiKey) {
    throw new Error(
      'No AI API key is configured. Set XAI_API_KEY, GROQ_API_KEY, or GROK_API_KEY in server/.env, then restart the API server.',
    )
  }
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: getBaseUrl(apiKey),
    })
  }
  return client
}

function resetClient() {
  client = null
}

function getModel() {
  const apiKey = getLlmApiKey()
  const provider = inferProvider(apiKey)
  return (
    process.env.LLM_MODEL ||
    process.env.XAI_MODEL ||
    process.env.GROQ_MODEL ||
    process.env.OPENAI_MODEL ||
    (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'grok-2-latest')
  )
}

/**
 * @param {object} params
 * @param {string} params.system
 * @param {string} params.user
 * @returns {Promise<string>} raw JSON string from model
 */
async function completeJson({ system, user }) {
  const openai = getOpenAI()
  const res = await openai.chat.completions.create({
    model: getModel(),
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  const text = res.choices[0]?.message?.content
  if (!text) throw new Error('Empty AI response')
  return text
}

module.exports = { getOpenAI, getModel, completeJson, resetClient }
