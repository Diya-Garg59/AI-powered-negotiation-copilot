import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { buttonClass } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { getLastNegotiation, getNegotiationRequest } from '../lib/api'
import type { Negotiation } from '../types/api'
import { formatMoney } from '../utils/formatMoney'

function riskLabel(r: string) {
  if (r === 'low') return 'Low'
  if (r === 'high') return 'High'
  return 'Medium'
}

type RiskLevel = 'low' | 'medium' | 'high'
type NextActionKey = 'accept' | 'negotiate' | 'alternative'
type NextAction = {
  key: NextActionKey
  title: string
  description: string
  risk: RiskLevel
  extraLabel: string
  extraValue: string
}

function detectHrTactic(messages: Negotiation['messages']) {
  const hrText = messages
    .filter((m) => m.sender === 'hr')
    .map((m) => m.message.toLowerCase())
    .join(' ')

  if (/(budget|band|headroom|constraint|approved)/.test(hrText)) {
    return 'HR used budget constraint tactic'
  }
  if (/(bonus|review|milestone|signing|component)/.test(hrText)) {
    return 'HR used trade-off tactic (bonus/review framing)'
  }
  return 'HR used incremental concession tactic'
}

function coachInsights(negotiation: Negotiation) {
  const messages = negotiation.messages || []
  const candidateMoves = messages.filter((m) => m.sender === 'candidate')
  const hrMoves = messages.filter((m) => m.sender === 'hr')
  const firstCandidate = candidateMoves[0]
  const lastCandidate = candidateMoves.at(-1)
  const lastHr = hrMoves.at(-1)

  const anchorInsight = firstCandidate
    ? firstCandidate.amount >= negotiation.targetValue * 0.96
      ? `You started with a strong anchor (${formatMoney(negotiation.currency || 'INR', firstCandidate.amount)})`
      : `You opened with a realistic anchor (${formatMoney(negotiation.currency || 'INR', firstCandidate.amount)})`
    : 'You established your value position early'

  const strategyLabel =
    negotiation.strategy === 'aggressive'
      ? 'firm strategy (slower concessions)'
      : negotiation.strategy === 'conservative'
        ? 'conservative strategy (careful concessions)'
        : 'balanced strategy (gradual concessions)'

  const strategyInsight = `You used a ${strategyLabel}`

  const hrTacticInsight = detectHrTactic(messages)

  let closureInsight = 'You kept the negotiation zone constructive'
  if (lastCandidate && lastHr) {
    const low = Math.min(lastCandidate.amount, lastHr.amount)
    const high = Math.max(lastCandidate.amount, lastHr.amount)
    const mid = (low + high) / 2
    const distance = Math.abs(lastCandidate.amount - lastHr.amount)
    closureInsight =
      distance / Math.max(mid, 1) <= 0.08
        ? 'You agreed near midpoint -> effective negotiation'
        : 'You maintained leverage while moving toward a workable midpoint'
  }

  return [anchorInsight, strategyInsight, hrTacticInsight, closureInsight]
}

function coachScore(negotiation: Negotiation) {
  const messages = negotiation.messages || []
  const candidateMoves = messages.filter((m) => m.sender === 'candidate')
  const hrMoves = messages.filter((m) => m.sender === 'hr')
  const firstCandidate = candidateMoves[0]
  const lastCandidate = candidateMoves.at(-1)
  const lastHr = hrMoves.at(-1)

  let score = 68
  if (firstCandidate?.amount >= negotiation.targetValue * 0.96) score += 10
  else if (firstCandidate?.amount >= negotiation.targetValue * 0.9) score += 6
  else score -= 4

  if (negotiation.strategy === 'balanced') score += 8
  if (negotiation.strategy === 'aggressive') score += 5
  if (negotiation.strategy === 'conservative') score += 4

  if (lastCandidate && lastHr) {
    const mid = (Math.min(lastCandidate.amount, lastHr.amount) + Math.max(lastCandidate.amount, lastHr.amount)) / 2
    const gapRatio = Math.abs(lastCandidate.amount - lastHr.amount) / Math.max(mid, 1)
    if (gapRatio <= 0.08) score += 10
    else if (gapRatio <= 0.14) score += 5
  }

  return Math.max(55, Math.min(95, score))
}

function nextBestAction(negotiation: Negotiation) {
  if (negotiation.strategy === 'aggressive') {
    return 'Confirm agreement terms in writing and lock review milestones before final acceptance.'
  }
  if (negotiation.strategy === 'conservative') {
    return 'Use one concise value-based follow-up to ask for a final movement before closing.'
  }
  return 'Send a written confirmation that captures number, timeline, and review terms to secure the outcome.'
}

function riskPillClass(risk: RiskLevel) {
  if (risk === 'low') return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-300'
  if (risk === 'high') return 'border-rose-400/35 bg-rose-500/10 text-rose-300'
  return 'border-amber-400/35 bg-amber-500/10 text-amber-300'
}

function mapOptionTitleToKey(title: string): NextActionKey {
  if (title === 'Negotiate Once More') return 'negotiate'
  if (title === 'Ask for Bonus / Alternative') return 'alternative'
  return 'accept'
}

function fromDisplayRisk(risk: string): RiskLevel {
  const low = String(risk).toLowerCase()
  if (low === 'low') return 'low'
  if (low === 'high') return 'high'
  return 'medium'
}

function buildNextActions(negotiation: Negotiation) {
  if (negotiation.result?.nextBestAction?.options?.length === 3) {
    const fromAi = negotiation.result.nextBestAction
    const actions: NextAction[] = fromAi.options.map((o) => {
      const key = mapOptionTitleToKey(o.title)
      const extraLabel =
        key === 'accept' ? 'Safe decision' : key === 'negotiate' ? 'Potential gain' : 'Success probability'
      const extraValue =
        key === 'accept'
          ? 'Lock the offer in writing'
          : key === 'negotiate'
            ? o.potentialGain || 'Discuss final movement'
            : o.successProbability || 'Medium'
      return {
        key,
        title:
          key === 'accept'
            ? 'OPTION 1: Accept Offer'
            : key === 'negotiate'
              ? 'OPTION 2: Negotiate Once More'
              : 'OPTION 3: Ask for Bonus / Alternative',
        description: o.description,
        risk: fromDisplayRisk(o.riskLevel),
        extraLabel,
        extraValue,
      }
    })
    return {
      actions,
      recommended: mapOptionTitleToKey(fromAi.recommendedOption),
    }
  }

  const messages = negotiation.messages || []
  const cur = negotiation.currency || 'INR'
  const hrMoves = messages.filter((m) => m.sender === 'hr')
  const candidateMoves = messages.filter((m) => m.sender === 'candidate')
  const finalHr = hrMoves.at(-1)?.amount ?? negotiation.initialOffer
  const finalCandidate = candidateMoves.at(-1)?.amount ?? negotiation.targetValue
  const gap = Math.max(0, finalCandidate - finalHr)
  const midpoint = (finalCandidate + finalHr) / 2
  const gapRatio = gap / Math.max(midpoint, 1)

  const negotiateMin = Math.max(0, Math.round(gap * 0.25))
  const negotiateMax = Math.max(negotiateMin + 1, Math.round(gap * 0.55))

  let recommended: NextActionKey = 'accept'
  if (gapRatio > 0.06 && gap > negotiation.targetValue * 0.02) {
    recommended = 'negotiate'
  } else if (gapRatio > 0.03 && gap <= negotiation.targetValue * 0.02) {
    recommended = 'alternative'
  }

  const actions: NextAction[] = [
    {
      key: 'accept',
      title: 'OPTION 1: Accept Offer',
      description:
        gapRatio <= 0.05
          ? 'Current numbers are already close to closure. Accepting now secures momentum and avoids last-round risk.'
          : 'Accepting now gives certainty and protects the current package without extending negotiation fatigue.',
      risk: gapRatio <= 0.05 ? 'low' : 'medium',
      extraLabel: 'Safe decision',
      extraValue: 'Lock the offer in writing',
    },
    {
      key: 'negotiate',
      title: 'OPTION 2: Negotiate Once More',
      description:
        gap > 0
          ? 'There is still measurable room to move. One focused counter anchored on value may unlock additional upside.'
          : 'You can still attempt one data-backed counter if role scope or responsibilities justify a revision.',
      risk: gapRatio > 0.08 ? 'high' : 'medium',
      extraLabel: 'Potential gain',
      extraValue: `${formatMoney(cur, negotiateMin)} – ${formatMoney(cur, negotiateMax)}`,
    },
    {
      key: 'alternative',
      title: 'OPTION 3: Ask for Bonus / Alternative',
      description:
        'If base is tight, shift to structure: signing bonus, early review cycle, variable pay, or high-impact perks.',
      risk: 'low',
      extraLabel: 'Success probability',
      extraValue: gapRatio <= 0.06 ? 'High' : 'Medium',
    },
  ]

  return { actions, recommended }
}

export function Result() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      const fromState = (location.state as { negotiation?: Negotiation } | undefined)?.negotiation
      if (fromState?.result) {
        setNegotiation(fromState)
        setLoading(false)
        return
      }
      const cached = getLastNegotiation()
      if (cached?.result && !id) {
        setNegotiation(cached)
        setLoading(false)
        return
      }
      if (id) {
        try {
          const { negotiation: n } = await getNegotiationRequest(id)
          if (!cancelled) setNegotiation(n)
        } catch {
          if (!cancelled) {
            setNegotiation(null)
            setError('Could not load this negotiation.')
          }
        }
      } else if (cached) {
        setNegotiation(cached)
      } else {
        setError('No result to show. Run a simulation first.')
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, location.state])

  const r = negotiation?.result
  const cur = negotiation?.currency || 'INR'

  const improvement = useMemo(() => {
    if (!negotiation || !r) return null
    const base = negotiation.initialOffer
    if (!base) return null
    const lift = ((r.average - base) / base) * 100
    return `${lift >= 0 ? '+' : ''}${lift.toFixed(1)}%`
  }, [negotiation, r])

  const insights = useMemo(() => {
    if (!negotiation) return []
    return coachInsights(negotiation)
  }, [negotiation])

  const score = useMemo(() => {
    if (!negotiation) return 0
    return coachScore(negotiation)
  }, [negotiation])

  const nextStep = useMemo(() => {
    if (!negotiation) return ''
    return nextBestAction(negotiation)
  }, [negotiation])

  const nextActionPlan = useMemo(() => {
    if (!negotiation) return { actions: [], recommended: 'accept' as NextActionKey }
    return buildNextActions(negotiation)
  }, [negotiation])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 pb-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !negotiation || !r) {
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 pb-8">
        <p className="text-slate-400">{error || 'No negotiation data.'}</p>
        <Link to="/negotiations/new" className={`${buttonClass('primary', 'mt-6 inline-block')}`}>
          Start new negotiation
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Simulation result</h1>
        <p className="mt-1 text-sm text-slate-400">Outcome summary and next steps</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong glow-purple relative overflow-hidden rounded-2xl p-8 md:p-10"
      >
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90">Final negotiation range</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
          {formatMoney(cur, r.finalRange.min)} – {formatMoney(cur, r.finalRange.max)}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {negotiation.type === 'salary' ? 'Compensation' : 'Rate'} · {cur}
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Best case', value: formatMoney(cur, r.bestCase), hint: 'Upside within model' },
          { label: 'Worst case', value: formatMoney(cur, r.worstCase), hint: 'Conservative floor' },
          { label: 'Average', value: formatMoney(cur, r.average), hint: 'Blended outcome' },
        ].map((x, i) => (
          <motion.div key={x.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="!p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{x.label}</p>
              <p className="mt-2 text-xl font-semibold text-white">{x.value}</p>
              <p className="mt-1 text-xs text-slate-500">{x.hint}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Insights</CardTitle>
          <CardDescription>Signals from this simulation</CardDescription>
          <ul className="mt-5 space-y-4 text-sm text-slate-300">
            <li className="flex items-start justify-between gap-4 rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="text-slate-400">Improvement vs. opening</span>
              <span className="font-semibold text-emerald-400">{improvement ?? '—'}</span>
            </li>
            <li className="flex items-start justify-between gap-4 rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="text-slate-400">Risk level</span>
              <span className="font-semibold text-amber-300/90">{riskLabel(r.riskLevel)}</span>
            </li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>AI Negotiation Coach</CardTitle>
              <CardDescription>
                Professional post-simulation review · {negotiation.strategy} · {negotiation.experienceLevel}
              </CardDescription>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Coach score</p>
              <p className="text-lg font-semibold text-emerald-200">{score}/100</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-300">
            {insights.map((line) => (
              <li key={line} className="rounded-xl bg-white/[0.03] px-4 py-3 text-slate-200">
                <span className="mr-2 font-semibold text-emerald-400">✔</span>
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.08] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">Coach recommendation</p>
            <p className="mt-1 text-sm text-slate-300">{nextStep}</p>
          </div>
        </Card>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-indigo-500/15 blur-3xl" />
        <CardTitle>🚀 Next Best Action</CardTitle>
        <CardDescription>
          AI-guided decision paths based on your target, final range, and negotiation behavior
        </CardDescription>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {nextActionPlan.actions.map((action) => {
            const isRecommended = action.key === nextActionPlan.recommended
            const themeClass =
              action.key === 'accept'
                ? 'border-emerald-500/35 bg-emerald-500/[0.08]'
                : action.key === 'negotiate'
                  ? 'border-amber-500/35 bg-amber-500/[0.08]'
                  : 'border-sky-500/35 bg-sky-500/[0.08]'

            return (
              <button
                key={action.key}
                type="button"
                className={`group relative rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  isRecommended
                    ? `ring-1 ring-indigo-300/60 ${themeClass} shadow-[0_0_28px_rgba(99,102,241,0.28)]`
                    : `bg-white/[0.02] hover:bg-white/[0.04] ${themeClass}`
                }`}
              >
                {isRecommended && (
                  <span className="mb-3 inline-flex rounded-full border border-indigo-300/40 bg-indigo-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                    ⭐ Recommended
                  </span>
                )}
                <p className="text-sm font-semibold text-white">{action.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{action.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-400">Risk level</span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${riskPillClass(action.risk)}`}
                  >
                    {riskLabel(action.risk)}
                  </span>
                </div>
                <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{action.extraLabel}</p>
                  <p className="mt-1 text-sm font-medium text-slate-100">{action.extraValue}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link to="/responses" className={buttonClass('primary', 'glow-purple w-full sm:w-auto')}>
          Generate Response
        </Link>
        <Link to="/negotiations/new" className={buttonClass('secondary', 'w-full sm:w-auto')}>
          Start New Negotiation
        </Link>
      </div>
    </div>
  )
}
