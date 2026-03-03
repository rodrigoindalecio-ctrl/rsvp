'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent } from '@/lib/event-context'
import { useRouter, usePathname } from 'next/navigation'
import React, { useState, useContext } from 'react'

// ── SVG Outline Icons ──────────────────────────────────────────
const IconHome = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
)
const IconUpload = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
)
const IconSettings = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
)
const IconBarChart = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
)
const IconUsers = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
)
const IconCalendarPlus = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="12" y1="14" x2="12" y2="18" />
        <line x1="10" y1="16" x2="14" y2="16" />
    </svg>
)
const IconLogOut = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
)

interface LinkItem {
    href: string
    label: string
    icon: React.ReactNode
}

interface SharedLayoutProps {
    children: React.ReactNode
    title?: string | React.ReactNode
    subtitle?: string | React.ReactNode
    headerActions?: React.ReactNode
    role: 'admin' | 'user'
}

export function SharedLayout({
    children,
    title,
    subtitle,
    headerActions,
    role
}: SharedLayoutProps) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Tentar pegar os nomes do casal do contexto de evento (para o avatar)
    let eventContext: any = null
    try {
        eventContext = useEvent()
    } catch (e) {
        // useEvent pode falhar se estiver fora do provider
    }

    if (!user) return null

    // Iniciais personalizadas para o Avatar (ex: Isabella e Felipe -> I&F)
    const getInitials = (name: string) => {
        if (!name) return '?'
        // Limpar prefixos comuns para eventos
        const cleanName = name.replace(/^(?:Casamento|Debutante|15 Anos|Evento|Festa)\s+/i, '').trim()
        const parts = cleanName.split(/\s+(?:e|&|E|&)\s+/i)
        if (parts.length >= 2) {
            return `${parts[0].trim().charAt(0)}&${parts[1].trim().charAt(0)}`.toUpperCase()
        }
        return cleanName.charAt(0).toUpperCase()
    }

    // Se for um usuário (noivos) e tivermos nomes do casal no evento, priorizamos isso
    const sourceName = (role === 'user' && eventContext?.eventSettings?.coupleNames && eventContext.eventSettings.coupleNames !== 'Nome do Casal')
        ? eventContext.eventSettings.coupleNames
        : user.name

    const initials = getInitials(sourceName)

    const adminLinks: LinkItem[] = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: <IconBarChart /> },
        { href: '/admin/users', label: 'Usuários', icon: <IconUsers /> },
        { href: '/admin/novo-evento', label: 'Novo Evento', icon: <IconCalendarPlus /> },
    ]

    const userLinks: LinkItem[] = [
        { href: '/dashboard', label: 'Início', icon: <IconHome /> },
        { href: '/import', label: 'Importar', icon: <IconUpload /> },
        { href: '/settings', label: 'Config.', icon: <IconSettings /> },
    ]

    const links = role === 'admin' ? adminLinks : userLinks
    const isEventPage = pathname.includes('/admin/evento/') || pathname.includes('/admin/users') || pathname.includes('/admin/novo-evento')

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans text-textPrimary overflow-x-hidden max-w-[100vw]">

            {/* ── TOP HEADER ──────────────────────────────────────────── */}
            <header className="bg-white border-b border-brand/5 sticky top-0 z-50 h-20 flex items-center shadow-sm">
                <div className="container mx-auto px-6 flex items-center justify-between relative h-full">

                    {/* Left: Back button or Logo */}
                    <div className="flex items-center gap-4 flex-1">
                        {isEventPage ? (
                            <button
                                onClick={() => router.push('/admin/dashboard')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-brand/5 text-brand rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-brand/10 transition-all border border-brand/10 shadow-sm group whitespace-nowrap"
                            >
                                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                                <span>Painel</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border border-brand/10">
                                    <img src="/Logo-03.jpg" alt="Logo" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-serif font-black text-[10px] text-brand uppercase tracking-tighter hidden sm:block">RSVP Manager</span>
                            </div>
                        )}
                    </div>

                    {/* Center: Title */}
                    <div className="flex-[2] flex flex-col items-center justify-center text-center px-2 min-w-0">
                        <h1 className="text-xs md:text-base font-serif font-black text-text-primary tracking-tight truncate leading-tight w-full">
                            {title || 'Painel'}
                        </h1>
                        {subtitle && <p className="text-[7px] md:text-[8px] font-bold text-text-muted uppercase tracking-widest mt-0.5 truncate w-full">{subtitle}</p>}
                    </div>

                    {/* Right: User Avatar (clica para abrir dropdown) */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-black uppercase shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all border-2 border-white ${initials.length > 2 ? 'text-[10px]' : 'text-sm'}`}
                            title={user.name}
                        >
                            {initials}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── DROPDOWN MENU ───────────────────────────────────────── */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-brand-dark/10 backdrop-blur-[2px] z-[60]"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Dropdown panel */}
                    <div className="fixed top-24 right-6 w-64 bg-surface rounded-3xl shadow-2xl z-[70] border border-border-soft animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

                        {/* User info */}
                        <div className="p-6 border-b border-border-soft bg-bg-light/30">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-black uppercase shadow-inner ${initials.length > 2 ? 'text-[10px]' : 'text-sm'}`}>
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-text-primary truncate">{user.name}</p>
                                    <p className="text-[9px] font-bold text-text-muted uppercase truncate">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <nav className="p-2 space-y-1">
                            {/* Links de navegação — só no desktop (no mobile já estão na barra inferior) */}
                            <div className="hidden md:block">
                                {links.map((link) => (
                                    <button
                                        key={link.href}
                                        onClick={() => { router.push(link.href); setIsMenuOpen(false) }}
                                        className="w-full text-left px-4 py-3 flex items-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-bg-light hover:text-brand transition-all"
                                    >
                                        <span className="flex-shrink-0">{link.icon}</span>
                                        {link.label}
                                    </button>
                                ))}
                                <div className="my-1 border-t border-border-soft" />
                            </div>

                            {/* Sair — aparece sempre */}
                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-3 flex items-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-danger hover:bg-danger-light transition-all"
                            >
                                <IconLogOut />
                                Sair
                            </button>
                        </nav>
                    </div>
                </>
            )}

            {/* ── MAIN CONTENT AREA ───────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-w-0">

                {/* Secondary Header (Actions) */}
                {headerActions && (
                    <div className="bg-white/50 border-b border-brand/5 backdrop-blur-sm shadow-sm py-4">
                        <div className="container mx-auto px-6 flex flex-wrap justify-center md:justify-end gap-3">
                            {headerActions}
                        </div>
                    </div>
                )}

                <div className="p-6 md:p-12 pb-24 md:pb-12 flex-1 relative">
                    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>

                {/* O rodapé foi removido para uma interface mais limpa no painel de gestão */}
            </main>

            {/* ── MOBILE BOTTOM NAVIGATION ──────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-brand/5 z-50 flex items-center justify-around px-2 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
                {links.map((link) => {
                    const isActive = pathname === link.href
                    return (
                        <button
                            key={link.href}
                            onClick={() => router.push(link.href)}
                            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-40 grayscale'}`}
                        >
                            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isActive ? 'bg-brand text-white shadow-lg shadow-brand-dark/20' : 'bg-bg-light text-text-muted'}`}>
                                {link.icon}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-brand' : 'text-text-muted'}`}>
                                {link.label}
                            </span>
                        </button>
                    )
                })}
            </nav>

        </div>
    )
}
