const fs = require('fs');

const API_KEY = '55349306-893f26303015dd3eff5ee3b48';
const FILE_PATH = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\lib\\gift-templates.ts';

const itemsToUpdate = {
    'Smart TV 55" 4K Neo QLED': 'modern living room smart tv flat screen',
    'Jogo de Jantar 42 Peças Porcelana Fina': 'fine porcelain dinnerware elegant table',
    'Fritadeira Elétrica AirFryer Digital XL': 'air fryer kitchen appliance',
    'Aspirador de Pó Vertical Sem Fio Pro': 'cordless vacuum cleaner home',
    'Liquidificador de Alta Potência Professional': 'kitchen blender smoothie'
};

// Fallback items if they have slight name variations in the file
const fallbackNames = {
    'Smart TV 55" 4K Neo QLED': ['Smart TV 55" 4K', 'Smart TV 55'],
    'Jogo de Jantar 42 Peças Porcelana Fina': ['Jogo de Jantar em Porcelana (42 peças)', 'Jogo de Jantar 42 Peças'],
    'Fritadeira Elétrica AirFryer Digital XL': ['Fritadeira Elétrica Airfryer Digital XL'],
    'Aspirador de Pó Vertical Sem Fio Pro': ['Aspirador de Pó Vertical Sem Fio'],
    'Liquidificador de Alta Potência Professional': ['Liquidificador de Alta Potência']
};

async function updatePixabay() {
    let content = fs.readFileSync(FILE_PATH, 'utf8');
    let modifications = 0;
    
    for (const [itemName, query] of Object.entries(itemsToUpdate)) {
        const encodedQuery = encodeURIComponent(query);
        // Using "all" for image_type since specific appliances might not have many "photo"s.
        const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodedQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3`;
        
        try {
            console.log(`\n🔍 Buscando [${itemName}] -> "${query}"`);
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.hits && data.hits.length > 0) {
                const imageUrl = data.hits[0].largeImageURL;
                console.log(`✅ Imagem encontrada: ${imageUrl}`);
                
                let replaced = false;
                const lines = content.split('\n');
                
                // Padrões de busca para o nome exato ou variacoes conhecidas
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
                            console.log(`✓ Aplicado no arquivo em vez de: ${itemName}`);
                        }
                    }
                }
                
                content = lines.join('\n');
                if(!replaced) {
                    console.log(`⚠️ Item "${itemName}" não encontrado no arquivo gift-templates.ts com esse nome exato.`);
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
        console.log(`\n🎉 Concluído! ${modifications} itens atualizados com Pixabay.`);
    } else {
        console.log('\nNenhuma modificação foi salva no arquivo.');
    }
}

updatePixabay();
