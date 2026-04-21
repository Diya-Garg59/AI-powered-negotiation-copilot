/** Whether to use offline templates / simulation instead of failing the HTTP request */
function isOpenAITransportOrQuotaError(err) {
  if (!err) return false
  const status = err.status ?? err.statusCode
  const code = err.code ?? err.error?.code
  if (status === 429 || status === 401 || status === 403 || status === 503) return true
  if (typeof status === 'number' && status >= 500 && status < 600) return true
  if (code === 'insufficient_quota' || code === 'rate_limit_exceeded') return true
  const nested = err.error || err.response?.data?.error
  const msg = String(err.message || nested?.message || '').toLowerCase()
  if (msg.includes('quota') || msg.includes('billing') || msg.includes('exceeded your current')) return true
  if (msg.includes('openai_api_key') || msg.includes('xai_api_key') || msg.includes('grok_api_key') || msg.includes('not configured')) return true
  if (msg.includes('econnrefused') || msg.includes('fetch failed')) return true
  if (msg.includes('timeout') || msg.includes('etimedout')) return true
  return false
}

module.exports = { isOpenAITransportOrQuotaError }
