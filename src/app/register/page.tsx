'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowRight, Eye, EyeOff, Lock, Check } from 'lucide-react'
import { toast } from 'sonner'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [coupleStyle, setCoupleStyle] = useState<'casal' | 'noivos' | 'noivas'>('casal')
  const [coupleNames, setCoupleNames] = useState('')
  const [eventType, setEventType] = useState<'casamento' | 'debutante'>('casamento')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)

  // Cloudflare Turnstile invisível
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return

    const renderWidget = () => {
      const turnstile = (window as any).turnstile
      if (!turnstile || !turnstileRef.current) return

      try {
        turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => setTurnstileToken(token),
          'error-callback': () => setTurnstileToken(null),
          'expired-callback': () => setTurnstileToken(null),
          theme: 'light',
          size: 'invisible'
        })
      } catch (e) {
        console.error('Turnstile render error', e)
      }
    }

    if ((window as any).turnstile) {
      renderWidget()
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.onload = renderWidget
      document.head.appendChild(script)
    }
  }, [])

  // Força da senha
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!termsAccepted) {
      toast.warning('Termos obrigatórios', {
        description: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade (LGPD) para continuar.'
      })
      return
    }

    if (password.length < 8) {
      toast.warning('Senha curta', {
        description: 'A senha de segurança deve ter pelo menos 8 caracteres.'
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          coupleNames,
          coupleStyle,
          eventType,
          turnstileToken,
          marketingOptIn
        })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error('Erro no cadastro', { description: data.error || 'Verifique seus dados.' })
        setLoading(false)
        return
      }

      toast.success('Código enviado! ✨', {
        description: 'Enviamos um código de 6 dígitos para o seu e-mail.'
      })

      // Redireciona para tela de conferência de 6 dígitos passando o e-mail
      router.push(`/verificar-email?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      console.error(err)
      toast.error('Falha de conexão', { description: 'Não foi possível enviar a solicitação. Tente novamente.' })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-xl">
        {/* Header com logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block transition-transform hover:scale-105 mb-4">
            <div className="w-16 h-16 relative mx-auto">
              <Image src="/logo_marsala.png" alt="Logo VB" fill className="object-contain" priority />
            </div>
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand block mb-1">
            VB Cerimonial • RSVP
          </span>
          <h1 className="text-3xl font-serif text-text-primary">Crie sua Conta</h1>
          <p className="text-xs text-text-muted mt-2">
            Organize seu evento com lista trancada e presentes inteligentes.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-surface p-8 sm:p-12 rounded-[2.5rem] border border-border-soft shadow-xl shadow-brand/5 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Nome do Responsável */}
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block mb-2">
                Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Vanessa Bidinotti"
                className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none text-text-primary placeholder:text-text-muted"
              />
            </div>

            {/* Configuração de Tratamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block mb-2">
                  Tipo de Casal / Evento
                </label>
                <select
                  value={coupleStyle}
                  onChange={e => setCoupleStyle(e.target.value as any)}
                  className="w-full px-4 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand/20 outline-none text-text-primary cursor-pointer appearance-none"
                >
                  <option value="casal">🤍 O Casal (Inclusivo)</option>
                  <option value="noivos">🤵‍♂️ Os Noivos</option>
                  <option value="noivas">👰‍♀️ As Noivas</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block mb-2">
                  {coupleStyle === 'noivas' ? 'Nome das Noivas *' : coupleStyle === 'noivos' ? 'Nome dos Noivos *' : 'Nomes do Casal *'}
                </label>
                <input
                  type="text"
                  required
                  value={coupleNames}
                  onChange={e => setCoupleNames(e.target.value)}
                  placeholder={
                    coupleStyle === 'noivas' ? 'Ex: Marina & Clara' : coupleStyle === 'noivos' ? 'Ex: Lucas & Gabriel' : 'Ex: Vanessa & Rodrigo'
                  }
                  className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block mb-2">
                Seu Melhor E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none text-text-primary placeholder:text-text-muted"
              />
              <p className="text-[10px] text-text-muted ml-1 mt-1">
                Você receberá um código de 6 dígitos neste e-mail para ativar a conta.
              </p>
            </div>

            {/* Senha */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block">
                  Senha de Acesso *
                </label>
                <span className="text-[10px] text-text-muted">mínimo 8 caracteres</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none text-text-primary placeholder:text-text-muted pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Medidor de força da senha */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full">
                    <div className={`h-full flex-1 rounded-full transition-all ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all ${passwordStrength >= 2 ? 'bg-amber-500' : 'bg-gray-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all ${passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all ${passwordStrength >= 4 ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Checkboxes LGPD */}
            <div className="pt-2 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-brand border-border-soft focus:ring-brand cursor-pointer accent-brand"
                />
                <span className="text-xs text-text-secondary leading-relaxed">
                  Li e concordo com os{' '}
                  <Link href="/termos" target="_blank" className="font-bold text-brand hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link href="/privacidade" target="_blank" className="font-bold text-brand hover:underline">
                    Política de Privacidade (LGPD)
                  </Link>
                  . *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={e => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-brand border-border-soft focus:ring-brand cursor-pointer accent-brand"
                />
                <span className="text-xs text-text-muted leading-relaxed">
                  Desejo receber novidades, dicas de assessoria e melhorias da plataforma por e-mail (opcional).
                </span>
              </label>
            </div>

            {/* Container do Turnstile invisível */}
            <div ref={turnstileRef} className="hidden" aria-hidden="true" />

            {/* Botão de Envio */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-full bg-brand text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-brand-dark hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando código...
                  </>
                ) : (
                  <>
                    Continuar e Receber Código
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Link para Login */}
          <div className="pt-6 mt-6 border-t border-border-soft text-center">
            <p className="text-xs text-text-muted">
              Já tem uma conta cadastrada?{' '}
              <Link href="/login" className="font-bold text-brand hover:underline">
                Acessar Painel →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
