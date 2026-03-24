import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias.' }, { status: 400 })
        }

        // Recuperar sessão do cookie para identificar o usuário
        const savedSession = request.cookies.get('rsvp_session')?.value
        if (!savedSession) {
            return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
        }

        const user = JSON.parse(decodeURIComponent(savedSession))
        const email = user.email

        // 1. Verificar senha atual no Supabase
        const { data, error } = await supabaseAdmin
            .from('admin_users')
            .select('id, password_hash')
            .eq('email', email.toLowerCase())
            .maybeSingle()

        if (error || !data) {
            return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
        }

        // 2. Verificar senha atual usando bcrypt (com suporte a legados)
        const isHashed = data.password_hash && data.password_hash.startsWith('$2')
        if (isHashed) {
            const isMatch = await bcrypt.compare(currentPassword, data.password_hash)
            if (!isMatch) {
                return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
            }
        } else {
            // Senha legada em texto simples
            if (data.password_hash !== currentPassword) {
                return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
            }
        }

        // 3. Atualizar para a nova senha (Hashed)
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const { error: updateError } = await supabaseAdmin
            .from('admin_users')
            .update({ password_hash: hashedPassword })
            .eq('id', data.id)

        if (updateError) {
            console.error('[PASSWORD CHANGE ERROR]', updateError)
            return NextResponse.json({ error: 'Erro ao atualizar senha.' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, message: 'Senha atualizada com sucesso!' })

    } catch (err) {
        console.error('[PASSWORD CHANGE EXCEPTION]', err)
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
    }
}
