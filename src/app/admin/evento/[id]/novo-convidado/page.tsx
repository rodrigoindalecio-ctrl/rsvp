'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAdmin } from '@/lib/admin-context'
import { useEvent, Companion } from '@/lib/event-context'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SharedLayout } from '@/app/components/shared-layout'
import { toast } from 'sonner'

function AdminNovoConvidadoContent() {
    const { events } = useAdmin()
    const { addGuest } = useEvent()
    const router = useRouter()
    const params = useParams()
    const eventId = params.id as string

    const [event, setEvent] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        telefone: '',
        grupo: '',
        category: 'adult_paying' as 'adult_paying' | 'child_paying' | 'child_not_paying'
    })

    const [companions, setCompanions] = useState<Companion[]>(
        Array(5).fill(null).map(() => ({ name: '', isConfirmed: false, category: 'adult_paying' }))
    )

    useEffect(() => {
        const found = events.find(e => e.id === eventId)
        if (found) {
            setEvent(found)
        }
    }, [eventId, events])

    const handleCompanionChange = (index: number, field: keyof Companion, value: any) => {
        const newCompanions = [...companions]
        newCompanions[index] = { ...newCompanions[index], [field]: value }
        setCompanions(newCompanions)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) {
            toast.warning('Nome obrigatório', { description: 'O nome do convidado é obrigatório.' })
            return
        }

        setLoading(true)

        try {
            // Filtrar apenas acompanhantes preenchidos
            const activeCompanions = companions.filter(c => c.name.trim() !== '')

            await addGuest({
                ...formData,
                companions: activeCompanions.length,
                companionsList: activeCompanions
            })

            setLoading(false)
            toast.success('Convidado adicionado com sucesso!')
            router.push(`/admin/evento/${eventId}`)
        } catch (error) {
            console.error(error)
            setLoading(false)
            toast.error('Erro ao adicionar convidado', { description: 'Verifique os dados e tente novamente.' })
        }
    }

    if (!event) return (
        <SharedLayout role="admin" title="Carregando...">
            <div className="p-20 text-center text-text-muted font-bold">Aguarde...</div>
        </SharedLayout>
    )

    return (
        <SharedLayout
            role="admin"
            title="Novo Convidado"
            subtitle={`Adicionando à lista de ${event.eventSettings.coupleNames}`}
        >
            <div className="max-w-4xl">
                <button
                    onClick={() => router.back()}
                    className="hidden md:inline-flex mb-6 items-center gap-2 text-text-muted hover:text-brand font-black text-[9px] uppercase tracking-widest transition-all p-2 bg-surface border border-border-soft rounded-xl shadow-sm hover:border-brand-light/30 group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar
                </button>

                <form onSubmit={handleSubmit} className="bg-surface rounded-[2rem] border border-border-soft shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                    {/* Sidebar Info */}
                    <div className="w-full md:w-64 bg-bg-light border-r border-border-soft p-8 space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-4">Dica</p>
                            <p className="text-xs text-text-muted font-bold leading-relaxed">
                                Você pode adicionar o convidado principal e até 5 acompanhantes de uma só vez. Tudo será salvo no Supabase.
                            </p>
                        </div>

                        <div className="pt-8 border-t border-border-soft">
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-4">Resumo</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-text-muted">Total Pessoas</span>
                                    <span className="text-text-primary">{1 + companions.filter(c => c.name.trim()).length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 md:p-12 space-y-12">
                        {/* DADOS PRINCIPAIS */}
                        <section>
                            <h3 className="text-[10px] font-black text-brand uppercase tracking-widest mb-8 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand"></span>
                                Dados do Convidado Principal
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Nome Completo *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Roberto Carlos Silva"
                                        className="w-full px-6 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner outline-none text-text-primary transition-all placeholder:text-text-muted"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">E-mail (Opcional)</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="roberto@email.com"
                                        className="w-full px-5 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Telefone</label>
                                    <input
                                        type="text"
                                        value={formData.telefone}
                                        onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                        placeholder="(11) 99999-9999"
                                        className="w-full px-5 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Grupo / Mesa</label>
                                    <input
                                        type="text"
                                        value={formData.grupo}
                                        onChange={e => setFormData({ ...formData, grupo: e.target.value })}
                                        placeholder="Ex: Família Noiva"
                                        className="w-full px-5 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Categoria Principal</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        className="w-full px-5 py-4 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-secondary transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="adult_paying">Adulto Pagante</option>
                                        <option value="child_paying">Criança Pagante</option>
                                        <option value="child_not_paying">Criança Não Pagante</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* ACOMPANHANTES */}
                        <section>
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-8 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-border-soft"></span>
                                Acompanhantes
                            </h3>

                            <div className="space-y-4">
                                {companions.map((comp, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-4 p-5 bg-bg-light border border-border-soft hover:border-brand-light/30 transition-colors rounded-2xl">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={comp.name}
                                                onChange={e => handleCompanionChange(idx, 'name', e.target.value)}
                                                placeholder={`Nome do Acompanhante ${idx + 1}`}
                                                className="w-full px-4 py-2 bg-surface border border-border-soft rounded-xl text-sm font-bold shadow-sm outline-none text-text-primary"
                                            />
                                        </div>
                                        <div className="sm:w-48">
                                            <select
                                                value={comp.category}
                                                onChange={e => handleCompanionChange(idx, 'category', e.target.value)}
                                                className="w-full px-4 py-2 bg-surface border border-border-soft rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm outline-none text-text-muted"
                                            >
                                                <option value="adult_paying">Adulto</option>
                                                <option value="child_paying">Criança Pagante</option>
                                                <option value="child_not_paying">Criança Não Pagante</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="pt-8 border-t border-border-soft flex flex-col sm:flex-row gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-8 py-5 border border-border-soft bg-bg-light rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:bg-brand-pale transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-5 px-8 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-dark/20 hover:bg-brand-dark hover:-translate-y-1 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Adicionando...' : '✨ Adicionar Convidado'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </SharedLayout>
    )
}

export default function AdminNovoConvidado() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminNovoConvidadoContent />
        </ProtectedRoute>
    )
}
