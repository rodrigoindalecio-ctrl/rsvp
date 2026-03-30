import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

export async function POST(req: Request) {
    console.log('--- STRIPE WEBHOOK RECEIVED AT 🚀 ---');
    // Instanciar dentro da função garante que a env var só é lida em runtime (não no build)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
        apiVersion: '2023-10-16' as any,
    });
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature') as string;
        console.log('Signature present:', !!signature);

        let event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err: any) {
            console.error('Webhook signature verification failed.', err.message);
            return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const transactionId = session.client_reference_id;
            console.log('Session Completed for Transaction:', transactionId);

            if (!transactionId) {
                return NextResponse.json({ ok: false }, { status: 400 });
            }

            // Detectar o método de pagamento para definir o prazo de liberação
            let method = 'STRIPE';
            let daysToRelease = 14; // Default para cartão

            try {
                // Buscar detalhes do PaymentIntent para saber o que foi usado
                if (session.payment_intent) {
                    const intent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
                    if (intent.payment_method_types.includes('pix')) {
                        method = 'STRIPE_PIX';
                        daysToRelease = 2;
                    } else if (intent.payment_method_types.includes('card')) {
                        method = 'STRIPE_CARD';
                        daysToRelease = 14;
                    } else if (intent.payment_method_types.includes('boleto')) {
                      method = 'STRIPE_BOLETO';
                      daysToRelease = 3; 
                    }
                }
            } catch (pErr) {
                console.error('Erro ao identificar método Stripe:', pErr);
            }

            const releaseDate = new Date();
            releaseDate.setDate(releaseDate.getDate() + daysToRelease);

            const { data: updateRes, error: updateErr } = await supabaseAdmin
                .from('gift_transactions')
                .update({
                    status: 'APPROVED',
                    mp_payment_id: session.payment_intent as string || session.id, // reaproveitando a coluna para o intent/session
                    payment_method: method,
                    release_date: releaseDate.toISOString(),
                })
                .eq('id', transactionId)
                .select();

            console.log('Update result:', updateRes?.length ? 'SUCCESS' : 'NO_ROWS_UPDATED', 'Error:', updateErr);

            // 🔔 REAL-TIME: Ouvir novos presentes e atualizar saldo/lista automaticamente
            const channel = supabase
                .channel('gift_transactions')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gift_transactions' }, () => {})
                .subscribe();

            // --- Enviar Notificação por E-mail ---
            try {
                const { data: tx } = await supabaseAdmin
                    .from('gift_transactions')
                    .select('*, gifts(*), events(*)')
                    .eq('id', transactionId)
                    .single();
                
                console.log('Transaction retrieved for email:', tx ? 'FOUND - status: ' + tx.status : 'NOT_FOUND');

                if (tx && tx.events) {
                    const settings = typeof tx.events.event_settings === 'string'
                        ? JSON.parse(tx.events.event_settings)
                        : tx.events.event_settings;

                    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/['"]+/g, '').trim();

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
                                amount: tx.amount_net, // Valor limpo que os noivos recebem
                                message: tx.message,
                                coupleNames: settings?.coupleNames
                            })
                        });
                    } else {
                        console.log('Notificação de presente desativada pelo usuário.');
                    }
                }
            } catch (notifError) {
                console.error('Erro ao enviar notificação:', notifError);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
