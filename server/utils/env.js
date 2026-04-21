/**
 * Normalize env values (trim, strip wrapping quotes — common in .env editors).
 */
function normalizeEnvValue(name) {
  const raw = process.env[name]
  if (raw == null) return ''
  let s = String(raw).trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }
  return s
}

/** Preferred key order: XAI/Grok first, then OpenAI fallback for compatibility */
function getLlmApiKey() {
  const xai = normalizeEnvValue('XAI_API_KEY')
  const groq = normalizeEnvValue('GROQ_API_KEY')
  const grok = normalizeEnvValue('GROK_API_KEY')
  const openai = normalizeEnvValue('OPENAI_API_KEY')
  const openaiAlt = normalizeEnvValue('OPENAI_KEY')
  return xai || groq || grok || openai || openaiAlt
}

function isLlmConfigured() {
  return Boolean(getLlmApiKey())
}

module.exports = { normalizeEnvValue, getLlmApiKey, isLlmConfigured }
