import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    const body = await request.json()
    const { updates } = body

    if (!eventId) {
      return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 })
    }

    // Usamos o supabaseAdmin direto aqui. Se o RLS estiver bloqueando, 
    // precisaremos usar a Service Role Key, mas vamos tentar primeiro via API padrão.
    // Nota: Como é uma rota server-side, temos mais controle.
    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()

    if (error) {
      console.error('❌ Erro no Supabase ao atualizar evento:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('❌ Erro na API de Eventos:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
