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
        adults: number
        childrenPaying: number
        childrenFree: number
        confirmedAdults: number
        confirmedChildrenPaying: number
        confirmedChildrenFree: number
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
    coupleNames: 'Nome do Casal',
    slug: 'meu-evento',
    eventDate: new Date().toISOString().split('T')[0],
    eventTime: '19:00',
    confirmationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    eventLocation: 'Espaço e Buffet - Endereço',
    wazeLocation: '',
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop',
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

    const metrics = useMemo(() => {
        const initial = {
            total: 0,
            confirmed: 0,
            pending: 0,
            declined: 0,
            totalPeople: 0, // Alias para confirmed
            adults: 0,
            childrenPaying: 0,
            childrenFree: 0,
            confirmedAdults: 0,
            confirmedChildrenPaying: 0,
            confirmedChildrenFree: 0
        }

        return guests.reduce((acc, guest) => {
            const isConfirmed = guest.status === 'confirmed'
            const isPending = guest.status === 'pending'
            const isDeclined = guest.status === 'declined'

            // Convidado Principal
            acc.total += 1
            if (guest.category === 'adult_paying' || !guest.category) acc.adults += 1
            else if (guest.category === 'child_paying') acc.childrenPaying += 1
            else if (guest.category === 'child_not_paying') acc.childrenFree += 1

            if (isConfirmed) {
                acc.confirmed += 1
                if (guest.category === 'adult_paying' || !guest.category) acc.confirmedAdults += 1
                else if (guest.category === 'child_paying') acc.confirmedChildrenPaying += 1
                else if (guest.category === 'child_not_paying') acc.confirmedChildrenFree += 1
            } else if (isPending) {
                acc.pending += 1
            } else if (isDeclined) {
                acc.declined += 1
            }

            // Acompanhantes
            guest.companionsList?.forEach(comp => {
                acc.total += 1
                const cat = comp.category || 'adult_paying'
                if (cat === 'adult_paying') acc.adults += 1
                else if (cat === 'child_paying') acc.childrenPaying += 1
                else if (cat === 'child_not_paying') acc.childrenFree += 1

                if (isConfirmed && comp.isConfirmed) {
                    acc.confirmed += 1
                    if (cat === 'adult_paying') acc.confirmedAdults += 1
                    else if (cat === 'child_paying') acc.confirmedChildrenPaying += 1
                    else if (cat === 'child_not_paying') acc.confirmedChildrenFree += 1
                } else if (isPending || (isConfirmed && !comp.isConfirmed)) {
                    acc.pending += 1
                } else if (isDeclined) {
                    acc.declined += 1
                }
            })

            acc.totalPeople = acc.confirmed // Sincroniza alias
            return acc
        }, initial)
    }, [guests])

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
