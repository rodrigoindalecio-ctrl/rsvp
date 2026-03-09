import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Função para parsear data ISO sem problemas de timezone
function parseDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
}

// Criar transportador SMTP com Outlook/Hotmail
const createTransporter = () => {
    const port = Number(process.env.SMTP_PORT)
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465, // SSL/TLS para porta 465, false para STARTTLS (587)
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
        const { email, guestName, eventSettings, confirmedCompanions, confirmedNames, confirmedDetails, giftListLinks } = body

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Email inválido' },
                { status: 400 }
            )
        }

        // Formatar data
        const eventDate = parseDateString(eventSettings.eventDate)
        const eventTime = eventSettings.eventTime || '00:00'
        const [hours, minutes] = eventTime.split(':')
        eventDate.setHours(parseInt(hours), parseInt(minutes))

        const formattedDate = eventDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })

        // Criar URL do Waze (se não houver, usar localização genérica)
        const wazeURL = eventSettings.wazeLocation
            ? `https://waze.com/ul?q=${encodeURIComponent(eventSettings.wazeLocation)}`
            : `https://waze.com/ul?q=${encodeURIComponent(eventSettings.eventLocation)}`

        // Gerar link do Google Calendar
        const calDate = eventSettings.eventDate.replace(/-/g, '')
        const calTime = (eventSettings.eventTime || '20:00').replace(':', '')
        const googleCalendarURL = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventSettings.coupleNames)}&dates=${calDate}T${calTime}00/${calDate}T${Number(calTime.substring(0, 2)) + 4}${calTime.substring(2)}00&details=${encodeURIComponent(eventSettings.customMessage || '')}&location=${encodeURIComponent(eventSettings.eventLocation)}`

        // Limpar baseUrl
        let baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/['"]+/g, '').trim();
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

        // Link da lista interna (Vitrine)
        const internalGiftLink = `${baseUrl}/${eventSettings.slug}/presentes`;

        // Construir HTML do email com template profissional
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
        .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #2E2E2E;
            margin-bottom: 25px;
            line-height: 1.6;
        }
        .confirmation-badge {
            background-color: #F8F9F8;
            border: 1px solid #E8EFE8;
            padding: 25px;
            margin: 20px 0;
            border-radius: 16px;
            color: #2E2E2E;
        }
        .confirmed-names {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #E6E2DC;
        }
        .confirmed-names h4 {
            margin: 0 0 12px 0;
            font-size: 11px;
            font-weight: 900;
            color: #8B2D4F;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .confirmed-names ul {
            margin: 0;
            padding: 0;
            list-style-type: none;
        }
        .confirmed-names li {
            margin: 8px 0;
            color: #333;
            font-size: 14px;
            display: flex;
            align-items: center;
        }
        .confirmed-names li:before {
            content: "✓";
            margin-right: 10px;
            color: #4CAF50;
            font-weight: bold;
        }
        .section-title {
            font-size: 12px;
            font-weight: 900;
            color: #8B2D4F;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 40px 0 15px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .info-card {
            background-color: #FAFAF8;
            border: 1px solid #E6E2DC;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 12px;
            position: relative;
        }
        .info-label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-weight: 700;
        }
        .info-value {
            font-size: 15px;
            color: #2E2E2E;
            font-weight: 600;
        }
        .cta-button {
            display: inline-block;
            background-color: #8B2D4F;
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            text-align: center;
            margin: 10px 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(139, 45, 79, 0.2);
        }
        .gift-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .gift-links li {
            margin: 10px 0;
        }
        .gift-links a {
            color: #8B2D4F;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            display: flex;
            align-items: center;
        }
        .gift-links a:before {
            content: "🎁";
            margin-right: 8px;
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
            <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 10px; font-weight: 900; margin-bottom: 15px;">Confirmação de Presença</p>
            <h1>${eventSettings.coupleNames}</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Olá, <strong>${guestName}</strong>!
                <br><br>
                Ficamos muito felizes com a sua confirmação! 🎉 Sua presença é o que tornará este dia verdadeiramente especial para nós.
            </div>

            <div class="confirmation-badge">
                <div style="font-size: 13px; font-weight: 700; color: #2E7D32;">✓ Presença Confirmada para ${confirmedCompanions} pessoa${confirmedCompanions > 1 ? 's' : ''}</div>
                ${confirmedDetails && confirmedDetails.length > 0 ? `
                <div class="confirmed-names">
                    <h4>Quem vai com você:</h4>
                    <ul>
                        ${confirmedDetails.map((detail: any) => {
            const categoryLabel = detail.category === 'adult_paying' ? 'Adulto' :
                detail.category === 'child_paying' ? 'Criança' :
                    'Criança'
            return `<li>${detail.name} <span style="font-size: 11px; color: #888; margin-left: auto;">${categoryLabel}</span></li>`
        }).join('')}
                    </ul>
                </div>
                ` : confirmedNames && confirmedNames.length > 0 ? `
                <div class="confirmed-names">
                    <h4>Nomes Confirmados:</h4>
                    <ul>
                        ${confirmedNames.map((name: string) => `<li>${name}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>

            <div class="section-title">📅 Onde e Quando</div>
            
            <div class="info-card">
                <div class="info-label">Data e Hora</div>
                <div class="info-value">${formattedDate}h</div>
                <div style="margin-top: 15px;">
                    <a href="${googleCalendarURL}" class="cta-button" style="background-color: #FAFAF8; border: 1px solid #8B2D4F; color: #8B2D4F !important; box-shadow: none;">Adicionar ao Calendário</a>
                </div>
            </div>

            <div class="info-card">
                <div class="info-label">Local do Evento</div>
                <div class="info-value">${eventSettings.eventLocation}</div>
                <div style="margin-top: 15px;">
                    <a href="${wazeURL}" class="cta-button">Ver no GPS / Waze</a>
                </div>
            </div>

            ${eventSettings.dressCode ? `
            <div class="section-title">👔 Sugestão de Traje</div>
            <div class="info-card">
                <div class="info-value">${eventSettings.dressCode}</div>
            </div>
            ` : ''}

            ${eventSettings.parkingSettings?.hasParking ? `
            <div class="section-title">🚗 Estacionamento</div>
            <div class="info-card">
                <div class="info-label">Tipo</div>
                <div class="info-value">
                    ${eventSettings.parkingSettings.type === 'free' ? 'Gratuito no Local' :
                    eventSettings.parkingSettings.type === 'valet' ? 'Valet / Manobrista' : 'Pago no Local'}
                    ${eventSettings.parkingSettings.price ? ` — ${eventSettings.parkingSettings.price}` : ''}
                </div>
                ${eventSettings.parkingSettings.address ? `
                <div style="margin-top: 10px; font-size: 13px; color: #666;">
                    <strong>Endereço do Estacionamento:</strong><br>
                    ${eventSettings.parkingSettings.address}
                </div>
                ` : ''}
            </div>
            ` : ''}

            <div class="section-title">🎁 Sugestões de Presentes</div>
            <div class="info-card">
                <p style="font-size: 14px; color: #555; margin-top: 0; line-height: 1.5;">
                    Ter você conosco já é o nosso maior presente! Se desejar nos agraciar com algo mais, preparamos algumas opções:
                </p>
                <div style="margin: 15px 0;">
                    <a href="${internalGiftLink}" class="cta-button" style="background-color: #D4AF37;">Ver Nossa Lista de Presentes</a>
                </div>
                
                ${eventSettings.giftListLinks && eventSettings.giftListLinks.length > 0 ? `
                <div style="margin-top: 20px; border-top: 1px solid #E6E2DC; pt-15px;">
                    <p style="font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase;">Outras Listas Externas:</p>
                    <ul class="gift-links">
                        ${eventSettings.giftListLinks.map((link: any) => `
                            <li><a href="${link.url}" target="_blank">${link.name}</a></li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>

            ${eventSettings.customMessage ? `
            <div style="margin-top: 40px; padding: 25px; border-left: 2px solid #8B2D4F; background-color: #FAFAF8; font-style: italic; color: #555; font-size: 15px; line-height: 1.6;">
                "${eventSettings.customMessage}"
            </div>
            ` : ''}
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

        // Enviar email via SMTP Hostinger
        try {
            const transporter = createTransporter()

            // Enviar email
            const result = await transporter.sendMail({
                from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                subject: `Presença Confirmada - ${eventSettings.coupleNames}`,
                html: emailHTML,
                replyTo: process.env.SMTP_FROM_EMAIL
            })

            // Retornar sucesso
            return NextResponse.json(
                {
                    success: true,
                    message: 'Email enviado com sucesso',
                    email: email,
                    guestName: guestName,
                    messageId: result.messageId
                },
                { status: 200 }
            )
        } catch (emailError) {
            console.error(`[EMAIL] ❌ Erro ao enviar email:`, emailError)
            throw emailError
        }

    } catch (error) {
        console.error('Erro ao enviar email:', error)
        return NextResponse.json(
            { error: 'Erro ao enviar email' },
            { status: 500 }
        )
    }
}
