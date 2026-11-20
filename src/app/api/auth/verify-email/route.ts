import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/auth-utils'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const { email, code } = await request.json()

        if (!email || !code) {
            return NextResponse.json({ error: 'E-mail e código de 6 dígitos são obrigatórios.' }, { status: 400 })
        }

        const cleanEmail = email.toLowerCase().trim()
        const cleanCode = code.toString().trim()

        if (cleanCode.length !== 6) {
            return NextResponse.json({ error: 'O código deve ter exatamente 6 dígitos.' }, { status: 400 })
        }

        // 1. Buscar token ativo mais recente não utilizado e não expirado
        const now = new Date().toISOString()
        const { data: tokenRecord, error: fetchError } = await supabaseAdmin
            .from('email_verification_tokens')
            .select('*')
            .eq('email', cleanEmail)
            .is('used_at', null)
            .gt('expires_at', now)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (fetchError || !tokenRecord) {
            return NextResponse.json({ 
                error: 'Código expirado ou inválido. Por favor, solicite um novo código.' 
            }, { status: 400 })
        }

        // 2. Proteção contra brute-force (máx 5 tentativas erradas por token)
        if ((tokenRecord.attempts || 0) >= 5) {
            return NextResponse.json({ 
                error: 'Limite de tentativas excedido. Solicite um novo código.' 
            }, { status: 403 })
        }

        // 3. Validar hash do código
        const isMatch = await bcrypt.compare(cleanCode, tokenRecord.token_hash)
        if (!isMatch) {
            // Incrementar tentativas
            await supabaseAdmin
                .from('email_verification_tokens')
                .update({ attempts: (tokenRecord.attempts || 0) + 1 })
                .eq('id', tokenRecord.id)

            const remaining = 4 - (tokenRecord.attempts || 0)
            return NextResponse.json({ 
                error: `Código incorreto. Você tem mais ${remaining > 0 ? remaining : 0} tentativa(s).` 
            }, { status: 400 })
        }

        // 4. Código correto! Marcar token como utilizado
        await supabaseAdmin
            .from('email_verification_tokens')
            .update({ used_at: now })
            .eq('id', tokenRecord.id)

        const meta = tokenRecord.metadata || {}

        // 5. Verificar novamente se usuário não foi criado concorrentemente
        const { data: existingUser } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle()

        let userId = existingUser?.id

        if (!existingUser) {
            userId = crypto.randomUUID()
            const { error: userError } = await supabaseAdmin.from('admin_users').insert({
                id: userId,
                name: meta.name || 'Usuário',
                email: cleanEmail,
                type: 'noivos',
                password_hash: meta.passwordHash,
                created_at: now,
                email_verified_at: now,
                terms_accepted_at: meta.acceptedAt || now,
                privacy_accepted_at: meta.acceptedAt || now,
                terms_version: meta.termsVersion || 'v1.0',
                consent_ip: meta.consentIp,
                consent_user_agent: meta.consentUserAgent,
                marketing_opt_in: Boolean(meta.marketingOptIn)
            })

            if (userError) {
                console.error('[VERIFY EMAIL CREATE USER ERROR]', userError)
                throw userError
            }

            // 6. Criar evento padrão com os dados fornecidos pelo casal
            const eventId = crypto.randomUUID()
            const baseSlug = (meta.coupleNames || meta.name || 'evento')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '')
                .slice(0, 20)
            const defaultSlug = `${baseSlug}-${Math.random().toString(36).substr(2, 4)}`

            const { error: eventError } = await supabaseAdmin.from('events').insert({
                id: eventId,
                slug: defaultSlug,
                event_settings: {
                    coupleNames: meta.coupleNames || meta.name,
                    coupleStyle: meta.coupleStyle || 'casal',
                    slug: defaultSlug,
                    eventType: meta.eventType || 'casamento',
                    eventDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    eventTime: '19:00',
                    confirmationDeadline: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    eventLocation: 'Espaço e Buffet',
                    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop',
                    coverImagePosition: 50,
                    coverImageScale: 1.0,
                    customMessage: 'Sejam bem-vindos! Ficamos felizes em compartilhar este momento com vocês.',
                    isGiftListEnabled: true,
                    giftListInternalEnabled: false
                },
                created_at: now,
                created_by: cleanEmail
            })

            if (eventError) {
                console.error('[VERIFY EMAIL CREATE EVENT ERROR]', eventError)
            }
        }

        // 7. Autenticar usuário criando sessão JWT no cookie
        const authUser = {
            name: meta.name || 'Usuário',
            email: cleanEmail,
            role: 'user'
        }

        const sessionToken = await encrypt(authUser)
        cookies().set('rsvp_session', sessionToken, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 dias
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        return NextResponse.json({
            ok: true,
            user: authUser,
            message: 'E-mail confirmado com sucesso!'
        })

    } catch (err: any) {
        console.error('[VERIFY EMAIL ERROR]', err)
        return NextResponse.json({ error: err.message || 'Erro ao validar código.' }, { status: 500 })
    }
}
