const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Parser simples de .env.local para evitar dependência de dotenv
const envMap = {};
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            envMap[key.trim()] = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
    });
} catch (e) {
    console.error('❌ Erro ao ler .env.local:', e.message);
}

const supabase = createClient(
    envMap['NEXT_PUBLIC_SUPABASE_URL'],
    envMap['SUPABASE_SERVICE_ROLE_KEY']
);

async function run() {
    console.log('🔄 Buscando última transação...');
    const { data: gifts, error: getError } = await supabase
        .from('gift_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (getError || !gifts || gifts.length === 0) {
        console.error('❌ Nenhuma transação encontrada:', getError || 'Array vazio');
        return;
    }

    const gift = gifts[0];
    console.log(`✅ Encontrada: [${gift.id}] ${gift.guest_name} - R$ ${gift.amount_net}`);

    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    console.log('⏳ Atualizando release_date para o passado e status para APPROVED...');
    const { error: updateError } = await supabase
        .from('gift_transactions')
        .update({ 
            release_date: pastDate.toISOString(),
            status: 'APPROVED' 
        })
        .eq('id', gift.id);

    if (updateError) {
        console.error('❌ Erro na atualização:', updateError);
    } else {
        console.log('🚀 Sucesso! A transação agora está disponível para saque no painel.');
    }
}

run();
