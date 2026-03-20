import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

        // 🔒 Verificar propriedade do evento
        const ownership = await verifyEventOwnership(req, eventId)
        if (!ownership.authorized) return ownership.response

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }

        // Separar por tipo para otimizar queries
        const giftIds = items.filter(i => i.type === 'gift').map(i => i.id)
        const rsvpIds = items.filter(i => i.type === 'rsvp').map(i => i.id)

        const tasks = []

        // Para presentes, apenas limpamos a mensagem (mantendo a transação financeira)
        if (giftIds.length > 0) {
            tasks.push(
                supabase
                    .from('gift_transactions')
                    .update({ message: null })
                    .in('id', giftIds)
                    .eq('event_id', eventId)
            )
        }

        // Para RSVP, limpamos a mensagem na tabela de convidados
        if (rsvpIds.length > 0) {
            tasks.push(
                supabase
                    .from('guests')
                    .update({ message: null })
                    .in('id', rsvpIds)
                    .eq('event_id', eventId)
            )
        }

        const results = await Promise.all(tasks)
        const hasError = results.some(r => r.error)

        if (hasError) {
            return NextResponse.json({ error: 'Erro parcial ao excluir' }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error('[MURAL DELETE ERROR]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
