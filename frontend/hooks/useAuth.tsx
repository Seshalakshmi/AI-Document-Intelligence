import React, { createContext, useContext, useEffect, useState } from 'react'
import * as api from '@/lib/api'
import { User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (fullname: string, email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'adi_auth_token'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!t) {
      setLoading(false)
      return
    }
    setToken(t)
    ;(async () => {
      try {
        const u = await api.getCurrentUser(t)
        setUser(u)
      } catch {
        // token invalid or expired
        setToken(null)
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  }, [token])

  async function login(email: string, password: string) {
    const res = await api.login(email, password)
    setUser(res.user)
    setToken(res.tokens.access_token)
  }

  async function register(fullname: string, email: string, password: string) {
    const res = await api.register(fullname, email, password)
    setUser(res.user)
    setToken(res.tokens.access_token)
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
