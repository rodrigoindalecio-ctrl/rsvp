import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Criar transportador SMTP com os dados da Hostinger
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
            rejectUnauthorized: false // Ignorar erros de certificado SSL
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        

        const body = await request.json()
        const { name, email, type, onboardingSteps, password } = body

        const reqBaseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

        // Template profissional de e-mail de convite
        const emailHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', serif, sans-serif; background-color: #FAFAF8; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 40px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); border: 1px solid #E6E2DC; }
        .header { background: linear-gradient(135deg, #7C2D12 0%, #450A0A 100%); color: white; padding: 60px 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; font-style: italic; }
        .content { padding: 50px 40px; }
        .greeting { font-size: 20px; color: #1A1A1A; margin-bottom: 25px; font-weight: 800; }
        .message { font-size: 15px; color: #4B5563; line-height: 1.8; margin-bottom: 40px; }
        .onboarding-box { background-color: #F9FAFB; border-radius: 24px; padding: 30px; border: 1px dashed #E5E7EB; margin-bottom: 40px; }
        .onboarding-title { font-size: 11px; font-weight: 900; color: #7C2D12; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 20px; display: block; }
        .step { display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px; }
        .step-num { font-weight: 900; color: #7C2D12; font-size: 14px; }
        .step-text { font-size: 14px; color: #374151; font-weight: 600; }
        .cta-button { display: block; background-color: #7C2D12; color: #FFFFFF !important; padding: 20px 40px; text-decoration: none; border-radius: 16px; font-weight: 900; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s; margin-top: 20px; }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #F3F4F6; }
        .footer p { margin: 5px 0; color: #9CA3AF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="font-family: serif;">Seu RSVP Premium está pronto!</h1>
            <p style="opacity: 0.8; font-size: 12px; margin-top: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Acesso exclusivo ao painel</p>
        </div>

        <div class="content">
            <div class="greeting">Olá, ${name}! 👋</div>
            <div class="message">
                Ficamos muito felizes em habilitar o seu acesso à nossa plataforma. Você já pode começar a organizar seu evento e acompanhar todas as confirmações em tempo real.
            </div>

            <div class="onboarding-box">
                <span class="onboarding-title">Seus Dados de Acesso:</span>
                <div class="step">
                    <span class="step-text"><strong>E-mail:</strong> ${email}</span>
                </div>
                <div style="margin-top: 20px;">
                    <span class="onboarding-title">Guia de Primeiros Passos:</span>
                    ${onboardingSteps.split('\n').filter((l: string) => l.trim()).map((line: string) => `
                        <div class="step">
                            <span class="step-text">${line.replace(/^[0-9️⃣]*/, '').trim()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <a href="${reqBaseUrl}/cadastrar-senha?email=${encodeURIComponent(email)}&temp=${password}" class="cta-button">
                Começar agora!
            </a>
        </div>

        <div class="footer">
            <p>Coordenação: Vanessa Bidinotti - Assessoria e Cerimonial</p>
            <p style="margin-top: 10px; color: #E5E7EB;">© 2026 RSVP Manager - Sistema Premium</p>
        </div>
    </div>
</body>
</html>
        `

        const transporter = createTransporter()
        
        const senderName = process.env.SMTP_FROM_NAME?.replace(/['"]/g, '') || "Vanessa Bidinotti"

        // Enviar o e-mail
        await transporter.sendMail({
            from: {
                name: senderName,
                address: process.env.SMTP_FROM_EMAIL as string
            },
            to: email,
            subject: `🎁 Convite Especial: Seu Painel RSVP está pronto!`,
            html: emailHTML,
        })

        return NextResponse.json({ success: true, message: 'Email enviado com sucesso!' })
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Falha ao enviar e-mail automático', details: error.message },
            { status: 500 }
        )
    }
}
