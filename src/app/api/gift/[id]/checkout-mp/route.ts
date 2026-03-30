import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const giftId = params.id;
        const { guestName, email, message } = await req.json();

        if (!guestName) {
            return NextResponse.json({ error: 'Nome do convidado é obrigatório' }, { status: 400 });
        }

        // 1. Buscar os dados do presente e do evento
        const { data: gift, error: giftError } = await supabaseAdmin
            .from('gifts')
            .select('*, events(*)')
            .eq('id', giftId)
            .single();

        if (giftError || !gift) {
            return NextResponse.json({ error: 'Presente não encontrado' }, { status: 404 });
        }

        const settings = typeof gift.events.event_settings === 'string'
            ? JSON.parse(gift.events.event_settings)
            : gift.events.event_settings;
        const customFee = settings?.serviceTax;
        const feePercent = customFee ? Number(customFee) / 100 : 0.0549;

        const price = Number(gift.price);
        let amountBruto = price;
        let amountFee = price * feePercent;
        let amountNet = price - amountFee;

        // Se o convidado paga a taxa (GUEST)
        if (gift.events.tax_payer === 'GUEST') {
            amountBruto = price * (1 + feePercent);
            amountFee = amountBruto - price;
            amountNet = price;
        }

        // 2. Criar registro de transação PENDENTE no banco
        const { data: tx, error: txError } = await supabaseAdmin
            .from('gift_transactions')
            .insert({
                gift_id: giftId,
                event_id: gift.event_id,
                guest_name: guestName,
                guest_email: email || null,
                message: message || null,
                amount_bruto: amountBruto,
                amount_gross: amountBruto,
                amount_fee: amountFee,
                amount_net: amountNet,
                tax_payer: gift.events?.tax_payer || 'COUPLE',
                status: 'PENDING',
                payment_method: 'PIX_MP'
            })
            .select()
            .single();

        if (txError) {
            console.error('DB insert error:', txError);
            throw new Error(`Erro ao salvar transação: ${txError.message}`);
        }

        let baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/['"]+/g, '').trim();
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        // 3. Criar Payment PIX diretamente (retorna QR Code na resposta)
        const paymentBody = {
            transaction_amount: Number(amountBruto.toFixed(2)),
            description: `Presente: ${gift.name} - De ${guestName}`,
            payment_method_id: 'pix',
            external_reference: tx.id,
            notification_url: `${baseUrl}/api/webhook/mercadopago`,
            payer: {
                email: email || 'convidado@rsvp.com.br',
                first_name: guestName.split(' ')[0],
                last_name: guestName.split(' ').slice(1).join(' ') || 'Convidado',
            }
        };

        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': tx.id, // Garante que não duplica
            },
            body: JSON.stringify(paymentBody)
        });

        const mpPaymentData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error('MP Payment Error:', JSON.stringify(mpPaymentData));
            throw new Error(mpPaymentData.message || 'Erro ao criar pagamento PIX');
        }

        const qrCode = mpPaymentData.point_of_interaction?.transaction_data?.qr_code;
        const qrCodeBase64 = mpPaymentData.point_of_interaction?.transaction_data?.qr_code_base64;

        console.log(`✅ PIX criado: Payment ID ${mpPaymentData.id}, QR: ${qrCode ? 'OK' : 'MISSING'}`);

        // 4. Salvar o payment_id no banco para o webhook correlacionar
        await supabaseAdmin
            .from('gift_transactions')
            .update({ mp_preference_id: String(mpPaymentData.id) })
            .eq('id', tx.id);

        return NextResponse.json({
            transactionId: tx.id,
            paymentId: mpPaymentData.id,
            qrCode,
            qrCodeBase64,
            status: mpPaymentData.status,
        });

    } catch (error: any) {
        console.error('Erro no Checkout MP Pix:', error.message);
        return NextResponse.json({ 
            error: 'Erro ao gerar Pix no Mercado Pago',
            details: error.message,
        }, { status: 500 });
    }
}
