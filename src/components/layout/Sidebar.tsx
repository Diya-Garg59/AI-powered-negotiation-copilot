import { motion } from 'framer-motion'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/negotiations/new', label: 'New Negotiation' },
  { to: '/history', label: 'History' },
  { to: '/offer-analyzer', label: '📄 Offer Analyzer' },
  { to: '/salary-benchmark', label: '📊 Salary Benchmark' },
  { to: '/profile', label: 'Profile' },
] as const

function Logo() {
  return (
    <NavLink to="/" className="group flex items-center gap-3 px-1 py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 transition group-hover:shadow-indigo-500/50">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <div className="text-left">
        <div className="text-sm font-semibold tracking-tight text-white">Negotiation Copilot</div>
        <div className="text-[11px] text-slate-500">AI simulation</div>
      </div>
    </NavLink>
  )
}

export function Sidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="sticky top-0 z-20 hidden h-svh w-[260px] shrink-0 flex-col border-r border-white/10 bg-slate-950/40 px-4 py-6 backdrop-blur-xl md:flex md:px-5">
      <Logo />
      {user && (
        <p className="mt-4 truncate rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
          <span className="font-medium text-slate-300">{user.name}</span>
          <br />
          <span className="truncate">{user.email}</span>
        </p>
      )}
      <nav className="mt-6 flex flex-col gap-1" aria-label="Main">
        {nav.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'relative rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-pill"
                    className="absolute inset-0 rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/login', { replace: true })
        }}
        className="mt-4 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
      >
        Log out
      </button>
      <div className="mt-auto rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-transparent p-4">
        <p className="text-xs leading-relaxed text-slate-400">
          Run a simulation before your next call. Sharper outcomes, less guesswork.
        </p>
        <NavLink
          to="/negotiations/new"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
        >
          New simulation
        </NavLink>
      </div>
    </aside>
  )
}
