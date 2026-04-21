import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonClass } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Input, Label } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'
import { ApiError, listNegotiationsRequest } from '../lib/api'

function initials(name: string) {
  const p = name.trim().split(/\s+/)
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '?'
}

export function Profile() {
  const { user } = useAuth()
  const [total, setTotal] = useState(0)
  const [avgGain, setAvgGain] = useState('0%')
  const [prefStrategy, setPrefStrategy] = useState('—')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { negotiations } = await listNegotiationsRequest()
      setTotal(negotiations.length)
      let sum = 0
      let n = 0
      const counts = new Map<string, number>()
      for (const row of negotiations) {
        if (row.result && row.initialOffer > 0) {
          sum += ((row.result.average - row.initialOffer) / row.initialOffer) * 100
          n += 1
        }
        counts.set(row.strategy, (counts.get(row.strategy) || 0) + 1)
      }
      const avg = n ? (sum / n).toFixed(1) : '0'
      setAvgGain(`${Number(avg) >= 0 ? '+' : ''}${avg}%`)
      let best = '—'
      let bestC = 0
      for (const [k, v] of counts) {
        if (v > bestC) {
          best = k
          bestC = v
        }
      }
      setPrefStrategy(bestC ? best : '—')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        /* handled by auth */
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-400">Your account and practice stats</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-lg shadow-indigo-500/30">
              {user ? initials(user.name) : '?'}
            </div>
            <div className="min-w-0 flex-1 space-y-5">
              <div>
                <CardTitle>Account</CardTitle>
                <CardDescription>Signed in with your Negotiation Copilot account</CardDescription>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" readOnly value={user?.name ?? ''} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" readOnly value={user?.email ?? ''} />
                </div>
              </div>
              <p className="text-xs text-slate-500">Profile edits can be added later via a dedicated API endpoint.</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total simulations', value: loading ? '…' : String(total), sub: 'All time' },
          { label: 'Avg gain', value: loading ? '…' : avgGain, sub: 'Vs. first offer' },
          { label: 'Preferred strategy', value: loading ? '…' : prefStrategy, sub: 'Most used' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="!p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
              <p className="mt-2 text-xl font-semibold text-white">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardTitle>Shortcuts</CardTitle>
        <CardDescription>Pick up where you left off</CardDescription>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/negotiations/new" className={buttonClass('primary', '!py-2 !text-xs')}>
            New simulation
          </Link>
          <Link to="/history" className={buttonClass('secondary', '!py-2 !text-xs')}>
            View history
          </Link>
        </div>
      </Card>
    </div>
  )
}
