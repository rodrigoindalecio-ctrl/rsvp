'use client'

import { useEvent, Guest, GuestCategory } from '@/lib/event-context'
import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/date-utils'

interface Props { slug: string }

export default function RSVPContent({ slug }: Props) {
    const { eventSettings, guests, updateGuest, ownerEmail } = useEvent()
    const [step, setStep] = useState<'idle' | 'search' | 'results' | 'group' | 'success'>('idle')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Guest[]>([])
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
    const [isMainConfirmed, setIsMainConfirmed] = useState(true)
    const [groupConf, setGroupConf] = useState<{ [k: number]: boolean }>({})
    const [guestEmail, setGuestEmail] = useState('')

    const isCorrectEvent = eventSettings.slug === slug

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchTerm.length < 3) return
        setSearchResults(guests.filter(g =>
            g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.grupo?.toLowerCase().includes(searchTerm.toLowerCase())
        ))
        setStep('results')
    }

    const handleSelectGuest = (guest: Guest) => {
        setSelectedGuest(guest)
        setIsMainConfirmed(true)
        setGuestEmail('')
        const init: { [k: number]: boolean } = {}
        guest.companionsList.forEach((_, i) => { init[i] = true })
        setGroupConf(init)
        setStep('group')
    }

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGuest) return
        setIsSubmitting(true)
        try {
            const updatedComps = selectedGuest.companionsList.map((c, i) => ({ ...c, isConfirmed: groupConf[i] || false }))
            await updateGuest(selectedGuest.id, {
                status: isMainConfirmed ? 'confirmed' : 'declined',
                email: guestEmail, companionsList: updatedComps, confirmedAt: new Date()
            })
            // Emails
            const confirmedNames: string[] = []
            if (isMainConfirmed) confirmedNames.push(selectedGuest.name)
            updatedComps.filter(c => c.isConfirmed).forEach(c => confirmedNames.push(c.name))
            const confirmedDetails: { name: string; category: GuestCategory }[] = []
            if (isMainConfirmed) confirmedDetails.push({ name: selectedGuest.name, category: selectedGuest.category })
            updatedComps.filter(c => c.isConfirmed).forEach(c => confirmedDetails.push({ name: c.name, category: c.category || 'adult_paying' }))

            if (confirmedNames.length > 0 && guestEmail) {
                fetch('/api/send-confirmation-email', {
                    method: 'POST', 
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: guestEmail, guestName: selectedGuest.name, eventSettings, confirmedCompanions: confirmedNames.length, confirmedNames, confirmedDetails, giftListLinks: eventSettings.giftListLinks || [] })
                }).catch(() => { })
            }
            if (eventSettings.notifyOwnerOnRSVP !== false) {
                fetch('/api/send-owner-notification', {
                    method: 'POST', 
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ownerEmail, guestName: selectedGuest.name, eventSettings, confirmedNames, status: isMainConfirmed ? 'confirmed' : 'declined' })
                }).catch(() => { })
            }
            setStep('success')
        } catch { alert('Erro ao confirmar. Tente novamente.') }
        finally { setIsSubmitting(false) }
    }

    if (!isCorrectEvent) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-text-secondary font-serif italic">Evento não encontrado.</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-bg-light flex flex-col">
            {/* Mini topo */}
            <div className="bg-surface/90 backdrop-blur-md border-b border-border-soft sticky top-0 z-20">
                <div className="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href={`/${slug}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand transition-colors group">
                        <svg className="group-hover:-translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Início
                    </Link>
                    <span className="font-serif text-text-primary text-sm">{eventSettings.coupleNames}</span>
                    <div className="w-16" />
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center py-12 px-6">
                <div className="w-full max-w-md">

                    {/* Header */}
                    {step !== 'success' && (
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-brand-pale rounded-3xl flex items-center justify-center mx-auto mb-5">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">RSVP</span>
                            <h1 className="text-3xl font-serif text-text-primary mt-2 mb-2">Confirmar Presença</h1>
                            {eventSettings.confirmationDeadline && (
                                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                                    Responda até <strong className="text-brand">
                                        {formatDate(eventSettings.confirmationDeadline, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </strong>
                                </p>
                            )}
                        </div>
                    )}

                    {/* SUCCESS */}
                    {step === 'success' && (
                        <div className="bg-surface rounded-[2.5rem] border border-border-soft p-10 text-center shadow-sm animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-success-light text-success-dark rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                            </div>
                            <h2 className="text-2xl font-serif text-text-primary mb-3">Presença Confirmada!</h2>
                            <p className="text-text-secondary text-sm leading-relaxed mb-8">
                                Que notícia incrível! Mal podemos esperar para celebrar com você. Um resumo foi enviado ao seu e-mail.
                            </p>
                            <div className="bg-bg-light rounded-2xl border border-border-soft p-5 text-left space-y-2 mb-8">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted text-center mb-3">Resumo</p>
                                <div className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border-soft">
                                    <span className="text-xs font-bold text-text-primary">{selectedGuest?.name}</span>
                                    <span className={`text-[10px] font-black uppercase ${isMainConfirmed ? 'text-success-dark' : 'text-text-muted'}`}>
                                        {isMainConfirmed ? '✓ Presente' : 'Ausente'}
                                    </span>
                                </div>
                                {selectedGuest?.companionsList.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border-soft">
                                        <span className="text-xs text-text-secondary">{c.name}</span>
                                        <span className={`text-[10px] font-black uppercase ${groupConf[i] ? 'text-success-dark' : 'text-text-muted'}`}>
                                            {groupConf[i] ? '✓ Confirmado' : 'Ausente'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <Link href={`/${slug}/presentes`}
                                    className="block w-full py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-md hover:bg-brand-dark transition-all">
                                    Ver Lista de Presentes 🎁
                                </Link>
                                <Link href={`/${slug}`} className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand transition-colors">
                                    Voltar ao Início
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* IDLE */}
                    {step === 'idle' && (
                        <div className="bg-surface rounded-[2.5rem] border border-border-soft p-8 shadow-sm text-center">
                            <p className="text-text-secondary text-sm font-serif italic mb-8 leading-relaxed">
                                {eventSettings.customMessage && eventSettings.customMessage !== 'Ficamos muito felizes em receber a sua confirmação de presença.'
                                    ? eventSettings.customMessage
                                    : 'Por favor, confirme sua presença para que possamos organizar tudo com muito carinho.'}
                            </p>
                            <button onClick={() => setStep('search')}
                                className="w-full py-5 bg-brand text-white rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-brand/30 hover:-translate-y-1 active:scale-95 transition-all">
                                Encontrar Meu Convite
                            </button>
                            <p className="mt-4 text-[10px] font-bold text-text-muted">Digite seu nome como consta no convite</p>
                        </div>
                    )}

                    {/* SEARCH / RESULTS */}
                    {(step === 'search' || step === 'results') && (
                        <div className="space-y-5 animate-in slide-in-from-bottom duration-500">
                            <form onSubmit={handleSearch}>
                                <div className="relative">
                                    <input required autoFocus type="text" value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="Seu nome completo..."
                                        className="w-full px-6 py-4 bg-surface border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none pr-14 shadow-sm placeholder:text-text-muted text-text-primary"
                                    />
                                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                    </button>
                                </div>
                            </form>

                            {step === 'results' && (
                                <div className="space-y-3 animate-in fade-in duration-300">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">
                                        {searchResults.length === 0 ? 'Nenhum convite encontrado' : `${searchResults.length} convite(s) encontrado(s)`}
                                    </p>
                                    {searchResults.length > 0 ? searchResults.map(guest => (
                                        <button key={guest.id} onClick={() => handleSelectGuest(guest)}
                                            className="w-full text-left p-5 bg-surface border border-border-soft rounded-[2rem] hover:border-brand hover:shadow-lg hover:shadow-brand/5 transition-all group">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-text-primary group-hover:text-brand transition-colors">{guest.name}</p>
                                                    {guest.grupo && <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">{guest.grupo}</p>}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-text-muted group-hover:bg-brand group-hover:text-white transition-all">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="p-8 bg-surface rounded-3xl border border-dashed border-border-soft text-center">
                                            <p className="text-sm text-text-muted italic mb-4">Não encontrou seu nome? Fale com os noivos.</p>
                                            <button onClick={() => { setSearchTerm(''); setStep('search') }} className="text-[10px] font-black uppercase tracking-widest text-brand">Tentar novamente</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* GROUP CONFIRMATION */}
                    {step === 'group' && (
                        <form onSubmit={handleConfirm} className="space-y-5 animate-in slide-in-from-right duration-500">
                            <div className="p-4 bg-brand-pale/30 border border-brand/10 rounded-2xl flex gap-3 items-start">
                                <div className="w-5 h-5 bg-brand text-white rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold">!</div>
                                <p className="text-[11px] text-text-primary leading-relaxed">
                                    <strong>Dica:</strong> Clique em qualquer nome para alternar entre presente/ausente.
                                </p>
                            </div>

                            {/* Main guest */}
                            <div onClick={() => setIsMainConfirmed(!isMainConfirmed)}
                                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${isMainConfirmed ? 'bg-brand-pale/50 border-brand' : 'bg-surface border-border-soft hover:border-brand/30'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isMainConfirmed ? 'bg-brand border-brand text-white' : 'border-border-soft'}`}>
                                        {isMainConfirmed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}
                                    </div>
                                    <span className={`text-sm font-bold ${isMainConfirmed ? 'text-text-primary' : 'text-text-muted'}`}>{selectedGuest?.name}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isMainConfirmed ? 'text-brand' : 'text-text-muted'}`}>{isMainConfirmed ? 'Eu Vou!' : 'Não Vou'}</span>
                            </div>

                            {/* Companions */}
                            {selectedGuest?.companionsList.map((comp, i) => (
                                <div key={i} onClick={() => setGroupConf({ ...groupConf, [i]: !groupConf[i] })}
                                    className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${groupConf[i] ? 'bg-brand-pale/50 border-brand' : 'bg-surface border-border-soft hover:border-brand/30'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${groupConf[i] ? 'bg-brand border-brand text-white' : 'border-border-soft'}`}>
                                            {groupConf[i] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}
                                        </div>
                                        <span className={`text-sm font-semibold ${groupConf[i] ? 'text-text-primary' : 'text-text-muted'}`}>{comp.name}</span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${groupConf[i] ? 'text-brand' : 'text-text-muted'}`}>{groupConf[i] ? 'Confirmado' : 'Ausente'}</span>
                                </div>
                            ))}

                            <div>
                                <label className="block text-[10px] font-black text-brand uppercase tracking-widest mb-3 ml-1">E-mail Obrigatório ●</label>
                                <input required type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="Seu melhor e-mail..."
                                    className="w-full px-6 py-4 bg-surface border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none shadow-sm placeholder:text-text-muted text-text-primary" />
                                <p className="text-[10px] text-text-muted font-medium mt-2 ml-1">Você receberá o resumo e informações do evento.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setStep('results')} className="px-6 py-4 bg-bg-light border border-border-soft rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-surface transition-all">
                                    Voltar
                                </button>
                                <button type="submit" disabled={isSubmitting}
                                    className="flex-1 py-4 bg-brand text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-brand-dark active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Finalizar Confirmação'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Footer mínimo */}
            <footer className="py-8 text-center border-t border-border-soft">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-text-muted opacity-40">RSVP • Vanessa Bidinotti</p>
            </footer>
        </div>
    )
}
