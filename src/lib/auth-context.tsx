'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import { toast } from 'sonner'

type User = {
  name: string
  email: string
  role?: 'user' | 'admin'
}

type LoginResult = {
  ok: boolean
  blocked?: boolean
  remainingMs?: number
  attemptsLeft?: number
  error?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string, turnstileToken?: string | null) => Promise<LoginResult>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAdmin?: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize state from localStorage once mounted
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rsvp_auth_user')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setUser(parsed)
        } catch (e) {
          console.error('Error parsing saved user:', e)
          localStorage.removeItem('rsvp_auth_user')
        }
      }
      setLoading(false)
    }
  }, [])

  const router = useRouter()

  async function login(email: string, password: string, turnstileToken?: string | null): Promise<LoginResult> {
    const setSession = (userData: any) => {
      setUser(userData)
      localStorage.setItem('rsvp_auth_user', JSON.stringify(userData))
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken: turnstileToken ?? null })
      })

      const data = await res.json()

      if (!res.ok) {
        // Bloqueio por brute force — não mostar toast genérico, a page cuida disso
        if (res.status === 429) {
          return { ok: false, blocked: data.blocked, remainingMs: data.remainingMs, error: data.error }
        }
        // Tentativas com aviso
        if (data.attemptsLeft !== undefined) {
          toast.error(data.error || 'Acesso negado.')
          return { ok: false, attemptsLeft: data.attemptsLeft, error: data.error }
        }
        toast.error(data.error || 'Acesso negado.', {
          description: 'Verifique o e-mail e a senha e tente novamente.'
        })
        return { ok: false, error: data.error }
      }

      setSession(data.user)

      if (data.user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }

      return { ok: true }
    } catch (err) {
      console.error('Erro no login:', err)
      toast.error('Erro de conexão', { description: 'Verifique sua internet e tente novamente.' })
      return { ok: false, error: 'Erro de conexão' }
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao criar conta.')
        return
      }

      // Login automático após registro
      const userData = data.user
      setUser(userData)
      const serialized = JSON.stringify(userData)
      localStorage.setItem('rsvp_auth_user', serialized)
      // O cookie é definido pelo servidor na rota de registro (precisamos atualizar a rota de registro também)

      router.push('/dashboard')
    } catch (err) {
      console.error('Erro ao registrar:', err)
      toast.error('Erro de conexão', { description: 'Verifique sua internet e tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

    const logout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch (err) {
        console.warn('Logout API error, clearing local state anyway.')
      }
      setUser(null)
      localStorage.removeItem('rsvp_auth_user')
      router.push('/login')
    }

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin'
  }), [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
