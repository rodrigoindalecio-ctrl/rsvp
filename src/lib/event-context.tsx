'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAdmin } from './admin-context'
import { useAuth } from './auth-context'
import { supabase } from './supabase'

export type GuestStatus = 'confirmed' | 'pending' | 'declined'
export type GuestCategory = 'adult_paying' | 'child_paying' | 'child_not_paying'

export type Companion = {
    name: string
    isConfirmed: boolean
    category?: GuestCategory
}

export type Guest = {
    id: string
    name: string
    email?: string
    telefone?: string
    grupo?: string
    companions: number
    companionsList: Companion[]
    status: GuestStatus
    category: GuestCategory
    updatedAt: Date
    confirmedAt?: Date
}

export type EventSettings = {
    eventType: 'casamento' | 'debutante'
    coupleNames: string
    slug: string
    eventDate: string
    eventTime?: string
    confirmationDeadline: string
    eventLocation: string
    wazeLocation?: string
    coverImage: string
    coverImagePosition: number
    coverImageScale: number
    customMessage: string
    giftList?: string
    giftListLinks?: { name: string; url: string }[]
}

type EventContextType = {
    guests: Guest[]
    eventSettings: EventSettings
    loading: boolean
    metrics: {
        total: number
        confirmed: number
        pending: number
        declined: number
        totalPeople: number
    }
    addGuest: (guest: Omit<Guest, 'id' | 'updatedAt' | 'status'>) => Promise<boolean>
    addGuestsBatch: (dataList: Omit<Guest, 'id' | 'updatedAt' | 'status'>[]) => Promise<{
        imported: number,
        duplicates: string[],
        error?: string
    }>
    removeGuest: (id: string) => Promise<void>
    updateGuestStatus: (id: string, status: GuestStatus) => Promise<void>
    updateGuest: (id: string, guest: Partial<Guest>) => Promise<void>
    updateGuestCompanions: (id: string, companions: Companion[]) => Promise<void>
    removeCompanion: (guestId: string, companionIndex: number) => Promise<void>
    updateEventSettings: (settings: Partial<EventSettings>) => Promise<void>
    submitRSVP: (rsvpData: Omit<Guest, 'id' | 'updatedAt'>) => Promise<void>
}

const DEFAULT_EVENT_SETTINGS: EventSettings = {
    eventType: 'casamento',
    coupleNames: 'Vanessa e Rodrigo',
    slug: 'vanessaerodrigo',
    eventDate: '2026-11-19',
    eventTime: '21:00',
    confirmationDeadline: '2026-11-13',
    eventLocation: 'Mansão Capricho - Av Nova Cantareira',
    wazeLocation: '',
    coverImage: 'https://...',
    coverImagePosition: 50,
    coverImageScale: 1,
    customMessage: 'Ficamos muito felizes em receber a sua confirmação de presença.',
    giftList: '',
    giftListLinks: []
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export function EventProvider({ children }: { children: ReactNode }) {
    const params = useParams()
    const slug = params?.slug as string
    const { user } = useAuth()
    const { events, updateEvent, loading: adminLoading } = useAdmin()

    const eventIdFromParams = params?.id as string
    const eventId = useMemo(() => {
        if (adminLoading) return null
        if (eventIdFromParams) return eventIdFromParams
        if (slug) {
            const event = events.find(e =>
                e.slug?.toLowerCase() === slug.toLowerCase() ||
                e.eventSettings.slug?.toLowerCase() === slug.toLowerCase()
            )
            return event?.id || null
        }
        // Se estamos no /dashboard (sem slug), procuramos o evento criado por este usuário
        if (user) {
            const userEmailLower = user.email ? user.email.toLowerCase() : ''
            const userEvent = events.find(e => {
                const createdByLower = e.createdBy ? e.createdBy.toLowerCase() : ''
                return createdByLower === userEmailLower
            })
            return userEvent?.id || null
        }
        return null
    }, [slug, events, eventIdFromParams, user, adminLoading])

    const [guests, setGuests] = useState<Guest[]>([])
    const [eventSettings, setEventSettings] = useState<EventSettings>(DEFAULT_EVENT_SETTINGS)
    const [loading, setLoading] = useState(false)


    useEffect(() => {
        const currentEvent = events.find(e => e.id === eventId || e.slug === slug)
        if (currentEvent) {
            setEventSettings(currentEvent.eventSettings)
        }
    }, [eventId, slug, events])

    useEffect(() => {
        if (!eventId) return

        async function loadGuests() {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('guests')
                    .select('*')
                    .eq('event_id', eventId)
                    .order('updated_at', { ascending: false })

                if (error) throw error

                setGuests((data || []).map(g => ({
                    id: g.id,
                    name: g.name,
                    email: g.email || '',
                    telefone: g.telefone || '',
                    grupo: g.grupo || '',
                    companions: g.companions_list?.length || 0,
                    companionsList: g.companions_list || [],
                    status: g.status as GuestStatus,
                    category: g.category as GuestCategory,
                    updatedAt: new Date(g.updated_at),
                    confirmedAt: g.confirmed_at ? new Date(g.confirmed_at) : undefined
                })))
            } catch (error) {
                console.error('Erro ao carregar convidados:', error)
            } finally {
                setLoading(false)
            }
        }

        loadGuests()
    }, [eventId])

    const metrics = useMemo(() => ({
        total: guests.reduce((acc, curr) => acc + 1 + (curr.companionsList?.length || 0), 0),
        confirmed: guests.reduce((acc, curr) => {
            if (curr.status === 'confirmed') {
                const confirmedCompanions = curr.companionsList ? curr.companionsList.filter(c => c.isConfirmed).length : 0
                return acc + 1 + confirmedCompanions
            }
            return acc
        }, 0),
        pending: guests.reduce((acc, curr) => {
            if (curr.status === 'pending') {
                const unconfirmedCompanions = curr.companionsList ? curr.companionsList.filter(c => !c.isConfirmed).length : 0
                return acc + 1 + unconfirmedCompanions
            }
            return acc
        }, 0),
        declined: guests.reduce((acc, curr) => {
            if (curr.status === 'declined') {
                return acc + 1 + (curr.companionsList?.length || 0)
            }
            return acc
        }, 0),
        totalPeople: guests
            .filter(g => g.status === 'confirmed')
            .reduce((acc, curr) => {
                const confirmedCompanions = curr.companionsList ? curr.companionsList.filter(c => c.isConfirmed).length : 0
                return acc + 1 + confirmedCompanions
            }, 0)
    }), [guests])

    async function addGuest(data: Omit<Guest, 'id' | 'updatedAt' | 'status'>) {
        if (!eventId) return false
        const newId = Math.random().toString(36).substr(2, 9)
        const newGuest: Guest = {
            ...data,
            id: newId,
            status: 'pending',
            updatedAt: new Date(),
            companionsList: data.companionsList || []
        }

        try {
            const { error } = await supabase.from('guests').insert({
                id: newId,
                event_id: eventId,
                name: data.name,
                email: data.email,
                telefone: data.telefone,
                grupo: data.grupo,
                status: 'pending',
                category: data.category,
                companions_list: data.companionsList,
                updated_at: new Date().toISOString()
            })

            if (error) throw error
            setGuests(prev => [newGuest, ...prev])
            return true
        } catch (error) {
            console.error('Erro ao adicionar convidado:', error)
            return false
        }
    }

    async function addGuestsBatch(dataList: Omit<Guest, 'id' | 'updatedAt' | 'status'>[]) {
        if (!eventId) {
            return { imported: 0, duplicates: [], error: 'Nenhum evento encontrado para o usuário atual.' }
        }
        const duplicates: string[] = []
        const toImport: any[] = []
        const newGuests: Guest[] = []

        dataList.forEach(data => {
            const isDuplicate = guests.some(g => g.name.toLowerCase() === data.name.toLowerCase() && g.telefone === data.telefone)
            if (isDuplicate) {
                duplicates.push(data.name)
            } else {
                const newId = Math.random().toString(36).substr(2, 9)
                const now = new Date()
                const guestDataToInsert = {
                    id: newId,
                    event_id: eventId,
                    name: data.name,
                    email: data.email || '',
                    telefone: data.telefone || '',
                    grupo: data.grupo || '',
                    status: 'pending',
                    category: data.category,
                    companions_list: data.companionsList || [],
                    updated_at: now.toISOString()
                }


                toImport.push(guestDataToInsert)
                newGuests.push({
                    ...data,
                    id: newId,
                    status: 'pending',
                    updatedAt: now,
                    companionsList: data.companionsList || []
                })
            }
        })

        if (toImport.length > 0) {
            try {
                const { error } = await supabase.from('guests').insert(toImport)
                if (error) throw error
                setGuests(prev => [...newGuests, ...prev])
                return { imported: toImport.length, duplicates }
            } catch (error) {
                console.error('Erro no batch import:', error)
                return { imported: 0, duplicates: [], error: 'Erro ao salvar convidados' }
            }
        }

        return { imported: 0, duplicates }
    }

    async function removeGuest(id: string) {
        try {
            const { error } = await supabase.from('guests').delete().eq('id', id)
            if (error) throw error
            setGuests(prev => prev.filter(g => g.id !== id))
        } catch (error) {
            console.error('Erro ao remover convidado:', error)
        }
    }

    async function updateGuestStatus(id: string, status: GuestStatus) {
        try {
            const now = new Date()
            const { error } = await supabase.from('guests').update({
                status,
                updated_at: now.toISOString(),
                confirmed_at: status === 'confirmed' ? now.toISOString() : null
            }).eq('id', id)

            if (error) throw error
            setGuests(prev => prev.map(g => g.id === id ? { ...g, status, updatedAt: now, confirmedAt: status === 'confirmed' ? now : undefined } : g))
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
        }
    }

    async function updateGuest(id: string, guestData: Partial<Guest>) {
        try {
            const now = new Date()
            const updates: any = { updated_at: now.toISOString() }
            if (guestData.name) updates.name = guestData.name
            if (guestData.email !== undefined) updates.email = guestData.email
            if (guestData.telefone !== undefined) updates.telefone = guestData.telefone
            if (guestData.grupo !== undefined) updates.grupo = guestData.grupo
            if (guestData.status) updates.status = guestData.status
            if (guestData.category) updates.category = guestData.category
            if (guestData.companionsList) updates.companions_list = guestData.companionsList

            const { error } = await supabase.from('guests').update(updates).eq('id', id)
            if (error) throw error
            setGuests(prev => prev.map(g => g.id === id ? { ...g, ...guestData, updatedAt: now } : g))
        } catch (error) {
            console.error('Erro ao atualizar convidado:', error)
        }
    }

    async function updateGuestCompanions(id: string, companions: Companion[]) {
        await updateGuest(id, { companionsList: companions })
    }

    async function removeCompanion(guestId: string, index: number) {
        const guest = guests.find(g => g.id === guestId)
        if (!guest) return
        const newList = [...guest.companionsList]
        newList.splice(index, 1)
        await updateGuest(guestId, { companionsList: newList })
    }

    async function updateEventSettings(newSettings: Partial<EventSettings>) {
        if (!eventId) return
        const updatedSettings = { ...eventSettings, ...newSettings }

        // Atualiza no banco através do AdminContext
        await updateEvent(eventId, {
            eventSettings: updatedSettings,
            slug: updatedSettings.slug
        })

        // Atualiza estado local
        setEventSettings(updatedSettings)
    }

    async function submitRSVP(rsvpData: Omit<Guest, 'id' | 'updatedAt'>) {
        if (!eventId) throw new Error('Evento não identificado')

        try {
            const now = new Date()
            const { error } = await supabase.from('guests').insert({
                event_id: eventId,
                name: rsvpData.name,
                email: rsvpData.email,
                telefone: rsvpData.telefone,
                grupo: rsvpData.grupo,
                status: 'confirmed',
                category: rsvpData.category,
                companions: rsvpData.companions,
                companions_list: rsvpData.companionsList,
                updated_at: now.toISOString(),
                confirmed_at: now.toISOString()
            })

            if (error) throw error

            // Opcional: Atualizar lista local se o admin estiver vendo
            const newGuest: Guest = {
                ...rsvpData,
                id: Math.random().toString(36).substr(2, 9), // ID temporário até refresh
                updatedAt: now,
                confirmedAt: now
            }
            setGuests(prev => [newGuest, ...prev])
        } catch (error) {
            console.error('Erro ao submeter RSVP:', error)
            throw error
        }
    }

    return (
        <EventContext.Provider value={{
            guests,
            eventSettings,
            loading,
            metrics,
            addGuest,
            addGuestsBatch,
            removeGuest,
            updateGuestStatus,
            updateGuest,
            updateGuestCompanions,
            removeCompanion,
            updateEventSettings,
            submitRSVP
        }}>
            {children}
        </EventContext.Provider>
    )
}

export function useEvent() {
    const context = useContext(EventContext)
    if (!context) {
        throw new Error('useEvent deve ser usado dentro de EventProvider')
    }
    return context
}
