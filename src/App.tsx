import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { NewNegotiation } from './pages/NewNegotiation'
import { OfferAnalyzer } from './pages/OfferAnalyzer'
import { SalaryBenchmark } from './pages/SalaryBenchmark'
import { Profile } from './pages/Profile'
import { ResponseGenerator } from './pages/ResponseGenerator'
import { Result } from './pages/Result'
import { Signup } from './pages/Signup'
import { Simulation } from './pages/Simulation'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/negotiations/new" element={<NewNegotiation />} />
          <Route path="/negotiations/simulate" element={<Simulation />} />
          <Route path="/negotiations/result" element={<Result />} />
          <Route path="/responses" element={<ResponseGenerator />} />
          <Route path="/history" element={<History />} />
          <Route path="/offer-analyzer" element={<OfferAnalyzer />} />
          <Route path="/salary-benchmark" element={<SalaryBenchmark />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  )
}
