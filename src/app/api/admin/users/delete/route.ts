import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Criar cliente com Service Role para ignorar RLS e garantir a exclusão
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json()

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'ID ou Email não informados' }, { status: 400 })
    }

    console.log(`[ADMIN DELETE] Iniciando exclusão total do usuário: ${userEmail} (${userId})`)

    // 1. Buscar IDs de eventos vinculados (Busca robusta)
    console.log(`[ADMIN DELETE] Buscando eventos para: ${userEmail} ou ID ${userId}`)
    
    const { data: eventsByEmail } = await supabaseAdmin
      .from('events')
      .select('id')
      .ilike('created_by', userEmail.trim())

    const { data: eventsById } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('created_by', userId)

    // Unificar IDs únicos
    const allEvents = [...(eventsByEmail || []), ...(eventsById || [])]
    const uniqueEventIds = Array.from(new Set(allEvents.map(e => e.id)))

    if (uniqueEventIds.length > 0) {
      console.log(`[ADMIN DELETE] Encontrados ${uniqueEventIds.length} eventos para remover:`, uniqueEventIds)

      // 2. Limpar tabelas relacionadas (Cascata manual)
      await Promise.all([
        supabaseAdmin.from('guests').delete().in('event_id', uniqueEventIds),
        supabaseAdmin.from('mural').delete().in('event_id', uniqueEventIds),
        supabaseAdmin.from('gifts').delete().in('event_id', uniqueEventIds)
      ])

      // 3. Excluir os eventos
      const { error: eventError } = await supabaseAdmin
        .from('events')
        .delete()
        .in('id', uniqueEventIds)
      
      if (eventError) throw eventError
      console.log(`[ADMIN DELETE] Eventos removidos com sucesso.`)
    } else {
      console.log(`[ADMIN DELETE] Nenhum evento encontrado para este usuário.`)
    }

    // 4. Excluir o usuário da tabela admin_users
    const { error: userError } = await supabaseAdmin
      .from('admin_users')
      .delete()
      .eq('id', userId)

    if (userError) throw userError

    console.log(`[ADMIN DELETE] Usuário ${userEmail} removido com sucesso de todas as tabelas.`)

    return NextResponse.json({ success: true, message: 'Usuário e dados vinculados removidos com sucesso.' })
  } catch (error: any) {
    console.error('[ADMIN DELETE ERROR]:', error)
    return NextResponse.json({ error: error.message || 'Erro interno na exclusão' }, { status: 500 })
  }
}
