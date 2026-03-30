import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

// Pega o diretório atual em modulos ES
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ────────────────────────────────────────────────────────
// ⚙️ CONFIGURAÇÕES (edite conforme seu projeto)
// ────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'SUA_URL_DO_SUPABASE';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'SUA_CHAVE_SERVICE_ROLE';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'SUA_CHAVE_OPENAI';
const SUPABASE_BUCKET = 'uploads'; // <--- Altere para o seu bucket (ex: 'public', 'images', 'uploads')

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
    console.error('ERRO: Defina suas chaves nas variáveis ou no topo do arquivo (Supabase e OpenAI).');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function generateAndUploadImage(name, description, subcategory) {
    console.log(`\n📸 Gerando imagem para: [${subcategory}] ${name}...`);
    try {
        // PROMPT DA IMAGEM: Focado em fotografia editorial, iluminação premium e contextualizado com o local real
        const prompt = `A highly professional, cinematic, and premium photograph representing an experience or gift: "${name}". Description: "${description}". Context: A luxurious wedding gift registry in ${subcategory}. The image should be beautifully lit, magazine-cover quality, warm and elegant, photorealistic, 8k resolution, award-winning photography. Only the object/experience, no text or words on image.`;

        // Chama o DALL-E 3
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
        });

        const imageUrl = response.data[0].url;
        console.log(`⬇️  Baixando imagem provisória da OpenAI...`);
        const imgResponse = await fetch(imageUrl);
        const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());

        // Cria nome de arquivo seguro: templates/gramado/passeio_lago_negro_12345.jpg
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const fileName = `templates/${subcategory}/${safeName}_${Date.now()}.jpg`;

        console.log(`☁️  Fazendo upload para o Supabase no bucket "${SUPABASE_BUCKET}": ${fileName}`);
        const { error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(fileName, imgBuffer, { contentType: 'image/jpeg', upscale: false });

        if (error) {
            console.error('Erro no Supabase Storage:', error.message);
            return null;
        }

        // Pega a URL pública
        const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    } catch (err) {
        console.error(`❌ Erro ao processar ${name}:`, err.message || err);
        return null;
    }
}

async function run() {
    const filePath = path.join(__dirname, '..', 'src', 'lib', 'gift-templates.ts');
    let content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Verifica se a linha corresponde a um presente formatado (que tenha as chaves principais)
        if (line.includes('name: ') && line.includes('imageUrl: ') && line.includes('subcategory: ')) {
            
            const nameMatch = line.match(/name:\s*'([^']+)'/);
            const descMatch = line.match(/description:\s*'([^']+)'/);
            const subMatch = line.match(/subcategory:\s*'([^']+)'/);
            const oldImgMatch = line.match(/imageUrl:\s*'([^']+)'/);
            
            if (nameMatch && descMatch && subMatch && oldImgMatch) {
                const name = nameMatch[1];
                const desc = descMatch[1];
                const subcat = subMatch[1];
                const oldUrl = oldImgMatch[1];

                // Pula a imagem de presentes que já foram gerados usando sua URL do supabase
                if (oldUrl.includes('supabase.co')) {
                    console.log(`\n⏭️  Pulando "${name}" (já tem URL do Supabase).`);
                    continue;
                }

                // Gera nova URL
                const newUrl = await generateAndUploadImage(name, desc, subcat);
                
                if (newUrl) {
                    // Substitui apenas a URL nesta linha exata
                    lines[i] = line.replace(`imageUrl: '${oldUrl}'`, `imageUrl: '${newUrl}'`);
                    changed = true;
                }
                
                // Pausa estratégica de 30 segundos (necessária para não ser barrado no limite RateLimit da OpenAI do DALL-E 3)
                console.log('⏳ Aguardando 15s p/ evitar bloqueio da API...');
                await new Promise(r => setTimeout(r, 15000));
            }
        }
    }

    if (changed) {
        console.log('\n💾 Salvando o arquivo gift-templates.ts...');
        await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
        console.log('✅ SCRIPT CONCLUÍDO! O seu arquivo TypeScript foi sobrescrito com imagens Premium da IA!');
    } else {
        console.log('\nNenhuma novidade para salvar. Todas imagens parecem atualizadas.');
    }
}

run();
