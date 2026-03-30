import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// InfinitePay Public Checkout Integration
// This endpoint generates a payment link directly with InfinitePay
// based on the shopping cart contents.

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, guestName, message, items, total, eventId } = body;

    const transactionId = crypto.randomUUID();
    const handle = process.env.INFINITEPAY_HANDLE || "rodrigo-indalecio";
    
    // Resolução Dinâmica de URL (Funciona em Localhost, Cloudflare e Vercel sem precisar configurar envs)
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = origin || (host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_BASE_URL?.replace(/['"]+/g, '').trim()) || 'http://localhost:3000';
    console.log(`[InfinitePay] Iniciando checkout para ${guestName} - Total: R$ ${total}`);

    // 1. Criar registro pendente no Banco de Dados (Supabase) - Usando supabaseAdmin para evitar bloqueios de RLS
    const { error: dbError } = await supabaseAdmin.from("gift_transactions").insert({
      id: transactionId,
      event_id: eventId,
      guest_name: guestName,
      guest_email: body.email || null,
      message: message,
      amount_bruto: total,
      amount_gross: total,
      amount_net: total,
      amount_fee: 0,
      status: "PENDING",
      payment_method: "infinitepay",
      items: items 
    });

    if (dbError) {
      console.error("[InfinitePay] Erro ao salvar transação no DB:", dbError);
      throw dbError;
    }

    // 2. Preparar itens para o formato InfinitePay (preço em centavos)
    const infinitePayItems = items.map((item: any) => ({
      description: item.name,
      price: Math.round(item.price * 100), // Ex: 10.50 -> 1050
      quantity: item.quantity
    }));

    // 3. Chamar a API Pública da InfinitePay para gerar o link
    const response = await fetch("https://api.infinitepay.io/invoices/public/checkout/links", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        handle: handle,
        order_nsu: transactionId,
        redirect_url: `${baseUrl}/${slug}/presentes/sucesso?t=${transactionId}`,
        webhook_url: `${baseUrl}/api/webhook/infinitepay`,
        items: infinitePayItems
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[InfinitePay] Erro na Resposta da API:", data);
      throw new Error(`InfinitePay API Error: ${JSON.stringify(data)}`);
    }

    // 4. Retornar a URL de pagamento gerada
    console.log(`[InfinitePay] Link gerado com sucesso: ${data.url}`);
    return NextResponse.json({ url: data.url });

  } catch (error: any) {
    console.error("[InfinitePay] Erro Crítico no Checkout:", error);
    return NextResponse.json(
      { error: "Erro ao processar checkout InfinitePay", details: error.message },
      { status: 500 }
    );
  }
}
