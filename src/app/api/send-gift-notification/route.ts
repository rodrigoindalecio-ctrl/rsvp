import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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

export async function POST(request: NextRequest) {
    try {
        

        const body = await request.json()
        const { ownerEmail, guestName, giftName, amount, message, coupleNames } = body

        if (!ownerEmail) {
            return NextResponse.json({ error: 'Email do proprietário não informado' }, { status: 400 })
        }

        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { background: #7b2d3d; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
        .gift-card { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7b2d3d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Eba! Você ganhou um presente! 🎁</h2>
            <p>${coupleNames || 'Seu Evento'}</p>
        </div>
        <div class="content">
            <p>Olá! Temos uma ótima notícia: um convidado acabou de enviar um presente para a sua lista.</p>
            
            <div class="gift-card">
                <p><strong>Presente:</strong> ${giftName}</p>
                <p><strong>De:</strong> ${guestName}</p>
                <p><strong>Valor:</strong> R$ ${Number(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                ${message ? `<p><strong>Mensagem:</strong> "${message}"</p>` : ''}
            </div>

            <p>O valor será processado e estará disponível no seu painel de acordo com o prazo do meio de pagamento (PIX é liberado em 48h).</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://rsvp-manager.vercel.app'}/dashboard" style="background: #7b2d3d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Acessar meu Extrato</a>
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
        await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: ownerEmail,
            subject: `🎁 Novo Presente: ${guestName} te presenteou com ${giftName}`,
            html: emailHTML
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao enviar notificação de presente para o proprietário:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
