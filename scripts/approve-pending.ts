import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function check() {
    const { data, error } = await supabase
        .from('gift_transactions')
        .update({ status: 'APPROVED' })
        .eq('status', 'PENDING');

    console.log(data, error || "All pending transactions are now APPROVED");
}
check();
