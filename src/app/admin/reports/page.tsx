'use client'

import { SharedLayout } from '@/app/components/shared-layout'
import { ProtectedRoute } from '@/lib/protected-route'
import { useAdmin } from '@/lib/admin-context'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

function AdminReportsContent() {
    const { events, loading: adminLoading } = useAdmin()
    const [allGuests, setAllGuests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAllData() {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('guests')
                    .select('*')

                if (error) throw error
                setAllGuests(data || [])
            } catch (err) {
                console.error('Erro ao carregar dados globais:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchAllData()
    }, [])

    const metrics = useMemo(() => {
        const stats = {
            totalEvents: events.length,
            totalGroups: allGuests.length,
            totalPeople: 0,
            confirmed: 0,
            pending: 0,
            declined: 0,
            adults: 0,
            childrenPaying: 0,
            childrenFree: 0,
            confirmedAdults: 0,
            confirmedChildrenPaying: 0,
            confirmedChildrenFree: 0
        }

        allGuests.forEach(g => {
            const comps = g.companions_list || []
            const groupSize = 1 + comps.length
            stats.totalPeople += groupSize

            // Categorias (Titular)
            if (g.category === 'adult_paying') stats.adults++
            else if (g.category === 'child_paying') stats.childrenPaying++
            else if (g.category === 'child_not_paying') stats.childrenFree++

            // Status (Titular)
            if (g.status === 'confirmed') {
                stats.confirmed++
                if (g.category === 'adult_paying') stats.confirmedAdults++
                else if (g.category === 'child_paying') stats.confirmedChildrenPaying++
                else if (g.category === 'child_not_paying') stats.confirmedChildrenFree++
            } else if (g.status === 'pending') {
                stats.pending++
            } else {
                stats.declined++
            }

            // Acompanhantes
            comps.forEach((c: any) => {
                const cCat = c.category || 'adult_paying'
                if (cCat === 'adult_paying') stats.adults++
                else if (cCat === 'child_paying') stats.childrenPaying++
                else if (cCat === 'child_not_paying') stats.childrenFree++

                if (c.isConfirmed) {
                    stats.confirmed++
                    if (cCat === 'adult_paying') stats.confirmedAdults++
                    else if (cCat === 'child_paying') stats.confirmedChildrenPaying++
                    else if (cCat === 'child_not_paying') stats.confirmedChildrenFree++
                } else {
                    // Acompanhantes de grupo confirmado que não vão são considerados recusados
                    if (g.status === 'confirmed') stats.declined++
                    else if (g.status === 'pending') stats.pending++
                    else stats.declined++
                }
            })
        })

        return stats
    }, [events, allGuests])

    if (loading || adminLoading) {
        return (
            <SharedLayout role="admin" title="Relatórios" subtitle="Carregando estatísticas...">
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                </div>
            </SharedLayout>
        )
    }

    const conversionRate = metrics.totalPeople > 0 ? Math.round((metrics.confirmed / metrics.totalPeople) * 100) : 0

    return (
        <SharedLayout
            role="admin"
            title="Dashboard Global"
            subtitle="Análise estatística de toda a plataforma"
        >
            <div className="space-y-6 md:space-y-10">

                {/* ── BIG NUMBERS ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border-soft shadow-sm group hover:border-brand/20 transition-all">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 text-center">Saúde da Plataforma</p>
                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-4">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
                                    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-bg-light" />
                                    <circle
                                        cx="50" cy="50" r="42"
                                        stroke="currentColor" strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray="263.89"
                                        strokeDashoffset={263.89 - (263.89 * conversionRate) / 100}
                                        strokeLinecap="round"
                                        className="text-brand transition-all duration-1000"
                                    />
                                </svg>
                                <span className="absolute text-2xl md:text-3xl font-black text-text-primary tracking-tighter">{conversionRate}%</span>
                            </div>
                            <p className="text-[8px] md:text-[9px] font-bold text-text-muted uppercase tracking-widest">Taxa média de adesão</p>
                        </div>
                    </div>

                    <div className="bg-brand rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-brand/20 flex flex-col items-center justify-center text-center">
                        <p className="text-[9px] md:text-[10px] font-black text-brand-pale uppercase tracking-[0.2em] mb-3">Volume de Convidados</p>
                        <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">{metrics.totalPeople}</h3>
                        <p className="text-[8px] md:text-[10px] font-bold text-white/80 uppercase tracking-widest">Pessoas mapeadas no sistema</p>
                    </div>

                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 border border-border-soft shadow-sm flex flex-col items-center justify-center text-center">
                        <p className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Ecossistema Ativo</p>
                        <h3 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter mb-2">{metrics.totalEvents}</h3>
                        <p className="text-[8px] md:text-[10px] font-bold text-text-muted uppercase tracking-widest">Eventos criados e ativos</p>
                    </div>
                </div>

                {/* ── BREAKDOWN METRICS ──────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">

                    {/* Status Breakdown */}
                    <div className="bg-surface rounded-[2rem] md:rounded-[3rem] border border-border-soft p-8 md:p-10 shadow-sm">
                        <h4 className="text-lg md:text-xl font-serif font-black text-text-primary mb-6 md:mb-8 tracking-tight italic">Status de Confirmações</h4>
                        <div className="space-y-5 md:space-y-6">
                            <StatBar label="Confirmados" count={metrics.confirmed} total={metrics.totalPeople} color="bg-success" textColor="text-success-dark" />
                            <StatBar label="Pendentes" count={metrics.pending} total={metrics.totalPeople} color="bg-warning" textColor="text-warning-dark" />
                            <StatBar label="Ausentes" count={metrics.declined} total={metrics.totalPeople} color="bg-danger" textColor="text-danger-dark" />
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="bg-surface rounded-[2rem] md:rounded-[3rem] border border-border-soft p-8 md:p-10 shadow-sm">
                        <h4 className="text-lg md:text-xl font-serif font-black text-text-primary mb-6 md:mb-8 tracking-tight italic">Perfil do Público</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CategoryMiniCard label="Adultos" current={metrics.confirmedAdults} total={metrics.adults} />
                            <CategoryMiniCard label="Crianças Pag." current={metrics.confirmedChildrenPaying} total={metrics.childrenPaying} />
                            <CategoryMiniCard label="Crianças Free" current={metrics.confirmedChildrenFree} total={metrics.childrenFree} />
                        </div>
                        <div className="mt-8 md:mt-10 p-5 md:p-6 bg-brand-pale/30 rounded-2xl border border-brand/5">
                            <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-brand">
                                <span>Eficiência de Buffet</span>
                                <span>{Math.round((metrics.confirmedAdults + metrics.confirmedChildrenPaying) / ((metrics.adults + metrics.childrenPaying) || 1) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="py-10 text-center">
                    <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Vanessa Bidinotti • Inteligência em RSVP</p>
                </div>

            </div>
        </SharedLayout>
    )
}

function StatBar({ label, count, total, color, textColor }: { label: string, count: number, total: number, color: string, textColor: string }) {
    const percent = total > 0 ? (count / total) * 100 : 0
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-text-muted">{label}</span>
                <span className={textColor}>{count} <span className="opacity-40 font-bold">({Math.round(percent)}%)</span></span>
            </div>
            <div className="h-3 bg-bg-light rounded-full overflow-hidden border border-border-soft shadow-inner">
                <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}

function CategoryMiniCard({ label, current, total }: { label: string, current: number, total: number }) {
    return (
        <div className="text-center p-6 bg-bg-light rounded-2xl border border-border-soft">
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-3">{label}</p>
            <p className="text-2xl font-black text-text-primary tracking-tighter mb-1">{current}</p>
            <p className="text-[8px] font-bold text-text-muted/60 uppercase">de {total}</p>
        </div>
    )
}

export default function AdminReportsPage() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminReportsContent />
        </ProtectedRoute>
    )
}
