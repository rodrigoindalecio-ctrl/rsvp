import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

// InfinitePay Webhook Handler
// IMPORTANTE: O webhook da InfinitePay NÃO possui campo 'status'.
// Ele é disparado SOMENTE quando o pagamento é aprovado.
// Formato recebido: { invoice_slug, amount, paid_amount, installments, capture_method, transaction_nsu, order_nsu, receipt_url, items }
// Se respondermos 400, a InfinitePay tenta novamente — usamos isso para garantir entrega.

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[InfinitePay Webhook] Notificação recebida:", JSON.stringify(body));

    // order_nsu = nosso transactionId (UUID que enviamos na criação do link)
    const transactionId = body.order_nsu;
    const captureMethod = body.capture_method; // "credit_card" ou "pix"

    if (!transactionId) {
      console.error("[InfinitePay Webhook] order_nsu ausente no payload");
      return NextResponse.json({ error: "order_nsu ausente" }, { status: 400 });
    }

    console.log(`[InfinitePay Webhook] Aprovado | order_nsu: ${transactionId} | método: ${captureMethod}`);

    // Verificar idempotência: evitar duplicatas por retentativas do webhook
    const { data: existing } = await supabaseAdmin
      .from("gift_transactions")
      .select("status")
      .eq("id", transactionId)
      .single();

    if (existing?.status === 'APPROVED') {
      console.log(`[InfinitePay Webhook] Transação ${transactionId} já estava aprovada. Ignorando.`);
      return NextResponse.json({ received: true });
    }

    // Sempre D+1 para InfinityPay, independente do método de pagamento
    const daysToRelease = 1;
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + daysToRelease);
    const paymentMethod = captureMethod === 'pix' ? 'INFINITEPAY_PIX' : 'INFINITEPAY_CARD';

    // Atualizar o status no Supabase
    const { error } = await supabaseAdmin
      .from("gift_transactions")
      .update({
        status: "APPROVED",
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        release_date: releaseDate.toISOString(),
        mp_payment_id: body.transaction_nsu || null, // ID único da transação InfinitePay
      })
      .eq("id", transactionId);

    if (error) {
      console.error("[InfinitePay Webhook] Erro ao atualizar Supabase:", error);
      // Retornar 400 para a InfinitePay tentar novamente
      return NextResponse.json({ error: "Erro ao atualizar banco" }, { status: 400 });
    }

    console.log(`[InfinitePay Webhook] Transação ${transactionId} marcada como APPROVED.`);

    // 🔔 REAL-TIME: Broadcast para o dashboard atualizar instantaneamente
    try {
      await supabase.channel('gift_transactions').send({
        type: 'broadcast',
        event: 'UPDATE',
        payload: { transactionId }
      });
    } catch (rtErr) {
      console.error('[InfinitePay Webhook] Erro no real-time broadcast:', rtErr);
    }

    // 📧 EMAIL: Notificar os noivos
    try {
      const { data: tx } = await supabaseAdmin
        .from('gift_transactions')
        .select('*, gifts(*), events(*)')
        .eq('id', transactionId)
        .single();

      if (tx && tx.events) {
        const settings = typeof tx.events.event_settings === 'string'
          ? JSON.parse(tx.events.event_settings)
          : tx.events.event_settings;

        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/['\"]+/g, '').trim();
        const notificationPrefs = tx.events.notification_settings || {};
        const hasMessage = tx.message && tx.message.trim().length > 0;
        const shouldNotifyGift = notificationPrefs.gifts !== false;
        const shouldNotifyMural = notificationPrefs.mural !== false && hasMessage;

        if (shouldNotifyGift || shouldNotifyMural) {
          await fetch(`${baseUrl}/api/send-gift-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
            },
            body: JSON.stringify({
              ownerEmail: tx.events.created_by,
              guestName: tx.guest_name,
              giftName: tx.gifts?.name || 'Presente em Dinheiro',
              amount: tx.amount_net,
              message: tx.message,
              coupleNames: settings?.coupleNames
            })
          });
          console.log('[InfinitePay Webhook] Email de notificação enviado.');
        }
      }
    } catch (emailErr) {
      console.error('[InfinitePay Webhook] Erro ao enviar email:', emailErr);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[InfinitePay Webhook] Erro Crítico:", error);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 400 });
  }
}
