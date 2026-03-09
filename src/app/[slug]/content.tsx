'use client'

import { useEvent } from '@/lib/event-context'
import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/date-utils'

interface EventContentProps { slug: string }

// ─── Countdown ──────────────────────────────────────────────
function useCountdown(targetDate: string) {
    const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    useEffect(() => {
        const tick = () => {
            const diff = new Date(targetDate).getTime() - Date.now()
            if (diff > 0) setT({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff / 3600000) % 24),
                minutes: Math.floor((diff / 60000) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            })
        }
        tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
    }, [targetDate])
    return t
}

// ─── Active Section ──────────────────────────────────────────
function useActiveSection(ids: string[]) {
    const [active, setActive] = useState(ids[0])
    useEffect(() => {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
            { rootMargin: '-40% 0px -55% 0px' }
        )
        ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
        return () => obs.disconnect()
    }, [ids])
    return active
}

// ─── Carousel ────────────────────────────────────────────────
const FALLBACK_SLIDES = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=85',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&q=85',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&q=85',
]

export default function EventContent({ slug }: EventContentProps) {
    const { eventSettings } = useEvent()
    const [slide, setSlide] = useState(0)
    const [navScrolled, setNavScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const sections = ['inicio', 'historia', 'galeria', 'local', 'presentes-link']
    const activeSection = useActiveSection(sections)
    const timeLeft = useCountdown(eventSettings.eventDate)
    const isCorrectEvent = eventSettings.slug === slug

    const slides = eventSettings.carouselImages && eventSettings.carouselImages.length > 0
        ? eventSettings.carouselImages
        : [
            eventSettings.coverImage && eventSettings.coverImage !== 'https://...'
                ? eventSettings.coverImage : FALLBACK_SLIDES[0],
            FALLBACK_SLIDES[1],
            FALLBACK_SLIDES[2],
        ]

    const nextSlide = useCallback(() => setSlide(s => (s + 1) % slides.length), [slides.length])
    const prevSlide = useCallback(() => setSlide(s => (s - 1 + slides.length) % slides.length), [slides.length])

    // Auto-play carousel
    useEffect(() => {
        const id = setInterval(nextSlide, 5000)
        return () => clearInterval(id)
    }, [nextSlide])

    // Nav scroll effect
    useEffect(() => {
        const h = () => setNavScrolled(window.scrollY > 60)
        window.addEventListener('scroll', h)
        return () => window.removeEventListener('scroll', h)
    }, [])

    const scrollTo = (id: string) => {
        setMobileMenuOpen(false)
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const mapsUrl = eventSettings.wazeLocation ||
        (eventSettings.eventLocation
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventSettings.eventLocation)}`
            : null)

    const navItems = [
        { id: 'inicio', label: 'Início' },
        { id: 'historia', label: 'Nossa História' },
        ...(eventSettings.galleryImages && eventSettings.galleryImages.length > 0 ? [{ id: 'galeria', label: 'Galeria' }] : []),
        { id: 'local', label: 'Local' },
        ...(eventSettings.isGiftListEnabled !== false ? [{ id: 'presentes-link', label: 'Presentes' }] : []),
    ]

    if (!isCorrectEvent) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-text-secondary font-serif italic">Evento não encontrado.</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-bg-light">

            {/* ── NAVBAR ─────────────────────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'bg-surface/95 backdrop-blur-md shadow-lg border-b border-border-soft' : 'bg-transparent'}`}>
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button onClick={() => scrollTo('inicio')} className={`font-serif text-lg transition-all duration-500 ${navScrolled ? 'text-text-primary' : 'text-white/0'}`}>
                        {eventSettings.coupleNames}
                    </button>
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => scrollTo(item.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === item.id
                                    ? (navScrolled ? 'bg-brand text-white shadow-md' : 'bg-white/20 text-white backdrop-blur')
                                    : (navScrolled ? 'text-text-muted hover:text-brand hover:bg-brand-pale' : 'text-white/70 hover:text-white hover:bg-white/10')
                                    }`}>
                                {item.label}
                            </button>
                        ))}
                        <Link href={`/${slug}/confirmar`}
                            className="ml-3 px-5 py-2.5 bg-brand text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-brand-dark hover:-translate-y-0.5 transition-all">
                            Confirmar Presença
                        </Link>
                    </div>
                    {/* Mobile hamburger */}
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`md:hidden w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${navScrolled ? 'bg-bg-light border border-border-soft' : 'bg-white/20 backdrop-blur'}`}>
                        <span className={`w-5 h-0.5 transition-all ${navScrolled ? 'bg-text-primary' : 'bg-white'} ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`w-5 h-0.5 transition-all ${navScrolled ? 'bg-text-primary' : 'bg-white'} ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                        <span className={`w-5 h-0.5 transition-all ${navScrolled ? 'bg-text-primary' : 'bg-white'} ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </button>
                </div>
                {mobileMenuOpen && (
                    <div className="md:hidden bg-surface/98 backdrop-blur-md border-b border-border-soft p-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => scrollTo(item.id)}
                                className={`text-left px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === item.id ? 'bg-brand text-white' : 'text-text-muted hover:bg-bg-light hover:text-brand'}`}>
                                {item.label}
                            </button>
                        ))}
                        <Link href={`/${slug}/confirmar`} className="px-5 py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center mt-1">
                            Confirmar Presença
                        </Link>
                    </div>
                )}
            </nav>

            {/* ── HERO CAROUSEL + COUNTDOWN ──────────────────────────── */}
            <section id="inicio" className="relative h-[85vh] md:h-screen min-h-[500px] md:min-h-[600px] overflow-hidden">
                {/* Slides */}
                {slides.map((src, i) => (
                    <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? 'opacity-100' : 'opacity-0'}`}>
                        <Image src={src} alt={`Slide ${i + 1}`} fill priority={i === 0}
                            className="object-cover"
                            style={{ objectPosition: i === 0 ? `50% ${eventSettings.coverImagePosition || 50}%` : '50% 50%' }}
                        />
                    </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/75" />

                {/* Conteúdo centralizado */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6 max-w-3xl mx-auto">
                    <h1
                        className="text-5xl md:text-7xl font-serif leading-tight mb-2 text-white animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200"
                        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)' }}>
                        {eventSettings.coupleNames}
                    </h1>
                    <p
                        className="text-[10px] md:text-xs text-white/90 font-black uppercase tracking-[0.5em] mb-8 animate-in fade-in duration-700 delay-300"
                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                        {eventSettings.customMessage && eventSettings.customMessage !== 'Ficamos muito felizes em receber a sua confirmação de presença.'
                            ? eventSettings.customMessage
                            : 'Bem-vindos ao nosso site de casamento'}
                    </p>
                    <div className="w-12 h-px bg-white/30 mx-auto mb-10 animate-in fade-in duration-700 delay-400" />

                    {/* Countdown em cards de vidro */}
                    <div className="flex justify-center gap-3 md:gap-4 mb-10 animate-in fade-in duration-700 delay-500">
                        {[
                            { v: timeLeft.days, l: 'Dias' },
                            { v: timeLeft.hours, l: 'Horas' },
                            { v: timeLeft.minutes, l: 'Min' },
                            { v: timeLeft.seconds, l: 'Seg' },
                        ].map(({ v, l }) => (
                            <div key={l} className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 md:px-5 md:py-4 text-center min-w-[60px] md:min-w-[72px]">
                                <div className="text-2xl md:text-4xl font-black tabular-nums text-white leading-none">
                                    {String(v).padStart(2, '0')}
                                </div>
                                <div className="text-[8px] font-black uppercase tracking-[0.25em] text-white/70 mt-1.5">{l}</div>
                            </div>
                        ))}
                    </div>

                    {/* Data badge */}
                    <div className="flex flex-wrap justify-center gap-3 mb-10 animate-in fade-in duration-700 delay-600">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 text-xs font-black tracking-wider"
                            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                            📅 {formatDate(eventSettings.eventDate, { day: '2-digit', month: 'long', year: 'numeric' })}
                            {eventSettings.eventTime && ` • ${eventSettings.eventTime}h`}
                        </div>
                        {eventSettings.eventLocation && (
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 text-xs font-black tracking-wider"
                                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                                📍 {eventSettings.eventLocation.split(',')[0]}
                            </div>
                        )}
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in duration-700 delay-700">
                        <Link href={`/${slug}/confirmar`}
                            className="px-8 py-4 bg-brand text-white rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-brand/40 hover:-translate-y-1 active:scale-95 transition-all">
                            Confirmar Presença
                        </Link>
                        {eventSettings.isGiftListEnabled !== false && (
                            <Link href={`/${slug}/presentes`}
                                className="px-8 py-4 bg-white/15 backdrop-blur border border-white/30 text-white rounded-full font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white/25 hover:-translate-y-1 transition-all">
                                Lista de Presentes
                            </Link>
                        )}
                    </div>
                </div>

                {/* Carousel controls */}
                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur border border-white/20 rounded-full flex items-center justify-center text-white transition-all z-10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur border border-white/20 rounded-full flex items-center justify-center text-white transition-all z-10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                </button>

                {/* Dots */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {slides.map((_, i) => (
                        <button key={i} onClick={() => setSlide(i)}
                            className={`transition-all rounded-full ${i === slide ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
                        />
                    ))}
                </div>
            </section>

            {/* ── NOSSA HISTÓRIA ─────────────────────────────────────── */}
            <section id="historia" className="py-24 md:py-32 bg-surface">
                <div className="max-w-2xl mx-auto px-6 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Nossa História</span>
                    <h2 className="text-4xl font-serif text-text-primary mt-3 mb-6">Como Tudo Começou</h2>
                    <div className="w-16 h-px bg-brand/20 mx-auto mb-10" />
                    <p className={`text-text-secondary leading-relaxed ${eventSettings.brandFont === 'great-vibes' ? 'font-sans font-medium' : 'font-serif italic'} text-lg mb-16 whitespace-pre-line`}>
                        {eventSettings.coupleStory ||
                            'O destino nos colocou no mesmo caminho e, desde então, cada dia ao lado um do outro é uma nova página da história mais bonita que já vivemos. Com alegria e gratidão, convidamos você para celebrar conosco este momento tão especial — a união de duas almas que escolheram caminhar juntas para sempre.'}
                    </p>

                    {/* Timeline */}
                    <div className="flex flex-col gap-6 text-left">
                        {(eventSettings.timelineEvents || [
                            { emoji: '💫', title: 'O primeiro encontro', description: 'O começo de tudo' },
                            { emoji: '💌', title: 'Nossa memória favorita', description: 'A decisão mais fácil das nossas vidas' },
                            { emoji: '💍', title: 'O pedido de casamento', description: 'Uma surpresa guardada no coração' },
                        ]).map((item, i) => (
                            <div key={i} className="flex items-start gap-5 group">
                                <div className="w-12 h-12 bg-brand-pale border border-brand/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                    {item.emoji}
                                </div>
                                <div className="pt-2 border-b border-border-soft pb-6 flex-1">
                                    <h3 className="font-black text-text-primary text-sm uppercase tracking-wider">{item.title}</h3>
                                    <p className="text-text-muted text-sm mt-1">{item.description}</p>
                                </div>
                            </div>
                        ))}
                        <div className="flex items-start gap-5 group">
                            <div className="w-12 h-12 bg-brand-pale border border-brand/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                🎊
                            </div>
                            <div className="pt-2 border-b border-border-soft pb-6 flex-1">
                                <h3 className="font-black text-text-primary text-sm uppercase tracking-wider">Nosso Grande Dia</h3>
                                <p className="text-text-muted text-sm mt-1">{formatDate(eventSettings.eventDate, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── GALERIA DE FOTOS ──────────────────────────────────────── */}
            {eventSettings.galleryImages && eventSettings.galleryImages.length > 0 && (
                <section id="galeria" className="py-24 md:py-32 bg-bg-light">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Galeria</span>
                            <h2 className="text-4xl font-serif text-text-primary mt-3">Alguns Momentos</h2>
                            <div className="w-16 h-px bg-brand/20 mx-auto mt-6" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {eventSettings.galleryImages.map((src, i) => (
                                <div key={i} className={`relative aspect-[3/4] rounded-3xl overflow-hidden shadow-sm group hover:-translate-y-2 transition-all duration-500 ${i % 3 === 0 ? 'md:col-span-1 md:row-span-1' : ''}`}>
                                    <Image
                                        src={src}
                                        alt={`Galeria ${i + 1}`}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── LOCAL ──────────────────────────────────────────────── */}
            <section id="local" className="py-24 md:py-32 bg-bg-light">
                <div className="max-w-2xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Onde Será</span>
                        <h2 className="text-4xl font-serif text-text-primary mt-3">Local do Evento</h2>
                        <div className="w-16 h-px bg-brand/20 mx-auto mt-6" />
                    </div>
                    <div className="bg-surface rounded-[2.5rem] border border-border-soft shadow-sm overflow-hidden">
                        {eventSettings.eventLocation && (
                            <div className="aspect-video bg-bg-light overflow-hidden">
                                <iframe
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(eventSettings.eventLocation)}&output=embed&z=16`}
                                    className="w-full h-full border-0" loading="lazy"
                                />
                            </div>
                        )}
                        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-14 h-14 bg-brand-pale rounded-2xl flex items-center justify-center flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Endereço</p>
                                <p className="text-text-primary font-bold leading-relaxed">{eventSettings.eventLocation || 'A confirmar'}</p>
                                {eventSettings.eventTime && <p className="text-text-muted text-sm mt-2 font-bold">🕐 {eventSettings.eventTime}h</p>}
                            </div>
                            {mapsUrl && (
                                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-brand-dark hover:-translate-y-0.5 transition-all flex-shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                    Abrir no Maps
                                </a>
                            )}
                        </div>

                        {/* Informações de Estacionamento Display */}
                        {eventSettings.parkingSettings?.hasParking && (
                            <div className="px-8 pb-10 md:px-10 border-t border-border-soft/50 pt-8 animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                    <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-success">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Estacionamento</p>
                                        <p className="text-text-primary font-bold text-sm">
                                            {eventSettings.parkingSettings.type === 'free' ? 'Gratuito no local para convidados' :
                                                eventSettings.parkingSettings.type === 'valet' ? 'Serviço de Valet / Manobrista disponível' :
                                                    'Estacionamento pago no local'}
                                            {eventSettings.parkingSettings.price && ` (${eventSettings.parkingSettings.price})`}
                                        </p>
                                        {eventSettings.parkingSettings.address && (
                                            <p className="text-text-muted text-xs mt-2 italic">📍 Endereço: {eventSettings.parkingSettings.address}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sugestão de Traje Display */}
                        {eventSettings.dressCode && (
                            <div className="px-8 pb-10 md:px-10 border-t border-border-soft/50 pt-8 animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                    <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-brand">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 1.88v6.52a2 2 0 0 0 1.05 1.76l8 4.38a2 2 0 0 0 1.9 0l8-4.38a2 2 0 0 0 1.05-1.76V5.34a2 2 0 0 0-1.34-1.88Z" /><path d="M12 22V12" /></svg>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Sugestão de Traje</p>
                                        <p className="text-text-primary font-bold text-sm">
                                            {eventSettings.dressCode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── CTA CARDS — RSVP + PRESENTES ──────────────────────── */}
            <section id="presentes-link" className="py-24 md:py-32 bg-surface">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Próximos Passos</span>
                        <h2 className="text-4xl font-serif text-text-primary mt-3">Como posso participar?</h2>
                        <div className="w-16 h-px bg-brand/20 mx-auto mt-6" />
                    </div>
                    <div className={`grid grid-cols-1 ${eventSettings.isGiftListEnabled !== false ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-6`}>

                        {/* RSVP Card */}
                        <Link href={`/${slug}/confirmar`}
                            className="group block bg-brand rounded-[2.5rem] p-10 text-white overflow-hidden relative shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300" style={{ color: 'white' }}>
                            <div className="absolute top-0 right-0 p-8 text-white/10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                                <h3 className="text-2xl font-serif text-white mb-3">Confirmar Presença</h3>
                                <p className="text-white/80 text-sm leading-relaxed mb-8">
                                    Sua presença faz toda a diferença para nós. Confirme até{' '}
                                    {eventSettings.confirmationDeadline
                                        ? formatDate(eventSettings.confirmationDeadline, { day: '2-digit', month: 'long' })
                                        : 'a data limite'}.
                                </p>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white group-hover:gap-4 transition-all">
                                    Confirmar Agora
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </Link>

                        {/* Presentes Card */}
                        {eventSettings.isGiftListEnabled !== false && (
                            <Link href={`/${slug}/presentes`}
                                className="group block bg-surface border border-border-soft rounded-[2.5rem] p-10 overflow-hidden relative shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-brand/30 transition-all duration-300">
                                <div className="absolute top-0 right-0 p-8 text-brand/10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20 12V8H4v4M2 4h20v4H2zM12 4v16M7 12v8h10v-8" /></svg>
                                </div>
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-brand-pale rounded-2xl flex items-center justify-center mb-6">
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand"><path d="M20 12V8H4v4M2 4h20v4H2zM12 4v16M7 12v8h10v-8" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-serif text-text-primary mb-3">Lista de Presentes</h3>
                                    <p className="text-text-muted text-sm leading-relaxed mb-8">
                                        "Ter você ao nosso lado já é um presente. Mas, se quiser nos presentear, preparamos esta lista com muito carinho."
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand group-hover:gap-4 transition-all">
                                        Ver Presentes
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────────────────────── */}
            <footer className="py-16 bg-brand-dark text-center">
                <div className="flex flex-col items-center gap-4 opacity-50 hover:opacity-100 transition-all duration-700">
                    <div className="w-10 h-10 rounded-xl overflow-hidden grayscale brightness-200 border border-white/10">
                        <img src="/Logo-03.jpg" alt="VB Assessoria" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">RSVP • Vanessa Bidinotti</p>
                    <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/40">Assessoria e Cerimonial</p>
                </div>
            </footer>
        </div>
    )
}