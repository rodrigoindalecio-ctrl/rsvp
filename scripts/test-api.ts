import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY) as string
);

async function checkDashboard() {
    const eventId = '77718818-e954-48a9-9c2a-003944a4e6a0'; // Using the one we saw earlier
    const { data: transactions, error } = await supabaseAdmin
        .from('gift_transactions')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false });

    console.log("Error:", error);
    
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

    console.log("STATS:", stats);

    const formattedTransactions = (transactions || []).map((t: any) => ({
        id: t.id,
        amount: Number(t.amount_bruto || t.amount || t.amount_net || 0),
        amountNet: Number(t.amount_net || 0),
        status: t.status
    }));
    console.log("TXS:", formattedTransactions);
}

checkDashboard();
