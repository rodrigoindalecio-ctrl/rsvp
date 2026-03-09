import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mpPreference } from '@/lib/mercadopago';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const giftId = params.id;
        const { name, email, message, eventId } = await req.json();

        // 1. Fetch gift data
        const { data: gift, error: giftError } = await supabase
            .from('gifts')
            .select('*')
            .eq('id', giftId)
            .single();

        if (giftError || !gift) {
            console.error('Checkout Error: Gift not found', giftId, giftError);
            return NextResponse.json({ error: 'Presente não encontrado no sistema' }, { status: 404 });
        }

        // 2. Fetch event data separately to be safe
        const eventToLookup = gift.event_id || eventId;
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, slug, tax_payer, event_settings')
            .eq('id', eventToLookup)
            .single();

        if (eventError || !event) {
            console.error('Checkout Error: Event not found', {
                giftEventId: gift.event_id,
                bodyEventId: eventId,
                error: eventError
            });
            return NextResponse.json({
                error: `Evento associado não encontrado`,
                details: eventError?.message
            }, { status: 404 });
        }

        // Extrair o nome do evento/casal dos settings
        // Usando o nome correto da coluna do banco: event_settings
        const settings = typeof event.event_settings === 'string'
            ? JSON.parse(event.event_settings)
            : event.event_settings;

        const eventDisplayName = settings?.coupleNames || "Nosso Evento";

        // Add event to gift object for the rest of the logic
        gift.events = {
            ...event,
            name: eventDisplayName
        };

        const price = Number(gift.price);
        const feePercent = 0.0499;
        let amountBruto = price;
        let amountFee = price * feePercent;
        let amountNet = price - amountFee;

        // Se o convidado paga a taxa (GUEST)
        if (gift.events.tax_payer === 'GUEST') {
            amountBruto = price / (1 - feePercent);
            amountFee = amountBruto - price;
            amountNet = price;
        }

        // 2. Create pending transaction
        // Tentamos inserir com os nomes exatos das colunas do banco: amount_gross, amount_fee, amount_net
        const txData: any = {
            event_id: gift.events.id,
            gift_id: gift.id,
            guest_name: name,
            guest_email: email || null,
            message: message || null,
            amount_gross: amountBruto, // No banco se chama amount_gross
            amount_fee: amountFee,
            amount_net: amountNet,
            tax_payer: gift.events.tax_payer,
            status: 'PENDING'
        };

        const { data: transaction, error: txError } = await supabase
            .from('gift_transactions')
            .insert(txData)
            .select()
            .single();

        if (txError || !transaction) {
            console.error('Insert TX error (Attempt 1):', txError);

            // Fallback: Tentativa com nomes alternativos caso o banco mude
            if (txError?.code === '23502' || txError?.code === 'PGRST204') {
                const retryData = { ...txData, amount_bruto: amountBruto };
                delete retryData.amount_gross;

                const { data: retryTx, error: retryError } = await supabase
                    .from('gift_transactions')
                    .insert(retryData)
                    .select()
                    .single();

                if (retryError) return NextResponse.json({ error: 'Erro de compatibilidade com o banco de dados' }, { status: 500 });
                return processCheckout(retryTx);
            }

            return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 500 });
        }

        return processCheckout(transaction);

        // Função auxiliar para continuar o fluxo após criar a transação no banco
        async function processCheckout(tx: any) {
            try {
                // Limpar baseUrl de aspas extras que podem vir do .env
                let baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/['"]+/g, '').trim();

                // Garantir que termina sem barra
                if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

                // Garantir que temos o ID do evento para o metadata
                const safeEventId = event?.id || eventId || gift.event_id;
                const eventSlug = event?.slug || settings?.slug || 'evento';

                const successUrl = `${baseUrl}/${eventSlug}/presentes/sucesso?t=${tx.id}`;
                const failureUrl = `${baseUrl}/${eventSlug}/presentes?error=payment`;
                const pendingUrl = `${baseUrl}/${eventSlug}/presentes?status=pending`;

                const preferenceBody: any = {
                    items: [{
                        id: gift.id,
                        title: `Presente: ${gift.name} - ${eventDisplayName}`,
                        quantity: 1,
                        unit_price: Number(amountBruto.toFixed(2)),
                        currency_id: 'BRL',
                    }],
                    payer: {
                        name: name,
                        email: email || 'convidado@vbeventos.com.br',
                    },
                    back_urls: {
                        success: successUrl,
                        failure: failureUrl,
                        pending: pendingUrl,
                    },
                    external_reference: tx.id,
                    metadata: {
                        transaction_id: tx.id,
                        event_id: safeEventId
                    },
                    statement_descriptor: "VB PRESENTES",
                    payment_methods: {
                        excluded_payment_types: [{ id: "ticket" }],
                        installments: 1
                    }
                };

                const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

                if (!isLocal) {
                    preferenceBody.auto_return = 'approved';
                    preferenceBody.notification_url = `${baseUrl}/api/webhook/mercadopago`;
                }

                const preference = await mpPreference.create({ body: preferenceBody });

                await supabase.from('gift_transactions').update({ mp_preference_id: preference.id }).eq('id', tx.id);
                return NextResponse.json({ init_point: preference.init_point, transactionId: tx.id });
            } catch (mpError) {
                console.error('Mercado Pago Error Details:', JSON.stringify(mpError, null, 2));
                return NextResponse.json({
                    error: 'Erro no MercadoPago',
                    details: (mpError as any)?.message
                }, { status: 500 });
            }
        }
    } catch (error) {
        console.error('Erro no checkout:', error);
        return NextResponse.json({ error: 'Erro interno ao processar checkout' }, { status: 500 });
    }
}
