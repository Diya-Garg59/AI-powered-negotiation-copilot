export type ApiEnvelope<T> = { success: boolean; data: T; message?: string }

export type ApiUser = { id: string; name: string; email: string }

export type NegotiationResult = {
  bestCase: number
  worstCase: number
  average: number
  finalRange: { min: number; max: number }
  riskLevel: 'low' | 'medium' | 'high'
  nextBestAction?: {
    options: Array<{
      title: 'Accept Offer' | 'Negotiate Once More' | 'Ask for Bonus / Alternative'
      description: string
      riskLevel: 'Low' | 'Medium' | 'High'
      potentialGain?: string
      successProbability?: 'Low' | 'Medium' | 'High'
    }>
    recommendedOption: 'Accept Offer' | 'Negotiate Once More' | 'Ask for Bonus / Alternative'
  }
}

export type NegotiationMessage = {
  sender: 'candidate' | 'hr'
  amount: number
  message: string
  timestamp?: string
}

export type Negotiation = {
  id: string
  type: 'salary' | 'freelance'
  currency?: string
  initialOffer: number
  targetValue: number
  minimumAcceptable: number
  strategy: string
  experienceLevel: string
  messages: NegotiationMessage[]
  result?: NegotiationResult
  createdAt?: string
  updatedAt?: string
}

export type NegotiationSummary = {
  id: string
  type: 'salary' | 'freelance'
  currency?: string
  initialOffer: number
  targetValue: number
  minimumAcceptable: number
  strategy: string
  experienceLevel: string
  result?: NegotiationResult
  messageCount: number
  createdAt?: string
}
