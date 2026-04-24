'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'

// Ícones SVG inline para evitar dependências extras
const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const LockClosedIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  // ── Countdown do bloqueio ─────────────────────────────────────────────────
  useEffect(() => {
    if (!blockedUntil) return
    const interval = setInterval(() => {
      const remaining = blockedUntil - Date.now()
      if (remaining <= 0) {
        setBlockedUntil(null)
        setCountdown('')
      } else {
        const m = Math.floor(remaining / 60_000)
        const s = Math.floor((remaining % 60_000) / 1000)
        setCountdown(`${m}:${String(s).padStart(2, '0')}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [blockedUntil])

  // ── Inicializar widget Turnstile ──────────────────────────────────────────
  const initTurnstile = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current || !(window as any).turnstile) return
    if (widgetIdRef.current !== null) return // já inicializado

    widgetIdRef.current = (window as any).turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'light',
      size: 'invisible',
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(null),
      'error-callback': () => setTurnstileToken(null),
    })
  }, [])

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return

    if ((window as any).turnstile) {
      initTurnstile()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => initTurnstile()
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [initTurnstile])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || blockedUntil) return

    // Disparar challenge Turnstile se configurado
    if (TURNSTILE_SITE_KEY && (window as any).turnstile && widgetIdRef.current !== null) {
      try { (window as any).turnstile.execute(widgetIdRef.current) } catch {}
      // Pequena espera para o token ser preenchido (challenge rápido/invisível)
      await new Promise(r => setTimeout(r, 300))
    }

    setLoading(true)
    try {
      const result = await login(email, password, turnstileToken)

      if (!result.ok) {
        // Reset captcha após falha
        if (TURNSTILE_SITE_KEY && (window as any).turnstile && widgetIdRef.current !== null) {
          ;(window as any).turnstile.reset(widgetIdRef.current)
          setTurnstileToken(null)
        }

        if (result.blocked) {
          setBlockedUntil(Date.now() + (result.remainingMs || 15 * 60_000))
          setAttemptsLeft(null)
        } else if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const isBlocked = !!blockedUntil

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-6 lg:px-8 relative overflow-hidden bg-background">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">

        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative w-24 h-24 mb-2 overflow-hidden rounded-2xl border border-brand/5 shadow-sm bg-white p-2">
              <Image src="/logo_marsala.png" alt="Logo Vanessa Bidinotti" fill sizes="96px" className="object-contain p-1" />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-brand tracking-tighter leading-none mb-2">Vanessa Bidinotti</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand/60">Assessoria e Cerimonial</p>
            </div>
          </div>
        </div>

        <div className="bg-surface p-10 md:p-14 rounded-[3rem] shadow-2xl shadow-brand/5 border border-border-soft space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight">Acesso ao Sistema</h2>
            <div className="h-px w-12 bg-brand/20 mx-auto mt-4" />
          </div>

          {/* Banner de bloqueio */}
          {isBlocked && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
              <LockClosedIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-red-700">Acesso temporariamente bloqueado</p>
                <p className="text-xs text-red-500 mt-0.5">
                  Muitas tentativas incorretas. Tente novamente em{' '}
                  <span className="font-black tabular-nums">{countdown || '...'}</span>
                </p>
              </div>
            </div>
          )}

          {/* Aviso de tentativas restantes */}
          {!isBlocked && attemptsLeft !== null && attemptsLeft > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
              <ShieldCheckIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-bold">
                Senha incorreta. Você ainda tem{' '}
                <span className="font-black">{attemptsLeft} tentativa{attemptsLeft !== 1 ? 's' : ''}</span>{' '}
                antes do bloqueio temporário.
              </p>
            </div>
          )}

          <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block">
                  E-mail institucional
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isBlocked}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none placeholder:text-text-muted text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  placeholder="nome@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block">
                  Senha de segurança
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={isBlocked}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none placeholder:text-text-muted text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Container invisível do Turnstile */}
            <div ref={turnstileRef} className="hidden" aria-hidden="true" />

            <div className="pt-4">
              <button
                type="submit"
                disabled={isBlocked || loading}
                className="w-full h-16 rounded-full bg-brand text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-brand-dark hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verificando...
                  </>
                ) : isBlocked ? (
                  <>
                    <LockClosedIcon className="w-4 h-4" />
                    Bloqueado — {countdown}
                  </>
                ) : (
                  'Acessar Painel'
                )}
              </button>
            </div>
          </form>

          <div className="pt-8 text-center border-t border-border-soft space-y-2">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
              RSVP • Gestão de Eventos
            </p>
            {TURNSTILE_SITE_KEY && (
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheckIcon className="w-3 h-3 text-text-muted/50" />
                <p className="text-[9px] text-text-muted/50 font-bold uppercase tracking-widest">
                  Protegido por Cloudflare Turnstile
                </p>
              </div>
            )}
          </div>
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
