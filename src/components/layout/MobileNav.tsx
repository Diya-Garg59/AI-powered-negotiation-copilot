import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/negotiations/new', label: 'New Negotiation' },
  { to: '/history', label: 'History' },
  { to: '/profile', label: 'Profile' },
] as const

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mb-4 flex items-center justify-between md:hidden">
      <NavLink to="/" className="text-sm font-semibold text-white">
        Negotiation Copilot
      </NavLink>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[min(100%,280px)] flex-col gap-1 border-l border-white/10 bg-slate-950/95 p-6 pt-14 backdrop-blur-xl"
            >
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-3 text-sm font-medium ${isActive ? 'bg-indigo-500/20 text-white' : 'text-slate-400'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  logout()
                  navigate('/login', { replace: true })
                }}
                className="mt-4 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300"
              >
                Log out
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
