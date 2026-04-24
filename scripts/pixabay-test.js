const fs = require('fs');

const API_KEY = '55349306-893f26303015dd3eff5ee3b48';
const FILE_PATH = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\lib\\gift-templates.ts';

// Mapeamento: Nome do Presente (exato) -> Termo de Busca em Inglês (bem específico)
const itemsToTest = {
    'Cota para Refrigerador Multidoor Smart': 'french door refrigerator stainless',
    'Robô Aspirador de Última Geração': 'robot vacuum cleaner floor',
    'Fritadeira Elétrica Airfryer Digital XL': 'air fryer kitchen appliance',
    'Micro-ondas Inox com Revestimento Interno Especial': 'stainless steel microwave oven',
    'Lixeira de Embutir Gourmet Inox': 'stainless steel kitchen trash can'
};

async function testPixabay() {
    let content = fs.readFileSync(FILE_PATH, 'utf8');
    let modifications = 0;
    
    for (const [itemName, query] of Object.entries(itemsToTest)) {
        const encodedQuery = encodeURIComponent(query);
        // Seguindo a sua estratégia de filtros
        const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodedQuery}&image_type=photo&orientation=horizontal&category=places,industry,food&safesearch=true&per_page=3`;
        
        try {
            console.log(`\n🔍 Buscando [${itemName}] -> "${query}"`);
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.hits && data.hits.length > 0) {
                // Pegando a imagem de melhor qualidade (largeImageURL) da primeira opção
                const imageUrl = data.hits[0].largeImageURL;
                console.log(`✅ Sucesso! Imagem encontrada: ${imageUrl}`);
                
                // Realizando a substituição segura no arquivo
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(`name: '${itemName}'`) || lines[i].includes(`name: "${itemName}"`)) {
                        const oldLine = lines[i];
                        const newLine = oldLine.replace(/imageUrl:\s*['"][^'"]+['"]/, `imageUrl: '${imageUrl}'`);
                        
                        if (oldLine !== newLine) {
                            lines[i] = newLine;
                            modifications++;
                        }
                    }
                }
                content = lines.join('\n');
            } else {
                console.log(`⚠️ Nenhum resultado perfeito encontrado para "${query}". Mantendo a imagem atual.`);
            }
        } catch (e) {
            console.error(`❌ Erro na API para ${itemName}:`, e.message);
        }
    }
    
    if (modifications > 0) {
        fs.writeFileSync(FILE_PATH, content);
        console.log(`\n🎉 Teste concluído! ${modifications} itens atualizados com fotos do Pixabay no código.`);
    } else {
        console.log('\nNenhuma modificação foi feita.');
    }
}

testPixabay();
