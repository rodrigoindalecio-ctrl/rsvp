const fs = require('fs');

const API_KEY = '55349306-893f26303015dd3eff5ee3b48';
const FILE_PATH = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\lib\\gift-templates.ts';

// O nome exato que está no arquivo gift-templates.ts e a estratégia IA visual de busca em inglês
const itemsToUpdate = {
    // GRAMADO
    'Passeio ao Lago Negro': 'pedal boat lake park',
    'Entrada para o Mini Mundo': 'miniature village toy',
    'Dia de Compras no Centro': 'winter shopping street',
    'Chá da Tarde em Estilo Inglês': 'afternoon tea cup pastry',
    'Sessão de Fotos no Belvédère': 'couple mountain landscape',
    'Ticket para o Museu de Cera Dreamland': 'wax museum figures',
    'Mimo: Cesta de Café da Manhã Colonial': 'breakfast picnic basket',
    'Jantar em Restaurante Temático': 'fancy dinner wine couple',
    'Aluguel de Bicicletas Retrô': 'vintage bicycle parked',
    'Passeio de Helicoptero sobre as Hortênsias': 'helicopter flying landscape',
    'Mimo: Jogo de Cristais de Gramado': 'elegant crystal glasses wine',
    'Update: Seguro Viagem Serra Gaúcha': 'travel insurance passport flight',

    // NORONHA
    'Observação de Golfinhos': 'dolphin jumping tropical sea',
    'Aluguel de Buggy por 1 Dia': 'beach buggy dune',
    'Entrada para o Parque Nacional Marinho': 'tropical marine national park island',
    'Tour de Fotos "Amanhecer em Noronha"': 'sunrise ocean view beach',
    'Passeio de Bike Elétrica na Orla': 'electric bike beach palm tree',
    'Degustação de Frutos do Mar': 'seafood platter luxury restaurant',
    'Mimo: Lembrança de Artesanato Local': 'handmade local craft souvenir',
    'Mimo: Toalha de Banho Premium Bordada': 'folded luxury bath towels spa',

    // COTAS LUA DE MEL
    'Passagens em Classe Executiva (Upgrade)': 'first class flight airplane seat',
    'Passeio de Mão Dada ao Pôr do Sol': 'couple holding hands sunset beach',
    'Jantar Romântico sob as Estrelas': 'romantic dinner under stars outdoor',
    'Aventura Radical: Voo de Asa Delta ou Balão': 'hot air balloon ride sky',
    'Champagne Gelado na Chegada ao Quarto': 'champagne bucket ice hotel room',
    'Frigobar Liberado por toda a Viagem': 'hotel minibar drinks snacks',
    'Entrada para Museu ou Galeria de Arte': 'art gallery paintings exhibition',
    'Piquenique Gourmet no Parque Local': 'gourmet picnic park nature',
    'Sobremesa Especial com Assinatura do Chef': 'gourmet dessert fine dining plate',

    // OPEN HOUSE
    'Cota para Refrigerador Multidoor Smart': 'smart refrigerator double door kitchen',
    'Adega Climatizada para Seleção de Rótulos': 'wine cooler fridge glass luxury',
    'Soundbar de Cinema para o Living': 'home theater soundbar tv living room',
    'Batedeira Planetária de Alta Performance': 'stand mixer baking kitchen counter',
    'Enxoval Real de Cama (1.000 Fios)': 'white luxury bed linen duvet',
    'Tapete Artesanal sob Medida para Sala': 'handmade rug living room floor'
};

async function updatePixabay() {
    let content = fs.readFileSync(FILE_PATH, 'utf8');
    let modifications = 0;
    
    for (const [itemName, query] of Object.entries(itemsToUpdate)) {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodedQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=5`;
        
        try {
            console.log(`\n🔍 Buscando para [${itemName}] -> "${query}"`);
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.hits && data.hits.length > 0) {
                // Tenta pegar a imagem com melhor qualidade visual
                const imageUrl = data.hits[0].largeImageURL;
                console.log(`✅ Imagem encontrada: ${imageUrl.split('/').pop()}`);
                
                let replaced = false;
                const lines = content.split('\n');
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.includes(`name: '${itemName}'`) || line.includes(`name: "${itemName}"`)) {
                        const newLine = line.replace(/imageUrl:\s*['"][^'"]+['"]/, `imageUrl: '${imageUrl}'`);
                        if (line !== newLine) {
                            lines[i] = newLine;
                            modifications++;
                            replaced = true;
                        }
                    }
                }
                
                content = lines.join('\n');
                if(!replaced) console.log(`⚠️ Item "${itemName}" já estava atualizado ou não encontrado na DB.`);
            } else {
                console.log(`⚠️ ZERO resultados no Pixabay para: "${query}". Tentando omitir palavras...`);
                // Fallback simplificado pela IA
                const simplerQuery = encodeURIComponent(query.split(' ').slice(0, 3).join(' ')); 
                const url2 = `https://pixabay.com/api/?key=${API_KEY}&q=${simplerQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3`;
                const res2 = await fetch(url2);
                const data2 = await res2.json();
                
                if (data2.hits && data2.hits.length > 0) {
                   const img2 = data2.hits[0].largeImageURL;
                   console.log(`✅ Encontrado com termo simples ("${query.split(' ').slice(0, 3).join(' ')}"): ${img2.split('/').pop()}`);
                   const lines = content.split('\n');
                   for (let i = 0; i < lines.length; i++) {
                       if (lines[i].includes(`name: '${itemName}'`)) {
                           lines[i] = lines[i].replace(/imageUrl:\s*['"][^'"]+['"]/, `imageUrl: '${img2}'`);
                           modifications++;
                       }
                   }
                   content = lines.join('\n');
                } else {
                   console.log(`❌ Falha até no fallback simples para: ${itemName}`);
                }
            }
        } catch (e) {
            console.error(`❌ Erro na requisição para ${itemName}:`, e.message);
        }
    }
    
    if (modifications > 0) {
        fs.writeFileSync(FILE_PATH, content);
        console.log(`\n🎉 Concluído com sucesso da Inteligência! ${modifications} instâncias atualizadas.`);
    }
}

updatePixabay();
