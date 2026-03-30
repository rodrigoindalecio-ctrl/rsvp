import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function run() {
    const { data } = await supabase.from('gift_transactions').select('*').eq('event_id', '77718818-e954-48a9-9c2a-003944a4e6a0');
    console.log(JSON.stringify(data, null, 2));
}

run();
