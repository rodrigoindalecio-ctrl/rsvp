'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

type User = {
  name: string
  email: string
  role?: 'user' | 'admin'
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
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
          // Garantir que o cookie de sessão existe (pode ter sido limpo)
          document.cookie = `rsvp_session=${encodeURIComponent(saved)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
        } catch (e) {
          console.error('Error parsing saved user:', e)
        }
      }
      setLoading(false)
    }
  }, [])

  const router = useRouter()

  async function login(email: string, password: string) {
    const setSession = (userData: any) => {
      setUser(userData)
      const serialized = JSON.stringify(userData)
      localStorage.setItem('rsvp_auth_user', serialized)
      document.cookie = `rsvp_session=${encodeURIComponent(serialized)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
    }

    try {
      // Toda a verificação acontece no servidor — credenciais nunca ficam no código
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Acesso negado.')
        return
      }

      setSession(data.user)

      if (data.user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Erro no login:', err)
      alert('Erro de conexão. Tente novamente.')
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
        alert(data.error || 'Erro ao criar conta.')
        return
      }

      // Login automático após registro
      const userData = data.user
      setUser(userData)
      const serialized = JSON.stringify(userData)
      localStorage.setItem('rsvp_auth_user', serialized)
      document.cookie = `rsvp_session=${encodeURIComponent(serialized)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`

      router.push('/dashboard')
    } catch (err) {
      console.error('Erro ao registrar:', err)
      alert('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('rsvp_auth_user')
    // Expirar o cookie de sessão imediatamente
    document.cookie = 'rsvp_session=; path=/; max-age=0; SameSite=Lax'
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
