const fs = require('fs');

const API_KEY = '55349306-893f26303015dd3eff5ee3b48';
const FILE_PATH = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\lib\\gift-templates.ts';

const itemsToUpdate = {
    'Batedeira Planetária Premium Edition': 'stand mixer kitchen counter',
    'Jogo de Panelas Cerâmica Non-Stick (10 pçs)': 'kitchen cookware pots pans',
    'Robô Aspirador Inteligente com Mapeamento': 'robot vacuum cleaner floor',
    'Mixer com Acessórios Gourmet 5 em 1': 'hand blender kitchen cooking',
    'Purificador de Água Touch com Água Gelada': 'water purifier dispenser kitchen',
    'Forno Elétrico de Convecção Gourmet': 'modern built-in oven kitchen'
};

// Fallback items based on names in gift-templates.ts
const fallbackNames = {
    'Batedeira Planetária Premium Edition': ['Batedeira Planetária Premium', 'Batedeira Planetária de Alta Performance'],
    'Jogo de Panelas Cerâmica Non-Stick (10 pçs)': ['Jogo de Panelas Cerâmica Non-Stick', 'Jogo de Panelas em Cerâmica Copper (10 pçs)', 'Jogo de Panelas'],
    'Robô Aspirador Inteligente com Mapeamento': ['Robô Aspirador Inteligente', 'Robô Aspirador de Última Geração'],
    'Mixer com Acessórios Gourmet 5 em 1': ['Mixer com Acessórios Gourmet', 'Mixer de Mão Multifuncional 4 em 1'],
    'Purificador de Água Touch com Água Gelada': ['Purificador de Água', 'Purificador de Água com Touch Panel'],
    'Forno Elétrico de Convecção Gourmet': ['Forno Elétrico de Convecção']
};

async function updatePixabay() {
    let content = fs.readFileSync(FILE_PATH, 'utf8');
    let modifications = 0;
    
    for (const [itemName, query] of Object.entries(itemsToUpdate)) {
        const encodedQuery = encodeURIComponent(query);
        // Usar image_type=photo para máxima qualidade
        const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodedQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=5`;
        
        try {
            console.log(`\n🔍 Buscando [${itemName}] -> "${query}"`);
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.hits && data.hits.length > 0) {
                // Pega a primeira com mais qualidade
                const imageUrl = data.hits[0].largeImageURL;
                console.log(`✅ Imagem encontrada: ${imageUrl}`);
                
                let replaced = false;
                const lines = content.split('\n');
                
                const possibleNames = [itemName, ...(fallbackNames[itemName] || [])];
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    
                    const hasMatch = possibleNames.some(n => line.includes(`name: '${n}'`) || line.includes(`name: "${n}"`));
                    
                    if (hasMatch) {
                        const newLine = line.replace(/imageUrl:\s*['"][^'"]+['"]/, `imageUrl: '${imageUrl}'`);
                        if (line !== newLine) {
                            lines[i] = newLine;
                            modifications++;
                            replaced = true;
                            // Encontrou um match
                            console.log(`✓ Aplicado na linha atualizada do arquivo.`);
                        }
                    }
                }
                
                content = lines.join('\n');
                if(!replaced) {
                    console.log(`⚠️ Item "${itemName}" não modificado (não encontrado ou já usava link igual).`);
                }
            } else {
                console.log(`⚠️ Nenhum resultado encontrado no Pixabay para "${query}".`);
            }
        } catch (e) {
            console.error(`❌ Erro na API:`, e.message);
        }
    }
    
    if (modifications > 0) {
        fs.writeFileSync(FILE_PATH, content);
        console.log(`\n🎉 Concluído! ${modifications} instâncias atualizadas.`);
    } else {
        console.log('\nNenhuma modificação foi salva no arquivo.');
    }
}

updatePixabay();
