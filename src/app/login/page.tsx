'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
            <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight">
              Acesso ao Sistema
            </h2>
            <div className="h-px w-12 bg-brand/20 mx-auto mt-4" />
          </div>

          <form 
            className="mt-10 space-y-6" 
            method="POST"
            onSubmit={(e) => { 
                e.preventDefault(); 
                login(email, password); 
            }}
          >
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
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   className="w-full px-6 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none placeholder:text-text-muted text-text-primary"
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
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   className="w-full px-6 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/5 focus:border-brand-light transition-all outline-none placeholder:text-text-muted text-text-primary"
                   placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full h-16 rounded-full bg-brand text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-brand-dark hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Acessar Painel
              </button>
            </div>
          </form>

          <div className="pt-8 text-center border-t border-border-soft">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
              RSVP • Gestão de Eventos
            </p>
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
