'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function GiftSuccessPage() {
    const params = useParams()
    const slug = params.slug as string
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        
        // Autossincronização de pagamentos (Especialmente para webhooks perdidos do Stripe)
        const transactionId = new URLSearchParams(window.location.search).get('t');
        if (transactionId) {
            fetch(`/api/gift/verify?t=${transactionId}`)
                .then(res => res.json())
                .catch(console.error);
        }
    }, [])

    return (
        <main className="min-h-screen bg-bg-light flex items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-pale/20 via-transparent to-transparent">

            {/* Confetti Elements */}
            {mounted && [...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute pointer-events-none animate-confetti"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-20px`,
                        backgroundColor: i % 3 === 0 ? '#8B2D4F' : i % 3 === 1 ? '#D4AF37' : '#EFCED8',
                        width: `${Math.random() * 10 + 5}px`,
                        height: `${Math.random() * 10 + 5}px`,
                        opacity: 0.6,
                        borderRadius: i % 2 === 0 ? '50%' : '0',
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${Math.random() * 2 + 3}s`
                    }}
                />
            ))}

            <style jsx>{`
                @keyframes confetti {
                    0% { transform: translateY(0) rotate(0); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .animate-confetti {
                    animation: confetti linear forwards;
                }
            `}</style>

            <div className="max-w-md w-full bg-surface border border-border-soft rounded-[3rem] shadow-2xl p-12 text-center animate-in zoom-in duration-700 relative overflow-hidden group hover:shadow-brand/10 transition-shadow">
                {/* Efeito visual de fundo */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-pale rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-pale rounded-full blur-3xl opacity-30 group-hover:scale-110 transition-transform duration-1000" />

                <div className="relative">
                    <div className="w-24 h-24 bg-success-light text-success-dark rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-6 hover:rotate-0 hover:scale-110 transition-all duration-500 shadow-lg shadow-success/10 group">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-in fade-in slide-in-from-top-4 delay-300">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Presente Enviado</span>
                    <h1 className="text-4xl font-serif text-text-primary mt-3 mb-6 tracking-tight tracking-tight">Muitíssimo Obrigado!</h1>

                    <p className="text-text-secondary leading-relaxed mb-10 text-base font-medium opacity-80 decoration-brand-pale decoration-wavy">
                        "Seu presente foi recebido com muito carinho e celebra a união que estamos prestes a viver. Mal podemos esperar para te dar um abraço!"
                    </p>

                    <div className="space-y-4">
                        <Link href={`/${slug}`}
                            className="block w-full py-5 bg-brand text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:-translate-y-1 shadow-xl shadow-brand/20 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-brand/20">
                            Voltar para o Convite
                        </Link>

                        {/* CTA RSVP */}
                        <div className="mt-2 bg-brand border border-brand/20 rounded-2xl p-5 text-left relative overflow-hidden shadow-lg shadow-brand/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border border-white/20">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Não se esqueça!</p>
                                    <p className="text-sm text-white font-semibold leading-snug">
                                        Você já confirmou sua presença? Garanta seu lugar na celebração! 🥂
                                    </p>
                                    <Link
                                        href={`/${slug}/confirmar`}
                                        className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 hover:-translate-y-0.5 active:scale-95 transition-all shadow-md"
                                    >
                                        Confirmar Presença →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 py-2">
                            <div className="w-1 h-1 rounded-full bg-brand/30" />
                            <div className="w-1 h-1 rounded-full bg-brand/30" />
                            <div className="w-1 h-1 rounded-full bg-brand/30" />
                        </div>

                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">
                            RSVP • Vanessa Bidinotti
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
