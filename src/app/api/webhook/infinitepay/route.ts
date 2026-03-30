import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// InfinitePay Webhook Handler
// This endpoint receives notifications when a payment is confirmed.

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[InfinitePay Webhook] Notificação recebida:", body);

    // InfinitePay status: Success is typically "confirmed", "paid" or "approved"
    const isSuccess = 
      body.status === "confirmed" || 
      body.status === "paid" || 
      body.status === "approved";

    if (isSuccess) {
      const transactionId = body.order_nsu; // O ID que enviamos na criação

      console.log(`[InfinitePay Webhook] Pagamento APROVADO para order_nsu: ${transactionId}`);

      // Definir data de liberação (ex: D+1)
      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + 1);

      // Atualizar o status no Supabase usando Admin para evitar RLS
      const { error } = await supabaseAdmin
        .from("gift_transactions")
        .update({ 
          status: "APPROVED",
          paid_at: new Date().toISOString(),
          release_date: releaseDate.toISOString()
        })
        .eq("id", transactionId);

      if (error) {
        console.error("[InfinitePay Webhook] Erro ao atualizar Supabase:", error);
        return NextResponse.json({ error: "Erro ao atualizar banco" }, { status: 500 });
      }

      console.log(`[InfinitePay Webhook] Transação ${transactionId} marcada como completa.`);
    } else {
      console.log(`[InfinitePay Webhook] Status ignorado: ${body.status}`);
    }

    // Sempre responder 200 OK para a InfinitePay parar de tentar
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[InfinitePay Webhook] Erro Crítico:", error);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 });
  }
}
