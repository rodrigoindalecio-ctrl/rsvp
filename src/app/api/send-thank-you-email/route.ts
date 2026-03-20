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

export async function POST(request: NextRequest) {
    try {
        if (!verifyInternalKey(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { guestEmail, guestName, coupleNames, customMessage, amount } = body

        if (!guestEmail) {
            return NextResponse.json({ error: 'Email do convidado não fornecido' }, { status: 400 })
        }

        const emailHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'DM Sans', sans-serif;
            background-color: #FAFAF8;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #8B2D4F 0%, #6D223D 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 300;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
            color: #2E2E2E;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 25px;
        }
        .message-box {
            background-color: #FAFAF8;
            border-left: 3px solid #D4AF37;
            padding: 20px;
            margin: 30px 0;
            font-size: 16px;
            font-style: italic;
            border-radius: 0 12px 12px 0;
            color: #555;
        }
        .footer {
            background-color: #FAFAF8;
            padding: 40px 30px;
            text-align: center;
            border-top: 1px solid #E6E2DC;
        }
        .footer p {
            margin: 5px 0;
            color: #888;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 10px; font-weight: 900; margin-bottom: 15px;">Agradecimento Especial</p>
            <h1>${coupleNames}</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Querido(a) <strong>${guestName}</strong>,
            </div>
            
            <p>Recebemos o seu presente e não temos palavras para agradecer tanto carinho! Nossa alegria só está completa porque temos pessoas tão especiais como você compartilhando esse momento com a gente.</p>
            
            <p>Seu presente ajudará a construir nossos novos sonhos e nossa nova vida a dois.</p>
            
            ${customMessage ? `
            <div class="message-box">
                "${customMessage.replace(/\n/g, '<br>')}"
            </div>
            ` : ''}

            <p style="margin-top: 30px;">Com muito amor e gratidão,</p>
            <p style="font-weight: 700; color: #8B2D4F; font-size: 18px;">${coupleNames}</p>
        </div>

        <div class="footer">
            <p><strong>Vanessa Bidinotti - Assessoria e Cerimonial</strong></p>
            <p>Coordenação e Planejamento</p>
            <p style="margin-top: 25px; font-size: 10px; opacity: 0.5;">RSVP Manager • © 2026</p>
        </div>
    </div>
</body>
</html>
        `

        const transporter = createTransporter()

        const senderName = process.env.SMTP_FROM_NAME?.replace(/['"]/g, '') || "Vanessa Bidinotti"

        const result = await transporter.sendMail({
            from: {
                name: senderName,
                address: process.env.SMTP_FROM_EMAIL as string
            },
            to: guestEmail,
            subject: `Obrigado pelo presente! - ${coupleNames}`,
            html: emailHTML,
            replyTo: process.env.SMTP_FROM_EMAIL
        })

        return NextResponse.json({ success: true, messageId: result.messageId }, { status: 200 })

    } catch (error) {
        console.error('Erro ao enviar email de agradecimento:', error)
        return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
    }
}
