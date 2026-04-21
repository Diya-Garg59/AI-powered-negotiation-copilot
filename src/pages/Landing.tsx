import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { buttonClass } from '../components/ui/Button'

const features = [
  {
    title: 'AI Simulation Engine',
    desc: 'Practice realistic back-and-forth with an AI that mirrors employer and client behavior.',
  },
  {
    title: 'Strategy Builder',
    desc: 'Tune aggression, experience level, and constraints—then stress-test your plan.',
  },
  {
    title: 'Smart Response Generator',
    desc: 'Turn outcomes into polished email and chat replies in seconds.',
  },
] as const

function DemoChat() {
  return (
    <div className="glass-strong relative overflow-hidden rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Live preview</span>
        <span className="flex items-center gap-2 text-xs text-emerald-400/90">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Simulating
        </span>
      </div>
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-start"
        >
          <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-slate-200">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
              Candidate
            </span>
            I’m excited about the role. Based on market data and my experience, I’m looking at ₹6,00,000 LPA.
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55 }}
          className="flex justify-end"
        >
          <div className="max-w-[85%] rounded-2xl rounded-br-md border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-slate-200">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-red-400/90">HR</span>
            We appreciate that. Our current band for this level is ₹5,20,000. We can discuss total rewards.
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95 }}
          className="flex items-center gap-2 px-1 text-xs text-slate-500"
        >
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
          </span>
          AI thinking…
        </motion.div>
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
          Negotiation Copilot
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            Log in
          </Link>
          <Link to="/signup" className={buttonClass('primary', '!py-2 !text-xs md:!text-sm')}>
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
        <section className="grid gap-16 pt-8 md:grid-cols-2 md:items-center md:gap-12 md:pt-16">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400/90"
            >
              Decision support, not a job board
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
            >
              Negotiate Smarter with{' '}
              <span className="text-gradient">AI</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 max-w-lg text-base leading-relaxed text-slate-400 md:text-lg"
            >
              Simulate salary & freelance negotiations before the real conversation. Built for students, freshers, and
              freelancers who want clarity—not guesswork.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link to="/negotiations/new" className={buttonClass('primary', 'glow-purple px-6')}>
                Start Negotiation
              </Link>
              <Link to="/dashboard" className={buttonClass('secondary', 'px-6')}>
                Open dashboard
              </Link>
            </motion.div>
          </div>
          <DemoChat />
        </section>

        <section className="mt-28">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-500">Why it works</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-2xl font-semibold text-white md:text-3xl">
            Everything you need to walk in prepared
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-6 transition hover:border-indigo-500/30"
              >
                <div className="mb-3 h-10 w-10 rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/30" />
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-28 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-600/5 p-8 md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Ready for your next conversation?</h2>
            <p className="mt-3 text-slate-400">
              Run a full simulation, review the range, and export responses—all in one flow.
            </p>
            <Link to="/negotiations/new" className={buttonClass('primary', 'glow-purple mt-8 px-8 py-3')}>
              Start Negotiation
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-600">
        Negotiation Copilot · UI preview · No backend
      </footer>
    </div>
  )
}
