# 📧 Funcionalidades Futuras: Enviar Mensagens em Massa

> Documentação de implementações futuras sugeridas para o sistema de emails

---

## 1️⃣ Reenviar Email de Confirmação

### Cenário
Convidado perdeu o email de confirmação e quer receber novamente.

### Implementação (Dashboard)

**Arquivo:** `src/app/dashboard/page.tsx`

**Adicionar botão em cada linha:**
```tsx
<button 
  onClick={() => handleResendEmail(guest.id)}
  className="text-primary hover:text-primary/70 text-sm"
  title="Reenviar email de confirmação"
>
  📧 Reenviar
</button>
```

**Handler:**
```tsx
const handleResendEmail = async (guestId: string) => {
  const guest = guests.find(g => g.id === guestId)
  
  if (!guest?.email) {
    alert('Este convidado não tem email registrado')
    return
  }
  
  const response = await fetch('/api/send-confirmation-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: guest.email,
      guestName: guest.name,
      eventSettings: eventSettings,
      confirmedCompanions: guest.companionsList.filter(c => c.isConfirmed).length + 1,
      giftListLinks: eventSettings.giftListLinks
    })
  })
  
  if (response.ok) {
    alert(`Email reenviado para ${guest.email}`)
  } else {
    alert('Erro ao reenviar email')
  }
}
```

---

## 2️⃣ Enviar Email em Massa para Não-Confirmados

### Cenário
Faltam 3 dias para o evento e você quer lembrar quem ainda não confirmou.

### Implementação (Dashboard - Novo Card)

```tsx
<div className="bg-surface border border-borderSoft rounded-lg p-4">
  <h3 className="text-lg font-semibold text-textPrimary mb-2">
    📢 Enviar Lembretes
  </h3>
  
  <div className="space-y-2 mb-4">
    <p className="text-sm text-textSecondary">
      {metrics.pending} convidados ainda não confirmaram
    </p>
    
    <button
      onClick={handleSendReminderEmails}
      className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all"
    >
      📧 Enviar Lembrança para Pendentes
    </button>
  </div>
</div>
```

**Handler:**
```tsx
const handleSendReminderEmails = async () => {
  const pendingGuests = guests.filter(
    g => g.status === 'pending' && g.email
  )
  
  if (pendingGuests.length === 0) {
    alert('Nenhum convidado com email pendente')
    return
  }
  
  const confirmSend = window.confirm(
    `Enviar lembrança para ${pendingGuests.length} convidados?`
  )
  
  if (!confirmSend) return
  
  let sent = 0
  let failed = 0
  
  for (const guest of pendingGuests) {
    try {
      await fetch('/api/send-reminder-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: guest.email,
          guestName: guest.name,
          eventSettings: eventSettings,
          daysUntilEvent: calculateDaysUntilEvent(eventSettings.eventDate)
        })
      })
      sent++
    } catch (error) {
      failed++
    }
  }
  
  alert(`Enviados: ${sent}, Falharam: ${failed}`)
}

const calculateDaysUntilEvent = (eventDate: string): number => {
  const event = new Date(eventDate)
  const now = new Date()
  const diff = event.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
}
```

### Nova Rota de API

**Arquivo:** `src/app/api/send-reminder-email/route.ts`

```tsx
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, guestName, eventSettings, daysUntilEvent } = body

    const reminderHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 20px; }
        .header { background: linear-gradient(135deg, #C6A664 0%, #B8945A 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .cta { background: #C6A664; color: white; padding: 15px 40px; border-radius: 50px; text-align: center; text-decoration: none; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${eventSettings.coupleNames}</h1>
            <p>Última chamada para confirmação! 📢</p>
        </div>
        <div class="content">
            <h2>Olá ${guestName}!</h2>
            <p>Faltam <strong>${daysUntilEvent} dias</strong> para nosso evento e ainda não recebemos sua confirmação.</p>
            
            <p>Seria muito importante para nós saber se você virá! 💝</p>
            
            <p><strong>Evento:</strong> ${eventSettings.coupleNames}</p>
            <p><strong>Data:</strong> ${new Date(eventSettings.eventDate).toLocaleDateString('pt-BR')}</p>
            <p><strong>Local:</strong> ${eventSettings.eventLocation}</p>
            
            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/evento/${eventSettings.slug}" class="cta">
                    Confirmar Presença
                </a>
            </p>
        </div>
    </div>
</body>
</html>
    `

    console.log(`[REMINDER] Email enviado para: ${email}`)

    // Implementar com Resend quando disponível
    // await resend.emails.send({
    //     from: 'noreply@rsvpmanager.com',
    //     to: email,
    //     subject: `Última chamada - ${eventSettings.coupleNames}`,
    //     html: reminderHTML
    // })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Erro ao enviar lembrança:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar email' },
      { status: 500 }
    )
  }
}
```

---

## 3️⃣ Enviar Agradecimento para Confirmados

### Cenário
Depois do evento, você quer enviar um email de agradecimento.

**Rota:** `src/app/api/send-thank-you-email/route.ts`

```tsx
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, guestName, eventSettings, photos, videoLink } = body

    const thankYouHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAFAF8; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; }
        .header { background: linear-gradient(135deg, #C6A664 0%, #B8945A 100%); color: white; text-align: center; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .photos { text-align: center; margin: 30px 0; }
        .photos img { max-width: 300px; border-radius: 8px; margin: 10px 0; }
        .cta { background: #C6A664; color: white; padding: 12px 30px; border-radius: 50px; text-decoration: none; display: inline-block; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Obrigado! 🙏</h1>
            <p>Sua presença fez toda diferença</p>
        </div>
        
        <h2>Oi ${guestName}!</h2>
        <p>Queremos agradecer imensamente sua presença em nosso evento!</p>
        
        <p>Foi uma noite inesquecível e você fez parte dessa magia. ✨</p>
        
        ${photos ? `
        <div class="photos">
            <h3>Relembre os melhores momentos:</h3>
            <a href="${photos}" class="cta">👇 Ver Fotos</a>
        </div>
        ` : ''}
        
        ${videoLink ? `
        <p style="text-align: center;">
            <a href="${videoLink}" class="cta">🎬 Assista o Vídeo Oficial</a>
        </p>
        ` : ''}
        
        <p>Com gratidão,</p>
        <p><strong>${eventSettings.coupleNames}</strong></p>
    </div>
</body>
</html>
    `

    console.log(`[THANK YOU] Email enviado para: ${email}`)

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao enviar email' },
      { status: 500 }
    )
  }
}
```

---

## 4️⃣ Agendador de Emails (Cron)

### Cenário
Enviar emails automaticamente em datas específicas.

**Rota:** `src/app/api/cron/send-emails/route.ts`

```tsx
// Usar Next.js scheduled tasks (beta)
// ou serviço externo como Cronitor

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Validar token de segurança
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, eventSettings, guests } = await request.json()

    if (action === 'send-reminder-7-days') {
      // Enviar lembrança 7 dias antes
      const eventDate = new Date(eventSettings.eventDate)
      const now = new Date()
      const daysUntil = Math.ceil(
        (eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
      )

      if (daysUntil === 7) {
        const pendingGuests = guests.filter(
          (g: any) => g.status === 'pending' && g.email
        )
        
        // Enviar email para cada um
        for (const guest of pendingGuests) {
          await fetch('/api/send-reminder-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: guest.email,
              guestName: guest.name,
              eventSettings,
              daysUntilEvent: daysUntil
            })
          })
        }

        return NextResponse.json(
          { sent: pendingGuests.length },
          { status: 200 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Nenhuma ação necessária' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro no agendador:', error)
    return NextResponse.json(
      { error: 'Erro ao processar' },
      { status: 500 }
    )
  }
}
```

**Usar com Vercel Cron:**

`.env.local`:
```env
CRON_SECRET=sua_chave_secreta_aqui
```

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-emails",
      "schedule": "0 10 * * *"
    }
  ]
}
```

---

## 5️⃣ Histórico de Emails Enviados

### Adicionar ao Contexto

**Arquivo:** `src/lib/event-context.tsx`

```tsx
export type EmailLog = {
  id: string
  guestId: string
  guestEmail: string
  type: 'confirmation' | 'reminder' | 'thank-you'
  sentAt: Date
  status: 'sent' | 'failed' | 'bounced'
  subject: string
}

export type EventSettings = {
  // ... campos existentes
  emailLogs?: EmailLog[] // Novo
}
```

### Dashboard de Emails

**Card no Dashboard:**

```tsx
<div className="bg-surface border border-borderSoft rounded-lg p-4">
  <h3 className="text-lg font-semibold text-textPrimary mb-4">
    📧 Histórico de Emails
  </h3>
  
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-borderSoft">
          <th className="text-left py-2">Convidado</th>
          <th className="text-left py-2">Tipo</th>
          <th className="text-left py-2">Status</th>
          <th className="text-left py-2">Data</th>
        </tr>
      </thead>
      <tbody>
        {eventSettings.emailLogs?.map((log: EmailLog) => (
          <tr key={log.id} className="border-b border-borderSoft/50">
            <td className="py-2">{log.guestEmail}</td>
            <td className="py-2">{log.type}</td>
            <td className="py-2">
              <span className={log.status === 'sent' ? 'text-primary' : 'text-danger'}>
                {log.status}
              </span>
            </td>
            <td className="py-2">
              {new Date(log.sentAt).toLocaleDateString('pt-BR')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## 📋 Ordem Recomendada de Implementação

1. **Fase 1** (Semana 1):
   - ✅ Sistema base (já feito)
   - Integração Resend

2. **Fase 2** (Semana 2):
   - Botão "Reenviar Email"
   - Página de histórico de emails

3. **Fase 3** (Semana 3):
   - Enviar lembranças em massa
   - Agendador com Cron

4. **Fase 4** (Futuro):
   - Email de agradecimento pós-evento
   - Relatórios avançados
   - Integração com WhatsApp

---

## 🔗 Recursos Úteis

- **Resend:** https://resend.com/docs
- **SendGrid:** https://docs.sendgrid.com
- **Vercel Cron:** https://vercel.com/docs/crons
- **Next.js Email:** https://nextjs.org/docs/app/building-your-application/functions/edge-middleware

---

**Próximas funcionalidades prontas para implementar!** 🚀
