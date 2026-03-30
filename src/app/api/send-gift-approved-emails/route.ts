import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyInternalKey } from '@/lib/auth-utils';

// Rota centralizada para emails de presente aprovado.
// Dispara 2 emails: (1) Dono do evento e (2) Convidado que presenteou.
// Deve ser chamada somente quando status muda de PENDING → APPROVED.

const createTransporter = () => {
    const port = Number(process.env.SMTP_PORT);
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        tls: { rejectUnauthorized: false }
    });
};

export async function POST(request: NextRequest) {
    try {
        if (!verifyInternalKey(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            // Dados da transação
            transactionId,
            guestName,
            guestEmail,
            giftName,
            amount,        // valor líquido (amount_net)
            message,
            captureMethod, // 'pix' | 'credit_card'
            // Dados do evento/dono
            ownerEmail,
            coupleNames,
            eventSlug,
            baseUrl,
        } = body;

        const results: string[] = [];
        const transporter = createTransporter();
        const senderName = process.env.SMTP_FROM_NAME?.replace(/['"]/g, '') || 'RSVP Manager';
        const fromAddress = process.env.SMTP_FROM_EMAIL as string;
        const formattedAmount = Number(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const methodLabel = captureMethod === 'pix' ? 'PIX' : 'Cartão de Crédito';
        const safeBase = (baseUrl || 'https://rsvpmanager.com.br').replace(/\/$/, '');

        // ─────────────────────────────────────────────────────────────
        // EMAIL 1: DONO DO EVENTO — "Você recebeu um presente!"
        // ─────────────────────────────────────────────────────────────
        if (ownerEmail) {
            const ownerHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAFAF8; margin: 0; padding: 20px; }
    .wrap { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.08); }
    .header { background: linear-gradient(135deg, #8B2D4F 0%, #6D223D 100%); color: #fff; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px; }
    .header p { margin: 8px 0 0; font-size: 13px; opacity: .85; }
    .body { padding: 40px 30px; }
    .card { background: #FAFAF8; border: 1px solid #E6E2DC; border-left: 4px solid #8B2D4F; border-radius: 14px; padding: 24px; margin: 24px 0; }
    .label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #8B2D4F; margin-bottom: 4px; }
    .value { font-size: 16px; font-weight: 600; color: #2E2E2E; }
    .amount { font-size: 28px; font-weight: 800; color: #2E7D32; }
    .btn { display: inline-block; background: #8B2D4F; color: #fff !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; }
    .footer { background: #FAFAF8; padding: 30px; text-align: center; border-top: 1px solid #E6E2DC; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;">🎁 Novo Presente Recebido</p>
      <h1>${coupleNames || 'Seu Evento'}</h1>
    </div>
    <div class="body">
      <p style="font-size:16px;color:#333;line-height:1.6;">Ótimas notícias! Um convidado acabou de te presentear. O valor já está contabilizado na sua tesouraria. 🥂</p>

      <div class="card">
        <div class="label">Presente</div>
        <div class="value">${giftName || 'Presente em Dinheiro'}</div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E6E2DC;">
          <div class="label">De</div>
          <div class="value">${guestName}</div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E6E2DC;">
          <div class="label">Valor líquido recebido</div>
          <div class="amount">R$ ${formattedAmount}</div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E6E2DC;">
          <div class="label">Método</div>
          <div class="value">${methodLabel} · Disponível em D+1</div>
        </div>
        ${message ? `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E6E2DC;">
          <div class="label">Mensagem do Convidado</div>
          <div style="font-size:14px;color:#555;font-style:italic;line-height:1.6;">"${message}"</div>
        </div>` : ''}
      </div>

      <div style="text-align:center;">
        <a href="${safeBase}/dashboard" class="btn">Ver Tesouraria →</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 RSVP Manager • Vanessa Bidinotti</p>
      <p>Este é um e-mail automático. Não responda.</p>
    </div>
  </div>
</body>
</html>`;

            await transporter.sendMail({
                from: { name: senderName, address: fromAddress },
                to: ownerEmail,
                subject: `🎁 ${guestName} te presenteou com ${giftName || 'um presente'}!`,
                html: ownerHTML,
            });
            results.push('owner_email_sent');
            console.log(`[GiftEmails] Email do dono enviado para ${ownerEmail}`);
        }

        // ─────────────────────────────────────────────────────────────
        // EMAIL 2: CONVIDADO — "Seu presente foi confirmado!"
        // ─────────────────────────────────────────────────────────────
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (guestEmail && emailRegex.test(guestEmail)) {
            const guestHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAFAF8; margin: 0; padding: 20px; }
    .wrap { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.08); }
    .header { background: linear-gradient(135deg, #8B2D4F 0%, #6D223D 100%); color: #fff; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px; }
    .body { padding: 40px 30px; }
    .badge { background: #F0FAF0; border: 1px solid #C8E6C9; border-radius: 14px; padding: 20px 24px; margin: 24px 0; display:flex; align-items:center; gap:16px; }
    .card { background: #FAFAF8; border: 1px solid #E6E2DC; border-radius: 14px; padding: 24px; margin: 24px 0; }
    .label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #8B2D4F; margin-bottom: 4px; }
    .value { font-size: 15px; font-weight: 600; color: #2E2E2E; }
    .btn { display: inline-block; background: #8B2D4F; color: #fff !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
    .footer { background: #FAFAF8; padding: 30px; text-align: center; border-top: 1px solid #E6E2DC; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <p style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;">Comprovante de Presente</p>
      <h1>${coupleNames || 'Obrigado!'}</h1>
    </div>
    <div class="body">
      <p style="font-size:17px;color:#333;line-height:1.6;">Olá, <strong>${guestName}</strong>! 💕</p>
      <p style="font-size:15px;color:#555;line-height:1.6;">Seu presente foi recebido com sucesso e com muito carinho. Os noivos já foram notificados!</p>

      <div class="badge">
        <span style="font-size:32px;">✅</span>
        <div>
          <div style="font-size:13px;font-weight:700;color:#2E7D32;">Pagamento Confirmado</div>
          <div style="font-size:12px;color:#555;margin-top:2px;">ID: ${transactionId?.substring(0, 8) || '—'}...</div>
        </div>
      </div>

      <div class="card">
        <div class="label">Presente</div>
        <div class="value">${giftName || 'Presente em Dinheiro'}</div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E6E2DC;">
          <div class="label">Para</div>
          <div class="value">${coupleNames || 'Os Noivos'}</div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E6E2DC;">
          <div class="label">Valor pago</div>
          <div style="font-size:22px;font-weight:800;color:#8B2D4F;">R$ ${formattedAmount}</div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E6E2DC;">
          <div class="label">Método</div>
          <div class="value">${methodLabel}</div>
        </div>
        ${message ? `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E6E2DC;">
          <div class="label">Sua mensagem</div>
          <div style="font-size:14px;color:#555;font-style:italic;line-height:1.6;">"${message}"</div>
        </div>` : ''}
      </div>

      ${eventSlug ? `
      <div style="text-align:center;">
        <a href="${safeBase}/${eventSlug}/presentes" class="btn">Ver Lista de Presentes</a>
      </div>` : ''}

      <p style="font-size:13px;color:#888;margin-top:32px;line-height:1.6;text-align:center;">
        Mal podemos esperar para te ver na celebração! 🥂<br>
        Guarde este e-mail como comprovante do seu presente.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 RSVP Manager • Vanessa Bidinotti</p>
      <p>Este é um e-mail automático. Não responda.</p>
    </div>
  </div>
</body>
</html>`;

            await transporter.sendMail({
                from: { name: senderName, address: fromAddress },
                to: guestEmail,
                subject: `✅ Seu presente para ${coupleNames || 'os noivos'} foi confirmado!`,
                html: guestHTML,
            });
            results.push('guest_email_sent');
            console.log(`[GiftEmails] Email do convidado enviado para ${guestEmail}`);
        } else {
            results.push('guest_email_skipped_no_email');
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('[GiftEmails] Erro ao enviar emails:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
