import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ApiUser } from '../types/api'
import { clearAuth, getStoredUser, getToken, loginRequest, registerRequest, setAuth } from '../lib/api'

type AuthContextValue = {
  token: string | null
  user: ApiUser | null
  isReady: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<ApiUser | null>(() => getStoredUser())
  const [isReady] = useState(true)

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password)
    setAuth(data.token, data.user)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await registerRequest(name, email, password)
    setAuth(data.token, data.user)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ token, user, isReady, login, register, logout }),
    [token, user, isReady, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
