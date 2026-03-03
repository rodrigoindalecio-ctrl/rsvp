'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useEvent } from '@/lib/event-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/app/components/confirm-dialog'
import { SharedLayout } from '@/app/components/shared-layout'
import ExcelJS from 'exceljs'
import { formatDate } from '@/lib/date-utils'

function FilterPill({ label, count, active, onClick, color = 'brand' }: { label: string, count?: number, active: boolean, onClick: () => void, color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 border ${active
        ? 'bg-brand text-white border-brand'
        : 'bg-surface text-text-muted border-border-soft hover:border-brand-light/30 hover:text-brand'
        }`}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  )
}

function AdminEventoPageContent() {
  const { user } = useAuth()
  const { events } = useAdmin()
  const { guests, loading: guestsLoading, removeGuest, addGuestsBatch, metrics, updateGuestStatus } = useEvent()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all')
  const [activeCategory, setActiveCategory] = useState<'all' | 'adult_paying' | 'child_paying' | 'child_not_paying'>('all')
  const [showStats, setShowStats] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; guestId?: string }>({ isOpen: false })
  const [deleteAllConfirmDialog, setDeleteAllConfirmDialog] = useState({ isOpen: false, step: 1 })

  useEffect(() => {
    const foundEvent = events.find(e => e.id === eventId)
    if (foundEvent) {
      setEvent(foundEvent)
    }
  }, [events, eventId])

  function handleDeleteGuest(guestId: string) {
    setDeleteConfirmDialog({ isOpen: true, guestId })
  }

  async function handleExportExcel() {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Lista de Convidados')

    // 1. Estilização do Cabeçalho
    const headerRow = worksheet.addRow([
      'NOME COMPLETO',
      'CATEGORIA',
      'GRUPO / FAMÍLIA',
      'TELEFONE',
      'STATUS',
      'ACOMPANHANTES',
      'DATA CONFIRMAÇÃO'
    ])

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF8B2D4F' } // Cor Brand
      }
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    worksheet.getRow(1).height = 30

    // 2. Mapeamento de Categorias para nomes amigáveis
    const categoryLabel = (cat: string) => {
      if (cat === 'adult_paying') return 'Adulto'
      if (cat === 'child_paying') return 'Criança (Pagante)'
      if (cat === 'child_not_paying') return 'Criança (Isenta)'
      return 'Adulto'
    }

    // 3. Adicionar dados
    guests.forEach(guest => {
      const row = worksheet.addRow([
        guest.name.toUpperCase(),
        categoryLabel(guest.category),
        guest.grupo || '-',
        guest.telefone || '-',
        guest.status === 'confirmed' ? 'CONFIRMADO' : (guest.status === 'declined' ? 'RECUSADO' : 'PENDENTE'),
        guest.companionsList?.map(c => `${c.name} (${categoryLabel(c.category || 'adult_paying')})`).join(', ') || 'Nenhum',
        guest.confirmedAt ? formatDate(guest.confirmedAt.toISOString(), { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
      ])

      // Estilo condicional para Status
      const statusCell = row.getCell(5)
      if (guest.status === 'confirmed') {
        statusCell.font = { color: { argb: 'FF107C10' }, bold: true }
      } else if (guest.status === 'declined') {
        statusCell.font = { color: { argb: 'FFA50000' }, bold: true }
      }

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: guest.companionsList?.length ? 'left' : 'center' }
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        }
      })
    })

    // 4. Ajustar largura das colunas
    worksheet.columns.forEach((column, i) => {
      let maxLength = 0
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10
        if (columnLength > maxLength) maxLength = columnLength
      })
      column.width = Math.min(Math.max(maxLength + 5, 15), 50)
    })

    // 5. Gerar o arquivo
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Lista_Convidados_${event.eventSettings.coupleNames.replace(/\s+/g, '_')}.xlsx`
    link.click()
  }

  if (!event) {
    return (
      <SharedLayout role="admin" title="Carregando...">
        <div className="p-20 text-center text-text-muted font-bold">Aguarde...</div>
      </SharedLayout>
    )
  }

  const filteredGuests = guests.filter((guest: any) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = activeFilter === 'all' || guest.status === activeFilter
    const matchesCategory = activeCategory === 'all' || guest.category === activeCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const { total, confirmed, pending, declined } = metrics

  return (
    <SharedLayout
      role="admin"
      title={event.eventSettings.coupleNames}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/admin/evento/${eventId}/configuracoes`)}
            className="w-10 h-10 flex items-center justify-center bg-surface border border-border-soft rounded-xl text-text-muted hover:text-brand transition-all shadow-sm"
            title="Configurações"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
          <button
            onClick={() => router.push(`/admin/evento/${eventId}/novo-convidado`)}
            className="w-10 h-10 flex items-center justify-center bg-brand text-white rounded-xl shadow-lg shadow-brand-dark/20 hover:scale-105 active:scale-95 transition-all"
            title="Novo Convidado"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      }
    >
      {/* EVENT BANNER (Legacy UI Style) */}
      <div className="bg-surface rounded-[2rem] border border-border-soft p-8 md:p-12 mb-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-serif italic font-black text-brand mb-2 tracking-tight">{event.eventSettings.coupleNames}</h2>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-10 opacity-70">Gestão de Convidados e RSVP</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 text-text-primary">
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">DATA E HORA</p>
              <p className="text-sm font-bold text-text-secondary leading-relaxed">
                {formatDate(event.eventSettings.eventDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {event.eventSettings.eventTime && <span className="block text-brand-dark/40 italic font-serif mt-1">às {event.eventSettings.eventTime}</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">STATUS DO EVENTO</p>
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-success/20 animate-ping absolute" />
                  <span className="w-2.5 h-2.5 rounded-full bg-success relative" />
                </div>
                <span className="text-sm font-bold text-text-secondary">Ativo & Recebendo</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">TIPO DE EVENTO</p>
              <p className="text-sm font-bold text-text-secondary leading-relaxed uppercase tracking-wider">
                {event.eventSettings.eventType === 'casamento' ? '💍 Casamento' : '🎉 Debutante'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">TOTAL DA LISTA</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-brand">{metrics.total}</p>
                <span className="text-[10px] font-bold text-text-muted uppercase">Pessoas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 border ${activeCategory !== 'all'
              ? 'bg-brand text-white border-brand'
              : 'bg-surface text-text-muted border-border-soft hover:border-brand-light/30 hover:text-brand'
              }`}
          >
            {activeCategory === 'all' ? 'Categoria' :
              activeCategory === 'adult_paying' ? 'Adultos' :
                activeCategory === 'child_paying' ? 'Crianças Pagantes' : 'Crianças Isentas'} ▾
          </button>

          {showCategoryMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-border-soft p-2 z-20 animate-in fade-in slide-in-from-top-2">
                {[
                  { id: 'all', label: 'Todas Categorias' },
                  { id: 'adult_paying', label: 'Adultos' },
                  { id: 'child_paying', label: 'Crianças Pagantes' },
                  { id: 'child_not_paying', label: 'Crianças Isentas' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id as any)
                      setShowCategoryMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.id ? 'bg-brand/10 text-brand' : 'hover:bg-bg-light text-text-muted'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <FilterPill label="Pendentes" count={metrics.pending} active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')} />
        <FilterPill label="Presentes" count={metrics.confirmed} active={activeFilter === 'confirmed'} onClick={() => setActiveFilter('confirmed')} />
        <FilterPill label="Todos" count={metrics.total} active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
        <FilterPill label="Estatísticas" active={showStats} onClick={() => setShowStats(true)} />
        <button
          onClick={handleExportExcel}
          className="px-6 py-2.5 bg-success-light text-success-dark border border-success/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 hover:bg-success/20"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Exportar Lista
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-8 py-4 bg-surface border border-border-soft rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-brand/5 placeholder:text-text-muted transition-all text-text-primary"
          />
        </div>
        <button
          onClick={() => router.push(`/admin/evento/${eventId}/novo-convidado`)}
          className="w-14 h-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-dark/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="text-2xl font-black">+</span>
        </button>
      </div>

      {/* GUEST LIST */}
      <div className="space-y-4">
        {filteredGuests.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-3xl border border-border-soft">
            <p className="text-text-muted font-black uppercase tracking-widest text-[10px]">Nenhum convidado nesta listagem...</p>
          </div>
        ) : (
          filteredGuests.map((guest: any) => (
            <div
              key={guest.id}
              className="bg-surface rounded-[2rem] p-6 md:px-10 border border-border-soft flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-brand/[0.02] transition-all group animate-in fade-in"
            >
              <div className="flex flex-col gap-1">
                <h4 className="text-lg font-black text-text-primary tracking-tight">
                  {guest.name}
                </h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-brand/5 text-[8px] font-black uppercase tracking-widest text-brand rounded-lg border border-brand/10">
                    {guest.category === 'adult_paying' ? 'Adulto' : guest.category === 'child_paying' ? 'Criança Pagante' : 'Criança Isenta'}
                  </span>
                  {guest.grupo && (
                    <span className="px-3 py-1 bg-bg-light text-[8px] font-black uppercase tracking-widest text-text-muted rounded-lg border border-border-soft">
                      Grupo: {guest.grupo}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest ${guest.status === 'confirmed' ? 'bg-success/10 border-success/20 text-success-dark' : guest.status === 'declined' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-bg-light border-border-soft text-text-muted'}`}>
                  {guest.status === 'confirmed' ? 'Confirmado' : guest.status === 'declined' ? 'Recusado' : 'Pendente'}
                </div>

                {guest.status !== 'confirmed' ? (
                  <button
                    onClick={() => updateGuestStatus(guest.id, 'confirmed')}
                    className="px-8 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-dark/20 hover:bg-brand-dark hover:-translate-y-0.5 transition-all"
                  >
                    Confirmar presença
                  </button>
                ) : (
                  <button
                    onClick={() => updateGuestStatus(guest.id, 'pending')}
                    className="px-8 py-3 bg-success-light text-success-dark border border-success/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-success/10 transition-all"
                  >
                    Presença Confirmada ✓
                  </button>
                )}

                <button
                  onClick={() => handleDeleteGuest(guest.id)}
                  className="w-10 h-10 flex items-center justify-center border border-border-soft bg-bg-light rounded-xl text-text-muted hover:text-danger hover:border-danger/20 transition-all group"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Dialogs */}
      {/* STATS MODAL */}
      {showStats && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStats(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-border-soft overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-text-primary tracking-tight">Estatísticas do Evento</h3>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Detalhamento Completo</p>
                </div>
                <button
                  onClick={() => setShowStats(false)}
                  className="w-10 h-10 flex items-center justify-center bg-bg-light rounded-xl text-text-muted hover:text-brand transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <StatItem
                    label="Crianças Pagantes"
                    current={metrics.confirmedChildrenPaying}
                    total={metrics.childrenPaying}
                    color="warning"
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                  />
                  <StatItem
                    label="Crianças Isentas"
                    current={metrics.confirmedChildrenFree}
                    total={metrics.childrenFree}
                    color="success"
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>}
                  />
                </div>

                <div className="p-8 bg-bg-light rounded-[2rem] border border-border-soft">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Resumo de Confirmação</span>
                    <span className="text-xl font-black text-brand">{Math.round((metrics.confirmed / (metrics.total || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-border-soft shadow-inner">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-1000"
                      style={{ width: `${(metrics.confirmed / (metrics.total || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-4">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest text-center w-full">
                      <strong className="text-text-primary">{metrics.confirmed}</strong> de {metrics.total} presentes confirmados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Dialogs */}
      <ConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        title="Excluir Convidado"
        message="Tem certeza que deseja remover este convidado da lista? Esta ação não pode ser desfeita."
        onConfirm={async () => {
          if (deleteConfirmDialog.guestId) {
            await removeGuest(deleteConfirmDialog.guestId)
            setDeleteConfirmDialog({ isOpen: false })
          }
        }}
        onCancel={() => setDeleteConfirmDialog({ isOpen: false })}
      />
    </SharedLayout>
  )
}

function StatItem({ label, current, total, color, icon }: { label: string, current: number, total: number, color: 'brand' | 'warning' | 'success', icon: React.ReactNode }) {
  const colorMap = {
    brand: 'text-brand bg-brand-pale/50 border-brand/20',
    warning: 'text-warning bg-warning-light/50 border-warning/20',
    success: 'text-success-dark bg-success-light/50 border-success/20'
  }

  return (
    <div className="p-5 bg-surface border border-border-soft rounded-[1.5rem] flex items-center justify-between shadow-sm group hover:border-brand/30 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md border transition-transform group-hover:scale-110 ${colorMap[color]}`}>
          {icon}
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1.5">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-text-primary tracking-tighter">{current}</span>
            <span className="text-[10px] font-bold text-text-muted">/ {total}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[10px] font-black text-brand-dark/20 uppercase tracking-[0.2em]">Confirmados</span>
      </div>
    </div>
  )
}

export default function AdminEventoPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminEventoPageContent />
    </ProtectedRoute>
  )
}
