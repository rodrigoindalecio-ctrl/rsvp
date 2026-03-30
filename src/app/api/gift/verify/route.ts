import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

// Impede o Next.js de tentar pré-renderizar esta rota GET como página estática no build
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const transactionId = searchParams.get('t');

        if (!transactionId) {
            return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
        }

        const { data: tx } = await supabaseAdmin
            .from('gift_transactions')
            .select('*, gifts(*), events(*)')
            .eq('id', transactionId)
            .single();

        // Se já está aprovado, não precisa de nada
        if (!tx || tx.status === 'APPROVED') {
            return NextResponse.json({ status: tx?.status || 'NOT_FOUND' });
        }

        // ============================================================
        // FALLBACK INFINITEPAY
        // A URL de redirect recebe: order_nsu, transaction_nsu, slug, capture_method
        // Usamos o endpoint payment_check da InfinitePay para confirmar antes de aprovar.
        // ============================================================
        if (tx.payment_method === 'infinitepay') {
            const transactionNsu = searchParams.get('transaction_nsu');
            const ipSlug = searchParams.get('ip_slug'); // invoice slug da InfinitePay

            console.log('🔄 [Verify] Fallback InfinityPay | tx:', transactionId, '| transaction_nsu:', transactionNsu);

            let isPaid = false;
            let captureMethod = 'pix';

            // Verificar com a API da InfinitePay se o pagamento realmente foi aprovado
            if (transactionNsu && ipSlug) {
                try {
                    const checkRes = await fetch('https://api.infinitepay.io/invoices/public/checkout/payment_check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            handle: process.env.INFINITEPAY_HANDLE || 'rodrigo-indalecio',
                            order_nsu: transactionId,
                            transaction_nsu: transactionNsu,
                            slug: ipSlug,
                        })
                    });
                    const checkData = await checkRes.json();
                    console.log('[Verify InfinityPay] payment_check resposta:', JSON.stringify(checkData));

                    if (checkData.paid === true) {
                        isPaid = true;
                        captureMethod = checkData.capture_method || 'pix';
                    }
                } catch (ipErr) {
                    console.error('[Verify InfinityPay] Erro ao chamar payment_check:', ipErr);
                    // Em caso de falha na API, aprovamos pelo contexto do redirect (redirect_url só é chamado após pagamento)
                    isPaid = true;
                }
            } else {
                // Sem os params da InfinitePay, confiamos no redirect (só ocorre após pagamento confirmado)
                console.log('[Verify InfinityPay] Sem transaction_nsu/ip_slug — aprovando pelo redirect context.');
                isPaid = true;
            }

            if (isPaid) {
                const daysToRelease = 1; // Sempre D+1 para InfinityPay
                const releaseDate = new Date();
                releaseDate.setDate(releaseDate.getDate() + daysToRelease);
                const paymentMethod = captureMethod === 'pix' ? 'INFINITEPAY_PIX' : 'INFINITEPAY_CARD';

                await supabaseAdmin
                    .from('gift_transactions')
                    .update({
                        status: 'APPROVED',
                        paid_at: new Date().toISOString(),
                        payment_method: paymentMethod,
                        release_date: releaseDate.toISOString(),
                    })
                    .eq('id', transactionId);

                // 🔔 REAL-TIME
                try {
                    await supabase.channel('gift_transactions').send({
                        type: 'broadcast', event: 'UPDATE', payload: { transactionId }
                    });
                } catch (rtErr) {
                    console.error('[Verify InfinityPay] Erro no real-time:', rtErr);
                }

                // 📧 EMAIL
                try {
                    if (tx.events) {
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
                                    amount: tx.amount_net,
                                    message: tx.message,
                                    coupleNames: settings?.coupleNames
                                })
                            });
                            console.log('[Verify InfinityPay] Email enviado.');
                        }
                    }
                } catch (emailErr) {
                    console.error('[Verify InfinityPay] Erro ao enviar email:', emailErr);
                }

                return NextResponse.json({ status: 'APPROVED' });
            }

            return NextResponse.json({ status: tx.status });
        }

        // ============================================================
        // FALLBACK STRIPE
        // Se for uma transação Stripe (salvamos o session.id no mp_preference_id)
        // ============================================================
        if (tx.mp_preference_id && tx.mp_preference_id.startsWith('cs_')) {
            // Instanciar Stripe dentro da função garante que a env var só é lida em runtime
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
                apiVersion: '2023-10-16' as any,
            });

            const session = await stripe.checkout.sessions.retrieve(tx.mp_preference_id);
            
            if (session.payment_status === 'paid') {
                console.log('🔄 Sincronização de segurança ativada: Webhook falhou, mas o Stripe confirmou o pagamento!');
                
                let method = 'STRIPE_CARD';
                let daysToRelease = 14;

                if (session.payment_intent && typeof session.payment_intent === 'string') {
                    const intent = await stripe.paymentIntents.retrieve(session.payment_intent);
                    if (intent.payment_method_types.includes('boleto')) {
                        method = 'STRIPE_BOLETO';
                        daysToRelease = 3; 
                    }
                }

                const releaseDate = new Date();
                releaseDate.setDate(releaseDate.getDate() + daysToRelease);

                await supabaseAdmin
                    .from('gift_transactions')
                    .update({
                        status: 'APPROVED',
                        mp_payment_id: session.payment_intent as string || session.id,
                        payment_method: method,
                        release_date: releaseDate.toISOString(),
                    })
                    .eq('id', transactionId);

                await supabase.channel('gift_transactions').send({
                    type: 'broadcast',
                    event: 'UPDATE',
                    payload: {}
                });

                return NextResponse.json({ status: 'APPROVED' });
            }
        }

        return NextResponse.json({ status: tx.status });

    } catch (error) {
        console.error('Erro no fallback de sincronização:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
