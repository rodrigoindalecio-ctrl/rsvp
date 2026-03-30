const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateApproval(transactionId) {
    console.log(`🚀 Simulando aprovação para transação: ${transactionId}`);
    
    // 1. Atualizar banco
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + 2); // Pix = 2 dias
    
    const { data: tx, error: updateError } = await supabase
        .from('gift_transactions')
        .update({
            status: 'APPROVED',
            mp_payment_id: 'fake_payment_' + Date.now(),
            payment_method: 'PIX',
            release_date: releaseDate.toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select('*, gifts(*), events(*)')
        .single();
        
    if (updateError) {
        console.error('❌ Erro ao atualizar banco:', updateError);
        return;
    }
    
    console.log('✅ Banco atualizado com sucesso!');
    
    // 2. Disparar notificação de e-mail (simulando webhook)
    console.log('📧 Disparando notificação de e-mail...');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    try {
        const settings = typeof tx.events.event_settings === 'string' 
            ? JSON.parse(tx.events.event_settings) 
            : tx.events.event_settings;

        const response = await fetch(`${baseUrl}/api/send-gift-notification`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
            },
            body: JSON.stringify({
                ownerEmail: tx.events.created_by,
                guestName: tx.guest_name,
                giftName: tx.gifts?.name || 'Presente em Dinheiro',
                amount: tx.amount_net,
                message: tx.message,
                coupleNames: settings?.coupleNames
            })
        });
        
        const result = await response.json();
        console.log('✨ Resultado da notificação:', result);
    } catch (err) {
        console.error('❌ Erro ao disparar e-mail:', err.message);
    }
}

// Rodar com o ID fornecido
const tid = process.argv[2];
if (!tid) {
    console.error('Uso: node scripts/test-payment.js <TRANSACTION_ID>');
} else {
    simulateApproval(tid);
}
