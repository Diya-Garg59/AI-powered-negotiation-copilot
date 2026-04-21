import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonClass } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { ApiError, listNegotiationsRequest } from '../lib/api'
import type { NegotiationSummary } from '../types/api'
import { formatMoney } from '../utils/formatMoney'

type TypeFilter = 'All' | 'Salary' | 'Freelance'
type OutcomeFilter = 'All' | 'Success' | 'Failed'

function deriveOutcome(n: NegotiationSummary): 'Success' | 'Failed' {
  if (!n.result) return 'Failed'
  return n.result.finalRange.max >= n.targetValue * 0.98 ? 'Success' : 'Failed'
}

function titleFor(n: NegotiationSummary) {
  const t = n.type === 'salary' ? 'Salary' : 'Freelance'
  return `${t} negotiation`
}

function improvementLabel(n: NegotiationSummary) {
  if (!n.result || !n.initialOffer) return '—'
  const p = ((n.result.average - n.initialOffer) / n.initialOffer) * 100
  return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`
}

export function History() {
  const [rows, setRows] = useState<NegotiationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeF, setTypeF] = useState<TypeFilter>('All')
  const [outF, setOutF] = useState<OutcomeFilter>('All')
  const [selected, setSelected] = useState<NegotiationSummary | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { negotiations } = await listNegotiationsRequest()
      setRows(negotiations)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return rows.filter((n) => {
      const typeOk =
        typeF === 'All' ||
        (typeF === 'Salary' && n.type === 'salary') ||
        (typeF === 'Freelance' && n.type === 'freelance')
      if (!typeOk) return false
      if (outF === 'All') return true
      const o = deriveOutcome(n)
      return outF === o
    })
  }, [rows, typeF, outF])

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">History</h1>
        <p className="mt-1 text-sm text-slate-400">Past simulations and outcomes</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(['All', 'Salary', 'Freelance'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeF(t)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition sm:text-sm ${
                typeF === t
                  ? 'bg-white/10 text-white ring-1 ring-white/20'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              {t === 'All' ? 'All types' : t}
            </button>
          ))}
        </div>
        <div className="hidden h-6 w-px bg-white/10 sm:block" />
        <div className="flex flex-wrap gap-2">
          {(['All', 'Success', 'Failed'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutF(o)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition sm:text-sm ${
                outF === o
                  ? o === 'Success'
                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                    : o === 'Failed'
                      ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30'
                      : 'bg-white/10 text-white ring-1 ring-white/20'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              {o === 'All' ? 'All outcomes' : o}
            </button>
          ))}
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">Loading…</div>
        ) : (
          <ul className="divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {filtered.map((n, i) => (
                <motion.li
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(n)}
                    className="min-w-0 flex-1 text-left transition hover:opacity-90"
                  >
                    <p className="font-medium text-white">{titleFor(n)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(n.createdAt && new Date(n.createdAt).toLocaleDateString()) || '—'} · {n.type} ·{' '}
                      <span className={deriveOutcome(n) === 'Success' ? 'text-emerald-400/90' : 'text-red-400/90'}>
                        {deriveOutcome(n)}
                      </span>
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-emerald-400/90">{improvementLabel(n)}</span>
                    <Button variant="secondary" className="!py-2 !text-xs" onClick={() => setSelected(n)}>
                      Details
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-6 py-16 text-center text-sm text-slate-500">No negotiations match these filters.</div>
        )}
      </Card>

      <AnimatePresence>
        {selected && (
          <>
            <motion.button
              type="button"
              aria-label="Close details"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,440px)] -translate-x-1/2 -translate-y-1/2"
            >
              <Card className="!p-6">
                <CardTitle className="!text-base">{titleFor(selected)}</CardTitle>
                <CardDescription>
                  {(selected.createdAt && new Date(selected.createdAt).toLocaleString()) || '—'} · {selected.type}
                </CardDescription>
                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Outcome</dt>
                    <dd className={deriveOutcome(selected) === 'Success' ? 'text-emerald-400' : 'text-red-400'}>
                      {deriveOutcome(selected)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Range</dt>
                    <dd className="text-white">
                      {selected.result
                        ? `${formatMoney(selected.currency, selected.result.finalRange.min)} – ${formatMoney(selected.currency, selected.result.finalRange.max)}`
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Improvement</dt>
                    <dd className="text-emerald-400/90">{improvementLabel(selected)}</dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    to="/responses"
                    onClick={() => setSelected(null)}
                    className={buttonClass('primary', '!py-2 !text-xs')}
                  >
                    Open responses
                  </Link>
                  <Link
                    to={`/negotiations/result?id=${selected.id}`}
                    onClick={() => setSelected(null)}
                    className={buttonClass('secondary', '!py-2 !text-xs')}
                  >
                    Full result
                  </Link>
                  <Button variant="secondary" className="!py-2 !text-xs" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
