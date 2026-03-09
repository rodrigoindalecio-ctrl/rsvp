import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json()

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
        }

        // 1. Verificar se usuário já existe
        const { data: existingUser } = await supabase
            .from('admin_users')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle()

        if (existingUser) {
            return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 })
        }

        // 2. Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10)
        const userId = crypto.randomUUID()

        // 3. Criar usuário
        const { error: userError } = await supabase.from('admin_users').insert({
            id: userId,
            name,
            email: email.toLowerCase(),
            type: 'noivos',
            password_hash: hashedPassword,
            created_at: new Date().toISOString()
        })

        if (userError) throw userError

        // 4. Criar evento padrão para o novo usuário
        const eventId = crypto.randomUUID()
        const defaultSlug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 4)

        const { error: eventError } = await supabase.from('events').insert({
            id: eventId,
            slug: defaultSlug,
            event_settings: {
                coupleNames: name,
                slug: defaultSlug,
                eventType: 'casamento',
                eventDate: new Date().toISOString().split('T')[0],
                eventTime: '19:00',
                confirmationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                eventLocation: 'Espaço e Buffet - Endereço',
                coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop',
                coverImagePosition: 50,
                coverImageScale: 1.0,
                customMessage: 'Sejam bem-vindos! Ficamos felizes em compartilhar este momento com vocês.'
            },
            created_at: new Date().toISOString(),
            created_by: email.toLowerCase()
        })

        if (eventError) throw eventError

        return NextResponse.json({
            ok: true,
            user: { name, email: email.toLowerCase(), role: 'user' }
        })

    } catch (err) {
        console.error('[REGISTER API ERROR]', err)
        return NextResponse.json({ error: 'Erro ao criar conta.' }, { status: 500 })
    }
}
