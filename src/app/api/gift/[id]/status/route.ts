import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

        const { data: tx } = await supabaseAdmin
            .from('gift_transactions')
            .select('status, mp_payment_id')
            .eq('id', transactionId)
            .single();

        return NextResponse.json({ status: tx?.status || 'PENDING' });
    } catch (e) {
        return NextResponse.json({ status: 'PENDING' });
    }
}
