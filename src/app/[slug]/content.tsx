'use client'

import { useEvent, Guest, GuestCategory } from '@/lib/event-context'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { formatDate } from '@/lib/date-utils'

interface EventContentProps {
    slug: string
}

export default function EventContent({ slug }: EventContentProps) {
    const { eventSettings, guests, updateGuest } = useEvent()
    const [step, setStep] = useState<'landing' | 'search' | 'results' | 'group' | 'success'>('landing')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Search & Selection state
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Guest[]>([])
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

    // Confirmation state (for the group)
    const [isMainGuestConfirmed, setIsMainGuestConfirmed] = useState(true)
    const [groupConfirmations, setGroupConfirmations] = useState<{ [key: number]: boolean }>({})
    const [guestEmail, setGuestEmail] = useState('')

    // Validate if this is the correct event
    const isCorrectEvent = eventSettings.slug === slug

    if (!isCorrectEvent) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-serif mb-2 text-text-primary">Evento não encontrado</h1>
                    <p className="text-text-secondary">O link que você acessou pode estar incorreto.</p>
                </div>
            </div>
        )
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchTerm.length < 3) return

        const results = guests.filter(g =>
            g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.grupo?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setSearchResults(results)
        setStep('results')
    }

    const handleSelectGuest = (guest: Guest) => {
        setSelectedGuest(guest)
        setIsMainGuestConfirmed(guest.status === 'confirmed')
        setGuestEmail('')

        // Initialize companions confirmations
        const initialComps: { [key: number]: boolean } = {}
        guest.companionsList.forEach((comp, idx) => {
            initialComps[idx] = comp.isConfirmed
        })
        setGroupConfirmations(initialComps)
        setStep('group')
    }

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGuest) return

        setIsSubmitting(true)
        try {
            const updatedCompanions = selectedGuest.companionsList.map((comp, idx) => ({
                ...comp,
                isConfirmed: groupConfirmations[idx] || false
            }))

            await updateGuest(selectedGuest.id, {
                status: isMainGuestConfirmed ? 'confirmed' : 'declined',
                email: guestEmail,
                companionsList: updatedCompanions,
                confirmedAt: new Date()
            })

            // Disparar o envio de email de confirmação
            if (isMainGuestConfirmed || updatedCompanions.some(c => c.isConfirmed)) {
                try {
                    const confirmedComps = updatedCompanions.filter(c => c.isConfirmed)
                    const confirmedNames = []
                    if (isMainGuestConfirmed) confirmedNames.push(selectedGuest.name)
                    confirmedComps.forEach(c => confirmedNames.push(c.name))

                    const confirmedDetails = []
                    if (isMainGuestConfirmed) confirmedDetails.push({ name: selectedGuest.name, category: selectedGuest.category })
                    confirmedComps.forEach(c => confirmedDetails.push({ name: c.name, category: c.category }))

                    await fetch('/api/send-confirmation-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: guestEmail,
                            guestName: selectedGuest.name,
                            eventSettings: eventSettings,
                            confirmedCompanions: confirmedNames.length,
                            confirmedNames: confirmedNames,
                            confirmedDetails: confirmedDetails,
                            giftListLinks: eventSettings.giftListLinks || []
                        })
                    })
                } catch (emailError) {
                    console.error('Erro ao disparar email:', emailError)
                }
            }

            setStep('success')
        } catch (error) {
            alert('Erro ao confirmar presença. Tente novamente.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (step === 'success') {
        return (
            <div className="max-w-xl mx-auto py-20 px-6 text-center animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-success-light text-success-dark rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <h1 className="text-3xl font-serif mb-4 text-text-primary">Confirmado!</h1>
                <p className="text-text-secondary mb-10 leading-relaxed text-sm">
                    Sua resposta foi salva com sucesso. <br />
                    Mal podemos esperar para celebrar este momento com você!
                </p>
                <div className="p-6 bg-bg-light rounded-3xl border border-border-soft text-left mb-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 text-center">Resumo</p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border-soft">
                            <span className="text-xs font-bold text-text-primary">{selectedGuest?.name}</span>
                            <span className={`text-[10px] font-black uppercase ${isMainGuestConfirmed ? 'text-success-dark' : 'text-text-muted'}`}>
                                {isMainGuestConfirmed ? 'Presença Confirmada' : 'Não Comparecerá'}
                            </span>
                        </div>
                        {selectedGuest?.companionsList.map((comp, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border-soft opacity-80">
                                <span className="text-xs font-medium text-text-secondary">{comp.name}</span>
                                <span className={`text-[10px] font-black uppercase ${groupConfirmations[idx] ? 'text-success-dark' : 'text-text-muted'}`}>
                                    {groupConfirmations[idx] ? 'Confirmado' : 'Ausente'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => {
                        setStep('landing')
                        setSearchTerm('')
                    }}
                    className="text-brand font-black text-[10px] uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                    Voltar para o Início
                </button>
            </div>
        )
    }

    if (step === 'search' || step === 'results') {
        return (
            <div className="max-w-xl mx-auto py-12 px-6 animate-in slide-in-from-bottom duration-700">
                <button
                    onClick={() => setStep('landing')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand mb-8 transition-colors group"
                >
                    <svg className="group-hover:-translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Voltar
                </button>

                <div className="mb-10">
                    <h2 className="text-3xl font-serif text-text-primary mb-2">Localizar Convite</h2>
                    <p className="text-text-secondary text-sm">Digite seu nome conforme escrito no convite para encontrar sua reserva.</p>
                </div>

                <form onSubmit={handleSearch} className="space-y-6">
                    <div className="relative">
                        <input
                            required
                            autoFocus
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Seu nome completo..."
                            className="w-full px-6 py-4 bg-surface border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none pr-14 shadow-sm placeholder:text-text-muted text-text-primary"
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand/20"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        </button>
                    </div>
                </form>

                {step === 'results' && (
                    <div className="mt-12 space-y-4 animate-in fade-in duration-500">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">
                            {searchResults.length === 0 ? 'Nenhum convite encontrado' : `${searchResults.length} Convite(s) Encontrado(s)`}
                        </p>

                        {searchResults.length > 0 ? (
                            <div className="space-y-3">
                                {searchResults.map((guest) => (
                                    <button
                                        key={guest.id}
                                        onClick={() => handleSelectGuest(guest)}
                                        className="w-full text-left p-6 bg-surface border border-border-soft rounded-[2rem] hover:border-brand hover:shadow-xl hover:shadow-brand/5 transition-all group relative overflow-hidden"
                                    >
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <p className="text-base font-serif text-text-primary group-hover:text-brand transition-colors">{guest.name}</p>
                                                {guest.grupo && <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">{guest.grupo}</p>}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-text-muted group-hover:bg-brand group-hover:text-white transition-all">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 bg-bg-light rounded-3xl border border-dashed border-border-soft text-center">
                                <p className="text-sm text-text-muted mb-4 italic">Não encontrou seu nome? Verifique se digitou corretamente ou entre em contato com os noivos.</p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-[10px] font-black uppercase tracking-widest text-brand"
                                >
                                    Tentar outro nome
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    if (step === 'group') {
        return (
            <div className="max-w-xl mx-auto py-12 px-6 animate-in slide-in-from-right duration-700">
                <button
                    onClick={() => setStep('results')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand mb-8 transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Voltar
                </button>

                <div className="mb-10">
                    <h2 className="text-3xl font-serif text-text-primary mb-2">Quem irá comparecer?</h2>
                    <p className="text-text-secondary text-sm">Selecione quem do seu grupo poderá prestigiar este momento.</p>
                </div>

                <form onSubmit={handleConfirm} className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Confirmar Presença</label>

                        {/* Convidado Principal */}
                        <div
                            onClick={() => setIsMainGuestConfirmed(!isMainGuestConfirmed)}
                            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${isMainGuestConfirmed ? 'bg-brand-pale/50 border-brand' : 'bg-surface border-border-soft hover:border-brand-light/30'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isMainGuestConfirmed ? 'bg-brand border-brand text-white' : 'border-border-soft'}`}>
                                    {isMainGuestConfirmed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                                </div>
                                <span className={`text-sm font-bold ${isMainGuestConfirmed ? 'text-text-primary' : 'text-text-muted'}`}>{selectedGuest?.name}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isMainGuestConfirmed ? 'text-brand' : 'text-text-muted'}`}>
                                {isMainGuestConfirmed ? 'Eu Vou!' : 'Não Vou'}
                            </span>
                        </div>

                        {/* Acompanhantes */}
                        {selectedGuest?.companionsList.map((comp, idx) => (
                            <div
                                key={idx}
                                onClick={() => setGroupConfirmations({ ...groupConfirmations, [idx]: !groupConfirmations[idx] })}
                                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${groupConfirmations[idx] ? 'bg-brand-pale/50 border-brand' : 'bg-surface border-border-soft hover:border-brand-light/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${groupConfirmations[idx] ? 'bg-brand border-brand text-white' : 'border-border-soft'}`}>
                                        {groupConfirmations[idx] && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                                    </div>
                                    <span className={`text-sm font-semibold ${groupConfirmations[idx] ? 'text-text-primary' : 'text-text-muted'}`}>{comp.name}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${groupConfirmations[idx] ? 'text-brand' : 'text-text-muted'}`}>
                                    {groupConfirmations[idx] ? 'Confirmado' : 'Ausente'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand ml-1 flex items-center gap-1">
                            E-mail Obrigatório
                            <span className="w-1 h-1 bg-brand rounded-full animate-pulse"></span>
                        </label>
                        <input
                            required
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder="Seu melhor e-mail..."
                            className="w-full px-6 py-4 bg-surface border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none shadow-sm placeholder:text-text-muted text-text-primary"
                        />
                        <p className="text-[10px] text-text-muted font-medium ml-1">
                            * Você receberá o resumo da confirmação, local e informações do evento neste e-mail.
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={isSubmitting}
                            className="w-full py-5 bg-brand text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Finalizar Confirmação'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#faf8f6] py-12 px-6 md:py-24">
            <div className="max-w-2xl mx-auto space-y-10">

                {/* ── CARD 1: BANNER HERO (Estilo Página Noivos) ──────────────── */}
                <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white animate-in fade-in slide-in-from-top-12 duration-1000">
                    <Image
                        src={eventSettings.coverImage && eventSettings.coverImage !== 'https://...' ? eventSettings.coverImage : 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop'}
                        alt="Event Cover"
                        fill
                        priority
                        className="object-cover transition-all duration-300"
                        style={{
                            objectPosition: `50% ${eventSettings.coverImagePosition || 50}%`,
                            transform: `scale(${eventSettings.coverImageScale || 1})`
                        }}
                    />
                    {/* Overlay Gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8 md:p-12" />

                    {/* Informações sobre a foto */}
                    <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 space-y-4 text-white">
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                            {/* Data */}
                            <div className="flex items-center gap-3 drop-shadow-lg">
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                </div>
                                <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em]">
                                    {formatDate(eventSettings.eventDate, { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            {/* Local */}
                            <div className="flex items-center gap-3 drop-shadow-lg">
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                </div>
                                <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] truncate max-w-[250px]">
                                    {eventSettings.eventLocation?.split(',')[0]}
                                </span>
                            </div>
                        </div>
                    </div>


                </div>

                {/* ── CARD 2: O CONVITE ────────────────────────────────────────── */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-border-soft p-10 md:p-16 text-center space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">

                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-brand-pale/50 rounded-3xl flex items-center justify-center text-brand animate-bounce duration-[3s]">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-4xl md:text-6xl font-serif text-text-primary leading-tight lowercase">
                            {eventSettings.coupleNames}
                        </h1>
                        <div className="w-16 h-px bg-brand/10 mx-auto" />
                        <p className="font-serif text-xl md:text-2xl text-text-secondary leading-relaxed italic max-w-lg mx-auto opacity-70">
                            {eventSettings.customMessage || "Nossa história ganha um novo capítulo e ficaremos imensamente felizes em tê-lo ao nosso lado."}
                        </p>
                    </div>

                    <div className="pt-6 space-y-6">
                        <button
                            onClick={() => setStep('search')}
                            className="w-full max-w-sm py-6 bg-brand text-white rounded-full font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-brand/20 hover:scale-[1.03] active:scale-95 transition-all duration-300"
                        >
                            Confirmar Minha Presença
                        </button>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                            {eventSettings.confirmationDeadline ? (
                                <>Por favor, responda até <strong className="text-text-primary">{formatDate(eventSettings.confirmationDeadline, { day: '2-digit', month: '2-digit' })}</strong></>
                            ) : 'Confirmação antecipada é apreciada'}
                        </p>
                    </div>
                </div>

                {/* ── SEÇÃO DE PRESENTES (SE HOUVER) ───────────────────────── */}
                {(eventSettings.giftList || (eventSettings.giftListLinks && eventSettings.giftListLinks.length > 0)) && (
                    <div className="pt-6 text-center space-y-8">
                        <h2 className="text-2xl font-serif text-text-secondary lowercase">Presentes</h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            {eventSettings.giftListLinks?.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-4 bg-white border border-brand/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-primary shadow-sm hover:shadow-xl hover:shadow-brand/10 hover:border-brand hover:-translate-y-1 transition-all duration-300"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── BOTÕES AUXILIARES (GPS) ─────────────────────────────── */}
                {eventSettings.wazeLocation && (
                    <div className="flex justify-center pt-8">
                        <a
                            href={eventSettings.wazeLocation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-6 py-3 bg-bg-light border border-border-soft rounded-full text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-brand transition-all"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            Ver Mapa do Local
                        </a>
                    </div>
                )}

                <footer className="py-24 text-center space-y-6">
                    <div className="flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-700">
                        <div className="w-12 h-12 rounded-xl overflow-hidden grayscale brightness-110 border border-brand/10">
                            <img src="/Logo-03.jpg" alt="Logo Vanessa Bidinotti" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand">RSVP • Vanessa Bidinotti</p>
                            <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-text-muted">Assessoria e Cerimonial</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}