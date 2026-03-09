'use client'

import { SharedLayout } from '@/app/components/shared-layout'
import { ProtectedRoute } from '@/lib/protected-route'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, X, Clock, Wallet, ArrowUpRight, Search, Filter } from 'lucide-react'

function AdminWithdrawalsContent() {
    const [withdrawals, setWithdrawals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('ALL')

    useEffect(() => {
        fetchWithdrawals()
    }, [])

    async function fetchWithdrawals() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    events (
                        event_settings
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setWithdrawals(data || [])
        } catch (err) {
            console.error('Erro ao carregar saques:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateStatus(id: string, newStatus: string) {
        if (!confirm(`Deseja alterar o status para ${newStatus}?`)) return

        setProcessingId(id)
        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w))
        } catch (err) {
            alert('Erro ao atualizar status')
            console.error(err)
        } finally {
            setProcessingId(null)
        }
    }

    const filteredWithdrawals = withdrawals.filter(w => {
        const settings = typeof w.events?.event_settings === 'string'
            ? JSON.parse(w.events.event_settings)
            : w.events?.event_settings
        const coupleNames = settings?.coupleNames?.toLowerCase() || ''
        const pixKey = w.pix_key?.toLowerCase() || ''
        const beneficiary = w.beneficiary?.toLowerCase() || ''

        const matchesSearch = coupleNames.includes(searchTerm.toLowerCase()) ||
            pixKey.includes(searchTerm.toLowerCase()) ||
            beneficiary.includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <SharedLayout
            role="admin"
            title="Gestão de Saques"
            subtitle="Controle financeiro e liberação de pagamentos"
        >
            <div className="space-y-8">
                {/* ── FILTROS E BUSCA ────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por casal, chave Pix ou titular..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-8 py-5 bg-surface border border-border-soft rounded-3xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-brand/5 transition-all"
                        />
                    </div>
                    <div className="flex bg-surface border border-border-soft rounded-3xl p-1 gap-1">
                        {(['ALL', 'PENDING', 'COMPLETED', 'REJECTED'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f
                                        ? 'bg-brand text-white shadow-lg'
                                        : 'text-text-muted hover:bg-bg-light'
                                    }`}
                            >
                                {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'Pendentes' : f === 'COMPLETED' ? 'Pagos' : 'Recusados'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── LISTA DE SAQUES ─────────────────────────────────────── */}
                <div className="bg-surface rounded-[3rem] border border-border-soft overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand">Carregando solicitações...</p>
                        </div>
                    ) : filteredWithdrawals.length === 0 ? (
                        <div className="py-24 text-center">
                            <Wallet className="w-16 h-16 text-text-muted/20 mx-auto mb-6" />
                            <p className="text-text-muted font-serif italic text-lg text-center px-6">Nenhuma solicitação encontrada para os filtros aplicados.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-bg-light border-b border-border-soft">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-muted">Evento / Casal</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-muted">Valor</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-muted">Dados do Pix</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-soft/50">
                                    {filteredWithdrawals.map((w) => {
                                        const settings = typeof w.events?.event_settings === 'string'
                                            ? JSON.parse(w.events.event_settings)
                                            : w.events?.event_settings

                                        return (
                                            <tr key={w.id} className="group hover:bg-bg-light/30 transition-colors">
                                                <td className="px-8 py-8">
                                                    <p className="font-serif font-black text-text-primary text-base leading-tight">
                                                        {settings?.coupleNames || 'Evento sem nome'}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-text-muted mt-2 uppercase tracking-widest">
                                                        Solicitado em {new Date(w.created_at).toLocaleDateString('pt-BR')} às {new Date(w.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-pale border border-brand/10 rounded-xl">
                                                        <span className="text-sm font-black text-brand tracking-tighter">
                                                            R$ {Number(w.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-text-primary">{w.pix_key}</p>
                                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                                                            {w.pix_type} • {w.beneficiary || 'Não informado'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex justify-center">
                                                        <span className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${w.status === 'COMPLETED' ? 'bg-success-light text-success-dark border-success/20' :
                                                                w.status === 'REJECTED' ? 'bg-danger-light text-danger-dark border-danger/20' :
                                                                    'bg-warning-light text-warning-dark border-warning/20 animate-pulse'
                                                            }`}>
                                                            {w.status === 'COMPLETED' ? 'Pago' : w.status === 'REJECTED' ? 'Recusado' : 'Pendente'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {w.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    disabled={processingId === w.id}
                                                                    onClick={() => handleUpdateStatus(w.id, 'COMPLETED')}
                                                                    className="w-10 h-10 bg-success text-white rounded-xl flex items-center justify-center shadow-lg shadow-success/20 hover:-translate-y-1 transition-all disabled:opacity-50"
                                                                    title="Marcar como Pago"
                                                                >
                                                                    {processingId === w.id ? <Clock size={16} className="animate-spin" /> : <Check size={18} />}
                                                                </button>
                                                                <button
                                                                    disabled={processingId === w.id}
                                                                    onClick={() => handleUpdateStatus(w.id, 'REJECTED')}
                                                                    className="w-10 h-10 bg-danger text-white rounded-xl flex items-center justify-center shadow-lg shadow-danger/20 hover:-translate-y-1 transition-all disabled:opacity-50"
                                                                    title="Recusar Saque"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            className="w-10 h-10 bg-bg-light text-text-muted rounded-xl flex items-center justify-center hover:bg-brand hover:text-white transition-all border border-border-soft group-hover:border-brand/20"
                                                            title="Ver detalhes do evento"
                                                            onClick={() => window.open(`/admin/evento/${w.event_id}`, '_blank')}
                                                        >
                                                            <ArrowUpRight size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="py-10 text-center">
                    <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Gestão Financeira • Vanessa Bidinotti</p>
                </div>
            </div>
        </SharedLayout>
    )
}

export default function AdminWithdrawalsPage() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminWithdrawalsContent />
        </ProtectedRoute>
    )
}
