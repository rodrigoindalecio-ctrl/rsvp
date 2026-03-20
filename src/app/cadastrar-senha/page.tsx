'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'

function SetupPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const tokenParam = searchParams.get('temp')
    if (emailParam) setEmail(emailParam)
    if (tokenParam) setTempToken(tokenParam)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tempToken, password })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao configurar senha.')
        return
      }

      toast.success('Senha configurada com sucesso! Redirecionando...')
      
      // Pequeno delay para o usuário ver o sucesso
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      console.error('Erro ao configurar senha:', err)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-6 lg:px-8 relative overflow-hidden bg-background">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
        
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative w-24 h-24 mb-2 overflow-hidden rounded-2xl border border-brand/5 shadow-sm bg-white p-2">
              <Image
                src="/Logo-03.jpg"
                alt="Logo Vanessa Bidinotti"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-brand tracking-tighter leading-none mb-2">Vanessa Bidinotti</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand/60">Assessoria e Cerimonial</p>
            </div>
          </div>
        </div>

        <div className="bg-surface p-10 md:p-14 rounded-[3rem] shadow-2xl shadow-brand/5 border border-border-soft space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight italic">
              Configurar sua Senha
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Crie uma senha para acessar seu painel
            </p>
            <div className="h-px w-12 bg-brand/20 mx-auto mt-4" />
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block">
                  E-mail
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-6 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold opacity-60 text-text-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block">
                  Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none text-text-primary"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none text-text-primary"
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 rounded-full bg-brand text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-brand-dark hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Confirmar Senha'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute top-1/4 right-[5%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-[5%] w-[40%] h-[40%] bg-brand/[0.02] rounded-full blur-[100px]" />
      </div>
    </div>
  )
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
        </div>
      }>
      <SetupPasswordContent />
    </Suspense>
  )
}
