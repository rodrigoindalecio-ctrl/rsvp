import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const giftId = params.id;
        const body = await req.json();
        const { guestName, name, email, message, eventId } = body;
        const finalName = guestName || name;

        // 1. Fetch gift data
        const { data: gift, error: giftError } = await supabaseAdmin
            .from('gifts')
            .select('*')
            .eq('id', giftId)
            .single();

        if (giftError || !gift) {
            console.error('Checkout Error: Gift not found', giftId, giftError);
            return NextResponse.json({ error: 'Presente não encontrado no sistema' }, { status: 404 });
        }

        const eventToLookup = gift.event_id || eventId;
        const { data: event, error: eventError } = await supabaseAdmin
            .from('events')
            .select('id, slug, tax_payer, event_settings')
            .eq('id', eventToLookup)
            .single();

        if (eventError || !event) {
            return NextResponse.json({
                error: `Evento associado não encontrado`,
                details: eventError?.message
            }, { status: 404 });
        }

        const settings = typeof event.event_settings === 'string'
            ? JSON.parse(event.event_settings)
            : event.event_settings;

        const eventDisplayName = settings?.coupleNames || "Nosso Evento";

        gift.events = {
            ...event,
            name: eventDisplayName,
            event_settings: settings
        };

        const price = Number(gift.price);
        // Ler taxa do eventSettings (ex: 5.49) e converter para decimal (0.0549)
        const customFee = gift.events.event_settings?.serviceTax;
        const feePercent = customFee ? Number(customFee) / 100 : 0.0549;
        let amountBruto = price;
        let amountFee = price * feePercent;
        let amountNet = price - amountFee;

        // Se o convidado paga a taxa (GUEST)
        if (gift.events.tax_payer === 'GUEST') {
            amountBruto = price * (1 + feePercent); // ex: 100 * 1.0549 = 105.49
            amountFee = amountBruto - price;
            amountNet = price;
        }

        // 2. Create pending transaction
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('gift_transactions')
            .insert({
                gift_id: giftId,
                event_id: gift.event_id,
                guest_name: finalName,
                guest_email: email || null,
                message: message || null,
                amount_gross: amountBruto,  // Usando ambos os nomes para evitar erros de schema legados
                amount_bruto: amountBruto,
                amount_fee: amountFee,
                amount_net: amountNet,
                tax_payer: gift.events?.tax_payer || 'COUPLE',
                status: 'PENDING'
            })
            .select()
            .single();

        if (txError || !transaction) {
            console.error('Insert TX error:', txError);
            return NextResponse.json({ error: 'Erro ao criar transação no banco de dados' }, { status: 500 });
        }

        return processCheckout(transaction);

        // Função auxiliar para Stripe
        async function processCheckout(tx: any) {
            try {
                // Instanciar Stripe dentro da função garante que a env var só é lida em runtime (não no build)
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
                    apiVersion: '2023-10-16' as any,
                });
                // Determine the base URL dynamically based on the request origin or referer.
                // This ensures we always return the user to the exact domain they are currently browsing,
                // avoiding "no tunnel here" errors if the env var tunnel is outdated.
                let origin = req.headers.get('origin');
                if (!origin) {
                    const referer = req.headers.get('referer');
                    if (referer) {
                        origin = new URL(referer).origin;
                    } else {
                        origin = 'http://localhost:3000';
                    }
                }
                const baseUrl = origin.replace(/\/$/, '');

                const safeEventId = event?.id || eventId || gift.event_id;
                const eventSlug = event?.slug || settings?.slug || 'evento';

                const successUrl = `${baseUrl}/${eventSlug}/presentes/sucesso?t=${tx.id}`;
                const cancelUrl = `${baseUrl}/${eventSlug}/presentes?error=payment_cancelled`;

                // Custo no Stripe é sempre em centavos (inteiro)
                const unitAmount = Math.round(amountBruto * 100);

                const isValidEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
                const safeEmail = email && isValidEmail(email) ? email : undefined;

                // Stripe aceita cartão (inclui Apple Pay e Google Pay automaticamente) e boleto
                // PIX é feito separadamente pelo Mercado Pago
                const paymentMethods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ['card', 'boleto'];

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: paymentMethods,
                    line_items: [
                        {
                            price_data: {
                                currency: 'brl',
                                product_data: {
                                    name: `Presente: ${gift.name}`,
                                    description: `Para ${eventDisplayName}`,
                                    images: gift.image_url && gift.image_url.startsWith('http') && !gift.image_url.includes('localhost') 
                                                ? [gift.image_url] 
                                                : [],
                                },
                                unit_amount: unitAmount,
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                    client_reference_id: tx.id,
                    customer_email: safeEmail,
                    metadata: {
                        transaction_id: tx.id,
                        event_id: safeEventId,
                    }
                });

                // Vamos salvar o session_id no mesmo campo que antes era o mp_preference_id para evitar migração
                await supabaseAdmin.from('gift_transactions').update({ mp_preference_id: session.id }).eq('id', tx.id);
                
                return NextResponse.json({ init_point: session.url, transactionId: tx.id });
            } catch (stripeError: any) {
                console.error('Stripe Error Details:', JSON.stringify({
                    type: stripeError?.type,
                    code: stripeError?.code,
                    message: stripeError?.message,
                    param: stripeError?.param,
                    raw: stripeError?.raw,
                }, null, 2));
                return NextResponse.json({
                    error: 'Erro no provedor de pagamentos',
                    details: stripeError?.message,
                    stripeCode: stripeError?.code,
                }, { status: 500 });
            }
        }
    } catch (error) {
        console.error('Erro no checkout:', error);
        return NextResponse.json({ error: 'Erro interno ao processar checkout' }, { status: 500 });
    }
}
