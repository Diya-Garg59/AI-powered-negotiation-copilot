import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, buttonClass } from '../components/ui/Button'
import { getLastNegotiation, setLastNegotiation } from '../lib/api'
import type { Negotiation } from '../types/api'
import { formatMoney } from '../utils/formatMoney'

type Side = 'candidate' | 'hr'

type Line = { side: Side; amountLabel: string; text: string }

const THINK_MS = 1400
const FIRST_DELAY_MS = 450
const BETWEEN_MS = 350

function MessageBubble({ side, amountLabel, text }: Line) {
  const isCandidate = side === 'candidate'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`flex ${isCandidate ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[min(100%,520px)] rounded-2xl px-4 py-3 text-sm leading-relaxed text-slate-100 shadow-lg ${
          isCandidate
            ? 'rounded-bl-md border border-emerald-500/30 bg-emerald-500/[0.12] shadow-emerald-900/20'
            : 'rounded-br-md border border-red-500/30 bg-red-500/[0.12] shadow-red-900/20'
        }`}
      >
        <span
          className={`mb-1.5 block text-[10px] font-bold uppercase tracking-wider ${
            isCandidate ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isCandidate ? 'Candidate' : 'HR / Client'}
        </span>
        <p className="text-base font-semibold text-white">{amountLabel}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200/95">{text}</p>
      </div>
    </motion.div>
  )
}

function TypingIndicator({ side }: { side: Side }) {
  const isCandidate = side === 'candidate'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`flex ${isCandidate ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs text-slate-400 ${
          isCandidate ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'
        }`}
      >
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
        </span>
        AI thinking…
      </div>
    </motion.div>
  )
}

function buildScript(n: Negotiation): Line[] {
  const cur = n.currency || 'INR'
  return (n.messages || []).map((m) => ({
    side: m.sender,
    amountLabel: formatMoney(cur, m.amount),
    text: m.message,
  }))
}

export function Simulation() {
  const location = useLocation()
  const navigate = useNavigate()

  const negotiation = useMemo(() => {
    const s = (location.state as { negotiation?: Negotiation } | undefined)?.negotiation
    if (s?.messages?.length) return s
    const cached = getLastNegotiation()
    return cached?.messages?.length ? cached : null
  }, [location.state])

  useEffect(() => {
    const s = (location.state as { negotiation?: Negotiation } | undefined)?.negotiation
    if (s?.messages?.length) setLastNegotiation(s)
  }, [location.state])

  const scriptLines = useMemo(() => (negotiation ? buildScript(negotiation) : []), [negotiation])

  useEffect(() => {
    if (!negotiation?.messages?.length) {
      navigate('/negotiations/new', { replace: true })
    }
  }, [negotiation, navigate])

  const [messages, setMessages] = useState<Line[]>([])
  const [typing, setTyping] = useState<Side | null>(null)
  const [runId, setRunId] = useState(0)
  const [paused, setPaused] = useState(false)
  const timeoutsRef = useRef<number[]>([])
  const pausedRef = useRef(false)
  const scriptRef = useRef<Line[]>([])

  scriptRef.current = scriptLines

  const setPausedBoth = useCallback((v: boolean) => {
    pausedRef.current = v
    setPaused(v)
  }, [])

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutsRef.current = []
  }, [])

  const pushT = useCallback((id: number) => {
    timeoutsRef.current.push(id)
  }, [])

  const runFromIndex = useCallback(
    (startIndex: number) => {
      clearTimers()
      setTyping(null)
      const script = scriptRef.current

      const play = (i: number) => {
        if (pausedRef.current || i >= script.length) {
          if (i >= script.length) setTyping(null)
          return
        }
        const line = script[i]
        const lead = i === 0 ? FIRST_DELAY_MS : BETWEEN_MS

        pushT(
          window.setTimeout(() => {
            if (pausedRef.current) return
            setTyping(line.side)
          }, lead),
        )

        pushT(
          window.setTimeout(() => {
            if (pausedRef.current) return
            setTyping(null)
            setMessages((prev) => [...prev, line])
            play(i + 1)
          }, lead + THINK_MS),
        )
      }

      play(startIndex)
    },
    [clearTimers, pushT],
  )

  useEffect(() => {
    if (!scriptLines.length) return
    setPausedBoth(false)
    setMessages([])
    setTyping(null)
    runFromIndex(0)
    return clearTimers
  }, [runId, runFromIndex, clearTimers, setPausedBoth, scriptLines.length])

  function handleReplay() {
    setPausedBoth(false)
    setRunId((x) => x + 1)
  }

  function handlePauseToggle() {
    if (!pausedRef.current) {
      setPausedBoth(true)
      clearTimers()
      setTyping(null)
    } else {
      setPausedBoth(false)
      const next = messages.length
      if (next < scriptRef.current.length) {
        runFromIndex(next)
      }
    }
  }

  if (!negotiation?.messages?.length) {
    return null
  }

  const sessionLabel = `${negotiation.type} · ${negotiation.currency || 'INR'}`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Negotiation simulation</h1>
          <p className="mt-1 text-sm text-slate-400">Candidate (green) · HR / Client (red)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handlePauseToggle} className="!text-xs sm:!text-sm">
            {paused ? 'Resume simulation' : 'Pause simulation'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleReplay} className="!text-xs sm:!text-sm">
            Replay simulation
          </Button>
          <Link
            to="/negotiations/result"
            state={{ negotiation }}
            className={buttonClass('primary', '!text-xs sm:!text-sm')}
          >
            View results
          </Link>
        </div>
      </div>

      <div className="glass-strong relative flex min-h-[480px] flex-1 flex-col overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-xs font-medium text-slate-400">Session · {sessionLabel}</span>
          </div>
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
            Step-by-step
          </span>
        </div>

        <div className="grid flex-1 grid-cols-1 md:grid-cols-2 md:divide-x md:divide-white/5">
          <div className="hidden flex-col border-b border-white/5 p-4 md:flex md:border-b-0 md:p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Candidate side</p>
            <p className="mt-1 text-xs text-slate-500">Your asks, anchors, and tradeoffs</p>
          </div>
          <div className="hidden flex-col p-4 md:flex md:p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">HR / Client side</p>
            <p className="mt-1 text-xs text-slate-500">Constraints, bands, and counteroffers</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="mb-6 flex justify-center gap-6 text-center text-[10px] uppercase tracking-wider md:hidden">
              <span className="text-emerald-400">Candidate ←</span>
              <span className="text-red-400">→ HR</span>
            </div>
            {messages.map((m, idx) => (
              <MessageBubble key={`${idx}-${m.text.slice(0, 20)}`} {...m} />
            ))}
            <AnimatePresence>{typing && !paused && <TypingIndicator side={typing} />}</AnimatePresence>
            {paused && messages.length > 0 && messages.length < scriptLines.length && (
              <p className="text-center text-xs text-amber-400/90">Paused — resume to continue</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
