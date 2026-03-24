'use client'

import { useEvent } from '@/lib/event-context'
import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/date-utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'

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
    const { eventSettings, loading } = useEvent()
    const { loading: authLoading } = useAuth()
    const [slide, setSlide] = useState(0)
    const [navScrolled, setNavScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const sections = ['inicio', 'historia', 'galeria', 'local', 'presentes-link']
    const activeSection = useActiveSection(sections)
    const timeLeft = useCountdown(eventSettings.eventDate)
    const isCorrectEvent = eventSettings.slug === slug && slug !== 'dashboard'
    
    // Responsive state to avoid Server/Client mismatch for animations
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check(); window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])
    
    const isLoading = loading || authLoading

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

    const ceremonyMapsUrl = eventSettings.ceremonyWazeLocation ||
        (eventSettings.ceremonyLocation
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventSettings.ceremonyLocation)}`
            : null)

    const navItems = [
        { id: 'inicio', label: 'Início' },
        { id: 'historia', label: 'Nossa História' },
        ...(eventSettings.galleryImages && eventSettings.galleryImages.length > 0 ? [{ id: 'galeria', label: 'Galeria' }] : []),
        { id: 'local', label: 'Local' },
        ...(eventSettings.isGiftListEnabled ? [{ id: 'presentes-link', label: 'Presentes' }] : []),
    ]

    if (isLoading) return (
        <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
            >
                <div className="absolute inset-0 bg-brand/5 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-24 h-24 bg-white rounded-[2rem] shadow-xl border border-brand/5 flex items-center justify-center overflow-hidden mb-8 group mx-auto">
                    <img src="/logo_marsala.png" alt="Loading" className="w-20 h-20 object-contain drop-shadow-md" />
                    <motion.div 
                        className="absolute inset-0 border-2 border-brand/20 rounded-[2rem]"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </div>
                <div className="space-y-3">
                    <p className="text-text-primary text-xl tracking-tight font-serif italic mb-6">Carregando site...</p>
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">RSVP • Vanessa Bidinotti</p>
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-text-muted/60">Assessoria e Cerimonial</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )

    if (!isCorrectEvent) return (
        <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center">
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-xs space-y-8"
            >
                <div className="w-20 h-20 flex items-center justify-center mx-auto opacity-70">
                    <img src="/logo_marsala.png" alt="VB" className="w-20 h-20 object-contain" />
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-3xl font-serif text-text-primary">Ops!</h2>
                    <p className="text-sm text-text-muted leading-relaxed font-medium">
                        Parece que este convite ainda não existe ou o link está incorreto. 👋
                    </p>
                </div>

                <div className="w-full h-px bg-border-soft" />

                <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-text-muted">VB Assessoria</p>
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-text-muted/40 italic">Onde cada detalhe conta.</p>
                </div>
            </motion.div>
        </div>
    )

    return (
        <div className="min-h-screen bg-bg-light">

            {/* ── NAVBAR ─────────────────────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'bg-surface/95 backdrop-blur-md shadow-lg border-b border-border-soft' : 'bg-transparent'}`}>
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button onClick={() => scrollTo('inicio')} className={`font-serif text-lg transition-all duration-500 ${navScrolled ? 'text-text-primary' : 'text-brand opacity-0 sm:opacity-100'}`}>
                        {eventSettings.coupleNames}
                    </button>
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => scrollTo(item.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === item.id
                                    ? (navScrolled ? 'bg-brand text-white shadow-md' : 'bg-brand/10 text-brand shadow-sm')
                                    : (navScrolled ? 'text-text-muted hover:text-brand hover:bg-brand-pale' : 'text-text-muted hover:text-brand hover:bg-brand-pale')
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

            {/* ── HERO CAROUSEL ──────────────────────────── */}
            <section id="inicio" className="max-w-6xl mx-auto px-4 sm:px-8 pt-28 pb-12 relative">
                {/* Efeito decorativo de fundo sutil */}
                <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[120%] h-full bg-gradient-to-b from-brand-pale/20 via-transparent to-transparent blur-[120px] -z-10 opacity-30 pointer-events-none" />
                
                <div className="relative aspect-[16/10] sm:aspect-[21/9] rounded-[2.5rem] p-1.5 sm:p-2 bg-white/40 backdrop-blur-sm border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] group/hero transition-all duration-700 hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.25)]">
                    <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-black/5 ring-1 ring-inset ring-white/20">
                    {/* Slides */}
                    {slides.map((src, i) => (
                        <div key={i} className={`absolute inset-0 transition-opacity duration-1500 ${i === slide ? 'opacity-100' : 'opacity-0'}`}>
                            <motion.div 
                                className="relative w-full h-full"
                                animate={i === slide ? { scale: [1.02, 1.08] } : { scale: 1.02 }}
                                transition={{ duration: 15000, ease: "linear" }}
                            >
                                <Image 
                                    src={src} 
                                    fill 
                                    alt="" 
                                    className="object-cover"
                                    priority={i === 0}
                                />
                                {/* Gradiente de Leitura Sofisticado */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            </motion.div>
                        </div>
                    ))}
                    
                    {/* Conteúdo flutuante sobre o carrossel (Apenas Nomes agora) */}
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-end text-center text-white pb-8 sm:pb-10 px-6">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h1 
                                className="text-4xl sm:text-5xl md:text-7xl text-white tracking-tight leading-tight mx-auto font-serif italic"
                                style={{ 
                                    textShadow: '0 4px 15px rgba(0,0,0,0.6), 0 0 30px rgba(0,0,0,0.3)',
                                    marginBottom: '0.2em'
                                }}
                            >
                                {eventSettings.coupleNames}
                            </h1>
                        </motion.div>
                    </div>

                    {/* Controles de Navegação */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/10 hover:bg-brand backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white transition-all z-50 opacity-40 hover:opacity-100"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/10 hover:bg-brand backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white transition-all z-50 opacity-40 hover:opacity-100"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                    </button>

                    {/* Sem Dots (Bolinhas removidas a pedido do usuário) */}
                    </div>
                </div>
            </section>

            {/* ── INFO COMPLEMENTAR (Countdown, CTAs, Mensagem) ──────────────── */}
            <section className="bg-bg-light pb-20 relative">
                {/* Elemento de Data e Hora Flutuante logo abaixo do carrossel */}
                <div className="flex justify-center -translate-y-1/2 relative z-50 mb-10">
                    <div className="inline-flex items-center gap-3 bg-white border border-border-soft rounded-full px-6 py-3 shadow-xl animate-in fade-in slide-in-from-top-4 duration-700">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-text-primary">
                            {formatDate(eventSettings.eventDate, { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        {eventSettings.eventTime && <div className="w-px h-3 bg-border-soft" />}
                        {eventSettings.eventTime && (
                           <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-brand">
                              {eventSettings.eventTime}H
                           </span>
                        )}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
                    
                    {/* Mensagem e Bem-vindo */}
                    <div className="space-y-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="w-10 h-px bg-brand/30 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Bem-vindos</p>
                        <p className={`text-text-secondary leading-relaxed font-serif italic text-lg`}>
                            {eventSettings.customMessage && eventSettings.customMessage !== 'Ficamos muito felizes em receber a sua confirmação de presença.'
                                ? eventSettings.customMessage
                                : 'Ficamos muito felizes em compartilhar este momento tão especial com você. Sejam bem-vindos ao nosso site!'}
                        </p>
                    </div>

                    {/* Contadores (Cards Modernos) */}
                    <div className="flex flex-wrap justify-center gap-3 md:gap-4 animate-in fade-in duration-700 delay-200">
                        {[
                            { v: timeLeft.days, l: 'Dias' },
                            { v: timeLeft.hours, l: 'Horas' },
                            { v: timeLeft.minutes, l: 'Min' },
                            { v: timeLeft.seconds, l: 'Seg' },
                        ].map(({ v, l }) => (
                            <div key={l} className="bg-white border border-border-soft rounded-[1.5rem] px-5 py-4 text-center min-w-[75px] md:min-w-[90px] shadow-sm group hover:border-brand/20 transition-all hover:shadow-md">
                                <div className="text-2xl md:text-3xl font-serif text-brand leading-none">
                                    {String(v).padStart(2, '0')}
                                </div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-2">{l}</div>
                            </div>
                        ))}
                    </div>

                    {/* Botões de Local e RSVP */}
                    <div className="space-y-8 animate-in fade-in duration-700 delay-300">
                        <div className="flex flex-wrap justify-center gap-3">
                            {eventSettings.hasSeparateCeremony ? (
                                <>
                                    <button className="flex items-center gap-3 bg-surface border border-border-soft rounded-full px-6 py-3 text-[10px] font-black tracking-widest text-text-muted hover:bg-brand/5 hover:text-brand hover:border-brand/20 transition-all shadow-sm active:scale-95"
                                        onClick={() => scrollTo('local')}>
                                        🏰 CERIMÔNIA
                                    </button>
                                    <button className="flex items-center gap-3 bg-surface border border-border-soft rounded-full px-6 py-3 text-[10px] font-black tracking-widest text-text-muted hover:bg-brand/5 hover:text-brand hover:border-brand/20 transition-all shadow-sm active:scale-95"
                                        onClick={() => scrollTo('local')}>
                                        🥂 RECEPÇÃO
                                    </button>
                                </>
                            ) : eventSettings.eventLocation && (
                                <button className="flex items-center gap-3 bg-surface border border-border-soft rounded-full px-7 py-3 text-[10px] font-black tracking-widest text-text-muted hover:bg-brand/5 hover:text-brand hover:border-brand/20 transition-all shadow-sm active:scale-95"
                                    onClick={() => scrollTo('local')}>
                                    📍 {eventSettings.eventLocation.split(',')[0]}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href={`/${slug}/confirmar`}
                                className="px-7 py-3 bg-brand text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand/20 hover:-translate-y-1 active:scale-95 transition-all text-center">
                                Confirmar Presença
                            </Link>
                            {eventSettings.isGiftListEnabled && (
                                <Link href={`/${slug}/presentes`}
                                    className="px-10 py-4.5 bg-white border border-border-soft text-text-primary rounded-full font-black uppercase tracking-widest text-[11px] hover:bg-bg-light hover:-translate-y-1 shadow-sm transition-all text-center">
                                    Lista de Presentes
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div id="historia-anchor" />

            {/* ── NOSSA HISTÓRIA ─────────────────────────────────────── */}
            <section id="historia" className="py-24 md:py-32 bg-surface">
                <div className="max-w-2xl mx-auto px-6 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Nossa História</span>
                    <h2 className="text-4xl font-serif text-text-primary mt-3 mb-6">{eventSettings.coupleStoryTitle || 'Como Tudo Começou'}</h2>
                    <div className="w-16 h-px bg-brand/20 mx-auto mb-10" />
                    <p className={`text-text-secondary max-w-md mx-auto font-serif italic text-sm tracking-wide leading-relaxed`}>
                        {eventSettings.coupleStory ||
                            'O destino nos colocou no mesmo caminho e, desde então, cada dia ao lado um do outro é uma nova página da história mais bonita que já vivemos. Com alegria e gratidão, convidamos você para celebrar conosco este momento tão especial — a união de duas almas que escolheram caminhar juntas para sempre.'}
                    </p>

                    {/* Timeline */}
                    <div className="flex flex-col gap-6 text-left">
                        {(eventSettings.timelineEvents || [
                            { emoji: '💫', title: 'O primeiro encontro', description: 'O começo de tudo', image: '' },
                            { emoji: '💌', title: 'Nossa memória favorita', description: 'A decisão mais fácil das nossas vidas', image: '' },
                            { emoji: '💍', title: 'O pedido de casamento', description: 'Uma surpresa guardada no coração', image: '' },
                        ]).map((item: any, i: number) => (
                            <div key={i} className="flex items-start gap-5 group">
                                <div className="w-14 h-14 bg-brand-pale border border-brand/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                                    ) : item.emoji}
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

            {/* Sugestão de Traje - Reposicionado para fluir com a Linha do Tempo */}
            {eventSettings.dressCode && (
                <section className="bg-bg-light pt-20 pb-8">
                    <div className="max-w-xl mx-auto px-6">
                        <div className="bg-surface p-8 rounded-[2.5rem] border border-border-soft shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-12 h-12 bg-brand/5 border border-brand/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-brand">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 1.88v6.52a2 2 0 0 0 1.05 1.76l8 4.38a2 2 0 0 0 1.9 0l8-4.38a2 2 0 0 0 1.05-1.76V5.34a2 2 0 0 0-1.34-1.88Z" /><path d="M12 22V12" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Sugestão de Traje</p>
                                    <h4 className="text-text-primary font-bold text-lg">
                                        {eventSettings.dressCode}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

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
                        {eventSettings.hasSeparateCeremony ? (
                            <div className="flex flex-col">
                                {/* Parte 1: Cerimônia */}
                                <div className="p-8 md:p-10 bg-bg-light/30">
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-brand/20">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 10a2 2 0 1 0-4 0a2 2 0 1 0 4 0Z" /><path d="M12 10v4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m19.07 4.93-1.41 1.41" /><path d="m6.34 17.66-1.41 1.41" /></svg>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-brand">A Cerimônia</span>
                                                {eventSettings.eventTime && <span className="text-[10px] font-bold text-text-muted opacity-60">• {eventSettings.eventTime}h</span>}
                                            </div>
                                            <p className="text-text-primary font-bold leading-relaxed">{eventSettings.ceremonyLocation || 'Endereço da Cerimônia'}</p>
                                        </div>
                                        {ceremonyMapsUrl && (
                                            <a href={ceremonyMapsUrl} target="_blank" rel="noopener noreferrer"
                                                className="px-6 py-3 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all flex-shrink-0">
                                                COMO CHEGAR
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {eventSettings.ceremonyLocation && (
                                    <div className="aspect-video bg-bg-light overflow-hidden border-y border-border-soft/30">
                                        <iframe
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(eventSettings.ceremonyLocation)}&output=embed&z=16`}
                                            className="w-full h-full border-0" loading="lazy"
                                        />
                                    </div>
                                )}

                                {/* Parte 2: Recepção */}
                                <div className="p-8 md:p-10">
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <div className="w-14 h-14 bg-brand-pale rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-brand">{eventSettings.hasSeparateCeremony ? 'A Recepção' : 'Endereço'}</span>
                                                {(!eventSettings.hasSeparateCeremony && eventSettings.eventTime) && <span className="text-[10px] font-bold text-text-muted opacity-60">• {eventSettings.eventTime}h</span>}
                                            </div>
                                            <p className="text-text-primary font-bold leading-relaxed">{eventSettings.eventLocation || 'A confirmar'}</p>
                                        </div>
                                        {mapsUrl && (
                                            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-brand-dark hover:-translate-y-0.5 transition-all flex-shrink-0">
                                                COMO CHEGAR
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {eventSettings.eventLocation && (
                                    <div className="aspect-video bg-bg-light overflow-hidden border-t border-border-soft/30">
                                        <iframe
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(eventSettings.eventLocation)}&output=embed&z=16`}
                                            className="w-full h-full border-0" loading="lazy"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
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
                                            COMO CHEGAR
                                        </a>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Informações de Estacionamento Display */}
                        {eventSettings.parkingSettings?.hasParking && (
                            <div className="px-8 pb-12 md:px-10 border-t border-border-soft/50 pt-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Estacionamento</span>
                                <div className="mt-8 flex flex-col items-center">
                                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success mb-6">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                                    </div>
                                    
                                    <div className="max-w-md mx-auto">
                                        {/* Título do Estacionamento (Nome do Local ou Sugestão) */}
                                        <h4 className="text-text-primary font-serif italic text-xl mb-4">
                                            {eventSettings.parkingSettings.type === 'free' ? 'Gratuito no local para convidados' :
                                                eventSettings.parkingSettings.type === 'valet' ? 'Valet / Estacionamento no Local' :
                                                    'Estacionamentos Próximos (Sugestão)'}
                                        </h4>

                                        {eventSettings.parkingSettings.address && (
                                            <div className="mb-2">
                                                <div className="text-text-primary text-sm font-bold leading-relaxed px-4 whitespace-pre-line">
                                                    {(() => {
                                                        const addr = eventSettings.parkingSettings.address;
                                                        // Se já tiver quebra de linha, usa como está
                                                        if (addr.includes('\n')) return addr;
                                                        
                                                        // Se tiver o padrão "Nome - Rua", divide
                                                        const parts = addr.split(/ - (.*)/);
                                                        if (parts.length > 1) {
                                                            return (
                                                                <>
                                                                    <div className="mb-1">{parts[0]}</div>
                                                                    <div className="text-xs font-medium text-text-muted">{parts[1]}</div>
                                                                </>
                                                            );
                                                        }
                                                        return addr;
                                                    })()}
                                                </div>
                                            </div>
                                        )}

                                        {eventSettings.parkingSettings.price && (
                                            <p className="font-bold text-brand text-[10px] uppercase tracking-widest mb-6">
                                                Valor: {eventSettings.parkingSettings.price}
                                            </p>
                                        )}
                                        
                                        {(eventSettings.parkingSettings.wazeLocation || eventSettings.parkingSettings.address) && (
                                            <div className="pt-2">
                                                <a href={eventSettings.parkingSettings.wazeLocation || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventSettings.parkingSettings.address || '')}`} 
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-10 py-3.5 bg-brand text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-brand-dark hover:-translate-y-1 active:scale-95 transition-all">
                                                    COMO CHEGAR
                                                </a>
                                            </div>
                                        )}
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
                    <div className={`grid grid-cols-1 ${eventSettings.isGiftListEnabled ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-6`}>

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
                        {eventSettings.isGiftListEnabled && (
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
                    <div className="w-16 h-16 flex justify-center items-center drop-shadow-md">
                        <img src="/logo_branco.png" alt="VB Assessoria" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">RSVP • Vanessa Bidinotti</p>
                    <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/40">Assessoria e Cerimonial</p>
                </div>
            </footer>
        </div>
    )
}