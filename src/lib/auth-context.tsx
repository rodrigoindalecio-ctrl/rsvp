'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import { useAdmin } from './admin-context'

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

const ADMIN_CREDENTIALS = {
  email: 'rodrigoindalecio@hotmail.com',
  password: 'Eu@784586'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const adminContext = useAdmin() // Usar contexto admin para criar eventos

  // Initialize state from localStorage once mounted
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rsvp_auth_user')
      if (saved) {
        try {
          setUser(JSON.parse(saved))
        } catch (e) {
          console.error('Error parsing saved user:', e)
        }
      }
      setLoading(false)
    }
  }, [])

  const router = useRouter()

  async function login(email: string, password: string) {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const adminUser = { name: 'Administrador', email, role: 'admin' as const }
      setUser(adminUser)
      localStorage.setItem('rsvp_auth_user', JSON.stringify(adminUser))
      router.push('/admin/dashboard')
      return
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (error) throw error

      if (data) {
        const rsvpUser = {
          name: data.name,
          email: data.email,
          role: (data.type === 'admin' ? 'admin' : 'user') as 'admin' | 'user'
        }
        setUser(rsvpUser)
        localStorage.setItem('rsvp_auth_user', JSON.stringify(rsvpUser))

        if (rsvpUser.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      } else {
        alert('Acesso negado: Este e-mail não está autorizado.')
      }
    } catch (err) {
      console.error('Erro no login Supabase:', err)
      alert('Erro ao verificar suas credenciais. Tente novamente.')
    }
  }

  async function register(name: string, email: string, password: string) {
    const newUser = { name, email, role: 'user' as const }
    setUser(newUser)
    localStorage.setItem('rsvp_auth_user', JSON.stringify(newUser))

    try {
      const userId = crypto.randomUUID()
      await supabase.from('admin_users').insert({
        id: userId,
        name,
        email,
        type: 'noivos',
        created_at: new Date().toISOString()
      })

      // Criar evento automático ao se registrar
      if (adminContext) {
        await adminContext.createDefaultEventForUser(email, name)
      }
    } catch (err) {
      console.error('Erro ao registrar no Supabase:', err)
    }

    router.push('/dashboard')
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('rsvp_auth_user')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
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
