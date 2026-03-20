import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Rota segura para processar o RSVP de um convidado.
 * Faz a atualização no banco E dispara os e-mails necessários pelo servidor.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { guestId, updates, eventSettings, ownerEmail } = body

        if (!guestId || !updates) {
            return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })
        }

        // 1. Atualizar no Banco de Dados
        const now = new Date()
        const dbUpdates: any = { 
            updated_at: now.toISOString(),
            status: updates.status,
            email: updates.email,
            message: updates.message,
            name: updates.name,
            companions_list: updates.companionsList // Mapear para snake_case
        }

        if (updates.status === 'confirmed') {
            dbUpdates.confirmed_at = updates.confirmedAt || now.toISOString()
        } else {
            dbUpdates.confirmed_at = null
        }

        const { error: dbError } = await supabase
            .from('guests')
            .update(dbUpdates)
            .eq('id', guestId)

        if (dbError) throw dbError

        // 2. Disparar E-mails em background (pelo servidor para o servidor interno)
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/['"]+/g, '').trim();
        const internalKey = process.env.INTERNAL_API_KEY;

        // E-mail para o Convidado
        if (updates.status === 'confirmed' && updates.email) {
            const confirmedNames = [updates.name || '']; // Simplificado para o exemplo, idealmente passar os nomes
            fetch(`${baseUrl}/api/send-confirmation-email`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${internalKey}`
                },
                body: JSON.stringify({ 
                    email: updates.email, 
                    guestName: updates.name, 
                    eventSettings,
                    confirmedNames: body.confirmedNames || []
                })
            }).catch(e => console.error('RSVP Webhook Email Error:', e))
        }

        // Notificação para os Noivos
        if (eventSettings.notifyOwnerOnRSVP !== false) {
            fetch(`${baseUrl}/api/send-owner-notification`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${internalKey}`
                },
                body: JSON.stringify({ 
                    ownerEmail, 
                    guestName: updates.name, 
                    eventSettings, 
                    confirmedNames: body.confirmedNames || [],
                    status: updates.status 
                })
            }).catch(e => console.error('RSVP Owner Notif Error:', e))
        }

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error('[RSVP API ERROR]', error)
        return NextResponse.json({ error: error.message || 'Erro ao processar RSVP' }, { status: 500 })
    }
}
