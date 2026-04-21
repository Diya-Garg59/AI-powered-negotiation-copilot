import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

const transition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

export function AppShell() {
  const location = useLocation()

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <main className="relative flex min-h-svh min-w-0 flex-1 flex-col p-4 pt-5 md:p-8 lg:pl-4">
        <MobileNav />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/3 h-56 w-56 rounded-full bg-violet-600/10 blur-[80px]" />
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={transition}
              className="flex min-h-0 flex-1 flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
