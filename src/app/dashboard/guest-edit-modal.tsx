'use client'

import { useState, useEffect } from 'react'
import { Guest, Companion, GuestCategory } from '@/lib/event-context'

interface GuestEditModalProps {
    guest: Guest | null
    isOpen: boolean
    onClose: () => void
    onSave: (updatedGuest: Guest) => void
    onDelete: (guestId: string) => void
}

const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

export function GuestEditModal({ guest, isOpen, onClose, onSave, onDelete }: GuestEditModalProps) {
    const [formData, setFormData] = useState<Guest | null>(guest)
    const [isSaving, setIsSaving] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [companionsList, setCompanionsList] = useState<Companion[]>([])

    // Atualiza o state quando o guest prop muda - inicializa com 5 slots
    useEffect(() => {
        if (guest && formData?.id !== guest.id) {
            setFormData(guest)
            // Inicializa com 5 slots, usando dados existentes se houver
            const initialList: Companion[] = []
            for (let i = 0; i < 5; i++) {
                if (guest.companionsList?.[i]) {
                    initialList.push(guest.companionsList[i])
                } else {
                    initialList.push({ name: '', isConfirmed: false, category: 'adult_paying' })
                }
            }
            setCompanionsList(initialList)
        }
    }, [guest, formData?.id])

    if (!isOpen || !formData) return null

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true)
    }

    const confirmDelete = () => {
        onDelete(formData.id)
        setShowDeleteConfirm(false)
    }

    // Atualiza a lista de acompanhantes quando o número muda
    const handleCompanionsChange = (newNumber: number) => {
        const currentList = companionsList || []
        let newList: Companion[] = []

        // Sempre limita a 5 acompanhantes
        const max = Math.min(newNumber, 5)
        for (let i = 0; i < max; i++) {
            if (currentList[i]) {
                newList.push(currentList[i])
            } else {
                newList.push({ name: '', isConfirmed: false, category: 'adult_paying' })
            }
        }

        setFormData({ ...formData, companions: max })
        setCompanionsList(newList)
    }

    // Atualiza nome do acompanhante
    const handleCompanionNameChange = (index: number, name: string) => {
        const newList = [...companionsList]
        newList[index] = { ...newList[index], name }
        setCompanionsList(newList)
    }

    // Atualiza confirmação do acompanhante
    const handleCompanionConfirmedChange = (index: number, isConfirmed: boolean) => {
        const newList = [...companionsList]
        newList[index] = { ...newList[index], isConfirmed }
        setCompanionsList(newList)
    }

    // Atualiza categoria do acompanhante
    const handleCompanionCategoryChange = (index: number, category: GuestCategory) => {
        const newList = [...companionsList]
        newList[index] = { ...newList[index], category }
        setCompanionsList(newList)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            alert('Por favor, preencha o nome')
            return
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            alert('Email inválido')
            return
        }

        setIsSaving(true)

        // Simular delay de salvamento
        setTimeout(() => {
            const updatedGuest: Guest = {
                ...formData,
                companionsList: companionsList.filter(c => c.name.trim() !== '')
            }
            onSave(updatedGuest)
            setIsSaving(false)
            onClose()
        }, 300)
    }

    return (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-300 border border-border-soft overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-soft">
                    <h2 className="text-xl font-serif font-black text-text-primary tracking-tight">Editar Convidado</h2>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-text-primary transition-colors p-2 hover:bg-bg-light rounded-xl"
                        disabled={isSaving}
                    >
                        <XIcon />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Nome Principal */}
                    <div>
                        <label htmlFor="name" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                            Nome Principal
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                            placeholder="Ex: Roberto Silva"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Grupo */}
                    <div>
                        <label htmlFor="group" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                            Grupo/Família
                        </label>
                        <input
                            id="group"
                            type="text"
                            value={formData.grupo || ''}
                            onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                            className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                            placeholder="Ex: Família Silva"
                            disabled={isSaving}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                                Status
                            </label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'confirmed' | 'pending' | 'declined' })}
                                className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-xs font-black uppercase tracking-widest text-text-secondary shadow-inner outline-none"
                                disabled={isSaving}
                            >
                                <option value="pending">⏳ Pendente</option>
                                <option value="confirmed">✓ Confirmado</option>
                                <option value="declined">✗ Recusado</option>
                            </select>
                        </div>

                        {/* Categoria */}
                        <div>
                            <label htmlFor="category" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                                Categoria
                            </label>
                            <select
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as GuestCategory })}
                                className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-xs font-black uppercase tracking-widest text-text-secondary shadow-inner outline-none"
                                disabled={isSaving}
                            >
                                <option value="adult_paying">Adulto</option>
                                <option value="child_paying">Criança Pag.</option>
                                <option value="child_not_paying">Criança N.P.</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Telefone */}
                        <div>
                            <label htmlFor="telefone" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                                WhatsApp / Tel.
                            </label>
                            <input
                                id="telefone"
                                type="text"
                                value={formData.telefone || ''}
                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                placeholder="(11) 99999-9999"
                                disabled={isSaving}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                                E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                placeholder="exemplo@email.com"
                                disabled={isSaving}
                            />
                        </div>
                    </div>


                    {/* Acompanhantes - 5 Slots Fixos */}
                    <div className="bg-bg-light/50 border border-border-soft rounded-[2rem] p-6 space-y-6">
                        <h3 className="text-xs font-black text-text-muted uppercase tracking-widest ml-1 mb-2">Acompanhantes (Até 5)</h3>
                        {companionsList.slice(0, 5).map((companion, index) => (
                            <div key={index} className="space-y-3 bg-surface p-4 rounded-2xl border border-border-soft shadow-sm">
                                <div className="grid grid-cols-3 gap-3 items-end">
                                    <div className="col-span-2">
                                        <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                                            Nome {index + 1}
                                        </label>
                                        <input
                                            type="text"
                                            value={companion.name}
                                            onChange={(e) => handleCompanionNameChange(index, e.target.value)}
                                            className="w-full px-4 py-2.5 bg-bg-light border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                            placeholder="Nome do acompanhante"
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <select
                                        value={companion.category || 'adult_paying'}
                                        onChange={(e) => handleCompanionCategoryChange(index, e.target.value as GuestCategory)}
                                        className="w-full px-3 py-2.5 bg-bg-light border border-border-soft rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary outline-none"
                                        disabled={isSaving}
                                    >
                                        <option value="adult_paying">Adulto</option>
                                        <option value="child_paying">Criança Pag.</option>
                                        <option value="child_not_paying">Não Pagante</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`companion-confirmed-${index}`}
                                            checked={companion.isConfirmed}
                                            onChange={(e) => handleCompanionConfirmedChange(index, e.target.checked)}
                                            className="w-4 h-4 rounded-md border-border-soft text-brand focus:ring-brand/20 cursor-pointer"
                                            disabled={isSaving}
                                        />
                                        <label htmlFor={`companion-confirmed-${index}`} className="text-[10px] font-black text-text-muted uppercase tracking-widest cursor-pointer">
                                            Confirmado
                                        </label>
                                    </div>
                                    {companion.name && (
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${companion.isConfirmed ? 'text-success' : (formData.status === 'pending' ? 'text-warning' : 'text-danger')}`}>
                                            {companion.isConfirmed ? '✓ Confirmado' : (formData.status === 'pending' ? '⏳ Pendente' : '✗ Ausente')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-4 pt-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 px-6 rounded-2xl border border-border-soft text-text-muted font-black uppercase tracking-widest text-[10px] hover:bg-bg-light transition-all disabled:opacity-50"
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-4 px-6 rounded-2xl bg-brand text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="w-full py-4 px-6 rounded-2xl border border-danger/30 text-danger font-black uppercase tracking-widest text-[10px] hover:bg-danger-light transition-all"
                        >
                            Excluir Registro
                        </button>
                    </div>
                </form>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
                    <div className="bg-surface rounded-[2.5rem] shadow-2xl border border-border-soft max-w-sm w-full animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-10 text-center">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-danger-light text-danger shadow-inner">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-serif font-black text-text-primary tracking-tight mb-2">
                                Excluir Convidado?
                            </h3>

                            <p className="text-text-muted text-sm font-bold leading-relaxed mb-8 px-2">
                                Tem certeza que deseja excluir <span className="text-text-primary">"{formData?.name}"</span>? Esta ação não pode ser desfeita.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-4 bg-bg-light rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-border-soft transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-4 bg-danger text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-danger/20 hover:bg-danger-dark transition-all"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
