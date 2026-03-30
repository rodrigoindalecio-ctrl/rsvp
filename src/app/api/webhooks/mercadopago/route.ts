import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import MercadoPagoConfig, { Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const topic = searchParams.get('topic') || searchParams.get('type');
        const id = searchParams.get('id') || searchParams.get('data.id');

        console.log(`[MP Webhook] Recebido topico: ${topic}, id: ${id}`);

        if (topic === 'payment' && id) {
            const payment = new Payment(client);
            const data = await payment.get({ id });

            if (data.status === 'approved') {
                const txId = data.metadata?.transaction_id;
                
                // 1. Marcar como aprovado no banco de dados
                const { data: tx, error: txError } = await supabaseAdmin
                    .from('gift_transactions')
                    .update({ 
                        status: 'APPROVED',
                        approved_at: new Date().toISOString(),
                        gateway_response: JSON.stringify(data)
                    })
                    .eq('id', txId)
                    .select('*, gifts(name, event_id)')
                    .single();

                if (txError) throw txError;
                if (!tx) throw new Error(`Transação ${txId} não encontrada`);

                console.log(`[MP Webhook] Pagamento aprovado para ${tx.guest_name}`);

                // 2. Notificação em Tempo Real (opcional se você usar canais do Supabase)
                // O dashboard dos noivos deve ouvir por mudanças no status.

                // 3. Enviar email de confirmação para os noivos (se implementado)
                // Você pode chamar as rotas de email internas aqui se quiser.
            }
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[MP Webhook Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
