'use client'

import { useEvent } from '@/lib/event-context'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props { slug: string }

export default function PresentsContent({ slug }: Props) {
    const { eventSettings } = useEvent()
    const [gifts, setGifts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<any | null>(null)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [eventId, setEventId] = useState('')
    const [giftSettings, setGiftSettings] = useState<any>(null)

    const isCorrectEvent = eventSettings.slug === slug

    useEffect(() => {
        if (!isCorrectEvent) return
        fetch(`/api/events/by-slug/${slug}/gifts`)
            .then(r => r.json())
            .then(d => {
                setGifts(d.gifts || [])
                setGiftSettings(d.settings || null)
                if (d.eventId) setEventId(d.eventId)
            })
            .finally(() => setLoading(false))
    }, [slug, isCorrectEvent])

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selected) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/gift/${selected.id}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message, eventId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            window.location.href = data.init_point
        } catch (err: any) {
            alert('Erro ao processar: ' + err.message)
            setSubmitting(false)
        }
    }

    if (!isCorrectEvent) return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
            <p className="text-text-secondary font-serif italic">Evento não encontrado.</p>
        </div>
    )

    if (!eventSettings.isGiftListEnabled && !eventSettings.giftListInternalEnabled) {
        return (
            <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-brand-pale rounded-full flex items-center justify-center mb-6">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand opacity-40"><path d="M20 12V8H4v4M2 4h20v4H2zM12 4v16M7 12v8h10v-8" /></svg>
                </div>
                <h1 className="text-3xl font-serif text-text-primary mb-4">Lista de Presentes</h1>
                <p className="text-text-secondary font-serif italic max-w-md mx-auto">
                    A lista de presentes deste evento ainda não está disponível ou foi pausada pelos organizadores.
                    Por favor, tente novamente mais tarde.
                </p>
                <Link href={`/${slug}`} className="mt-10 px-8 py-3 bg-brand text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all">
                    Voltar ao Início
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg-light flex flex-col">
            {/* Topo */}
            <div className="bg-surface/90 backdrop-blur-md border-b border-border-soft sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href={`/${slug}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand transition-colors group">
                        <svg className="group-hover:-translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Início
                    </Link>
                    <span className="font-serif text-text-primary text-sm">{eventSettings.coupleNames}</span>
                    <Link href={`/${slug}/confirmar`} className="text-[10px] font-black uppercase tracking-widest text-brand hover:opacity-70 transition-opacity hidden sm:block">
                        Confirmar Presença →
                    </Link>
                    <div className="w-16 sm:hidden" />
                </div>
            </div>

            {/* Header da página */}
            <div className="bg-surface border-b border-border-soft py-16 md:py-20 text-center">
                <div className="max-w-xl mx-auto px-6">
                    <div className="w-14 h-14 bg-brand-pale rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand">
                            <path d="M20 12V8H4v4M2 4h20v4H2zM12 4v16M7 12v8h10v-8" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Lista de Presentes</span>
                    <h1 className="text-4xl font-serif text-text-primary mt-2 mb-4">{eventSettings.coupleNames}</h1>
                    <p className="text-text-secondary font-serif italic text-base leading-relaxed mb-10">
                        "Ter você ao nosso lado já é o maior presente. Mas, se quiser nos presentear, preparamos esta lista com muito carinho."
                    </p>

                    {/* Links Externos / Lojas */}
                    {eventSettings.isGiftListEnabled && eventSettings.giftListLinks && eventSettings.giftListLinks.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {eventSettings.giftListLinks.map((link, i) => (
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-white border border-border-soft rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand hover:border-brand/30 hover:-translate-y-1 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" /></svg>
                                    {link.name || 'Loja Externa'}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid de presentes */}
            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand">Carregando presentes...</p>
                    </div>
                ) : gifts.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-16 h-16 bg-bg-light rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border-soft">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted"><path d="M20 12V8H4v4M2 4h20v4H2zM12 4v16" /></svg>
                        </div>
                        <p className="text-text-muted font-serif italic">A lista de presentes ainda não foi publicada.</p>
                        <Link href={`/${slug}`} className="mt-6 inline-block text-[10px] font-black uppercase tracking-widest text-brand hover:opacity-70">← Voltar ao Início</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {eventSettings.giftListInternalEnabled && gifts.map(gift => (
                            <div key={gift.id} onClick={() => setSelected(gift)}
                                className="group bg-surface rounded-[2rem] overflow-hidden border border-border-soft hover:shadow-xl hover:border-brand/30 hover:-translate-y-1.5 transition-all cursor-pointer">
                                {/* Imagem */}
                                <div className="aspect-square relative overflow-hidden bg-bg-light">
                                    {gift.image_url ? (
                                        <img src={gift.image_url} alt={gift.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-brand/15">
                                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <path d="M20 12V8H4v4M2 4h20v4H2zM12 4v16M7 12v8h10v-8" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="p-5">
                                    <h3 className="font-serif text-text-primary text-sm mb-1 line-clamp-2 leading-snug">{gift.name}</h3>
                                    {gift.description && <p className="text-[11px] text-text-muted mb-3 line-clamp-2 leading-relaxed">{gift.description}</p>}
                                    <div className="flex items-center justify-between pt-3 border-t border-border-soft">
                                        <span className="font-black text-brand text-sm">
                                            R$ {Number(gift.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <div className="w-8 h-8 bg-brand-pale rounded-xl flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer mínimo */}
            <footer className="py-8 text-center border-t border-border-soft">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-text-muted opacity-40">RSVP • Vanessa Bidinotti</p>
            </footer>

            {/* ── MODAL CHECKOUT ──────────────────────────────────────── */}
            {selected && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface rounded-[2rem] w-full max-w-md flex flex-col max-h-[90vh] border border-border-soft shadow-2xl overflow-hidden">
                        {/* Header do modal */}
                        <div className="p-6 bg-bg-light flex items-start gap-4 border-b border-border-soft">
                            <div className="w-16 h-16 rounded-xl bg-surface border border-border-soft overflow-hidden flex-shrink-0">
                                {selected.image_url
                                    ? <img src={selected.image_url} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-brand/25"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 12V8H4v4M2 4h20v4H2zM12 4v16" /></svg></div>
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-serif text-text-primary font-bold leading-snug line-clamp-2">{selected.name}</h3>
                                {giftSettings?.taxPayer === 'GUEST' ? (
                                    <div className="flex flex-col">
                                        <p className="text-brand font-black text-sm mt-1">
                                            R$ {(Number(selected.price) / (1 - 0.0499)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">
                                            Valor original: R$ {Number(selected.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + taxas
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-brand font-black text-sm mt-1">
                                        R$ {Number(selected.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setSelected(null)}
                                className="w-9 h-9 bg-surface border border-border-soft rounded-xl flex items-center justify-center text-text-muted hover:text-danger transition-colors flex-shrink-0">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Formulário */}
                        <div className="p-6 overflow-y-auto">
                            <form id="gift-checkout-form" onSubmit={handleCheckout} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 ml-1">Seu Nome *</label>
                                    <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo"
                                        className="w-full p-4 bg-bg-light border border-border-soft rounded-xl text-sm font-bold text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-text-muted" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 ml-1">E-mail (para recibo)</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                                        className="w-full p-4 bg-bg-light border border-border-soft rounded-xl text-sm font-bold text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-text-muted" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 ml-1">Mensagem (opcional)</label>
                                    <textarea value={message} onChange={e => setMessage(e.target.value)}
                                        placeholder="Deixe um recado carinhoso para os noivos..."
                                        className="w-full p-4 bg-bg-light border border-border-soft rounded-xl text-sm font-bold text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none h-24 placeholder:text-text-muted" />
                                </div>

                                {/* Segurança */}
                                <div className="flex items-center gap-3 text-xs font-bold bg-success-light text-success-dark border border-success/20 rounded-xl p-4">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                    Pagamento 100% seguro via Mercado Pago
                                </div>
                            </form>
                        </div>

                        {/* Ações */}
                        <div className="p-6 border-t border-border-soft bg-surface grid grid-cols-2 gap-3">
                            <button onClick={() => setSelected(null)}
                                className="py-4 border border-border-soft rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-bg-light transition-all">
                                Cancelar
                            </button>
                            <button type="submit" form="gift-checkout-form" disabled={submitting}
                                className="py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center shadow-md hover:bg-brand-dark active:scale-95 transition-all disabled:opacity-70">
                                {submitting
                                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : 'Presentear 🎁'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
