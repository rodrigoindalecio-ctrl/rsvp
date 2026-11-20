import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import nodemailer from 'nodemailer'
import bcrypt from 'bcryptjs'

// Cria transportador SMTP usando Hostinger (mesma infra de send-invite-email)
const createTransporter = () => {
    const port = Number(process.env.SMTP_PORT) || 465
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    })
}

// Validador simples de Turnstile no servidor
async function verifyTurnstile(token: string, ip: string) {
    const secret = process.env.TURNSTILE_SECRET_KEY
    if (!secret) return true // Se não configurado, ignora

    try {
        const formData = new URLSearchParams()
        formData.append('secret', secret)
        formData.append('response', token)
        formData.append('remoteip', ip)

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        })
        const data = await res.json()
        return data.success === true
    } catch (e) {
        console.error('[TURNSTILE VERIFY ERROR]', e)
        return true // Fallback gracioso
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name,
            email,
            password,
            coupleNames,
            coupleStyle = 'casal',
            eventType = 'casamento',
            turnstileToken,
            marketingOptIn = false
        } = body

        // 1. Validações básicas
        if (!name || !email || !password || !coupleNames) {
            return NextResponse.json({ error: 'Por favor, preencha todos os campos obrigatórios.' }, { status: 400 })
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
        }

        const cleanEmail = email.toLowerCase().trim()
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'
        const userAgent = request.headers.get('user-agent') || 'desconhecido'

        // 2. Validar Turnstile se enviado
        if (turnstileToken) {
            const isHuman = await verifyTurnstile(turnstileToken, clientIp)
            if (!isHuman) {
                return NextResponse.json({ error: 'Falha na validação do captcha. Tente novamente.' }, { status: 400 })
            }
        }

        // 3. Verificar se o e-mail já existe na base
        const { data: existingUser } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle()

        if (existingUser) {
            return NextResponse.json({ error: 'Este e-mail já possui uma conta cadastrada. Faça login.' }, { status: 400 })
        }

        // 4. Rate-limiting simples: verificar quantos tokens foram criados para este e-mail nos últimos 15 min
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
        const { count } = await supabaseAdmin
            .from('email_verification_tokens')
            .select('id', { count: 'exact', head: true })
            .eq('email', cleanEmail)
            .gte('created_at', fifteenMinutesAgo)

        if ((count || 0) >= 5) {
            return NextResponse.json({ 
                error: 'Muitas tentativas para este e-mail. Aguarde 15 minutos antes de solicitar novo código.' 
            }, { status: 429 })
        }

        // 5. Gerar código de 6 dígitos numéricos e hash
        const rawCode = Math.floor(100000 + Math.random() * 900000).toString()
        const tokenHash = await bcrypt.hash(rawCode, 10)
        const hashedPassword = await bcrypt.hash(password, 10)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos

        // 6. Salvar metadados do cadastro temporariamente
        const metadata = {
            name,
            passwordHash: hashedPassword,
            coupleNames,
            coupleStyle,
            eventType,
            consentIp: clientIp,
            consentUserAgent: userAgent,
            marketingOptIn: Boolean(marketingOptIn),
            termsVersion: 'v1.0',
            acceptedAt: new Date().toISOString()
        }

        const { error: insertError } = await supabaseAdmin
            .from('email_verification_tokens')
            .insert({
                email: cleanEmail,
                token_hash: tokenHash,
                metadata,
                expires_at: expiresAt
            })

        if (insertError) {
            console.error('[REGISTER PUBLIC DB ERROR]', insertError)
            return NextResponse.json({ error: 'Erro ao preparar verificação. Verifique se a migração SQL foi executada.' }, { status: 500 })
        }

        // 7. Enviar e-mail com o código de 6 dígitos
        const transporter = createTransporter()
        const emailHtml = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="utf-8">
                <title>Seu Código de Confirmação</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f7; margin: 0; padding: 40px 20px;">
                <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #ebe4e1; box-shadow: 0 4px 20px rgba(123, 45, 61, 0.05);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 11px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; color: #7b2d3d;">VB Assessoria e Cerimonial</span>
                        <h1 style="color: #1a1a1a; font-size: 24px; margin: 12px 0 6px; font-family: serif;">Confirme seu E-mail</h1>
                        <p style="color: #666; font-size: 14px; margin: 0;">Olá, <strong>${name}</strong>! Digite o código de 6 dígitos para ativar sua conta:</p>
                    </div>

                    <div style="background-color: #fcfafa; border: 2px dashed #7b2d3d; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
                        <span style="font-size: 38px; font-weight: 900; letter-spacing: 0.3em; color: #7b2d3d; font-family: monospace;">${rawCode}</span>
                        <p style="margin: 8px 0 0; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.1em;">Válido por 15 minutos</p>
                    </div>

                    <p style="color: #555; font-size: 13px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                        Se você não solicitou este cadastro na plataforma de RSVP de Vanessa Bidinotti, por favor desconsidere este e-mail com segurança.
                    </p>

                    <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                        <p style="font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">
                            VB Cerimonial • RSVP & Lista Inteligente
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `

        await transporter.sendMail({
            from: `"Vanessa Bidinotti RSVP" <${process.env.SMTP_USER || 'contato@vanessabidinotti.com.br'}>`,
            to: cleanEmail,
            subject: `${rawCode} é o seu código de confirmação RSVP`,
            html: emailHtml
        })

        return NextResponse.json({
            ok: true,
            email: cleanEmail,
            message: 'Código enviado com sucesso para o seu e-mail!'
        })

    } catch (err: any) {
        console.error('[REGISTER PUBLIC API ERROR]', err)
        return NextResponse.json({ error: err.message || 'Erro ao processar solicitação de cadastro.' }, { status: 500 })
    }
}
