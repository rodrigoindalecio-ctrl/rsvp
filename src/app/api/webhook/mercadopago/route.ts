import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mpPayment } from '@/lib/mercadopago';

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const topic = searchParams.get('topic');
        const id = searchParams.get('id');

        // Tentar ler o corpo, mas não travar se estiver vazio
        let body: any = {};
        try {
            body = await req.json();
        } catch (e) {
            console.log('ℹ️ Webhook recebido sem corpo JSON (normal para alguns eventos)');
        }

        const resourceId = id || (body.data && body.data.id);
        const action = body.action || (topic === 'payment' ? 'payment.created' : '');

        console.log(`🔔 Webhook MP: Topic=${topic}, ID=${resourceId}, Action=${action}`);

        if (action === 'payment.created' || action === 'payment.updated' || topic === 'payment') {
            
            if (!resourceId) {
                console.warn('⚠️ Webhook sem resourceId, ignorando...');
                return NextResponse.json({ ok: true });
            }

            const payment = await mpPayment.get({ id: resourceId });
            console.log(`💰 Status do Pagamento ${resourceId}: ${payment.status}`);

            if (payment.status === 'approved') {
                const transactionId = payment.external_reference;

                if (!transactionId) {
                    console.error('❌ Pagamento sem external_reference (ID do banco)');
                    return NextResponse.json({ ok: false }, { status: 400 });
                }

                console.log(`✅ Pagamento APROVADO para transação: ${transactionId}`);

                const method = payment.payment_method_id;
                const days = (method === 'pix') ? 2 : 14;
                const releaseDate = new Date();
                releaseDate.setDate(releaseDate.getDate() + days);

                const { error: updateError } = await supabaseAdmin
                    .from('gift_transactions')
                    .update({
                        status: 'APPROVED',
                        mp_payment_id: String(resourceId),
                        payment_method: method?.toUpperCase(),
                        release_date: releaseDate.toISOString()
                    })
                    .eq('id', transactionId);

                if (updateError) {
                    console.error('❌ Erro ao atualizar banco:', updateError);
                    throw updateError;
                }

                console.log('🚀 Banco de dados atualizado com sucesso!');

                // --- Enviar Notificação por E-mail ---
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
                            console.log('📧 Notificação enviada para o dono do evento!');
                        } else {
                            console.log('Notificação de presente desativada pelo usuário.');
                        }
                    }
                } catch (notifError) {
                    console.error('⚠️ Erro na notificação, mas pagamento já aprovado:', notifError);
                }
            }
        }

        return NextResponse.json({ ok: true });

    } catch (error: any) {
        console.error('💥 Webhook Error:', error.message || error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
