const fs = require('fs');
const xlsx = require('xlsx');

const UNSPLASH_ACCESS_KEY = 'shmVeJer7vMIjLuWJzr-fi6RHLWNLjEVmeq60wS9YKE';
const EXCEL_PATH = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\docs\\presentes.xlsx';

const searchQueryMap = {
    'Cota para Refrigerador Multidoor Smart': 'modern smart refrigerator kitchen',
    'Robô Aspirador de Última Geração': 'robot vacuum cleaner floor',
    'Máquina de Café Espresso Profissional': 'espresso coffee machine barista',
    'Adega Climatizada para Seleção de Rótulos': 'wine cooler fridge glass',
    'Soundbar de Cinema para o Living': 'soundbar home theater living room',
    'Jogo de Panelas em Cerâmica Copper (10 pçs)': 'copper ceramic cookware set pots',
    'Batedeira Planetária de Alta Performance': 'stand mixer kitchen counter baking',
    'Enxoval Real de Cama (1.000 Fios)': 'luxury white bed linen bedroom',
    'Tapete Artesanal sob Medida para Sala': 'handmade rug living room floor',
    'Fritadeira Elétrica Airfryer Digital XL': 'air fryer kitchen modern',
    'Purificador de Água com Touch Panel': 'water purifier dispenser modern kitchen',
    'Faqueiro Inox 101 peças em Estojo de Madeira': 'silver flatware cutlery dining table',
    'Micro-ondas Inox com Revestimento Interno Especial': 'stainless steel microwave oven',
    'Quadro Artístico Fine Art Numerado': 'abstract fine art wall painting',
    'Jogo de Jantar em Porcelana (42 peças)': 'fine porcelain dinnerware set table',
    'Vaporizador de Roupas Vertical Pro': 'garment steamer clothes',
    'Luminária de Piso Industrial Design': 'industrial floor lamp living room',
    'Conjunto de Toalhas Algodão Egípcio (5 peças)': 'luxury bath towels folded spa',
    'Manta em Tricô para Sofá Classic': 'cozy throw blanket sofa knit',
    'Vaso em Cristal Murano Legítimo': 'murano crystal vase flowers',
    'Mixer de Mão Multifuncional 4 em 1': 'hand immersion blender kitchen',
    'Jogo de Taças de Cristal para Degustação (12 un)': 'crystal wine glasses table',
    'Kit Churrasco Profissional em Maleta Inox': 'bbq grill tool set meat',
    'Cooler Vintage para Bebidas e Lounge': 'vintage drink cooler ice',
    'Difusor de Ambiente Ultrassônico e Aromas': 'essential oil diffuser living room',
    'Espelho Adnet com Alça de Couro Premium': 'round leather strap mirror interior',
    'Garden Seat em Cerâmica Marroquina': 'moroccan ceramic garden seat patio',
    'Abajur de Mesa em Metal Escovado Modernist': 'modern desk lamp light',
    'Champanheira em Inox Martelar Design': 'hammered stainless ice bucket champagne',
    'Kit de Lavabo Luxo (Saboneteira e Difusor)': 'luxury bathroom soap dispenser spa',
    'Jogo de Almofadas Veludo Maison': 'velvet sofa pillows living room',
    'Bandeja Master para Café na Cama': 'breakfast bed tray wooden morning',
    'Lixeira de Embutir Gourmet Inox': 'stainless steel kitchen modern',
    'Relógio de Parede Industrial Grand Central': 'large industrial wall clock vintage',
    'Kit de Velas Aromáticas Gourmet Premium': 'luxury scented candles spa',
    'Cesto de Organização em Fibra Natural': 'woven storage basket natural decor',
    'Conjunto de Facas Artificiais para Queijos e Vinhos': 'cheese board knife wine set',
    'Petisqueira em Bambu Sustentável (5 divs)': 'bamboo serving tray appetizers',
    'Organizador de Maquiagem/Joias em Acrílico Diamond': 'acrylic makeup jewelry organizer vanity',
    'Suporte Ergonômico para Home Office em Alumínio': 'aluminum laptop stand desk office',
    'Cafeteira Francesa em Vidro Borossilicato': 'french press coffee maker morning',
    'Saca-Rolhas Elétrico Recarregável One-Touch': 'wine opener corkscrew bottle',
    'Balança de Cozinha Digital Ultra Slim': 'digital kitchen scale food prep',
    'Moedor Duplo de Pimenta e Sal Elétrico Inox': 'salt pepper grinder kitchen',
    'Porta-Retrato em Prata Martelada Legacy': 'silver picture frame table',
    'Jogo de Copos Baixos Old Fashioned (6 un)': 'old fashioned whiskey glasses drink',
    'Porta-Condimentos Giratório em Inox (12 potes)': 'spice rack stainless steel kitchen',
    'Set de Potes de Cerâmica Herméticos Modernos': 'ceramic food storage jars pantry',
    'Tábua de Corte Profissional em Ardósia Natural': 'slate cutting board kitchen',
    'Cabides de Veludo Slim Antiderrapantes (20 un)': 'velvet clothes hangers closet wardrobe',
    'Organizador de Gavetas Ajustável Premium': 'drawer organizer closet neat',
    'Centrífuga de Saladas Manual Ergonomica': 'salad spinner bowl fresh greens',
    'Infusor de Chá em Porcelana e Filtro Inox': 'porcelain tea infuser mug hot',
    'Capacho de Entrada Welcome Design Edition': 'welcome door mat entrance house',
    'Set de Assadeiras Antiaderentes Professional': 'nonstick baking pans oven kitchen',
    'Descanso de Panelas em Cortiça Estilizada (3 un)': 'cork trivet hot pads table',
    'Descascador de Legumes Giratório Soft-Touch': 'vegetable peeler kitchen tool hands',
    'Ralador 4 Faces Professional em Aço Escovado': 'stainless steel box grater cheese',
    'Assadeira com Grelha Interna para Roast': 'roasting pan oven cooking meat',
    'Kit de Utensílios de Silicone (7 itens)': 'silicone kitchen utensils set cooking'
};

function generateFallback(name) {
    if(!name) return 'kitchen interior design';
    return name.split(' ').slice(0, 3).join(' ') + ' modern';
}

async function populateExcelUnsplash() {
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheetName = 'Open House';
    
    if (!workbook.SheetNames.includes(sheetName)) {
        console.error(`Sheet ${sheetName} not found.`);
        return;
    }
    
    const ws = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
    
    if(data.length > 0) {
        data[0][1] = 'Unsplash 1';
        data[0][2] = 'Unsplash 2';
        data[0][3] = 'Unsplash 3';
    }

    console.log(`Iniciando busca na Unsplash API para ${data.length - 1} itens do Open House...`);
    let requestsMade = 0;

    for (let r = 1; r < data.length; r++) {
        const row = data[r];
        if (!row || !row[0]) continue;
        
        const itemName = row[0].trim();
        let query = searchQueryMap[itemName] || generateFallback(itemName);
        
        // Unsplash search endpoint
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=3`;
        
        try {
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            });
            requestsMade++;
            
            if (res.status === 403 || res.status === 429) {
                console.log(`🛑 Limite da API Unsplash atingido (Rate Limit). Parando no item ${r}...`);
                break; // Limit is 50/hour for demo apps
            }

            const json = await res.json();
            
            if (json.results && json.results.length > 0) {
                // Add Next.js optimization parameters
                const getOptUrl = (img) => img ? `${img.urls.raw}&auto=format&fit=crop&q=80&w=800` : '';
                
                row[1] = getOptUrl(json.results[0]);
                row[2] = getOptUrl(json.results[1]);
                row[3] = getOptUrl(json.results[2]);
                console.log(`[OK] ${itemName}`);
            } else {
                console.log(`[ZERO] ${itemName} -> tentou: ${query}`);
                row[1] = 'N/A';
                row[2] = 'N/A';
                row[3] = 'N/A';
            }
        } catch (e) {
            console.error(`[ERRO] ${itemName} - ${e.message}`);
        }
        
        // Delay to prevent hitting burst limits quickly (though rate limit is 50/h anyway)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (requestsMade >= 49) {
             console.log(`🛑 Cota de 50 requests/hora da conta Demo da Unsplash quase esgotada. Salvando progresso e pausando.`);
             break;
        }
    }
    
    const newWs = xlsx.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = newWs;
    
    xlsx.writeFile(workbook, EXCEL_PATH);
    console.log(`\n✅ Planilha Unsplash atualizada com sucesso! (Processados: ${requestsMade} requisições)`);
}

populateExcelUnsplash();
