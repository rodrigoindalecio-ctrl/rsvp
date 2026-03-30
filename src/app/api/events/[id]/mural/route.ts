import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyEventOwnership } from '@/lib/verify-ownership'

/**
 * API para excluir/esconder recados do mural.
 * Suporta exclusão em massa.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id
        const { items } = await req.json() // [{ id, type }]

        console.log('[MURAL DELETE] Request received:', { eventId, itemsCount: items?.length })

        // 🔒 Verificar propriedade do evento
        const ownership = await verifyEventOwnership(req, eventId)
        if (!ownership.authorized) {
            console.error('[MURAL DELETE] Unauthorized access attempt for event:', eventId)
            return ownership.response
        }

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }

        // Separar por tipo para otimizar queries
        const giftIds = items.filter(i => i.type === 'gift').map(i => i.id)
        const rsvpIds = items.filter(i => i.type === 'rsvp' || i.type === 'guest').map(i => i.id)

        const tasks = []

        // Para presentes, "limpamos" a mensagem setando explicitamente para string vazia
        // Isso garante que filtros como .not('message', 'is', null) ou .neq('message', '') funcionem.
        if (giftIds.length > 0) {
            console.log('[MURAL DELETE] Erasing messages from gift_transactions:', giftIds)
            tasks.push(
                supabaseAdmin
                    .from('gift_transactions')
                    .update({ 
                        message: '', // Usar string vazia para garantir que saia do filtro
                    })
                    .in('id', giftIds)
                    .eq('event_id', eventId)
            )
        }

        // Para RSVP, limpamos a mensagem na tabela de convidados (guests)
        if (rsvpIds.length > 0) {
            console.log('[MURAL DELETE] Erasing messages from guests:', rsvpIds)
            tasks.push(
                supabaseAdmin
                    .from('guests')
                    .update({ 
                        message: '', // String vazia
                        updated_at: new Date().toISOString()
                    })
                    .in('id', rsvpIds)
                    .eq('event_id', eventId)
            )
        }

        const results = await Promise.all(tasks)
        const hasError = results.some(r => r.error)

        if (hasError) {
            const errors = results.filter(r => r.error).map(r => r.error)
            console.error('[MURAL DELETE] Database errors:', errors)
            return NextResponse.json({ error: 'Erro parcial ao excluir', details: errors }, { status: 500 })
        }

        console.log('[MURAL DELETE] Success for event:', eventId)
        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error('[MURAL DELETE ERROR]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
