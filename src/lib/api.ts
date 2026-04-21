import type { ApiEnvelope, ApiUser, Negotiation, NegotiationResult, NegotiationSummary } from '../types/api'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

const TOKEN_KEY = 'nc_token'
const USER_KEY = 'nc_user'
const LAST_NEG_KEY = 'nc_last_negotiation'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuth(token: string, user: ApiUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ApiUser
  } catch {
    return null
  }
}

export function setLastNegotiation(n: Negotiation) {
  localStorage.setItem(LAST_NEG_KEY, JSON.stringify(n))
}

export function getLastNegotiation(): Negotiation | null {
  try {
    const raw = localStorage.getItem(LAST_NEG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Negotiation
  } catch {
    return null
  }
}

function url(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url(path), { ...options, headers })
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    message?: string
    data?: T
    errors?: unknown
  }

  if (!res.ok || json.success === false) {
    const errs = (json as { errors?: { msg?: string }[] }).errors
    const firstErr = Array.isArray(errs) ? errs[0]?.msg : undefined
    const msg =
      firstErr ||
      json.message ||
      (typeof json.errors === 'string' ? json.errors : null) ||
      res.statusText ||
      'Request failed'
    throw new ApiError(msg, res.status, json)
  }

  if (Object.prototype.hasOwnProperty.call(json, 'data')) {
    return (json as ApiEnvelope<T>).data as T
  }
  return json as T
}

export async function loginRequest(email: string, password: string) {
  return apiRequest<{ token: string; user: ApiUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function registerRequest(name: string, email: string, password: string) {
  return apiRequest<{ token: string; user: ApiUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export async function startNegotiationRequest(body: {
  type: 'salary' | 'freelance'
  currency?: string
  initialOffer: number
  targetValue: number
  minimumAcceptable: number
  strategy: 'aggressive' | 'balanced' | 'conservative'
  experienceLevel: 'fresher' | 'junior' | 'mid'
}) {
  return apiRequest<{ negotiation: Negotiation }>('/api/negotiation/start', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function listNegotiationsRequest() {
  return apiRequest<{ negotiations: NegotiationSummary[] }>('/api/negotiation/history')
}

export async function getNegotiationRequest(id: string) {
  return apiRequest<{ negotiation: Negotiation }>(`/api/negotiation/${id}`)
}

export async function generateResponseRequest(body: {
  tone: 'formal' | 'confident' | 'assertive'
  negotiationId?: string
  result?: NegotiationResult
  type?: string
  currency?: string
  initialOffer?: number
  targetValue?: number
  minimumAcceptable?: number
}) {
  return apiRequest<{ response: { emailSubject: string; emailBody: string; chatReply: string; tone: string } }>(
    '/api/negotiation/generate-response',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export type OfferLetterAnalysis = {
  context: {
    company: string
    role: string
    location: string
    startDate: string
    employmentType: string
  }
  salary: {
    base: string
    verdict: 'Good' | 'Average' | 'Low'
    bonus: 'Mentioned' | 'Not Mentioned'
    other: string
  }
  keyTerms: {
    noticePeriod: string
    probation: string
    reviewCycle: string
  }
  confidence: {
    overall: 'High' | 'Medium' | 'Low'
    salary: 'High' | 'Medium' | 'Low'
    keyTerms: 'High' | 'Medium' | 'Low'
  }
  redFlags: string[]
  positives: string[]
  suggestions: string[]
  finalVerdict: string
}

export async function analyzeOfferLetterRequest(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return apiRequest<{ analysis: OfferLetterAnalysis }>('/api/offer/analyze', {
    method: 'POST',
    body: fd,
  })
}

export type SalaryBenchmarkResult = {
  marketRange: string
  averageSalary: string
  userSalary: string
  comparison: 'Below Average' | 'Fair' | 'Above Average'
  insight: string
  recommendedRange: string
  confidence: 'Low' | 'Medium' | 'High'
}

export async function benchmarkSalaryRequest(body: {
  role: string
  experience: string
  location?: string
  offeredSalary: number
}) {
  return apiRequest<SalaryBenchmarkResult>('/api/salary/benchmark', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
