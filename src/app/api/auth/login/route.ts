import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
        }

        // 1. Verificar credenciais do Admin Master (lidas do .env — nunca do código-fonte)
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD

        if (adminEmail && adminPassword && email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
            return NextResponse.json({
                ok: true,
                user: { name: 'Administrador', email: adminEmail, role: 'admin' }
            })
        }

        // 2. Verificar usuários cadastrados no Supabase
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, name, email, type, password_hash')
            .eq('email', email.toLowerCase())
            .maybeSingle()

        if (error) {
            console.error('[LOGIN] Supabase error:', error)
            return NextResponse.json({ error: 'Erro ao verificar credenciais.' }, { status: 500 })
        }

        if (!data) {
            // Mensagem genérica para não revelar se o e-mail existe ou não
            return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
        }

        // 3. Verificar senha
        if (data.password_hash) {
            // Verificar se a senha está em formato hash (bcrypt hashes começam com $2a$ ou $2b$)
            const isHashed = data.password_hash.startsWith('$2')

            if (isHashed) {
                const isMatch = await bcrypt.compare(password, data.password_hash)
                if (!isMatch) {
                    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
                }
            } else {
                // Senha legada em texto simples: comparar e então converter para hash
                if (data.password_hash !== password) {
                    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
                }

                // Converter para hash para as próximas vezes
                const hashedPassword = await bcrypt.hash(password, 8)
                await supabase
                    .from('admin_users')
                    .update({ password_hash: hashedPassword })
                    .eq('id', data.id)
            }
        } else {
            // Sem senha definida: primeiro login, salvar a senha fornecida como hash
            const hashedPassword = await bcrypt.hash(password, 8)
            await supabase
                .from('admin_users')
                .update({ password_hash: hashedPassword })
                .eq('id', data.id)
        }

        return NextResponse.json({
            ok: true,
            user: {
                name: data.name,
                email: data.email,
                role: data.type === 'admin' ? 'admin' : 'user'
            }
        })

    } catch (err) {
        console.error('[LOGIN] Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
    }
}
