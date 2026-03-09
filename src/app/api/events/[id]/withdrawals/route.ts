import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyEventOwnership } from '@/lib/verify-ownership';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id;

        // 🔒 Verificar propriedade do evento
        const ownership = await verifyEventOwnership(req, eventId)
        if (!ownership.authorized) return ownership.response

        const { amount, pixKey, pixType, beneficiary } = await req.json();
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Saldo insuficiente para saque ou valor inválido.' }, { status: 400 });
        }

        // 1. Criar a solicitação de saque (Withdrawal)
        const { data: withdrawal, error } = await supabase
            .from('withdrawals')
            .insert({
                event_id: eventId,
                amount: amount,
                pix_key: pixKey,
                pix_type: pixType,
                beneficiary: beneficiary,
                status: 'PENDING'
            })
            .select()
            .single();

        if (error) {
            console.error('[WITHDRAWAL ERROR]', error);
            return NextResponse.json({ error: 'Erro ao registrar solicitação de saque.' }, { status: 500 });
        }

        // 📧 Notificar Admin (Vanessa/Rodrigo) sobre novo saque
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'rodrigoindalecio@hotmail.com';
            const { sendEmail } = await import('@/lib/email');

            await sendEmail({
                to: adminEmail,
                subject: `💰 NOVO SAQUE: R$ ${amount.toLocaleString('pt-BR')} solicitado!`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #7C2D12;">Nova solicitação de saque! 🚀</h2>
                        <p>Um casal acaba de solicitar um resgate na plataforma.</p>
                        <hr />
                        <p><strong>Valor:</strong> R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p><strong>Beneficiário:</strong> ${beneficiary}</p>
                        <p><strong>Chave PIX:</strong> ${pixKey} (${pixType})</p>
                        <p><strong>Evento ID:</strong> ${eventId}</p>
                        <hr />
                        <p>Acesse o painel de retiradas para aprovar: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/withdrawals">Ver Saques</a></p>
                    </div>
                `
            });
        } catch (mailErr) {
            console.error('[WITHDRAWAL MAIL NOTIFY ERROR]', mailErr);
        }

        return NextResponse.json({ ok: true, withdrawal });

    } catch (e) {
        console.error('[WITHDRAWAL EXCEPTION]', e);
        return NextResponse.json({ error: 'Erro interno ao processar saque.' }, { status: 500 });
    }
}
