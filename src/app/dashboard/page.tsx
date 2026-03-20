'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent, Guest, GuestStatus, GuestCategory } from '@/lib/event-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { GuestEditModal } from './guest-edit-modal'
import { ConfirmDialog } from '@/app/components/confirm-dialog'
import { formatDate } from '@/lib/date-utils'
import { SharedLayout } from '@/app/components/shared-layout'
import Link from 'next/link'
import GiftManagementTab from '@/app/components/GiftManagementTab'
import MuralMessagesTab from '@/app/components/MuralMessagesTab'
import { OnboardingTour, TourStep } from '@/app/components/onboarding-tour'

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const { guests, eventSettings, metrics, updateGuestStatus, removeGuest, removeCompanion, updateGuest, refreshData, eventId } = useEvent()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'guests' | 'gifts' | 'messages'>('guests')

  // States for UX
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'declined'>('all')
  const [activeCategory, setActiveCategory] = useState<'all' | 'adult_paying' | 'child_paying' | 'child_not_paying'>('all')
  const [showStats, setShowStats] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; person?: any }>({ isOpen: false })
  const [deleteAllConfirmDialog, setDeleteAllConfirmDialog] = useState({ isOpen: false, step: 1 })
  const [whatsappConfirmDialog, setWhatsappConfirmDialog] = useState<{ isOpen: boolean; guest?: Guest }>({ isOpen: false })

  // Onboarding Tour state
  const [isTourOpen, setIsTourOpen] = useState(false)
  
  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-welcome-intro', // ID inexistente → fallback elegante para centro
      title: 'Bem-vindo ao seu Painel! 🏠',
      content: 'Este é o coração do seu evento. Aqui você tem uma visão geral de tudo o que está acontecendo.',
      position: 'center'
    },
    {
      targetId: 'tour-invite',
      title: 'Seu Convite Digital 💌',
      content: 'Aqui está o seu link personalizado. Copie e envie para seus convidados. É por este link que eles acessarão o site e farão o RSVP.',
      position: 'bottom'
    },
    {
      targetId: 'tour-stats',
      title: 'Acompanhe os Números 📊',
      content: 'Clique aqui para ver estatísticas detalhadas do buffet, como total de adultos e crianças confirmadas.',
      position: 'bottom'
    },
    {
      targetId: 'tour-rsvp',
      title: 'Gestão de Convidados 👥',
      content: 'Aqui você gerencia sua lista. Pode importar nomes do Excel, exportar a lista atualizada para o buffet ou limpar tudo se precisar recomeçar.',
      position: 'top'
    },
    {
      targetId: 'tour-avatar',
      title: 'Configurações e Perfil ⚙️',
      content: 'Aqui no seu perfil você acessa as configurações para definir o prazo final de confirmação e personalizar a URL do seu site.',
      position: 'left'
    }
  ]

  const { updateEventSettings } = useEvent()

  useEffect(() => {
    // Só inicia o tour se as configurações já foram carregadas e o onboarding não foi feito
    if (!loading && user && eventSettings && eventSettings.hasCompletedOnboarding !== true && !isTourOpen) {
       // Pequeno delay para garantir que o DOM renderizou
       const timer = setTimeout(() => setIsTourOpen(true), 1500)
       return () => clearTimeout(timer)
    }
  }, [loading, user, eventSettings, isTourOpen])

  const handleTourComplete = async () => {
    setIsTourOpen(false)
    await updateEventSettings({ hasCompletedOnboarding: true })
    // Após o término do tour, redireciona para configurações
    router.push('/settings?onboarding=true')
  }

  const handleTourSkip = async () => {
    setIsTourOpen(false)
    await updateEventSettings({ hasCompletedOnboarding: true })
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      refreshData()
    }
  }, [user, loading, router, refreshData])

  // Reset tab if module is disabled
  useEffect(() => {
    if (eventSettings.isGiftListEnabled === false && (activeTab === 'gifts' || activeTab === 'messages')) {
      setActiveTab('guests')
    }
  }, [eventSettings.isGiftListEnabled, activeTab])

  const handleEditClick = (guest: Guest) => {
    setEditingGuest(guest)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = (updatedGuest: Guest) => {
    // Atualiza todos os campos do guest em uma única operação
    updateGuest(updatedGuest.id, {
      name: updatedGuest.name,
      email: updatedGuest.email,
      telefone: updatedGuest.telefone,
      grupo: updatedGuest.grupo,
      status: updatedGuest.status,
      category: updatedGuest.category,
      companions: updatedGuest.companions,
      companionsList: updatedGuest.companionsList
    })
    setIsEditModalOpen(false)
    setEditingGuest(null)
  }

  const handleDeleteGuest = (guestId: string) => {
    removeGuest(guestId)
    setIsEditModalOpen(false)
    setEditingGuest(null)
  }
  
  const handleWhatsAppReminder = (person: FlattenedGuest) => {
    const guest = guests.find(g => g.id === person.guestId)
    if (!guest) return
    
    const phone = guest.telefone?.replace(/\D/g, '')
    if (!phone) {
      setWhatsappConfirmDialog({ isOpen: true, guest })
      return
    }
    
    const coupleNames = eventSettings.coupleNames || 'os noivos'
    const eventSlug = eventSettings.slug || 'dashboard'
    const url = `${window.location.origin}/${eventSlug}`
    
    // Identifica o tipo de evento para a mensagem
    const eventTypeText = eventSettings.eventType === 'casamento' ? 'o nosso Casamento' : 'a nossa Festa de Debutante'
    
    // Formata as datas para o padrão brasileiro
    const eventDateStr = formatDate(eventSettings.eventDate, { day: '2-digit', month: '2-digit', year: 'numeric' })
    const deadlineStr = formatDate(eventSettings.confirmationDeadline, { day: '2-digit', month: '2-digit', year: 'numeric' })
    const eventTimeStr = eventSettings.eventTime || 'horário definido no convite'

    const message = `Olá, ${person.name}! 👋 Tudo bem?\n\nAqui é ${coupleNames}.\n\nEstamos a poucos dias de ${eventTypeText}! Será no dia ${eventDateStr} às ${eventTimeStr}. 💒\n\nNosso buffet precisa da lista final, e a confirmação oficial deve ser feita EXCLUSIVAMENTE pelo link abaixo, pois é por ele que os nomes serão validados para a entrada no evento:\n\n🔗 ${url}\n\n⚠️ Importante: Precisamos da sua confirmação até o dia ${deadlineStr}. Após essa data, fecharemos a lista final e, sem o registro no link, teremos que considerar sua ausência para a recepção. (Favor não responder apenas por aqui, valide pelo link acima).\n\nEstamos imensamente felizes em compartilhar esse dia especial com você! ❤️`
    
    // No Windows, às vezes o wa.me tem problemas com preenchimento via URL se não for disparado corretamente.
    // O encodeURIComponent é o padrão, vamos manter mas garantir a URL limpa.
    const whatsappUrl = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Flatten guests logic
  type FlattenedGuest = {
    uniqueId: string
    guestId: string
    companionIndex?: number
    name: string
    type: 'Principal' | 'Acompanhante'
    category: GuestCategory
    groupName: string
    status: GuestStatus
    updatedAt: Date
    confirmedAt?: Date
    telefone?: string
  }

  const allPeople: FlattenedGuest[] = useMemo(() => {
    return guests.flatMap(g => {
      // 1. O Titular
      const main: FlattenedGuest = {
        uniqueId: g.id + '-main',
        guestId: g.id,
        name: g.name,
        type: 'Principal',
        category: g.category,
        groupName: g.grupo || g.name,
        status: g.status,
        updatedAt: g.updatedAt,
        confirmedAt: g.confirmedAt ? new Date(g.confirmedAt) : undefined,
        telefone: g.telefone
      }

      // 2. Os Acompanhantes
      const companions: FlattenedGuest[] = g.companionsList.map((c, idx) => ({
        uniqueId: g.id + '-comp-' + idx,
        guestId: g.id,
        companionIndex: idx,
        name: c.name,
        type: 'Acompanhante',
        category: c.category || 'adult_paying',
        groupName: g.grupo || g.name,
        status: c.isConfirmed ? 'confirmed' : (g.status === 'pending' ? 'pending' : 'declined'),
        updatedAt: g.updatedAt,
        confirmedAt: g.confirmedAt ? new Date(g.confirmedAt) : undefined,
        telefone: g.telefone // O acompanhante herda o telefone do titular para contato
      }))

      return [main, ...companions]
    })
  }, [guests])

  // Filter flattened list
  const filteredPeople = useMemo(() => {
    return allPeople.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.groupName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filter === 'all' || p.status === filter
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory
      return matchesSearch && matchesFilter && matchesCategory
    })
  }, [allPeople, searchTerm, filter, activeCategory])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleCopyLink = () => {
    const slug = eventSettings.slug || user.name.toLowerCase().replace(/\s+/g, '-')
    const url = `${window.location.origin}/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportCSV = async () => {
    if (guests.length === 0) {
      alert('Nenhum convidado para exportar')
      return
    }

    try {
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Lista de Convidados')

      // 1. Estilização do Cabeçalho
      const headerRow = worksheet.addRow([
        'NOME COMPLETO',
        'TELEFONE',
        'CATEGORIA',
        'GRUPO / FAMÍLIA',
        'STATUS',
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

      // 2. Mapeamento de Categorias
      const categoryLabel = (cat: string) => {
        if (cat === 'adult_paying') return 'Adulto'
        if (cat === 'child_paying') return 'Criança (Pagante)'
        if (cat === 'child_not_paying') return 'Criança (Isenta)'
        return 'Adulto'
      }

      // 3. Adicionar dados (Usando allPeople para exportar linha a linha)
      allPeople.forEach(person => {
        const row = worksheet.addRow([
          person.name.toUpperCase(),
          person.telefone || '-',
          categoryLabel(person.category),
          person.groupName || '-',
          person.status === 'confirmed' ? 'CONFIRMADO' : (person.status === 'declined' ? 'RECUSADO' : 'PENDENTE'),
          person.confirmedAt ? formatDate(person.confirmedAt.toISOString(), { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
        ])

        // Estilo condicional para Status
        const statusCell = row.getCell(4)
        if (person.status === 'confirmed') {
          statusCell.font = { color: { argb: 'FF107C10' }, bold: true }
        } else if (person.status === 'declined') {
          statusCell.font = { color: { argb: 'FFA50000' }, bold: true }
        }

        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          }
        })
      })

      // 4. Ajustar largura das colunas
      worksheet.columns.forEach((column) => {
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
      link.download = `Lista_Convidados_${eventSettings.coupleNames.replace(/\s+/g, '_')}.xlsx`
      link.click()
    } catch (error) {
      console.error('❌ ERRO na exportação:', error)
      alert('Erro ao exportar: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleDelete = (person: FlattenedGuest) => {
    setDeleteConfirmDialog({ isOpen: true, person })
  }

  const confirmDeleteGuest = (person: FlattenedGuest) => {
    if (person.type === 'Principal') {
      removeGuest(person.guestId)
    } else if (person.companionIndex !== undefined) {
      removeCompanion(person.guestId, person.companionIndex)
    }
    setDeleteConfirmDialog({ isOpen: false })
  }

  const handleDeleteAllGuests = () => {
    setDeleteAllConfirmDialog({ isOpen: true, step: 1 })
  }

  const confirmDeleteAllFirstStep = () => {
    setDeleteAllConfirmDialog({ isOpen: true, step: 2 })
  }

  const confirmDeleteAllGuests = () => {
    guests.forEach(guest => {
      removeGuest(guest.id)
    })

    if (typeof window !== 'undefined') {
      localStorage.setItem('rsvp_guests', JSON.stringify([]))
    }

    setDeleteAllConfirmDialog({ isOpen: false, step: 1 })
  }

  const handleDeleteAllGuestsOld = () => {
    if (!window.confirm(`Tem certeza que deseja excluir TODOS os ${metrics.total} convidados? Esta ação é irreversível.`)) {
      return
    }

    if (!window.confirm('⚠️ AVISO: Esta ação é PERMANENTE e não pode ser desfeita. Deseja continuar?')) {
      return
    }

    // Remover cada convidado
    guests.forEach(guest => {
      removeGuest(guest.id)
    })

    // Também limpar localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('rsvp_guests', JSON.stringify([]))
    }
  }

  return (
    <SharedLayout
      role="user"
      title={eventSettings.coupleNames}
      subtitle={`${eventSettings.eventType === 'casamento' ? '💒' : '👑'} ${eventSettings.eventType === 'casamento' ? 'Casamento' : 'Debutante'}`}
    >
      <div id="tour-dashboard" className="max-w-6xl mx-auto">
      <OnboardingTour 
        isOpen={isTourOpen} 
        steps={tourSteps} 
        onComplete={handleTourComplete} 
        onSkip={handleTourSkip} 
      />
      {/* HERO SECTION - Cover Image (Card Style as Guest View) */}
      {eventSettings.coverImage && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mb-10 overflow-hidden">
          <div className="relative aspect-[16/10] sm:aspect-[21/9] rounded-[2.5rem] p-1.5 sm:p-2 bg-white/40 backdrop-blur-sm border border-white/50 shadow-xl group transition-all duration-700">
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-black/5">
              <Image
            src={eventSettings.coverImage}
            alt="Event Cover"
            fill
            className="transition-all duration-300"
            style={{
              objectFit: 'cover',
              objectPosition: `50% ${eventSettings.coverImagePosition || 50}%`,
              transform: `scale(${eventSettings.coverImageScale || 1})`
            }}
          />
          {/* Liquid Glass Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex items-end">
            {/* Badge Data - Único elemento agora */}
            <div className="flex items-center gap-3 text-white text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-lg">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <CalendarIcon />
              </div>
              <span>{formatDate(eventSettings.eventDate, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARE CARD */}
      <div id="tour-invite" className="bg-surface border border-border-soft rounded-[2rem] p-6 mb-10 shadow-sm relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-pale rounded-full blur-3xl opacity-50 group-hover:bg-brand-pale/80 transition-all" />
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-brand-pale rounded-2xl flex items-center justify-center text-brand flex-shrink-0 animate-pulse">
            <ShareIcon />
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h3 className="text-text-primary font-black text-xl mb-1 tracking-tight">Meu Site</h3>
            <p className="text-text-muted text-xs font-bold leading-relaxed max-w-2xl px-4 md:px-0">
              O seu link personalizado está pronto. Envie para os convidados confirmarem presença.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch">
            <div className="flex-1 bg-bg-light border border-border-soft rounded-xl px-5 py-3.5 text-[10px] text-text-muted font-black uppercase tracking-widest overflow-hidden text-ellipsis flex items-center shadow-inner min-w-[200px] md:min-w-[280px]">
              {typeof window !== 'undefined' ?
                `${window.location.origin.replace('http://', '').replace('https://', '')}/${eventSettings.slug || user.name.toLowerCase().replace(/\s+/g, '-')}` : '...'
              }
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={handleCopyLink}
                className={`flex-1 md:flex-none px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 border-2 ${copied ? 'bg-success text-white border-success' : 'bg-brand-pale/30 text-brand border-brand/5 hover:bg-brand-pale/50 active:scale-95'}`}
              >
                {copied ? <><CheckIcon /> Copiado!</> : <><CopyIcon /> Copiar Link</>}
              </button>
              
              <Link
                href={`/${eventSettings.slug || user.name.toLowerCase().replace(/\s+/g, '-')}`}
                target="_blank"
                className="flex-1 md:flex-none px-6 py-3.5 bg-brand text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <div className="sm:hidden lg:block"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg></div>
                Ver meu site
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between mb-10 gap-4">
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('guests')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl sm:rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'guests' ? 'bg-brand text-white shadow-xl' : 'bg-surface border border-border-soft text-text-muted hover:border-brand/30 hover:text-brand'}`}
          >
            <UsersIconMini /> <span className="whitespace-nowrap">Lista de Convidados</span>
          </button>
          <button
            onClick={() => {
              if (eventSettings.isGiftListEnabled === false) return;
              setActiveTab('gifts');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl sm:rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${eventSettings.isGiftListEnabled === false
              ? 'bg-bg-light border border-dashed border-border-soft text-text-muted opacity-50 cursor-not-allowed select-none'
              : activeTab === 'gifts'
                ? 'bg-brand text-white shadow-xl'
                : 'bg-surface border border-border-soft text-text-muted hover:border-brand/30 hover:text-brand'
              }`}
            title={eventSettings.isGiftListEnabled === false ? "Este módulo está desativado nas configurações" : ""}
          >
            <HeartIcon /> <span className="whitespace-nowrap">Presentes {eventSettings.isGiftListEnabled === false && '🔒'}</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl sm:rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'messages'
                ? 'bg-brand text-white shadow-xl'
                : 'bg-surface border border-border-soft text-text-muted hover:border-brand/30 hover:text-brand'
              }`}
          >
            <MessageSquareIcon /> <span className="whitespace-nowrap">Mural</span>
          </button>
        </div>

        <button
          onClick={() => setIsTourOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl sm:rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all bg-bg-light border border-border-soft text-text-muted hover:bg-brand-pale hover:text-brand hover:border-brand/20 shadow-sm"
        >
          <HelpCircleIcon className="w-4 h-4" /> Ver Tutorial
        </button>
      </div>

      {activeTab === 'guests' ? (
        <>
          {/* FILTER ROW EXCLUSIVE STYLE (SYNCED WITH ADMIN) */}
          <div id="tour-rsvp" className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <div className="relative">
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 border ${activeCategory !== 'all'
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

            <FilterPill label="Pendentes" count={metrics.pending} active={filter === 'pending'} onClick={() => setFilter('pending')} />
            <FilterPill label="Presentes" count={metrics.confirmed} active={filter === 'confirmed'} onClick={() => setFilter('confirmed')} />
            <FilterPill label="Todos" count={metrics.total} active={filter === 'all'} onClick={() => setFilter('all')} />
            <div id="tour-stats">
              <FilterPill label="Estatísticas" active={showStats} onClick={() => setShowStats(true)} />
            </div>
            

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => router.push('/import')}
                className="px-4 py-2 bg-brand/5 text-brand border border-brand/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 hover:bg-brand/10 whitespace-nowrap"
              >
                <UploadIcon className="w-3.5 h-3.5" />
                Adicionar Convidados
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-success-light text-success-dark border border-success/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 hover:bg-success/20 whitespace-nowrap"
              >
                <DownloadIcon />
                Baixar Lista
              </button>
              <button
                onClick={handleDeleteAllGuests}
                disabled={metrics.total === 0}
                className="px-4 py-2 bg-danger/5 text-danger border border-danger/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 hover:bg-danger/10 disabled:opacity-30 whitespace-nowrap"
              >
                <TrashIcon />
                Limpar Lista
              </button>
            </div>
          </div>

          {/* DETAILED STATS MODAL */}
          {showStats && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStats(false)} />
              <div className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 md:p-12">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-2xl font-serif text-text-primary tracking-tight italic">Estatísticas do Evento</h3>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Planejamento & Buffet</p>
                    </div>
                    <button
                      onClick={() => setShowStats(false)}
                      className="w-10 h-10 flex items-center justify-center bg-bg-light rounded-xl text-text-muted hover:text-brand transition-all"
                    >
                      <XIcon />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-5 bg-surface border border-border-soft rounded-[1.5rem] flex items-center justify-between shadow-sm group hover:border-brand/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-pale/50 backdrop-blur-md border border-brand/20 rounded-2xl flex items-center justify-center text-brand transition-transform group-hover:scale-110">
                            <UsersIcon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1.5">Adultos</p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-text-primary tracking-tighter">{metrics.confirmedAdults}</span>
                              <span className="text-[10px] font-bold text-text-muted">/ {metrics.adults}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-brand-dark/20 uppercase tracking-[0.2em]">Confirmados</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-surface border border-border-soft rounded-[1.5rem] flex items-center justify-between shadow-sm group hover:border-brand/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-warning-light/50 backdrop-blur-md border border-warning/20 rounded-2xl flex items-center justify-center text-warning transition-transform group-hover:scale-110">
                              <StarIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1.5">Crianças Pagantes</p>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-text-primary tracking-tighter">{metrics.confirmedChildrenPaying}</span>
                                <span className="text-[10px] font-bold text-text-muted">/ {metrics.childrenPaying}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 bg-surface border border-border-soft rounded-[1.5rem] flex items-center justify-between shadow-sm group hover:border-brand/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-success-light/50 backdrop-blur-md border border-success/20 rounded-2xl flex items-center justify-center text-success-dark transition-transform group-hover:scale-110">
                              <HeartIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1.5">Crianças Isentas</p>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-text-primary tracking-tighter">{metrics.confirmedChildrenFree}</span>
                                <span className="text-[10px] font-bold text-text-muted">/ {metrics.childrenFree}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-bg-light rounded-[2rem] border border-border-soft">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Adesão Total</span>
                        <span className="text-xl font-black text-brand">{Math.round((metrics.confirmed / (metrics.total || 1)) * 100)}%</span>
                      </div>
                      <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-border-soft shadow-inner">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-1000"
                          style={{ width: `${(metrics.confirmed / (metrics.total || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-relaxed">
                          <strong className="text-text-primary">{metrics.confirmed}</strong> condidados confirmados<br />
                          em uma lista total de <strong className="text-text-primary">{metrics.total}</strong> pessoas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH AND FILTER */}
          <div className="bg-surface rounded-[2rem] border border-border-soft shadow-sm overflow-hidden mb-10">
            <div className="p-4 md:p-6 border-b border-border-soft flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Pesquisar convidado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-bg-light border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                />
              </div>
            </div>

            {/* GUEST LIST - Unified Card Grid */}
            <div className="p-4 md:p-8">
              {filteredPeople.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-text-muted">
                  <UsersIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhum convidado encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredPeople.map((person) => (
                    <div
                      key={person.uniqueId}
                      className="bg-surface rounded-[2rem] border border-border-soft shadow-sm p-5 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-2 mb-4">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm shadow-inner transform group-hover:scale-110 transition-transform ${person.status === 'confirmed' ? 'bg-success-light text-success-dark' : person.status === 'declined' ? 'bg-danger-light text-danger-dark' : 'bg-bg-light text-text-muted'}`}>
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-black text-text-primary tracking-tight line-clamp-2 leading-tight mb-0.5" title={person.name}>
                              {person.name}
                            </h4>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest truncate">
                              {person.groupName}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-end justify-between pt-4 border-t border-border-soft">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2 py-0.5 w-fit rounded-lg text-[8px] font-black uppercase tracking-widest ${person.type === 'Principal' ? 'bg-brand-pale text-brand' : 'bg-bg-light text-text-muted'}`}>
                              {person.type}
                            </span>
                            <StatusBadge status={person.status} />
                          </div>
                          <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">
                            {person.category === 'adult_paying' ? 'Adulto' :
                              person.category === 'child_paying' ? 'Criança Pag.' :
                                'Criança Isenta'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {person.status === 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleWhatsAppReminder(person)
                              }}
                              className="w-9 h-9 bg-success-light text-success-dark rounded-xl flex items-center justify-center hover:bg-success hover:text-white hover:scale-110 transition-all shadow-inner"
                              title="Lembrete via WhatsApp"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(guests.find(g => g.id === person.guestId)!)}
                            className="w-9 h-9 bg-bg-light text-text-muted rounded-xl flex items-center justify-center hover:bg-brand hover:text-white hover:scale-110 transition-all shadow-inner group-hover:text-text-primary"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Guest Edit Modal */}
          <GuestEditModal
            guest={editingGuest}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEdit}
            onDelete={handleDeleteGuest}
          />

          {/* Confirm Dialogs */}
          <ConfirmDialog
            isOpen={deleteConfirmDialog.isOpen}
            title={deleteConfirmDialog.person?.type === 'Principal' ? "Excluir Convidado" : "Excluir Acompanhante"}
            message={deleteConfirmDialog.person?.type === 'Principal'
              ? `Deseja excluir "${deleteConfirmDialog.person.name}" e todo o seu grupo?`
              : `Deseja excluir o acompanhante "${deleteConfirmDialog.person?.name}"?`
            }
            confirmText="Excluir"
            cancelText="Voltar"
            isDangerous={true}
            onConfirm={() => deleteConfirmDialog.person && confirmDeleteGuest(deleteConfirmDialog.person)}
            onCancel={() => setDeleteConfirmDialog({ isOpen: false })}
          />

          <ConfirmDialog
            isOpen={deleteAllConfirmDialog.isOpen}
            title={deleteAllConfirmDialog.step === 1 ? "Limpar Toda a Lista" : "Confirmação Final"}
            message={deleteAllConfirmDialog.step === 1
              ? `Tem certeza que deseja excluir TODOS os ${metrics.total} convidados?`
              : "Esta ação apagará permanentemente todos os dados. Continuar?"
            }
            confirmText={deleteAllConfirmDialog.step === 1 ? "Sim, Continuar" : "Apagar Tudo"}
            isDangerous={true}
            onConfirm={() => deleteAllConfirmDialog.step === 1 ? confirmDeleteAllFirstStep() : confirmDeleteAllGuests()}
            onCancel={() => setDeleteAllConfirmDialog({ isOpen: false, step: 1 })}
          />
        </>
      ) : activeTab === 'gifts' ? (
        eventId && <GiftManagementTab eventId={eventId as string} />
      ) : (
        eventId && <MuralMessagesTab eventId={eventId as string} />
      )}
      </div>
      {/* Diálogo de Confirmação para WhatsApp sem Telefone */}
      <ConfirmDialog
        isOpen={whatsappConfirmDialog.isOpen}
        onClose={() => setWhatsappConfirmDialog({ isOpen: false })}
        onConfirm={() => {
          if (whatsappConfirmDialog.guest) {
            handleEditClick(whatsappConfirmDialog.guest)
          }
          setWhatsappConfirmDialog({ isOpen: false })
        }}
        title="WhatsApp não cadastrado"
        message={`O convidado "${whatsappConfirmDialog.guest?.name}" não possui um número de telefone cadastrado. Deseja adicionar agora para enviar o lembrete?`}
        confirmText="Adicionar Telefone"
        cancelText="Depois"
      />
    </SharedLayout>
  )
}


function NavItem({ href, active, label, icon }: { href: string; active?: boolean; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active
        ? 'bg-brand/10 text-brand shadow-sm'
        : 'text-text-muted hover:bg-bg-light hover:text-text-primary'
        }`}
    >
      <span className={active ? 'text-brand' : 'text-text-muted'}>{icon}</span>
      {label}
    </Link>
  )
}

function FilterPill({ label, count, active, onClick }: { label: string, count?: number, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 border ${active
        ? 'bg-brand text-white border-brand'
        : 'bg-surface text-text-muted border-border-soft hover:border-brand-light/30 hover:text-brand'
        }`}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  )
}

function KPICard({
  label,
  value,
  subValue,
  icon,
  status,
  isActive = false,
  onClick
}: {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  status?: 'success' | 'warning' | 'danger'
  isActive?: boolean
  onClick?: () => void
}) {
  const bgColors: { [key: string]: string } = {
    success: 'bg-success-light text-success-dark',
    warning: 'bg-warning-light text-warning',
    danger: 'bg-danger-light text-danger-dark',
    default: 'bg-bg-light text-text-muted'
  }
  const colorClass = status ? bgColors[status] : bgColors.default

  return (
    <button
      onClick={onClick}
      className={`relative p-5 lg:p-6 rounded-[2.5rem] border transition-all duration-500 text-left h-36 flex flex-col justify-between group overflow-hidden ${isActive
        ? 'bg-brand text-white border-brand shadow-xl shadow-brand/20 -translate-y-2'
        : 'bg-white border-border-soft shadow-sm hover:border-brand/20 hover:shadow-xl hover:shadow-brand/[0.05] hover:-translate-y-1'
        }`}
    >
      <div className="flex justify-between items-start relative z-10">
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-white/70' : 'text-text-muted'}`}>{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-white/20 backdrop-blur-md text-white border border-white/20' : 'bg-brand-pale/50 text-brand group-hover:bg-brand group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand/20'}`}>
          {icon}
        </div>
      </div>

      <div className="relative z-10 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-black tracking-tighter ${isActive ? 'text-white' : 'text-text-primary'}`}>{value}</span>
        </div>
        {subValue && (
          <p className={`text-[8px] font-black uppercase tracking-[0.3em] mt-1 ${isActive ? 'text-white/60' : (status === 'success' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-text-muted/60')}`}>
            {subValue}
          </p>
        )}
      </div>
    </button>
  )
}

function StatusBadge({ status }: { status: GuestStatus }) {
  const config = {
    confirmed: { label: 'Presença', icon: '✓', class: 'bg-success-light text-success-dark border-success/20' },
    pending: { label: 'Pendente', icon: '⏳', class: 'bg-warning-light text-warning border-warning/20' },
    declined: { label: 'Recusado', icon: '✗', class: 'bg-danger-light text-danger-dark border-danger/20' }
  }

  const { label, icon, class: className } = config[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border shadow-sm font-black uppercase tracking-tight whitespace-nowrap ${className} text-[8px] md:text-[9px]`}>
      <span className="opacity-70">{icon}</span> {label}
    </span>
  )
}

// --- ICONS (SVG RAW) ---

const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const UploadIcon = ({ className = "" }: { className?: string }) => <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
const SettingsIcon = ({ className = "" }: { className?: string }) => <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
const LogOutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
const HeartIconFilled = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
const CrownIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v2H3v-2zm1.5-8L6 14h12l1.5-4-3.5 2-4-4-4 4-3.5-2z" /><path d="M8 7c0-.55-.45-1-1-1s-1 .45-1 1c0 .28.11.53.29.71L8 9.41 6.29 7.71C6.11 7.53 6 7.28 6 7zm4-2c0-.55-.45-1-1-1s-1 .45-1 1c0 .28.11.53.29.71L12 8.41l1.71-1.7C13.89 6.53 14 6.28 14 6c0-.55-.45-1-1-1s-1 .45-1 1zm5 2c0-.55-.45-1-1-1s-1 .45-1 1c0 .28.11.53.29.71L18 9.41l-1.71-1.7C16.11 7.53 16 7.28 16 7z" /></svg>
const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
const PinIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
const ShareIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
const CopyIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
const ExternalLinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></svg>
const UsersIcon = ({ className = "" }: { className?: string }) => <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
const CheckCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
const XCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
const SearchIcon = ({ className = "" }: { className?: string }) => <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
const ChevronDownIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
const UsersIconMini = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
const DownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
const BarChartIcon = ({ className = "" }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
const XIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const StarIcon = ({ className = "" }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
const HeartIcon = ({ className = "" }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
const MessageSquareIcon = ({ className = "" }: { className?: string }) => <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
const HelpCircleIcon = ({ className = "" }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
