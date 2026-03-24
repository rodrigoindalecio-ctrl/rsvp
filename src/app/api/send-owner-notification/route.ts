import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { verifyInternalKey } from '@/lib/auth-utils'

// Criar transportador SMTP
const createTransporter = () => {
    const port = Number(process.env.SMTP_PORT)
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
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

export async function sendOwnerEmail(body: any) {
    try {
        const { ownerEmail, guestName, eventSettings, confirmedNames, status, reqBaseUrl = 'http://localhost:3000' } = body

        if (!ownerEmail) {
            return { error: 'Email do proprietário não informado', status: 400 }
        }

        const isConfirmed = status === 'confirmed' || confirmedNames.length > 0

        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { background: #8B2D4F; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
        .badge { display: inline-block; padding: 5px 10px; border-radius: 5px; font-weight: bold; font-size: 12px; }
        .badge-success { background: #E8F5E9; color: #2E7D32; }
        .badge-danger { background: #FFEBEE; color: #C62828; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Novo RSVP Recebido! 🔔</h2>
            <p>${eventSettings.coupleNames}</p>
        </div>
        <div class="content">
            <p>Olá! Você acabou de receber uma nova atualização na sua lista de convidados.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Convidado:</strong> ${guestName}</p>
                <p><strong>Status:</strong> <span class="badge ${isConfirmed ? 'badge-success' : 'badge-danger'}">${isConfirmed ? 'CONFIRMADO ✅' : 'RECUSADO ❌'}</span></p>
                
                ${confirmedNames.length > 0 ? `
                    <p><strong>Pessoas Confirmadas (${confirmedNames.length}):</strong></p>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${confirmedNames.map((name: string) => `<li>${name}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>

            <p>Para ver a lista completa e gerenciar seus convidados, acesse seu painel:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${reqBaseUrl}/dashboard" style="background: #8B2D4F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Painel de Controle</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2026 RSVP Manager - Vanessa Bidinotti</p>
            <p>Este é um e-mail automático. Não responda.</p>
        </div>
    </div>
</body>
</html>
        `

        const transporter = createTransporter()
        
        const senderName = (process.env.SMTP_FROM_NAME || "Vanessa Bidinotti • RSVP Manager").replace(/['"]/g, '')
        const fromEmail = process.env.SMTP_FROM_EMAIL
        
        const info = await transporter.sendMail({
            from: `"${senderName}" <${fromEmail}>`,
            to: ownerEmail,
            subject: `🔔 Novo RSVP: ${guestName} ${isConfirmed ? 'confirmou' : 'recusou'} presença`,
            html: emailHTML,
            replyTo: fromEmail
        })

        return { success: true, messageId: info.messageId }
    } catch (error: any) {
        console.error('Erro ao enviar notificação para o proprietário:', error)
        return { error: error.message || 'Erro interno', status: 500 }
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!verifyInternalKey(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const body = await request.json()
        body.reqBaseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        
        const result = await sendOwnerEmail(body)
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status })
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
