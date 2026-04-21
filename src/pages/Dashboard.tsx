import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonClass } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { ApiError, listNegotiationsRequest } from '../lib/api'
import type { NegotiationSummary } from '../types/api'
import { formatMoney } from '../utils/formatMoney'

function StatCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string
  value: string
  hint: string
  loading: boolean
}) {
  return (
    <Card className="!p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-2xl font-semibold tracking-tight text-white"
        >
          {value}
        </motion.p>
      )}
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </Card>
  )
}

function titleFor(n: NegotiationSummary) {
  const t = n.type === 'salary' ? 'Salary' : 'Freelance'
  return `${t} · ${formatMoney(n.currency, n.initialOffer)} → target ${formatMoney(n.currency, n.targetValue)}`
}

function deriveOutcome(n: NegotiationSummary): 'Success' | 'Failed' {
  if (!n.result) return 'Failed'
  return n.result.finalRange.max >= n.targetValue * 0.98 ? 'Success' : 'Failed'
}

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [list, setList] = useState<NegotiationSummary[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { negotiations } = await listNegotiationsRequest()
      setList(negotiations)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load history')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = (() => {
    const total = list.length
    let pctSum = 0
    let pctN = 0
    let wins = 0
    for (const n of list) {
      if (n.result && n.initialOffer > 0) {
        pctSum += ((n.result.average - n.initialOffer) / n.initialOffer) * 100
        pctN += 1
      }
      if (deriveOutcome(n) === 'Success') wins += 1
    }
    const avgPct = pctN ? (pctSum / pctN).toFixed(1) : '0'
    const successRate = total ? Math.round((wins / total) * 100) : 0
    return {
      total: String(total),
      avgImp: `${Number(avgPct) >= 0 ? '+' : ''}${avgPct}%`,
      success: `${successRate}%`,
    }
  })()

  const recent = list.slice(0, 5)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Overview of your negotiation practice</p>
        </div>
        <Link to="/negotiations/new" className={buttonClass('primary', 'glow-purple w-full sm:w-auto')}>
          Start New Negotiation
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total simulations" value={stats.total} hint="All time" loading={loading} />
        <StatCard label="Avg improvement" value={stats.avgImp} hint="vs. opening offer (where available)" loading={loading} />
        <StatCard label="Success rate" value={stats.success} hint="Target roughly met" loading={loading} />
      </div>

      <Card className="min-h-0 flex-1 !p-0 overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <CardTitle>Recent negotiations</CardTitle>
          <CardDescription>Jump back into a scenario or start fresh</CardDescription>
        </div>
        <ul className="divide-y divide-white/5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 max-w-xs w-[60%]" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="hidden h-8 w-20 shrink-0 rounded-lg sm:block" />
                </li>
              ))
            : recent.length === 0
              ? (
                  <li className="px-6 py-12 text-center text-sm text-slate-500">No simulations yet. Start one above.</li>
                )
              : (
                  recent.map((n, i) => (
                    <motion.li
                      key={n.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                            n.type === 'salary'
                              ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                              : 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30'
                          }`}
                        >
                          {n.type === 'salary' ? 'S' : 'F'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white">{titleFor(n)}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''} · {deriveOutcome(n)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                        {n.result && (
                          <span className="text-sm text-emerald-400/90">
                            {formatMoney(n.currency, n.result.finalRange.min)}–{formatMoney(n.currency, n.result.finalRange.max)}
                          </span>
                        )}
                        <Link to={`/negotiations/result?id=${n.id}`} className={buttonClass('secondary', '!py-2 !text-xs')}>
                          View result
                        </Link>
                      </div>
                    </motion.li>
                  ))
                )}
        </ul>
      </Card>
    </div>
  )
}
