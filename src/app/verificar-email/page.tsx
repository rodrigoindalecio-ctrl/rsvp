'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, RotateCw, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-light flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  
  const [email] = useState(emailParam)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Cooldown de reenvio
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Foco automático no primeiro input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Atualização de dígito
  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '')
    if (!clean) {
      const copy = [...digits]
      copy[index] = ''
      setDigits(copy)
      return
    }

    const copy = [...digits]
    copy[index] = clean.slice(-1)
    setDigits(copy)

    // Avançar cursor para o próximo input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Teclado Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Suporte a colar (Paste) o código inteiro
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const copy = [...digits]
    for (let i = 0; i < 6; i++) {
      copy[i] = pasted[i] || ''
    }
    setDigits(copy)

    // Foca no último preenchido
    const targetIdx = Math.min(pasted.length, 5)
    inputRefs.current[targetIdx]?.focus()
  }

  // Submissão do código
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const fullCode = digits.join('')

    if (fullCode.length !== 6) {
      toast.warning('Código incompleto', { description: 'Digite os 6 dígitos do seu código.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: fullCode
        })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error('Erro de verificação', { description: data.error || 'Código inválido.' })
        setLoading(false)
        return
      }

      setIsSuccess(true)
      toast.success('Conta confirmada! 🎉', {
        description: 'Redirecionando para o seu novo painel...'
      })

      setTimeout(() => {
        // Redireciona diretamente para o onboarding / dashboard
        window.location.href = '/settings?onboarding=true'
      }, 1500)

    } catch (err) {
      console.error(err)
      toast.error('Falha de conexão', { description: 'Tente novamente.' })
      setLoading(false)
    }
  }

  // Reenviar código
  const handleResend = async () => {
    if (cooldown > 0) return
    setCooldown(60)
    toast.info('Reenviando código...', { description: 'Por favor, aguarde.' })

    try {
      const res = await fetch('/api/auth/register-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: 'Usuário',
          password: 'temp_revalidate',
          coupleNames: 'Evento',
          isResend: true
        })
      })
      if (res.ok) {
        toast.success('Novo código enviado!', { description: 'Verifique sua caixa de entrada e spam.' })
      }
    } catch (e) {
      // Ignorar erro
    }
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/register" className="inline-block transition-transform hover:scale-105 mb-4">
            <div className="w-16 h-16 relative mx-auto">
              <Image src="/logo_marsala.png" alt="Logo VB" fill className="object-contain" priority />
            </div>
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand block mb-1">
            Confirmação de Segurança
          </span>
          <h1 className="text-3xl font-serif text-text-primary">Digite o Código</h1>
          <p className="text-xs text-text-muted mt-2 max-w-xs mx-auto">
            Enviamos um código de 6 dígitos para <strong className="text-text-primary">{email || 'seu e-mail'}</strong>.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface p-8 sm:p-10 rounded-[2.5rem] border border-border-soft shadow-xl shadow-brand/5 relative overflow-hidden">
          
          {isSuccess ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-serif text-text-primary">E-mail Confirmado!</h2>
              <p className="text-xs text-text-muted">Preparando seu painel exclusivo...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* 6 inputs para os dígitos */}
              <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-12 h-16 sm:w-14 sm:h-18 text-center text-2xl font-mono font-bold bg-bg-light border-2 border-border-soft rounded-2xl focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-text-primary"
                  />
                ))}
              </div>

              {/* Botão de confirmação */}
              <button
                type="submit"
                disabled={loading || digits.join('').length !== 6}
                className="w-full h-14 rounded-full bg-brand text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-brand-dark hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Validando...
                  </>
                ) : (
                  'Ativar Minha Conta'
                )}
              </button>

              {/* Reenvio com cooldown */}
              <div className="text-center pt-2">
                {cooldown > 0 ? (
                  <p className="text-[11px] text-text-muted">
                    Reenviar código em <strong className="text-brand">{cooldown}s</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="inline-flex items-center gap-2 text-xs font-bold text-brand hover:underline"
                  >
                    <RotateCw size={14} /> Reenviar novo código
                  </button>
                )}
              </div>

              {/* Voltar */}
              <div className="pt-4 border-t border-border-soft text-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
                >
                  <ArrowLeft size={14} /> Digitei o e-mail errado
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
