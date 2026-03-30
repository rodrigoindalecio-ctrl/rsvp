import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

// Impede o Next.js de tentar pré-renderizar esta rota GET como página estática no build
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Instanciar dentro da função garante que a env var só é lida em runtime (não no build)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
        apiVersion: '2023-10-16' as any,
    });
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

        // Se for uma transação Stripe (salvamos o session.id no mp_preference_id)
        if (tx.mp_preference_id && tx.mp_preference_id.startsWith('cs_')) {
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

                // Notificar canal real-time pro front-end atualizar
                supabase.channel('gift_transactions').send({
                    type: 'broadcast',
                    event: 'UPDATE',
                    payload: {}
                 });

                 // (Opcional) Poderíamos enviar o email de notificação aqui também, 
                 // mas no modo fallback vamos focar em garantir o financeiro.

                return NextResponse.json({ status: 'APPROVED' });
            }
        }

        return NextResponse.json({ status: tx.status });

    } catch (error) {
        console.error('Erro no fallback de sincronização Stripe:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
