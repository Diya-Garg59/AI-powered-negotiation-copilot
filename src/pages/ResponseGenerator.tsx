import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonClass } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { ApiError, generateResponseRequest, getLastNegotiation } from '../lib/api'

const VARIANTS = ['Formal', 'Confident', 'Assertive'] as const
type Variant = (typeof VARIANTS)[number]

function toTone(v: Variant): 'formal' | 'confident' | 'assertive' {
  return v.toLowerCase() as 'formal' | 'confident' | 'assertive'
}

export function ResponseGenerator() {
  const [variant, setVariant] = useState<Variant>('Formal')
  const [email, setEmail] = useState('')
  const [chat, setChat] = useState('')
  const [copied, setCopied] = useState<'email' | 'chat' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadForTone = useCallback(async (v: Variant) => {
    const last = getLastNegotiation()
    const negotiationId = last?.id
    if (!negotiationId) {
      setError('Run a negotiation first, then open this page from the result flow.')
      setEmail('')
      setChat('')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { response } = await generateResponseRequest({
        negotiationId,
        tone: toTone(v),
      })
      setEmail(`${response.emailSubject}\n\n${response.emailBody}`)
      setChat(response.chatReply)
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'Could not generate responses. Check XAI_API_KEY/GROK_API_KEY on the server.',
      )
      setEmail('')
      setChat('')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadForTone(variant)
  }, [variant, loadForTone])

  async function copy(text: string, which: 'email' | 'chat') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Response generator</h1>
          <p className="mt-1 text-sm text-slate-400">Email and chat drafts from your last simulation</p>
        </div>
        <Link to="/negotiations/result" className={buttonClass('ghost', '!text-slate-400')}>
          ← Back to result
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            disabled={loading}
            onClick={() => setVariant(v)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              variant === v
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Generating with AI…</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="!flex !flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Email response</CardTitle>
              <CardDescription>Subject + body — edit before sending</CardDescription>
            </div>
            <Button variant="secondary" className="!shrink-0 !py-2 !text-xs" onClick={() => copy(email, 'email')} disabled={!email}>
              {copied === 'email' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <textarea
            className="mt-4 min-h-[280px] flex-1 resize-y rounded-xl border border-white/10 bg-slate-950/50 p-4 font-mono text-xs leading-relaxed text-slate-200 outline-none transition focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/15 md:text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            spellCheck={false}
            placeholder="Generated email will appear here…"
          />
        </Card>

        <Card className="!flex !flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Chat reply</CardTitle>
              <CardDescription>Slack / Teams / WhatsApp</CardDescription>
            </div>
            <Button variant="secondary" className="!shrink-0 !py-2 !text-xs" onClick={() => copy(chat, 'chat')} disabled={!chat}>
              {copied === 'chat' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <textarea
            className="mt-4 min-h-[200px] flex-1 resize-y rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-relaxed text-slate-200 outline-none transition focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/15"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder="Generated chat reply will appear here…"
          />
          <AnimatePresence>
            {copied && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-xs text-emerald-400/90"
              >
                Copied to clipboard
              </motion.p>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}
