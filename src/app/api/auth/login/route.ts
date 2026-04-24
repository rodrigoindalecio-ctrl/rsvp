import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/auth-utils'
import { cookies } from 'next/headers'
import {
    checkLoginAllowed,
    recordFailedAttempt,
    clearLoginAttempts,
    formatBlockTime
} from '@/lib/login-limiter'

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || ''

/**
 * Verifica o token do Cloudflare Turnstile no servidor.
 * Retorna true se válido, false se inválido ou se a chave não estiver configurada.
 */
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
    // Se não houver chave configurada, pula a verificação (dev local)
    if (!TURNSTILE_SECRET || TURNSTILE_SECRET === '') {
        return true
    }

    try {
        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: TURNSTILE_SECRET,
                response: token,
                remoteip: ip,
            }),
        })
        const data = await res.json()
        return data.success === true
    } catch (err) {
        console.error('[TURNSTILE] Erro na verificação:', err)
        return false
    }
}

export async function POST(request: NextRequest) {
    // Obter IP do cliente
    const ip =
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1'

    try {
        const { email, password, turnstileToken } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
        }

        // ── 1. Verificar se IP/email está bloqueado ──────────────────────────
        const limitCheck = checkLoginAllowed(ip, email)
        if (limitCheck.blocked) {
            const timeStr = formatBlockTime(limitCheck.remainingMs)
            return NextResponse.json(
                {
                    error: `Muitas tentativas incorretas. Aguarde ${timeStr} antes de tentar novamente.`,
                    blocked: true,
                    remainingMs: limitCheck.remainingMs,
                },
                { status: 429 }
            )
        }

        // ── 2. Verificar CAPTCHA Turnstile ───────────────────────────────────
        if (turnstileToken) {
            const captchaOk = await verifyTurnstile(turnstileToken, ip)
            if (!captchaOk) {
                return NextResponse.json(
                    { error: 'Verificação de segurança falhou. Recarregue a página e tente novamente.' },
                    { status: 403 }
                )
            }
        }

        // ── 3. Verificar Admin Master (via .env) ─────────────────────────────
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD

        if (adminEmail && adminPassword && email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
            const adminUser = { id: 'master', name: 'Administrador', email: adminEmail, role: 'admin' }
            const token = await encrypt(adminUser)

            clearLoginAttempts(ip, email)

            cookies().set('rsvp_session', token, {
                path: '/',
                maxAge: 60 * 60 * 24 * 30,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            })

            return NextResponse.json({ ok: true, user: adminUser, token })
        }

        // ── 4. Verificar usuários no Supabase ────────────────────────────────
        const { data, error } = await supabaseAdmin
            .from('admin_users')
            .select('id, name, email, type, password_hash')
            .eq('email', email.toLowerCase())
            .maybeSingle()

        if (error) {
            return NextResponse.json({ error: 'Erro ao verificar credenciais.' }, { status: 500 })
        }

        if (!data) {
            const { attemptsLeft } = recordFailedAttempt(ip, email)
            return NextResponse.json(
                {
                    error: 'E-mail ou senha incorretos.',
                    attemptsLeft: attemptsLeft > 0 ? attemptsLeft : undefined,
                },
                { status: 401 }
            )
        }

        // ── 5. Verificar senha ───────────────────────────────────────────────
        if (data.password_hash) {
            const isHashed = data.password_hash.startsWith('$2')

            if (isHashed) {
                const isMatch = await bcrypt.compare(password, data.password_hash)
                if (!isMatch) {
                    const { attemptsLeft, blocked } = recordFailedAttempt(ip, email)
                    if (blocked) {
                        return NextResponse.json(
                            {
                                error: 'Conta bloqueada temporariamente por excesso de tentativas. Aguarde 15 minutos.',
                                blocked: true,
                                remainingMs: 15 * 60_000,
                            },
                            { status: 429 }
                        )
                    }
                    return NextResponse.json(
                        {
                            error: 'E-mail ou senha incorretos.',
                            attemptsLeft: attemptsLeft > 0 ? attemptsLeft : undefined,
                        },
                        { status: 401 }
                    )
                }
            } else {
                return NextResponse.json(
                    { error: 'Sua conta precisa de uma atualização de segurança. Contate o suporte.' },
                    { status: 403 }
                )
            }
        } else {
            // Primeiro login — define hash
            const hashedPassword = await bcrypt.hash(password, 8)
            await supabaseAdmin
                .from('admin_users')
                .update({ password_hash: hashedPassword })
                .eq('id', data.id)
        }

        // ── 6. Login bem-sucedido ────────────────────────────────────────────
        clearLoginAttempts(ip, email)

        const user = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.type === 'admin' ? 'admin' : 'user'
        }

        const token = await encrypt(user)

        cookies().set('rsvp_session', token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        return NextResponse.json({ ok: true, user, token })

    } catch (err) {
        console.error('[LOGIN ERROR]', err)
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
    }
}
