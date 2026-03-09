import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyEventOwnership } from '@/lib/verify-ownership';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id;

        // 🔒 Verificar propriedade do evento
        const ownership = await verifyEventOwnership(req, eventId)
        if (!ownership.authorized) return ownership.response

        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, slug, gift_list_enabled, tax_payer, bank_pix_key, bank_type, bank_beneficiary, event_settings')
            .eq('id', eventId)
            .single();

        if (eventError || !event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const { data: gifts } = await supabase
            .from('gifts')
            .select('*')
            .eq('event_id', eventId)
            .order('order', { ascending: true });

        const { data: transactions } = await supabase
            .from('gift_transactions')
            .select('*')
            .eq('event_id', eventId)
            .eq('status', 'APPROVED')
            .order('created_at', { ascending: false });

        const { data: withdrawals } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('event_id', eventId);

        const now = new Date();
        const stats = (transactions || []).reduce((acc: any, t: any) => {
            const net = Number(t.amount_net);
            acc.totalNet += net;
            if (t.release_date && new Date(t.release_date) > now) {
                acc.pendingNet += net;
            } else {
                acc.availableNet += net;
            }
            return acc;
        }, { totalNet: 0, pendingNet: 0, availableNet: 0 });

        const totalWithdrawn = (withdrawals || [])
            .filter((w: any) => w.status === 'COMPLETED' || w.status === 'PENDING')
            .reduce((acc: any, w: any) => acc + Number(w.amount), 0);
        stats.availableNet -= totalWithdrawn;

        return NextResponse.json({
            gifts: gifts || [],
            stats,
            settings: {
                giftListEnabled: event.gift_list_enabled || false,
                taxPayer: event.tax_payer || 'COUPLE',
                slug: event.slug || '',
                bankPixKey: event.bank_pix_key || '',
                bankType: event.bank_type || 'CPF',
                bankBeneficiary: event.bank_beneficiary || '',
                coupleNames: typeof event.event_settings === 'string' ? JSON.parse(event.event_settings).coupleNames : event.event_settings?.coupleNames || 'Nós'
            },
            transactions: (transactions || []).slice(0, 50).map(t => ({
                id: t.id,
                guestName: t.guest_name,
                guestEmail: t.guest_email,
                message: t.message,
                amountNet: Number(t.amount_net),
                status: t.status,
                createdAt: t.created_at
            })),
            withdrawals: (withdrawals || []).map(w => ({
                id: w.id,
                amount: Number(w.amount),
                status: w.status,
                createdAt: w.created_at,
                pixKey: w.pix_key
            }))
        });

    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
