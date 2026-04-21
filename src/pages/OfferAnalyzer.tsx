import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { analyzeOfferLetterRequest, type OfferLetterAnalysis } from '../lib/api'

function verdictClass(v: OfferLetterAnalysis['salary']['verdict']) {
  if (v === 'Good') return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200'
  if (v === 'Low') return 'border-rose-400/35 bg-rose-500/10 text-rose-200'
  return 'border-amber-400/35 bg-amber-500/10 text-amber-200'
}

function confidenceClass(v: OfferLetterAnalysis['confidence']['overall']) {
  if (v === 'High') return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200'
  if (v === 'Low') return 'border-rose-400/35 bg-rose-500/10 text-rose-200'
  return 'border-amber-400/35 bg-amber-500/10 text-amber-200'
}

function ListCard({
  title,
  subtitle,
  tone = 'neutral',
  items,
}: {
  title: string
  subtitle: string
  tone?: 'neutral' | 'danger' | 'success' | 'info'
  items: string[]
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-500/25 bg-rose-500/[0.06]'
      : tone === 'success'
        ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
        : tone === 'info'
          ? 'border-sky-500/25 bg-sky-500/[0.06]'
          : 'border-white/10 bg-white/[0.02]'

  return (
    <Card className={`border ${toneClass}`}>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{subtitle}</CardDescription>
      <ul className="mt-5 space-y-2 text-sm text-slate-300">
        {items.length ? (
          items.map((x) => (
            <li key={x} className="rounded-lg bg-black/20 px-3 py-2">
              {x}
            </li>
          ))
        ) : (
          <li className="rounded-lg bg-black/20 px-3 py-2 text-slate-400">Not specified</li>
        )}
      </ul>
    </Card>
  )
}

export function OfferAnalyzer() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<OfferLetterAnalysis | null>(null)

  const fileLabel = useMemo(() => {
    if (!file) return 'Upload a PDF offer letter'
    return file.name
  }, [file])

  async function handleAnalyze() {
    if (!file) return
    setError(null)
    setLoading(true)
    setAnalysis(null)
    try {
      const { analysis: a } = await analyzeOfferLetterRequest(file)
      setAnalysis(a)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze offer letter.')
    } finally {
      setLoading(false)
    }
  }

  function onPick(f: File | null) {
    if (!f) return
    if (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.')
      return
    }
    setError(null)
    setAnalysis(null)
    setFile(f)
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">📄 Offer Letter Analyzer</h1>
        <p className="mt-1 text-sm text-slate-400">Upload your offer letter and get AI-powered insights instantly</p>
      </div>

      <Card className="glass-strong glow-purple relative overflow-hidden p-0">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="p-6 md:p-8">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              onPick(e.dataTransfer.files?.[0] ?? null)
            }}
            className={`group cursor-pointer rounded-2xl border p-6 transition-all md:p-8 ${
              dragOver
                ? 'border-indigo-400/60 bg-indigo-500/10'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-500/25">
                <svg className="h-6 w-6 text-indigo-200" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">Drag & drop your PDF here</p>
              <p className="text-xs text-slate-400">or click to upload · Max 6MB</p>
              <p className="mt-3 w-full max-w-xl truncate rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                {fileLabel}
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Tip: Use the final signed PDF or the latest shared version.</p>
            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Analyzing…' : 'Analyze Offer'}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </div>
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
              <p className="text-sm text-slate-300">Analyzing your offer with AI…</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-white/10 bg-white/[0.02]">
              <CardTitle>Salary Breakdown</CardTitle>
              <CardDescription>Compensation components extracted from the letter</CardDescription>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="flex items-start justify-between gap-4 rounded-xl bg-black/20 px-4 py-3">
                  <span className="text-slate-400">Base salary</span>
                  <span className="font-semibold text-white">{analysis.salary.base}</span>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl bg-black/20 px-4 py-3">
                  <span className="text-slate-400">Bonus</span>
                  <span className="font-semibold text-white">{analysis.salary.bonus}</span>
                </div>
                <div className="rounded-xl bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Verdict</span>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${verdictClass(analysis.salary.verdict)}`}>
                      {analysis.salary.verdict}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Other: {analysis.salary.other || 'Not specified'}</p>
                </div>
              </div>
            </Card>

            <Card className="border border-white/10 bg-white/[0.02]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Key Terms</CardTitle>
                  <CardDescription>Terms that affect flexibility and risk</CardDescription>
                </div>
                <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${confidenceClass(analysis.confidence.overall)}`}>
                  Confidence: {analysis.confidence.overall}
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="rounded-xl bg-black/20 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notice period</p>
                  <p className="mt-1 font-medium text-slate-100">{analysis.keyTerms.noticePeriod}</p>
                </div>
                <div className="rounded-xl bg-black/20 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Probation</p>
                  <p className="mt-1 font-medium text-slate-100">{analysis.keyTerms.probation}</p>
                </div>
                <div className="rounded-xl bg-black/20 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Review cycle</p>
                  <p className="mt-1 font-medium text-slate-100">{analysis.keyTerms.reviewCycle}</p>
                </div>
              </div>
            </Card>

            <Card className="border border-indigo-400/20 bg-indigo-500/[0.06]">
              <CardTitle>Final Verdict</CardTitle>
              <CardDescription>Clear summary in 2–3 lines</CardDescription>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Context</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="rounded-lg bg-black/20 px-3 py-2">
                    <span className="text-slate-500">Company</span>
                    <div className="truncate font-medium text-slate-100">{analysis.context.company}</div>
                  </div>
                  <div className="rounded-lg bg-black/20 px-3 py-2">
                    <span className="text-slate-500">Role</span>
                    <div className="truncate font-medium text-slate-100">{analysis.context.role}</div>
                  </div>
                  <div className="rounded-lg bg-black/20 px-3 py-2">
                    <span className="text-slate-500">Location</span>
                    <div className="truncate font-medium text-slate-100">{analysis.context.location}</div>
                  </div>
                  <div className="rounded-lg bg-black/20 px-3 py-2">
                    <span className="text-slate-500">Type</span>
                    <div className="truncate font-medium text-slate-100">{analysis.context.employmentType}</div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-200">{analysis.finalVerdict}</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ListCard title="Red Flags" subtitle="Points to verify or negotiate" tone="danger" items={analysis.redFlags} />
            <ListCard title="Positive Points" subtitle="Strengths in the offer" tone="success" items={analysis.positives} />
            <ListCard title="Suggestions" subtitle="Practical next steps for you" tone="info" items={analysis.suggestions} />
          </div>
        </motion.div>
      )}
    </div>
  )
}

