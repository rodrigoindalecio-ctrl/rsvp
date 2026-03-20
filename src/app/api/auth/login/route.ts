import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/auth-utils'
import { cookies } from 'next/headers'

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
            const adminUser = { id: 'master', name: 'Administrador', email: adminEmail, role: 'admin' }
            const token = await encrypt(adminUser)
            
            cookies().set('rsvp_session', token, {
                path: '/',
                maxAge: 60 * 60 * 24 * 30,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            })

            return NextResponse.json({
                ok: true,
                user: adminUser,
                token
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
                // Senha legada em texto simples: recusar por segurança.
                // O administrador deve atualizar no banco para o primeiro hash.
                return NextResponse.json({ error: 'Sua conta precisa de uma atualização de segurança. Contate o suporte.' }, { status: 403 })
            }
        } else {
            // Sem senha definida: primeiro login, salvar a senha fornecida como hash
            const hashedPassword = await bcrypt.hash(password, 8)
            await supabase
                .from('admin_users')
                .update({ password_hash: hashedPassword })
                .eq('id', data.id)
        }

        const user = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.type === 'admin' ? 'admin' : 'user'
        }

        // Criar Sessão Segura (JWT)
        const token = await encrypt(user)
        
        // Configurar o Cookie de Sessão no Servidor (HttpOnly)
        cookies().set('rsvp_session', token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 dias
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        return NextResponse.json({
            ok: true,
            user,
            token // Opcional: retornar o token se quiser salvar no localStorage também
        })

    } catch (err) {
        console.error('[LOGIN ERROR]', err)
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
    }
}
