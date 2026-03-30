import { NextResponse } from 'next/server';
import { mpPayment } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const transactionId = searchParams.get('tx');

        if (!transactionId) {
            return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
        }

        // Buscar a transação para obter o mp_preference_id
        const { data: tx } = await supabaseAdmin
            .from('gift_transactions')
            .select('mp_preference_id, mp_payment_id')
            .eq('id', transactionId)
            .single();

        if (!tx?.mp_preference_id) {
            return NextResponse.json({ error: 'Preference not found' }, { status: 404 });
        }

        // Buscar o pagamento no Mercado Pago pela preferência
        // A API do MP não retorna QR diretamente da preference, precisamos usar a API de payments
        // Vamos usar a API de pagamentos buscando pela referência externa
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        
        // Aguardar um momento para o MP criar o pagamento
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Buscar pagamentos associados à preference
        const mpRes = await fetch(
            `https://api.mercadopago.com/v1/payments/search?external_reference=${transactionId}&status=pending`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        const mpData = await mpRes.json();
        
        const payment = mpData.results?.[0];
        
        if (!payment) {
            return NextResponse.json({ error: 'Payment not found yet' }, { status: 404 });
        }

        const qrCode = payment.point_of_interaction?.transaction_data?.qr_code;
        const qrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64;

        if (!qrCode) {
            return NextResponse.json({ error: 'QR Code not available' }, { status: 404 });
        }

        return NextResponse.json({ 
            qrCode, 
            qrCodeBase64,
            paymentId: payment.id 
        });

    } catch (e: any) {
        console.error('PIX QR Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
