import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cart, guestName, name, email, message, eventId } = body;
        const finalName = guestName || name;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
        }

        // 1. Fetch gift data for all items in cart
        const giftIds = cart.map(item => item.id);
        const { data: giftsData, error: giftsError } = await supabaseAdmin
            .from('gifts')
            .select('*, events(*)')
            .in('id', giftIds);

        if (giftsError || !giftsData || giftsData.length === 0) {
            console.error('Checkout Error: Gifts not found', giftsError);
            return NextResponse.json({ error: 'Presentes não encontrados no sistema' }, { status: 404 });
        }

        // Use first gift for event lookup
        const firstGift = giftsData[0];
        const eventToLookup = firstGift.event_id || eventId;
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
        const customFee = settings?.serviceTax;
        const feePercent = customFee ? Number(customFee) / 100 : 0.0549;
        const taxPayer = event.tax_payer || 'COUPLE';

        // 2. Map cart items to Stripe line items and calculate totals
        const lineItems = [];
        const itemsForDb = [];
        let totalAmoutBruto = 0;
        let totalAmountFee = 0;
        let totalAmountNet = 0;

        for (const cartItem of cart) {
            const gift = giftsData.find(g => g.id === cartItem.id);
            if (!gift) continue;

            const quantity = cartItem.quantity || 1;
            const price = Number(gift.price);
            
            let amountBruto = price;
            let amountFee = price * feePercent;
            let amountNet = price - amountFee;

            if (taxPayer === 'GUEST') {
                amountBruto = price * (1 + feePercent);
                amountFee = amountBruto - price;
                amountNet = price;
            }

            totalAmoutBruto += amountBruto * quantity;
            totalAmountFee += amountFee * quantity;
            totalAmountNet += amountNet * quantity;

            itemsForDb.push({
                id: gift.id,
                name: gift.name,
                price: price,
                quantity: quantity
            });

            lineItems.push({
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: `Presente: ${gift.name}`,
                        description: `Para ${eventDisplayName}`,
                        images: gift.image_url && gift.image_url.startsWith('http') && !gift.image_url.includes('localhost') 
                                    ? [gift.image_url] 
                                    : [],
                    },
                    unit_amount: Math.round(amountBruto * 100),
                },
                quantity: quantity,
            });
        }

        // 3. Create a single transaction record representing the WHOLE cart
        // We'll store the items details in a JSON field if it exists, or description if not.
        // Actually, we'll store cart details in metadata and session.
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('gift_transactions')
            .insert({
                gift_id: firstGift.id, // Linking to first gift for compatibility
                event_id: event.id,
                guest_name: finalName,
                guest_email: email || null,
                message: message || `Carrinho: ${giftsData.map(g => g.name).join(', ')}. ${message || ''}`,
                amount_bruto: totalAmoutBruto,
                amount_gross: totalAmoutBruto,
                amount_fee: totalAmountFee,
                amount_net: totalAmountNet,
                tax_payer: taxPayer,
                status: 'PENDING',
                payment_method: 'STRIPE_CARD',
                items: itemsForDb
            })
            .select()
            .single();

        if (txError || !transaction) {
            console.error('Insert TX error:', txError);
            return NextResponse.json({ error: 'Erro ao criar transação no banco de dados' }, { status: 500 });
        }

        const baseUrl = (req.headers.get('origin') || 'http://localhost:3000').replace(/\/$/, '');
        const successUrl = `${baseUrl}/${event.slug}/presentes/sucesso?t=${transaction.id}`;
        const cancelUrl = `${baseUrl}/${event.slug}/presentes?error=payment_cancelled`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'boleto'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: transaction.id,
            customer_email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
            metadata: {
                transaction_id: transaction.id,
                event_id: event.id,
                is_cart: 'true',
                item_count: cart.length.toString()
            }
        });

        await supabaseAdmin
            .from('gift_transactions')
            .update({ mp_preference_id: session.id })
            .eq('id', transaction.id);
        
        return NextResponse.json({ init_point: session.url, transactionId: transaction.id });

    } catch (error) {
        console.error('Erro no checkout de múltiplos presentes:', error);
        return NextResponse.json({ error: 'Erro interno ao processar checkout' }, { status: 500 });
    }
}
