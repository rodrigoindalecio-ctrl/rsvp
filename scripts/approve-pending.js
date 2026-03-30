const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function approveTransactions() {
  console.log('Aprovando transações PENDING...');
  const { data, error } = await supabase
    .from('gift_transactions')
    .update({ status: 'APPROVED', paid_at: new Date().toISOString() })
    .eq('status', 'PENDING');

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Sucesso! As transações com status PENDING agora estão APPROVED. Abra a tela "Tesouraria dos Noivos"!');
  }
}

approveTransactions();
