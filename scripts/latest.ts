import { createClient } from '@supabase/supabase-js';
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY) as string
);

async function check() {
    const { data, error } = await supabaseAdmin
        .from('gift_transactions')
        .select('id, amount_net, amount_bruto, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
    console.log("LAST 10 TRANSACTIONS IN DB:", JSON.stringify(data, null, 2));
}
check();
