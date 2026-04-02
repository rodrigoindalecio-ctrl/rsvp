import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/**
 * Script de Migração: Base64 -> Supabase Storage
 * Converte imagens armazenadas como strings Base64 no banco de dados para arquivos no Storage.
 */

// 🛠️ Carregar variáveis do .env.local manualmente
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('❌ Erro: Arquivo .env.local não encontrado.');
    process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const index = line.indexOf('=');
            if (index === -1) return [];
            const key = line.substring(0, index).trim();
            const val = line.substring(index + 1).trim().replace(/^"(.*)"$/, '$1');
            return [key, val];
        })
        .filter(pair => pair.length === 2)
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env.local.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'event-images';

/**
 * Utilitário para converter Base64 em Buffer e extrair info
 */
function parseBase64(base64String) {
    if (!base64String || !base64String.startsWith('data:')) return null;
    
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    return {
        type: matches[1],
        extension: matches[1].split('/')[1] || 'png',
        buffer: Buffer.from(matches[2], 'base64')
    };
}

/**
 * Upload de imagem para o Storage
 */
async function uploadToStorage(base64Data, folder) {
    const parsed = parseBase64(base64Data);
    if (!parsed) return null;

    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${parsed.extension}`;
    
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, parsed.buffer, {
            contentType: parsed.type,
            upsert: true
        });

    if (error) {
        console.error(`  ❌ Erro no upload (${fileName}):`, error.message);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

    return publicUrl;
}

/**
 * Migração da tabela GIFTS
 */
async function migrateGifts() {
    console.log('\n📦 Iniciando migração de GIFTS...');
    
    const { data: gifts, error } = await supabase
        .from('gifts')
        .select('id, name, image_url')
        .filter('image_url', 'ilike', 'data:image%');

    if (error) {
        console.error('❌ Erro ao buscar presentes:', error.message);
        return;
    }

    if (!gifts?.length) {
        console.log('✅ Nenhum presente com Base64 encontrado.');
        return;
    }

    console.log(`🔍 Encontrados ${gifts.length} presentes para processar.`);

    for (let i = 0; i < gifts.length; i++) {
        const gift = gifts[i];
        process.stdout.write(`  [${i + 1}/${gifts.length}] Processando: ${gift.name}... `);

        const newUrl = await uploadToStorage(gift.image_url, 'gifts');
        if (newUrl) {
            const { error: updateError } = await supabase
                .from('gifts')
                .update({ image_url: newUrl })
                .eq('id', gift.id);

            if (updateError) {
                console.log('❌ Erro no update.');
            } else {
                console.log('✅ Sucesso.');
            }
        } else {
            console.log('⏭️ Ignorado (formato inválido ou erro no upload).');
        }
    }
}

/**
 * Migração da tabela EVENTS (JSON event_settings)
 */
async function migrateEvents() {
    console.log('\n🎨 Iniciando migração de EVENTS (Configurações)...');
    
    // Buscamos todos os eventos que tenham event_settings
    const { data: events, error } = await supabase
        .from('events')
        .select('id, slug, event_settings')
        .not('event_settings', 'is', null);

    if (error) {
        console.error('❌ Erro ao buscar eventos:', error.message);
        return;
    }

    if (!events?.length) {
        console.log('✅ Nenhum evento encontrado.');
        return;
    }

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        let settings = typeof event.event_settings === 'string' 
            ? JSON.parse(event.event_settings) 
            : event.event_settings;
        
        let changed = false;
        console.log(`  [${i + 1}/${events.length}] Analisando evento: ${event.slug || event.id}...`);

        // 1. Cover Image
        if (settings.coverImage && settings.coverImage.startsWith('data:')) {
            console.log('    ⚡ Migrando Cover Image...');
            const newUrl = await uploadToStorage(settings.coverImage, 'events');
            if (newUrl) { settings.coverImage = newUrl; changed = true; }
        }

        // 2. Carousel
        if (Array.isArray(settings.carousel)) {
            for (let j = 0; j < settings.carousel.length; j++) {
                if (settings.carousel[j] && settings.carousel[j].startsWith('data:')) {
                    console.log(`    ⚡ Migrando Carousel [${j}]...`);
                    const newUrl = await uploadToStorage(settings.carousel[j], 'events');
                    if (newUrl) { settings.carousel[j] = newUrl; changed = true; }
                }
            }
        }

        // 3. Gallery
        if (Array.isArray(settings.gallery)) {
            for (let j = 0; j < settings.gallery.length; j++) {
                if (settings.gallery[j] && settings.gallery[j].startsWith('data:')) {
                    console.log(`    ⚡ Migrando Galeria [${j}]...`);
                    const newUrl = await uploadToStorage(settings.gallery[j], 'events');
                    if (newUrl) { settings.gallery[j] = newUrl; changed = true; }
                }
            }
        }

        // 4. Timeline
        if (Array.isArray(settings.timeline)) {
            for (let j = 0; j < settings.timeline.length; j++) {
                if (settings.timeline[j].image && settings.timeline[j].image.startsWith('data:')) {
                    console.log(`    ⚡ Migrando Timeline [${j}]...`);
                    const newUrl = await uploadToStorage(settings.timeline[j].image, 'events');
                    if (newUrl) { settings.timeline[j].image = newUrl; changed = true; }
                }
            }
        }

        if (changed) {
            const { error: updateError } = await supabase
                .from('events')
                .update({ event_settings: settings })
                .eq('id', event.id);

            if (updateError) {
                console.error(`    ❌ Erro ao atualizar configurações do evento ${event.slug}:`, updateError.message);
            } else {
                console.log(`    ✅ Evento ${event.slug} atualizado com sucesso.`);
            }
        } else {
            console.log(`    ⏭️ Nada para migrar neste evento.`);
        }
    }
}

// 🚀 Executar
async function main() {
    console.log('🚀 Iniciando Migração de Mídia para o Storage...');
    
    await migrateGifts();
    await migrateEvents();

    console.log('\n🏁 Migração concluída!');
}

main().catch(err => {
    console.error('\n💥 Erro Fatal:', err);
});
