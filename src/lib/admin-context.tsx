'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { EventSettings, Guest } from './event-context'
import { supabase } from './supabase'

export type UserType = 'admin' | 'noivos'

export type AdminUser = {
  id: string
  name: string
  email: string
  type: UserType
  eventsCount: number
  createdAt: Date
  events?: string[]
}

export type AdminEvent = {
  id: string
  slug: string
  eventSettings: EventSettings
  guests: Guest[]
  createdAt: Date
  createdBy: string
}

type AdminContextType = {
  events: AdminEvent[]
  users: AdminUser[]
  loading: boolean
  addEvent: (event: AdminEvent) => Promise<void>
  removeEvent: (id: string) => Promise<void>
  updateEvent: (id: string, event: Partial<AdminEvent>) => Promise<void>
  addUser: (user: AdminUser) => Promise<void>
  removeUser: (id: string) => Promise<void>
  updateUser: (id: string, user: Partial<AdminUser>) => Promise<void>
  getEventById: (id: string) => AdminEvent | undefined
  getTotalMetrics: () => {
    totalEvents: number
    totalCouples: number
    totalGuests: number
    totalConfirmed: number
    totalPending: number
    confirmationRate: number
  }
  createDefaultEventForUser: (userEmail: string, userName: string) => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  // Carrega dados iniciais do Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Buscar Eventos
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })

        if (eventsError) throw eventsError

        const formattedEvents = (eventsData || []).map(e => ({
          id: e.id,
          slug: e.slug,
          eventSettings: e.event_settings,
          guests: [], // Guests são carregados no EventContext ou Dashboard
          createdAt: new Date(e.created_at),
          createdBy: e.created_by
        }))

        // Mapear contagem de eventos por email
        const eventCounts: Record<string, number> = {}
        formattedEvents.forEach(e => {
          if (e.createdBy) {
            const email = e.createdBy.toLowerCase()
            eventCounts[email] = (eventCounts[email] || 0) + 1
          }
        })

        // Buscar Usuários
        const { data: usersData, error: usersError } = await supabase
          .from('admin_users')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersError) throw usersError

        const formattedUsers = (usersData || []).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          type: u.type,
          eventsCount: eventCounts[u.email.toLowerCase()] || 0,
          createdAt: new Date(u.created_at)
        }))

        setEvents(formattedEvents)
        setUsers(formattedUsers)
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function addEvent(event: AdminEvent) {
    try {
      const { error } = await supabase.from('events').insert({
        id: event.id,
        slug: event.slug,
        event_settings: event.eventSettings,
        created_at: event.createdAt.toISOString(),
        created_by: event.createdBy
      })

      if (error) throw error
      setEvents(prev => [event, ...prev])
    } catch (error) {
      console.error('Erro ao adicionar evento:', error)
      alert('Erro ao salvar no banco de dados')
    }
  }

  async function removeEvent(id: string) {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      console.error('Erro ao remover evento:', error)
    }
  }

  async function updateEvent(id: string, eventData: Partial<AdminEvent>) {
    try {
      const updates: any = {}
      if (eventData.slug) updates.slug = eventData.slug
      if (eventData.eventSettings) updates.event_settings = eventData.eventSettings

      const { error } = await supabase.from('events').update(updates).eq('id', id)
      if (error) throw error

      setEvents(prev => prev.map(e => e.id === id ? { ...e, ...eventData } : e))

      // Se o slug mudou, atualizar também no eventSettings
      if (eventData.slug) {
        setEvents(prev => prev.map(e => e.id === id ? {
          ...e,
          eventSettings: { ...e.eventSettings, slug: eventData.slug! }
        } : e))
      }
    } catch (error) {
      console.error('Erro ao atualizar evento:', error)
    }
  }

  async function addUser(user: AdminUser) {
    try {
      const { error } = await supabase.from('admin_users').insert({
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        created_at: user.createdAt.toISOString()
      })
      if (error) throw error
      setUsers(prev => [user, ...prev])
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error)
      alert('Erro ao salvar usuário no banco de dados.')
    }
  }

  async function removeUser(id: string) {
    try {
      // Buscar o usuário antes para ter o email
      const userToRemove = users.find(u => u.id === id)
      if (!userToRemove) return

      // 1. Buscar os eventos criados por este usuário (por ID ou Email)
      const { data: userEvents, error: fetchError } = await supabase
        .from('events')
        .select('id')
        .or(`created_by.eq.${id},created_by.eq.${userToRemove.email}`)

      if (fetchError) throw fetchError

      // 2. Excluir os eventos deste usuário
      const { error: eventsDeleteError } = await supabase
        .from('events')
        .delete()
        .or(`created_by.eq.${id},created_by.eq.${userToRemove.email}`)

      if (eventsDeleteError) throw eventsDeleteError

      // 3. Excluir o usuário
      const { error: userDeleteError } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id)

      if (userDeleteError) throw userDeleteError

      // 4. Atualizar estados locais
      setUsers(prev => prev.filter(u => u.id !== id))
      if (userEvents && userEvents.length > 0) {
        const eventIdsToRemove = userEvents.map(e => e.id)
        setEvents(prev => prev.filter(e => !eventIdsToRemove.includes(e.id)))
      }
    } catch (error) {
      console.error('Erro ao remover usuário e seus dados:', error)
      throw error
    }
  }

  async function updateUser(id: string, userData: Partial<AdminUser>) {
    try {
      const updates: any = {}
      if (userData.name) updates.name = userData.name
      if (userData.email) updates.email = userData.email
      if (userData.type) updates.type = userData.type

      const { error } = await supabase.from('admin_users').update(updates).eq('id', id)
      if (error) throw error

      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u))
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  function getEventById(id: string) {
    return events.find(e => e.id === id)
  }

  function getTotalMetrics() {
    let totalEvents = events.length
    let totalCouples = totalEvents
    let totalGuests = 0
    let totalConfirmed = 0
    let totalPending = 0

    // Nota: Como os convidados agora estão no Supabase, as métricas totais no AdminContext
    // podem precisar de uma query separada se quisermos precisão total sem carregar tudo.
    // Por enquanto, vou manter a lógica de loop, mas saiba que e.guests pode estar vazio aqui.
    events.forEach(event => {
      let eventGuests = event.guests || []
      eventGuests.forEach((guest: Guest) => {
        const count = 1 + (guest.companionsList?.length || 0)
        totalGuests += count

        if (guest.status === 'confirmed') {
          const cC = guest.companionsList ? guest.companionsList.filter((c: any) => c.isConfirmed).length : 0
          totalConfirmed += 1 + cC
        } else if (guest.status === 'pending') {
          const uC = guest.companionsList ? guest.companionsList.filter((c: any) => !c.isConfirmed).length : 0
          totalPending += 1 + uC
        }
      })
    })

    const confirmationRate = totalGuests > 0 ? Math.round((totalConfirmed / totalGuests) * 100) : 0

    return {
      totalEvents,
      totalCouples,
      totalGuests,
      totalConfirmed,
      totalPending,
      confirmationRate
    }
  }

  async function createDefaultEventForUser(userEmail: string, userName: string) {
    try {
      const eventId = crypto.randomUUID()
      const defaultSlug = userName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 4)

      const newEvent: AdminEvent = {
        id: eventId,
        slug: defaultSlug,
        eventSettings: {
          coupleNames: userName,
          slug: defaultSlug,
          eventType: 'casamento',
          eventDate: new Date().toISOString().split('T')[0],
          eventTime: '19:00',
          confirmationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          eventLocation: 'Espaço e Buffet - Endereço',
          coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop',
          coverImagePosition: 50,
          coverImageScale: 1.0,
          customMessage: 'Ficamos muito felizes em receber a sua confirmação de presença.'
        },
        guests: [],
        createdAt: new Date(),
        createdBy: userEmail
      }

      await addEvent(newEvent)

      // Atualizar contagem no estado local se o usuário já estiver listado
      setUsers(prev => prev.map(u => u.email.toLowerCase() === userEmail.toLowerCase() ? { ...u, eventsCount: 1 } : u))
    } catch (error) {
      console.error('Erro ao criar evento padrão:', error)
    }
  }

  return (
    <AdminContext.Provider value={{
      events,
      users,
      loading,
      addEvent,
      removeEvent,
      updateEvent,
      addUser,
      removeUser,
      updateUser,
      getEventById,
      getTotalMetrics,
      createDefaultEventForUser
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de AdminProvider')
  }
  return context
}
