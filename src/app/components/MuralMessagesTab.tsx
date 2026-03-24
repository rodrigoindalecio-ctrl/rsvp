'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Heart, Star, Quote, Search, Trash2, X, CheckSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/app/components/confirm-dialog'

interface Props {
    eventId: string
}

export default function MuralMessagesTab({ eventId }: Props) {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedItems, setSelectedItems] = useState<{id: string, type: string}[]>([])
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null as any })
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

    useEffect(() => {
        if (!eventId) return
        fetchMessages()
    }, [eventId])

    const fetchMessages = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/events/${eventId}/gifts`, { cache: 'no-store' })
            const data = await res.json()
            if (data && data.transactions) {
                const sorted = data.transactions.sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                setMessages(sorted)
            }
        } catch (error) {
            console.error('Erro ao buscar recados:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleSelection = (item: any) => {
        const isSelected = selectedItems.some(i => i.id === item.id)
        if (isSelected) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id))
        } else {
            setSelectedItems([...selectedItems, { id: item.id, type: item.type }])
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return
        setBulkDeleteConfirm(true)
    }

    const confirmBulkDelete = async () => {
        setBulkDeleteConfirm(false)

        try {
            const res = await fetch(`/api/events/${eventId}/mural`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: selectedItems })
            })
            if (res.ok) {
                toast.success('Recados excluídos com sucesso!')
                setIsSelectionMode(false)
                setSelectedItems([])
                fetchMessages()
            } else {
                toast.error('Erro ao excluir recados')
            }
        } catch (error) {
            toast.error('Erro de conexão')
        }
    }

    const handleDeleteSingle = async (item: any) => {
        setDeleteConfirm({ isOpen: true, item })
    }

    const confirmSingleDelete = async () => {
        const item = deleteConfirm.item
        if (!item) return
        setDeleteConfirm({ isOpen: false, item: null })
        try {
            const res = await fetch(`/api/events/${eventId}/mural`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [{ id: item.id, type: item.type }] })
            })
            if (res.ok) {
                toast.success('Recado removido do mural.')
                fetchMessages()
            }
        } catch (error) {
            toast.error('Erro ao excluir')
        }
    }

    const filteredMessages = messages.filter(m => 
        m.message !== null && // Se for null, foi excluído/escondido do mural
        (
            (m.guestName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.message || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    )

    if (loading) {
        return (
            <div className="py-24 text-center">
                <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-brand">Abrindo o baú de memórias...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header Emocional */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <div className="w-16 h-16 bg-brand-pale rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner text-brand transform -rotate-3">
                    <Heart size={30} fill="currentColor" />
                </div>
                <h2 className="text-3xl md:text-4xl font-serif text-text-primary italic">Mural de Carinho</h2>
                <p className="text-text-secondary text-sm font-serif italic leading-relaxed">
                    "Cada presente é um gesto de amor, mas cada palavra é um tesouro que guardaremos para sempre."
                </p>
            </div>

            {/* Ações e Busca */}
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:max-w-md relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou palavra..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-surface border border-border-soft rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/20 transition-all placeholder:text-text-muted/50"
                    />
                </div>

                <div className="flex gap-2">
                    {isSelectionMode ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsSelectionMode(false)
                                    setSelectedItems([])
                                }}
                                className="px-5 py-3.5 bg-bg-light text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-border-soft transition-all flex items-center gap-2"
                            >
                                <X size={14} /> Cancelar
                            </button>
                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedItems.length === 0}
                                className="px-5 py-3.5 bg-danger text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-danger/20 hover:bg-danger-dark transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <Trash2 size={14} /> Excluir ({selectedItems.length})
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            className="px-5 py-3.5 bg-brand/5 text-brand border border-brand/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand/10 transition-all flex items-center gap-2"
                        >
                            <CheckSquare size={14} /> Gerenciar Mural
                        </button>
                    )}
                </div>
            </div>

            {/* Grid de Recados */}
            {filteredMessages.length === 0 ? (
                <div className="py-20 text-center bg-surface border border-dashed border-border-soft rounded-[3rem]">
                    <MessageSquare size={48} className="text-text-muted/20 mx-auto mb-4" />
                    <p className="text-text-muted font-serif italic">Ainda não recebemos recadinhos por aqui...</p>
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    <AnimatePresence>
                        {filteredMessages.map((msg, idx) => {
                            const isSelected = selectedItems.some(i => i.id === msg.id)
                            return (
                                <div key={msg.id} className="relative group/card break-inside-avoid">
                                    {/* Botão de Excluir por Swipe (Fundo) - Visível quando arrasta */}
                                    <div className="absolute inset-0 bg-danger rounded-[2rem] flex items-center justify-end px-8 text-white">
                                        <Trash2 size={24} />
                                    </div>

                                    <motion.div
                                        layout
                                        drag="x"
                                        dragConstraints={{ right: 0, left: -100 }}
                                        dragElastic={0.05}
                                        onDragEnd={(_, info) => {
                                            if (info.offset.x < -60) handleDeleteSingle(msg)
                                        }}
                                        className={`bg-white rounded-[2rem] p-8 border border-border-soft shadow-sm hover:shadow-xl transition-all duration-300 relative z-10 
                                            ${isSelected ? 'border-brand ring-2 ring-brand/10 scale-[0.98]' : 'hover:-translate-y-1'}
                                            ${isSelectionMode ? 'cursor-pointer' : ''}
                                        `}
                                        onClick={() => isSelectionMode && toggleSelection(msg)}
                                    >
                                        {/* Aspas decorativas */}
                                        <Quote className="absolute -top-2 -right-2 text-brand/5 group-hover/card:text-brand/10 transition-colors" size={120} />

                                        {/* Checkbox de Seleção */}
                                        {isSelectionMode && (
                                            <div className="absolute top-6 right-6">
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand border-brand text-white' : 'border-border-soft bg-white'}`}>
                                                    {isSelected && <CheckSquare size={14} />}
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative z-10 space-y-6">
                                            {/* Status Badge */}
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${msg.type === 'gift' ? 'bg-success-light text-success-dark' : 'bg-brand-pale text-brand'}`}>
                                                    {msg.type === 'gift' ? <Star size={14} fill="currentColor" /> : <MessageSquare size={14} />}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${msg.type === 'gift' ? 'text-success-dark/60' : 'text-brand/60'}`}>
                                                    {msg.type === 'gift' ? 'Presente Recebido' : 'Recado no RSVP'}
                                                </span>
                                            </div>

                                            {/* O Recado */}
                                            <p className="text-text-primary font-serif italic text-lg leading-relaxed mb-6">
                                                {msg.message || "Enviou um presente com muito carinho para celebrar este momento!"}
                                            </p>

                                            {/* Assinatura */}
                                            <div className="pt-6 border-t border-border-soft flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-brand/5 border border-brand/10 flex items-center justify-center text-brand font-black text-xs">
                                                        {msg.guestName?.charAt(0) || 'C'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-text-primary tracking-tight">{msg.guestName}</p>
                                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Convidado</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                                        {new Date(msg.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detalhe de cor aleatório */}
                                        <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${idx % 3 === 0 ? 'bg-brand' : idx % 3 === 1 ? 'bg-success' : 'bg-warning'} opacity-20`} />
                                    </motion.div>
                                </div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            <div className="py-12 text-center">
                <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-[0.4em]">Mural de Amor • Inteligência em RSVP</p>
            </div>

            {/* Diálogos de Confirmação */}
            <ConfirmDialog
                isOpen={bulkDeleteConfirm}
                title="Excluir Recados"
                message={`Deseja realmente excluir permanentemente os ${selectedItems.length} recados selecionados?`}
                onConfirm={confirmBulkDelete}
                onCancel={() => setBulkDeleteConfirm(false)}
            />

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Remover Recado"
                message="Deseja remover este recado do mural? O registro do convidado será mantido."
                onConfirm={confirmSingleDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, item: null })}
            />
        </div>
    )
}
