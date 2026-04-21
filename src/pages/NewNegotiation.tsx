import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Input, Label, Select } from '../components/ui/Field'
import { ApiError, setLastNegotiation, startNegotiationRequest } from '../lib/api'

function mapType(v: string): 'salary' | 'freelance' {
  return v.toLowerCase() === 'freelance' ? 'freelance' : 'salary'
}

function mapStrategy(v: string): 'aggressive' | 'balanced' | 'conservative' {
  const x = v.toLowerCase()
  if (x === 'aggressive' || x === 'conservative') return x
  return 'balanced'
}

function mapLevel(v: string): 'fresher' | 'junior' | 'mid' {
  const x = v.toLowerCase()
  if (x === 'junior' || x === 'mid') return x
  return 'fresher'
}

export function NewNegotiation() {
  const navigate = useNavigate()
  const [fileName, setFileName] = useState<string | null>(null)
  const [offerType, setOfferType] = useState('Salary')
  const [currency, setCurrency] = useState('INR')
  const [initialOffer, setInitialOffer] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [minimumAcceptable, setMinimumAcceptable] = useState('')
  const [strategy, setStrategy] = useState('Balanced')
  const [experienceLevel, setExperienceLevel] = useState('Fresher')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const io = Number(initialOffer.replace(/,/g, ''))
    const tv = Number(targetValue.replace(/,/g, ''))
    const ma = Number(minimumAcceptable.replace(/,/g, ''))
    if (!Number.isFinite(io) || !Number.isFinite(tv) || !Number.isFinite(ma)) {
      setError('Enter valid numbers for all offer fields.')
      return
    }
    setLoading(true)
    try {
      const { negotiation } = await startNegotiationRequest({
        type: mapType(offerType),
        currency,
        initialOffer: io,
        targetValue: tv,
        minimumAcceptable: ma,
        strategy: mapStrategy(strategy),
        experienceLevel: mapLevel(experienceLevel),
      })
      setLastNegotiation(negotiation)
      navigate('/negotiations/simulate', { state: { negotiation } })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Could not start simulation. Is the API running and XAI_API_KEY/GROK_API_KEY set on the server?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">New negotiation</h1>
        <p className="mt-1 text-sm text-slate-400">Configure your scenario—then run the AI simulation</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
            role="alert"
          >
            {error}
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardTitle>Offer details</CardTitle>
            <CardDescription>Numbers and context the simulation will use</CardDescription>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="offerType">Offer type</Label>
                <Select id="offerType" value={offerType} onChange={(e) => setOfferType(e.target.value)}>
                  <option value="Salary">Salary</option>
                  <option value="Freelance">Freelance</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="initial">Their initial offer</Label>
                <Input
                  id="initial"
                  placeholder="e.g. 520000 or 1500"
                  value={initialOffer}
                  onChange={(e) => setInitialOffer(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="target">Your target / expected value</Label>
                <Input
                  id="target"
                  placeholder="e.g. 600000"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="minimum">Minimum acceptable</Label>
                <Input
                  id="minimum"
                  placeholder="Walk-away number"
                  value={minimumAcceptable}
                  onChange={(e) => setMinimumAcceptable(e.target.value)}
                  required
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card>
            <CardTitle>Strategy settings</CardTitle>
            <CardDescription>How the AI should posture on each side</CardDescription>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="style">Negotiation style</Label>
                <Select id="style" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                  <option value="Aggressive">Aggressive</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Conservative">Conservative</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="level">Experience level</Label>
                <Select id="level" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  <option value="Fresher">Fresher</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                </Select>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Card>
            <CardTitle>Upload</CardTitle>
            <CardDescription>Optional — offer letter or scope PDF (stored locally in browser only for now)</CardDescription>
            <div className="mt-6">
              <label
                htmlFor="file"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/40 px-6 py-12 transition hover:border-indigo-500/40 hover:bg-slate-900/40"
              >
                <span className="text-sm font-medium text-slate-300">Drop file or click to upload</span>
                <span className="mt-1 text-xs text-slate-500">PDF, PNG (optional)</span>
                <input
                  id="file"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    setFileName(f?.name ?? null)
                  }}
                />
              </label>
              {fileName && <p className="mt-3 text-xs text-indigo-300/90">Selected: {fileName}</p>}
            </div>
          </Card>
        </motion.div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="submit" className="glow-purple order-1 w-full sm:order-2 sm:w-auto sm:min-w-[200px]" disabled={loading}>
            {loading ? 'Running simulation…' : 'Start Simulation'}
          </Button>
        </div>
      </form>
    </div>
  )
}
