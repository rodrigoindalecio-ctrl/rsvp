'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useEvent } from '@/lib/event-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { ConfirmDialog } from '@/app/components/confirm-dialog'
import { SharedLayout } from '@/app/components/shared-layout'
import ExcelJS from 'exceljs'
import { formatDate } from '@/lib/date-utils'
import { toast } from 'sonner'

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
  const { events, updateEvent } = useAdmin()
  const { guests, loading: guestsLoading, removeGuest, addGuestsBatch, metrics, updateGuestStatus } = useEvent()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all')
  const [activeCategory, setActiveCategory] = useState<'all' | 'adult_paying' | 'child_paying' | 'child_not_paying'>('all')
  const [showStats, setShowStats] = useState(false)
  const [showGuests, setShowGuests] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; guestId?: string }>({ isOpen: false })
  const [deleteAllConfirmDialog, setDeleteAllConfirmDialog] = useState({ isOpen: false, step: 1 })
  const [showQrModal, setShowQrModal] = useState(false)

  // Dados financeiros e da lista de presentes
  const [giftStats, setGiftStats] = useState<{
    totalNet: number;
    availableNet: number;
    pendingNet: number;
    totalBruto: number;
    count: number;
  }>({ totalNet: 0, availableNet: 0, pendingNet: 0, totalBruto: 0, count: 0 })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [giftsListCount, setGiftsListCount] = useState(0)
  const [loadingGifts, setLoadingGifts] = useState(true)

  useEffect(() => {
    const foundEvent = events.find(e => e.id === eventId)
    if (foundEvent) {
      setEvent(foundEvent)
    }
  }, [events, eventId])

  useEffect(() => {
    if (!eventId) return
    setLoadingGifts(true)
    fetch(`/api/events/${eventId}/gifts`)
      .then(r => r.json())
      .then(data => {
        if (data.stats) {
          const totalBruto = (data.transactions || []).reduce((acc: number, t: any) => acc + (t.amount || 0), 0)
          setGiftStats({
            totalNet: data.stats.totalNet || 0,
            availableNet: data.stats.availableNet || 0,
            pendingNet: data.stats.pendingNet || 0,
            totalBruto: totalBruto,
            count: (data.transactions || []).length
          })
        }
        if (data.transactions) {
          setRecentTransactions(data.transactions.slice(0, 5))
        }
        if (data.gifts) {
          setGiftsListCount(data.gifts.length)
        }
      })
      .catch(err => console.error('Erro ao carregar métricas de presentes:', err))
      .finally(() => setLoadingGifts(false))
  }, [eventId])

  const countdownText = useMemo(() => {
    if (!event?.eventSettings?.eventDate) return null
    try {
      const eventDate = new Date(event.eventSettings.eventDate)
      const today = new Date()
      eventDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      const diffTime = eventDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 1) return `Faltam ${diffDays} dias`
      if (diffDays === 1) return 'É amanhã!'
      if (diffDays === 0) return 'É Hoje! 🎉'
      return `Realizado há ${Math.abs(diffDays)} dias`
    } catch (_) {
      return null
    }
  }, [event?.eventSettings?.eventDate])

  const slug = event?.slug || event?.eventSettings?.slug || ''
  
  const copyToClipboard = (urlPath: string, label: string) => {
    if (typeof window === 'undefined') return
    const fullUrl = `${window.location.origin}${urlPath}`
    navigator.clipboard.writeText(fullUrl)
    toast.success(`Link ${label} copiado!`, { description: fullUrl })
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0)
  }

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
      {/* EVENT BANNER WITH COUNTDOWN & PUBLIC LINKS */}
      <div className="bg-surface rounded-[2rem] border border-border-soft p-8 md:p-12 mb-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-4xl font-serif italic font-black text-brand tracking-tight">{event.eventSettings.coupleNames}</h2>
              {countdownText && (
                <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-pale text-brand border border-brand/10 shadow-sm flex items-center gap-1.5">
                  <span>⏳</span> {countdownText}
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-8 opacity-70">Painel de Gestão e Visão Geral do Evento</p>

          {/* Grid de Informações Básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 text-text-primary">
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">DATA E HORA</p>
              <p className="text-sm font-bold text-text-secondary leading-relaxed">
                {formatDate(event.eventSettings.eventDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {event.eventSettings.eventTime && <span className="block text-brand-dark/40 italic font-serif mt-0.5">às {event.eventSettings.eventTime}</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">STATUS DO EVENTO</p>
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-success/20 animate-ping absolute" />
                  <span className="w-2.5 h-2.5 rounded-full bg-success relative" />
                </div>
                <span className="text-sm font-bold text-text-secondary">Ativo & Recebendo</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">TIPO DE EVENTO</p>
              <p className="text-sm font-bold text-text-secondary leading-relaxed uppercase tracking-wider">
                {event.eventSettings.eventType === 'casamento' ? '💍 Casamento' : '🎉 Debutante'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">TOTAL DA LISTA</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-brand">{metrics.total}</p>
                <span className="text-[10px] font-bold text-text-muted uppercase">Pessoas</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">MÓDULO PRESENTES</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const newValue = !(event.eventSettings.isGiftListEnabled ?? true);
                    await updateEvent(eventId, {
                      eventSettings: { 
                        ...event.eventSettings, 
                        isGiftListEnabled: newValue,
                        giftListInternalEnabled: newValue 
                      }
                    });
                  }}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${(event.eventSettings.isGiftListEnabled ?? true) ? 'bg-brand' : 'bg-border-soft'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${(event.eventSettings.isGiftListEnabled ?? true) ? 'left-5.5' : 'left-0.5'}`} />
                </button>
                <span className={`text-[9px] font-black uppercase ${(event.eventSettings.isGiftListEnabled ?? true) ? 'text-success' : 'text-text-muted'}`}>
                  {(event.eventSettings.isGiftListEnabled ?? true) ? 'Habilitada' : 'Desativada'}
                </span>
              </div>
            </div>
          </div>

          {/* BARRA DE LINKS PÚBLICOS E COMPARTILHAMENTO */}
          <div className="mt-8 pt-8 border-t border-border-soft">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em]">Links Públicos do Casal</span>
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-brand/5 px-2.5 py-0.5 rounded-lg border border-brand/10">/{slug}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Site dos Noivos */}
              <div className="bg-bg-light/80 border border-border-soft rounded-2xl p-3.5 flex items-center justify-between gap-2 group hover:border-brand/30 transition-all">
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Site dos Noivos</p>
                  <p className="text-xs font-bold text-text-primary truncate">/{slug}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(`/${slug}`, 'do Site')}
                    className="p-2 bg-white hover:bg-brand hover:text-white text-text-muted rounded-xl border border-border-soft transition-all shadow-sm"
                    title="Copiar Link"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                  <a
                    href={`/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white hover:bg-brand hover:text-white text-text-muted rounded-xl border border-border-soft transition-all shadow-sm"
                    title="Abrir Site"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              </div>

              {/* Lista de Presentes */}
              <div className="bg-bg-light/80 border border-border-soft rounded-2xl p-3.5 flex items-center justify-between gap-2 group hover:border-brand/30 transition-all">
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Lista de Presentes</p>
                  <p className="text-xs font-bold text-text-primary truncate">/{slug}/presentes</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(`/${slug}/presentes`, 'da Lista de Presentes')}
                    className="p-2 bg-white hover:bg-brand hover:text-white text-text-muted rounded-xl border border-border-soft transition-all shadow-sm"
                    title="Copiar Link"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                  <a
                    href={`/${slug}/presentes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white hover:bg-brand hover:text-white text-text-muted rounded-xl border border-border-soft transition-all shadow-sm"
                    title="Abrir Lista"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              </div>

              {/* Confirmação RSVP */}
              <div className="bg-bg-light/80 border border-border-soft rounded-2xl p-3.5 flex items-center justify-between gap-2 group hover:border-brand/30 transition-all">
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">RSVP Direto</p>
                  <p className="text-xs font-bold text-text-primary truncate">/{slug}/confirmar</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(`/${slug}/confirmar`, 'do RSVP')}
                    className="p-2 bg-white hover:bg-brand hover:text-white text-text-muted rounded-xl border border-border-soft transition-all shadow-sm"
                    title="Copiar Link"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                  <a
                    href={`/${slug}/confirmar`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white hover:bg-brand hover:text-white text-text-muted rounded-xl border border-border-soft transition-all shadow-sm"
                    title="Abrir RSVP"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-bg-light/80 border border-border-soft rounded-2xl p-3.5 flex items-center justify-between gap-2 group hover:border-brand/30 transition-all">
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">QR Code do Evento</p>
                  <p className="text-xs font-bold text-text-primary truncate">Para convites físicos</p>
                </div>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="px-3 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-dark transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
                  Ver QR
                </button>
              </div>
            </div>
          </div>

          {/* BARRA DE AÇÕES RÁPIDAS (ATALHOS) */}
          <div className="mt-6 pt-6 border-t border-border-soft flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em]">Ações Rápidas</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => router.push(`/admin/evento/${eventId}/novo-convidado`)}
                className="px-4 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>+</span> Convidado
              </button>
              <button
                onClick={() => router.push(`/import?eventId=${eventId}`)}
                className="px-4 py-2 bg-surface border border-border-soft hover:border-brand/30 text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5"
              >
                📥 Importar Lista
              </button>
              <button
                onClick={() => router.push(`/dashboard/presentes/biblioteca?eventId=${eventId}`)}
                className="px-4 py-2 bg-surface border border-border-soft hover:border-brand/30 text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5"
              >
                🎁 Catálogo de Presentes
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-success/10 text-success-dark border border-success/20 hover:bg-success/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5"
              >
                📊 Exportar Excel
              </button>
              <button
                onClick={() => router.push(`/admin/evento/${eventId}/configuracoes`)}
                className="px-4 py-2 bg-surface border border-border-soft hover:border-brand/30 text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5"
              >
                ⚙️ Configurações
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN COCKPIT (RSVP & BUFFET + FINANCEIRO & PRESENTES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* CARD 1: RESUMO RSVP & BUFFET */}
        <div className="bg-surface rounded-[2.5rem] border border-border-soft p-8 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-border-soft">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-pale rounded-2xl flex items-center justify-center text-brand">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary tracking-tight">Presença & RSVP</h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Status em tempo real</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-brand tracking-tight leading-none block">
                  {metrics.total > 0 ? Math.round((metrics.confirmed / metrics.total) * 100) : 0}%
                </span>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Confirmados</span>
              </div>
            </div>

            {/* Barra Visual Segmentada */}
            {(() => {
              const totalVal = metrics.total || 1;
              const confPct = Math.round((metrics.confirmed / totalVal) * 100);
              const pendPct = Math.round((metrics.pending / totalVal) * 100);
              const declPct = Math.round((metrics.declined / totalVal) * 100);
              return (
                <div className="mb-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-2">
                    <span className="text-success-dark">Confirmados: {metrics.confirmed}</span>
                    <span className="text-warning">Pendentes: {metrics.pending}</span>
                    <span className="text-danger">Recusados: {metrics.declined}</span>
                  </div>
                  <div className="h-3 w-full bg-border-soft/60 rounded-full overflow-hidden flex shadow-inner">
                    <div style={{ width: `${confPct}%` }} className="bg-success transition-all duration-500" title={`Confirmados: ${metrics.confirmed}`} />
                    <div style={{ width: `${pendPct}%` }} className="bg-warning transition-all duration-500" title={`Pendentes: ${metrics.pending}`} />
                    <div style={{ width: `${declPct}%` }} className="bg-danger transition-all duration-500" title={`Recusados: ${metrics.declined}`} />
                  </div>
                </div>
              );
            })()}

            {/* Grid de Categorias */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-bg-light rounded-2xl p-3.5 border border-border-soft">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-1">Adultos</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-text-primary">{metrics.confirmedAdults}</span>
                  <span className="text-[10px] font-bold text-text-muted">/ {metrics.adults}</span>
                </div>
              </div>
              <div className="bg-bg-light rounded-2xl p-3.5 border border-border-soft">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-1">Crianças Pag.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-text-primary">{metrics.confirmedChildrenPaying}</span>
                  <span className="text-[10px] font-bold text-text-muted">/ {metrics.childrenPaying}</span>
                </div>
              </div>
              <div className="bg-bg-light rounded-2xl p-3.5 border border-border-soft">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-1">Crianças Isen.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-text-primary">{metrics.confirmedChildrenFree}</span>
                  <span className="text-[10px] font-bold text-text-muted">/ {metrics.childrenFree}</span>
                </div>
              </div>
            </div>

            {/* Destaque para o Buffet */}
            <div className="bg-brand/5 border border-brand/15 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm border border-brand/10 shrink-0">
                  🍽️
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand leading-none mb-1">Métricas do Buffet</p>
                  <p className="text-sm font-black text-text-primary leading-tight">
                    {(metrics.confirmedAdults || 0) + (metrics.confirmedChildrenPaying || 0)} <span className="text-[11px] font-normal text-text-muted">pratos pagantes</span>
                  </p>
                </div>
              </div>
              <div className="text-right border-l border-brand/10 pl-4">
                <p className="text-[8px] font-bold uppercase tracking-wider text-text-muted">Crianças Isentas</p>
                <p className="text-sm font-black text-text-secondary">{metrics.confirmedChildrenFree || 0}</p>
              </div>
            </div>
          </div>

          {/* Botão de Controle da Tabela */}
          <button
            onClick={() => setShowGuests(!showGuests)}
            className="w-full py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/15 hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
            {showGuests ? 'Ocultar Lista de Convidados' : `Gerenciar Lista de Convidados (${metrics.total})`}
          </button>
        </div>

        {/* CARD 2: LISTA DE PRESENTES & FINANCEIRO */}
        <div className="bg-surface rounded-[2.5rem] border border-border-soft p-8 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-border-soft">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-pale rounded-2xl flex items-center justify-center text-brand">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary tracking-tight">Finanças & Presentes</h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Arrecadação e Resgates</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${(event.eventSettings.isGiftListEnabled ?? true) ? 'bg-success/10 text-success-dark border-success/20' : 'bg-bg-light text-text-muted border-border-soft'}`}>
                {(event.eventSettings.isGiftListEnabled ?? true) ? 'Lista Ativa' : 'Lista Desativada'}
              </span>
            </div>

            {/* Grid Financeiro 2x2 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-bg-light rounded-2xl p-4 border border-border-soft">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-1">Total Arrecadado (Líq)</p>
                <p className="text-lg font-black text-brand leading-none mb-1">
                  {formatCurrency(giftStats.totalNet)}
                </p>
                <p className="text-[9px] font-bold text-text-muted">
                  Bruto: {formatCurrency(giftStats.totalBruto)}
                </p>
              </div>

              <div className="bg-bg-light rounded-2xl p-4 border border-border-soft">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-1">Disponível p/ Resgate</p>
                <p className="text-lg font-black text-success-dark leading-none mb-1">
                  {formatCurrency(giftStats.availableNet)}
                </p>
                <p className="text-[9px] font-bold text-text-muted">
                  {giftStats.pendingNet > 0 ? `+ ${formatCurrency(giftStats.pendingNet)} a liberar` : 'Saldo liberado'}
                </p>
              </div>

              <div className="bg-bg-light rounded-2xl p-4 border border-border-soft">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-1">Presentes Recebidos</p>
                <p className="text-lg font-black text-text-primary leading-none mb-1">
                  {giftStats.count}
                </p>
                <p className="text-[9px] font-bold text-text-muted">transações pagas</p>
              </div>

              <div className="bg-bg-light rounded-2xl p-4 border border-border-soft">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-1">Catálogo de Presentes</p>
                <p className="text-lg font-black text-text-primary leading-none mb-1">
                  {giftsListCount}
                </p>
                <p className="text-[9px] font-bold text-text-muted">itens cadastrados</p>
              </div>
            </div>

            {/* Feed dos Últimos Presentes Recebidos */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Últimas Contribuições</p>
                <a href={`/${slug}/presentes`} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-brand uppercase tracking-wider hover:underline">
                  Ver no Site ↗
                </a>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-2">
                  {recentTransactions.map((tx: any) => (
                    <div key={tx.id} className="bg-bg-light border border-border-soft rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 bg-brand-pale text-brand rounded-lg flex items-center justify-center shrink-0 font-black text-[10px]">
                          🎁
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-text-primary truncate">{tx.guestName || 'Convidado Anônimo'}</p>
                          <p className="text-[9px] text-text-muted">
                            {tx.createdAt ? formatDate(tx.createdAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-brand shrink-0">
                        {formatCurrency(tx.amount || tx.amountNet)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-bg-light/60 border border-border-soft rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-text-muted mb-1">Nenhum presente recebido ainda.</p>
                  <p className="text-[10px] text-text-muted/70 mb-3">Compartilhe o link da lista com seus convidados para começar a receber!</p>
                  <button
                    onClick={() => copyToClipboard(`/${slug}/presentes`, 'da Lista de Presentes')}
                    className="px-4 py-1.5 bg-white border border-border-soft rounded-xl text-[9px] font-black text-brand uppercase tracking-wider hover:bg-brand hover:text-white transition-all shadow-sm"
                  >
                    Copiar Link da Lista
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação da Lista */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/admin/withdrawals')}
              className="py-3.5 bg-white border border-border-soft text-text-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:border-brand/40 transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              Resgates / Carteira
            </button>
            <button
              onClick={() => router.push(`/dashboard/presentes/biblioteca?eventId=${eventId}`)}
              className="py-3.5 bg-brand-pale text-brand border border-brand/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-brand hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Gerenciar Presentes
            </button>
          </div>
        </div>

      </div>

      {/* GUEST LIST MANAGEMENT (EXPANDABLE) */}
      {showGuests && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              <h3 className="text-lg font-black text-text-primary tracking-tight uppercase tracking-widest text-[11px]">Gerenciamento de Convidados</h3>
            </div>
            <button
              onClick={() => setShowGuests(false)}
              className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline"
            >
              Ocultar Lista ✕
            </button>
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
        </div>
      )}

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
                    label="Adultos"
                    current={metrics.confirmedAdults}
                    total={metrics.adults}
                    color="brand"
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                  />
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

      {/* MODAL QR CODE DO EVENTO */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl border border-border-soft p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-bg-light border border-border-soft text-text-muted hover:text-text-primary flex items-center justify-center transition-all text-xs font-bold"
            >
              ✕
            </button>

            <div className="w-12 h-12 bg-brand-pale text-brand rounded-2xl flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
            </div>

            <h3 className="text-xl font-serif font-black text-brand mb-1 tracking-tight">QR Code do Evento</h3>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-6">
              {event.eventSettings.coupleNames}
            </p>

            {/* Imagem do QR Code */}
            <div className="p-4 bg-white rounded-2xl border border-border-soft shadow-inner mb-4 flex items-center justify-center">
              {typeof window !== 'undefined' && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/${slug}`)}`}
                  alt="QR Code do Evento"
                  className="w-48 h-48 object-contain"
                />
              )}
            </div>

            <p className="text-xs font-bold text-text-secondary truncate w-full mb-6 px-2 bg-bg-light py-2 rounded-xl border border-border-soft">
              {typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => copyToClipboard(`/${slug}`, 'do Site')}
                className="py-3 px-4 bg-surface border border-border-soft rounded-xl text-[10px] font-black uppercase tracking-wider text-text-primary hover:border-brand/40 transition-all shadow-sm"
              >
                Copiar Link 📋
              </button>
              <a
                href={typeof window !== 'undefined' ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`${window.location.origin}/${slug}`)}` : '#'}
                download={`qrcode_${slug}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-dark transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Baixar Imagem ⬇
              </a>
            </div>
          </div>
        </div>
      )}
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
