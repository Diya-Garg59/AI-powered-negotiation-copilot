import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { benchmarkSalaryRequest, type SalaryBenchmarkResult } from '../lib/api'

const EXPERIENCES = ['Fresher', '1–2 yrs', '3–5 yrs', '6–8 yrs', '9+ yrs'] as const

function pillClass(v: SalaryBenchmarkResult['comparison']) {
  if (v === 'Above Average') return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200'
  if (v === 'Below Average') return 'border-rose-400/35 bg-rose-500/10 text-rose-200'
  return 'border-amber-400/35 bg-amber-500/10 text-amber-200'
}

function confidenceClass(v: SalaryBenchmarkResult['confidence']) {
  if (v === 'High') return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200'
  if (v === 'Low') return 'border-rose-400/35 bg-rose-500/10 text-rose-200'
  return 'border-amber-400/35 bg-amber-500/10 text-amber-200'
}

function parseRangeToNumbers(range: string) {
  // Handles: "₹4.5L – ₹7L", "₹450000 – ₹700000", "₹4.5L-₹7L"
  const raw = String(range || '')
  const parts = raw
    .replace(/[₹,\s]/g, '')
    .split(/–|-|to/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)

  const parseOne = (s: string) => {
    const upper = s.toUpperCase()
    const isLakh = upper.endsWith('L') || upper.includes('LPA')
    const num = Number(upper.replace(/LPA|L/g, ''))
    if (!Number.isFinite(num)) return null
    return isLakh ? Math.round(num * 100000) : Math.round(num)
  }

  const a = parts[0] ? parseOne(parts[0]) : null
  const b = parts[1] ? parseOne(parts[1]) : null
  if (!a || !b) return null
  return { min: Math.min(a, b), max: Math.max(a, b) }
}

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export function SalaryBenchmark() {
  const [role, setRole] = useState('Software Engineer')
  const [experience, setExperience] = useState<(typeof EXPERIENCES)[number]>('Fresher')
  const [location, setLocation] = useState('India')
  const [offeredSalary, setOfferedSalary] = useState<number>(500000)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SalaryBenchmarkResult | null>(null)

  async function handleAnalyze() {
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const out = await benchmarkSalaryRequest({ role, experience, location, offeredSalary: Number(offeredSalary) })
      setResult(out)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze salary benchmark.')
    } finally {
      setLoading(false)
    }
  }

  const rangeNumbers = useMemo(() => (result ? parseRangeToNumbers(result.marketRange) : null), [result])
  const userPos = useMemo(() => {
    if (!rangeNumbers) return 50
    const v = Number(offeredSalary) || 0
    const pct = ((v - rangeNumbers.min) / Math.max(1, rangeNumbers.max - rangeNumbers.min)) * 100
    return Math.round(Math.max(0, Math.min(100, pct)))
  }, [rangeNumbers, offeredSalary])

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">📊 Salary Benchmark</h1>
        <p className="mt-1 text-sm text-slate-400">
          Compare your salary with market data and make smarter career decisions
        </p>
      </div>

      <Card className="glass-strong glow-purple relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <CardTitle>Market comparison inputs</CardTitle>
        <CardDescription>Enter role, experience, location, and your offered salary</CardDescription>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role</p>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Experience</p>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value as (typeof EXPERIENCES)[number])}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
            >
              {EXPERIENCES.map((x) => (
                <option key={x} value={x} className="bg-slate-900">
                  {x}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Location</p>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="India"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Offered Salary (annual, INR)</p>
            <input
              value={String(offeredSalary)}
              onChange={(e) => setOfferedSalary(Number(e.target.value || 0))}
              inputMode="numeric"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="500000"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Tip: If you have CTC breakdown, use annual total (not monthly take-home).
          </p>
          <Button variant="primary" onClick={handleAnalyze} disabled={loading || !role.trim() || offeredSalary <= 0}>
            {loading ? 'Analyzing…' : 'Analyze Salary'}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </Card>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-indigo-400/40 border-t-indigo-300" />
              <p className="text-sm text-slate-300">Analyzing market data…</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
            <Skeleton className="h-28 rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-white/10 bg-white/[0.02]">
              <CardTitle>Market Range</CardTitle>
              <CardDescription>Typical annual band for your inputs</CardDescription>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{result.marketRange}</p>
              <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${confidenceClass(result.confidence)}`}>
                Confidence: {result.confidence}
              </p>
            </Card>

            <Card className="border border-white/10 bg-white/[0.02]">
              <CardTitle>Average Salary</CardTitle>
              <CardDescription>Estimated market midpoint</CardDescription>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{result.averageSalary}</p>
            </Card>

            <Card className="border border-indigo-400/20 bg-indigo-500/[0.06]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Your Salary</CardTitle>
                  <CardDescription>Compared against market</CardDescription>
                </div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${pillClass(result.comparison)}`}>
                  {result.comparison}
                </span>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{result.userSalary || formatInr(offeredSalary)}</p>
              <p className="mt-2 text-sm text-slate-300">{result.insight}</p>
            </Card>
          </div>

          <Card className="border border-white/10 bg-white/[0.02]">
            <CardTitle>Visual comparison</CardTitle>
            <CardDescription>Where your offer sits within the market range</CardDescription>
            <div className="mt-5">
              <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-rose-500/35 via-amber-500/35 to-emerald-500/35">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white/40 bg-indigo-300 shadow-[0_0_18px_rgba(129,140,248,0.65)]"
                  style={{ left: `${userPos}%`, transform: 'translate(-50%, -50%)' }}
                  title={`Your offer: ${formatInr(offeredSalary)}`}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Low</span>
                <span className="text-slate-400">{result.marketRange}</span>
                <span>High</span>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-white/10 bg-white/[0.02]">
              <CardTitle>Insight</CardTitle>
              <CardDescription>What the market comparison implies</CardDescription>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{result.insight}</p>
            </Card>
            <Card className="border border-indigo-400/20 bg-indigo-500/[0.06]">
              <CardTitle>💡 Suggested Action</CardTitle>
              <CardDescription>A practical next step based on market standards</CardDescription>
              <p className="mt-4 text-lg font-semibold text-white">Negotiate for {result.recommendedRange}</p>
              <p className="mt-2 text-sm text-slate-300">
                Use this as your target band and anchor with a clear value narrative (impact, scope, and market parity).
              </p>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}

