const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRealtime() {
  const { data, error } = await supabase.from('guests').select('id').limit(1);
  console.log('Test query error:', error ? error.message : 'OK');
}

checkRealtime();
