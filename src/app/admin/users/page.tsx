'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAdmin } from '@/lib/admin-context'
import { useState } from 'react'
import { SharedLayout } from '@/app/components/shared-layout'

function UsersManagementContent() {
  const { users, addUser, updateUser, removeUser, addEvent, createDefaultEventForUser } = useAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', type: 'noivos' as 'noivos' | 'admin' })
  const [editingUser, setEditingUser] = useState<any>(null)

  // Função para gerar iniciais inteligentes (ex: Isabella e Felipe -> I&F)
  const getUserInitials = (name: string) => {
    if (!name) return '?'
    // Limpar prefixos comuns
    const cleanName = name.replace(/^(?:Casamento|Debutante|15 Anos|Evento|Festa)\s+/i, '').trim()
    const coupleParts = cleanName.split(/\s+(?:e|&)\s+/i)
    if (coupleParts.length >= 2) {
      return `${coupleParts[0].trim().charAt(0)}&${coupleParts[1].trim().charAt(0)}`.toUpperCase()
    }
    return cleanName.charAt(0).toUpperCase()
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInviteUser = async () => {
    if (!newUser.name || !newUser.email) {
      alert('Preencha todos os campos')
      return
    }

    setIsSending(true)

    try {
      const userToInvite = {
        id: crypto.randomUUID(),
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
        eventsCount: 0,
        createdAt: new Date()
      }

      await addUser(userToInvite)

      // Criar evento automático se for Noivos (usando a nova função centralizada do contexto)
      if (newUser.type === 'noivos') {
        await createDefaultEventForUser(newUser.email, newUser.name)
      }

      // Lógica de Onboarding Passo a Passo para o Email
      const onboardingSteps = newUser.type === 'noivos' ? `
1️⃣  Acesse o link: ${window.location.origin}/
2️⃣  Faça seu cadastro utilizando este e-mail.
3️⃣  Configure as informações (Data, Local e Fotos).
4️⃣  Importe sua lista de convidados pelo modelo Excel.
5️⃣  Acompanhe as confirmações em tempo real! 📊
      ` : `
1️⃣  Confirme seu acesso administrativo.
2️⃣  Gerencie todos os eventos da plataforma.
3️⃣  Acesse relatórios e métricas globais.
      `

      // Chamada para a nova API de e-mail automático (Hostinger SMTP)
      const response = await fetch('/api/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          type: newUser.type,
          onboardingSteps: onboardingSteps.trim()
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.details || 'Falha no envio do e-mail')

      setNewUser({ name: '', email: '', type: 'noivos' })
      setShowInviteModal(false)
      alert('Usuário convidado e e-mail automático enviado! ✨')
    } catch (error: any) {
      console.error('Erro ao convidar usuário:', error)
      alert(`Erro: ${error.message}\n\nO usuário foi cadastrado, mas o e-mail falhou.`)
    } finally {
      setIsSending(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    setIsSending(true)
    try {
      await updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        type: editingUser.type
      })
      setShowEditModal(false)
      setEditingUser(null)
      alert('Usuário atualizado com sucesso!')
    } catch (error) {
      alert('Erro ao atualizar usuário')
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover o acesso deste usuário? Esta ação não pode ser desfeita.')) return

    setIsSending(true)
    try {
      await removeUser(id)
      setShowEditModal(false)
      setEditingUser(null)
      alert('Usuário removido do sistema.')
    } catch (error) {
      alert('Erro ao remover usuário')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <SharedLayout
      role="admin"
      title="Gerenciar Usuários"
      subtitle="Adicione noivos e administradores"
      headerActions={
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          ➕ Convidar Usuário
        </button>
      }
    >
      {/* Search bar */}
      <div className="bg-surface rounded-2xl border border-border-soft shadow-sm mb-4 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</div>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-light border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner placeholder:text-text-muted text-text-primary outline-none"
          />
        </div>
        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">
          {filteredUsers.length} usuário(s)
        </p>
      </div>

      {/* CARDS GRID */}
      {filteredUsers.length === 0 ? (
        <div className="bg-surface rounded-[2.5rem] border border-border-soft shadow-sm py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
          <span className="text-5xl opacity-20">👥</span>
          <p className="text-[10px] font-black uppercase tracking-widest">Nenhum administrador encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="bg-surface rounded-[2.5rem] border border-border-soft shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 group overflow-hidden flex flex-col"
            >
              <div className="p-8 pb-6 flex-1">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-bg-light flex items-center justify-center text-text-muted font-black uppercase shadow-inner group-hover:scale-110 transition-transform ${getUserInitials(u.name).length > 2 ? 'text-sm' : 'text-xl'}`}>
                      {getUserInitials(u.name)}
                    </div>
                    <div>
                      <h4 className="text-lg font-serif font-black text-text-primary tracking-tight leading-tight mb-1">{u.name}</h4>
                      <div className={`badge ${u.type === 'admin'
                        ? 'badge-success'
                        : u.name.toLowerCase().includes('debutante') || u.name.toLowerCase().includes('15 anos')
                          ? 'bg-warning-light text-warning-dark border-warning/20'
                          : 'badge-primary'
                        }`}>
                        {u.type === 'admin'
                          ? '👑 Administrador'
                          : u.name.toLowerCase().includes('debutante') || u.name.toLowerCase().includes('15 anos')
                            ? '💃 Debutante'
                            : '💒 Casamento'
                        }
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingUser({ ...u })
                      setShowEditModal(true)
                    }}
                    className="w-10 h-10 bg-bg-light text-text-muted rounded-xl flex items-center justify-center hover:bg-brand hover:text-white transition-all shadow-inner"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <span>E-mail de Acesso</span>
                    <span className="text-text-secondary lowercase font-bold">{u.email}</span>
                  </div>
                  <div className="h-px bg-border-soft" />
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <span>Membro desde</span>
                    <span className="text-text-secondary font-bold">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* DARK INFO BAR */}
              <div className="bg-brand-dark px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-brand-pale uppercase tracking-widest">Eventos</span>
                  <span className="text-sm font-black text-white">{u.eventsCount}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-success uppercase tracking-widest">
                  Ativo <span className="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_10px_rgba(107,165,131,0.6)]"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-surface rounded-[3.5rem] shadow-2xl border border-border-soft max-w-md w-full p-10 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight mb-8 italic text-center">Configurar Usuário</h3>

            <div className="space-y-5 mb-10 text-left">
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2.5 ml-1">Nome</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-6 py-4 bg-bg-light border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2.5 ml-1">E-mail</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-6 py-4 bg-bg-light border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2.5 ml-1">Tipo de Acesso</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditingUser({ ...editingUser, type: 'noivos' })}
                    className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${editingUser.type === 'noivos' ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-surface text-text-muted border-border-soft hover:border-brand/20'}`}
                  >
                    ❤️ Noivos
                  </button>
                  <button
                    onClick={() => setEditingUser({ ...editingUser, type: 'admin' })}
                    className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${editingUser.type === 'admin' ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-surface text-text-muted border-border-soft hover:border-brand/20'}`}
                  >
                    👑 Admin
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-4 bg-bg-light rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-secondary transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={isSending}
                  className="flex-2 px-4 py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/30 hover:bg-brand-dark transition-all disabled:opacity-50"
                >
                  Salvar Alterações
                </button>
              </div>
              <button
                onClick={() => handleDeleteUser(editingUser.id)}
                disabled={isSending}
                className="w-full px-4 py-3 bg-danger-light/30 text-danger rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-danger-light transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>⚠️</span> Remover Acesso Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-surface rounded-[3.5rem] shadow-2xl border border-border-soft max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row">

            {/* Form Side */}
            <div className="flex-1 p-8 md:p-12">
              <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight mb-8 italic">Convidar no App</h3>

              <div className="space-y-5 mb-10">
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2.5 ml-1">Nome Completo</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Fulano de Tal"
                    className="w-full px-6 py-4 bg-bg-light border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary transition-all outline-none placeholder:text-text-muted/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2.5 ml-1">E-mail de Acesso</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@email.com"
                    className="w-full px-6 py-4 bg-bg-light border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary transition-all outline-none placeholder:text-text-muted/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2.5 ml-1">Nível de Permissão</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNewUser({ ...newUser, type: 'noivos' })}
                      className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${newUser.type === 'noivos' ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-surface text-text-muted border-border-soft hover:border-brand/20'}`}
                    >
                      ❤️ Noivos
                    </button>
                    <button
                      onClick={() => setNewUser({ ...newUser, type: 'admin' })}
                      className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${newUser.type === 'admin' ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-surface text-text-muted border-border-soft hover:border-brand/20'}`}
                    >
                      👑 Admin
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-4.5 bg-bg-light rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-secondary transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInviteUser}
                  disabled={isSending}
                  className="flex-3 px-8 py-4.5 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/30 hover:bg-brand-dark hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                  {isSending ? 'Enviando...' : (
                    <>
                      Enviar Convite & Guia
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info Path Side (Step by Step Preview) */}
            <div className="hidden md:flex w-72 bg-bg-light border-l border-border-soft p-10 flex-col justify-center">
              <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-8">Guia de Boas-vindas</p>

              <div className="space-y-8">
                {[
                  { step: '01', title: 'Habilitação', desc: 'O sistema libera o e-mail no banco de dados.' },
                  { step: '02', title: 'E-mail Automático', desc: 'O disparo é feito com as instruções de login.' },
                  { step: '03', title: 'Onboarding', desc: 'Apresentamos os 5 passos para configurar o evento.' },
                  { step: '04', title: 'Sucesso', desc: 'O casal começa a receber confirmações.' }
                ].map((s, i) => (
                  <div key={i} className="relative">
                    <span className="text-[9px] font-black text-brand-dark/20 absolute -left-6 top-1 tracking-widest">{s.step}</span>
                    <h5 className="text-[11px] font-black text-text-primary uppercase tracking-widest mb-1.5">{s.title}</h5>
                    <p className="text-[10px] font-medium text-text-muted leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  )
}

export default function UsersManagement() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <UsersManagementContent />
    </ProtectedRoute>
  )
}
