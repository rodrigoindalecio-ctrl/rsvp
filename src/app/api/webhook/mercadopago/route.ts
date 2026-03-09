import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mpPayment } from '@/lib/mercadopago';

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const topic = searchParams.get('topic');
        const id = searchParams.get('id');

        const body = await req.json();
        const resourceId = id || (body.data && body.data.id);
        const action = body.action || (topic === 'payment' ? 'payment.created' : '');

        if (action === 'payment.created' || action === 'payment.updated' || topic === 'payment') {

            const payment = await mpPayment.get({ id: resourceId });

            if (payment.status === 'approved') {
                const transactionId = payment.external_reference;

                if (!transactionId) {
                    return NextResponse.json({ ok: false }, { status: 400 });
                }

                const method = payment.payment_method_id;
                const days = (method === 'pix') ? 2 : 14;
                const releaseDate = new Date();
                releaseDate.setDate(releaseDate.getDate() + days);

                await supabase
                    .from('gift_transactions')
                    .update({
                        status: 'APPROVED',
                        mp_payment_id: String(resourceId),
                        payment_method: method?.toUpperCase(),
                        release_date: releaseDate.toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', transactionId);

                // --- Enviar Notificação por E-mail ---
                try {
                    // Buscar dados da transação para a notificação
                    const { data: tx } = await supabase
                        .from('gift_transactions')
                        .select('*, gifts(*), events(*)')
                        .eq('id', transactionId)
                        .single();

                    if (tx && tx.events) {
                        const settings = typeof tx.events.event_settings === 'string'
                            ? JSON.parse(tx.events.event_settings)
                            : tx.events.event_settings;

                        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/['"]+/g, '').trim();

                        await fetch(`${baseUrl}/api/send-gift-notification`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                ownerEmail: tx.events.created_by,
                                guestName: tx.guest_name,
                                giftName: tx.gifts?.name || 'Presente em Dinheiro',
                                amount: tx.amount_net, // Valor limpo que os noivos recebem
                                message: tx.message,
                                coupleNames: settings?.coupleNames
                            })
                        });
                    }
                } catch (notifError) {
                    console.error('Erro ao processar notificação de presente no webhook:', notifError);
                }
            }
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
