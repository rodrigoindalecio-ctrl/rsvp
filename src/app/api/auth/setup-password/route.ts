import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { email, tempToken, password } = await request.json()

        if (!email || !tempToken || !password) {
            return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
        }

        // 1. Buscar usuário
        const { data, error } = await supabaseAdmin
            .from('admin_users')
            .select('id, name, email, password_hash')
            .eq('email', email.toLowerCase())
            .maybeSingle()

        if (error) {
            console.error('[SETUP PASSWORD] Supabase error:', error)
            return NextResponse.json({ error: 'Erro ao verificar usuário.' }, { status: 500 })
        }

        if (!data) {
            return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
        }

        // 2. Verificar se o token temporário (password_hash atual) coincide
        // Se já estiver hashed (começa com $2), significa que ele já configurou a senha
        if (data.password_hash && data.password_hash.startsWith('$2')) {
            return NextResponse.json({ error: 'Este link de configuração expirou ou a senha já foi definida.' }, { status: 403 })
        }

        if (data.password_hash !== tempToken) {
            return NextResponse.json({ error: 'Token de configuração inválido.' }, { status: 403 })
        }

        // 3. Hash da nova senha
        const hashedPassword = await bcrypt.hash(password, 10)

        // 4. Salvar a nova senha
        const { error: updateError } = await supabaseAdmin
            .from('admin_users')
            .update({ password_hash: hashedPassword })
            .eq('id', data.id)

        if (updateError) {
            console.error('[SETUP PASSWORD] Update error:', updateError)
            return NextResponse.json({ error: 'Erro ao salvar nova senha.' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, message: 'Senha configurada com sucesso!' })

    } catch (err) {
        console.error('[SETUP PASSWORD] Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
    }
}
