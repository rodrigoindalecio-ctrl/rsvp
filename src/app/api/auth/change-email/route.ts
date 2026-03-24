import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession, encrypt } from '@/lib/auth-utils'
import { cookies } from 'next/headers'

// Cliente Admin para ignorar RLS na atualização de segurança
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Você precisa estar logado para alterar seu e-mail.' }, { status: 401 })
    }

    const { newEmail } = await request.json()

    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ error: 'Por favor, informe um e-mail válido.' }, { status: 400 })
    }

    const oldEmail = session.email.toLowerCase()
    const targetEmail = newEmail.toLowerCase()

    if (oldEmail === targetEmail) {
      return NextResponse.json({ error: 'O novo e-mail é igual ao atual.' }, { status: 400 })
    }

    console.log(`[AUTH CHANGE EMAIL] Tentando migrar de ${oldEmail} para ${targetEmail}`)

    // 1. Verificar se o novo e-mail já existe em outra conta
    const { data: existing } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', targetEmail)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está sendo utilizado por outra conta.' }, { status: 409 })
    }

    // 2. Iniciar migração em cascata
    // 2.1 Atualizar a tabela de eventos (created_by)
    const { error: eventsError } = await supabaseAdmin
      .from('events')
      .update({ created_by: targetEmail })
      .eq('created_by', oldEmail)

    if (eventsError) {
      console.error('[AUTH CHANGE EMAIL ERROR EVENTS]:', eventsError)
      throw eventsError
    }

    // 2.2 Atualizar a tabela de usuários
    const { error: userError } = await supabaseAdmin
      .from('admin_users')
      .update({ email: targetEmail })
      .eq('id', session.id)

    if (userError) {
      console.error('[AUTH CHANGE EMAIL ERROR USER]:', userError)
      throw userError
    }

    // 3. Atualizar o cookie de sessão para refletir o novo e-mail
    const updatedSession = { ...session, email: targetEmail }
    const encryptedSession = await encrypt(updatedSession)
    
    // Configurar o novo cookie
    cookies().set('rsvp_session', encryptedSession, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    console.log(`[AUTH CHANGE EMAIL SUCCESS] Migração de ${oldEmail} -> ${targetEmail} concluída.`)

    return NextResponse.json({ success: true, message: 'Seu e-mail de acesso foi atualizado com sucesso!' })
  } catch (error: any) {
    console.error('[AUTH CHANGE EMAIL EXCEPTION]:', error)
    return NextResponse.json({ 
      error: 'Erro ao atualizar o e-mail no servidor', 
      details: error.message 
    }, { status: 500 })
  }
}
