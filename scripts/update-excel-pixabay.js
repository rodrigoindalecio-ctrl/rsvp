const fs = require('fs');
const xlsx = require('xlsx');

const API_KEY = '55349306-893f26303015dd3eff5ee3b48';
const EXCEL_PATH = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\docs\\presentes.xlsx';

const searchQueryMap = {
    'Cota para Refrigerador Multidoor Smart': 'smart refrigerator kitchen',
    'Robô Aspirador de Última Geração': 'robot vacuum cleaner',
    'Máquina de Café Espresso Profissional': 'espresso coffee machine kitchen',
    'Adega Climatizada para Seleção de Rótulos': 'wine cooler fridge glass',
    'Soundbar de Cinema para o Living': 'soundbar home theater',
    'Jogo de Panelas em Cerâmica Copper (10 pçs)': 'copper ceramic cookware set',
    'Batedeira Planetária de Alta Performance': 'stand mixer baking',
    'Enxoval Real de Cama (1.000 Fios)': 'luxury white bed linen',
    'Tapete Artesanal sob Medida para Sala': 'handmade rug living room',
    'Fritadeira Elétrica Airfryer Digital XL': 'air fryer kitchen appliance',
    'Purificador de Água com Touch Panel': 'water purifier dispenser kitchen',
    'Faqueiro Inox 101 peças em Estojo de Madeira': 'silver flatware cutlery set',
    'Micro-ondas Inox com Revestimento Interno Especial': 'stainless steel microwave oven',
    'Quadro Artístico Fine Art Numerado': 'fine art wall painting',
    'Jogo de Jantar em Porcelana (42 peças)': 'fine porcelain dinnerware set',
    'Vaporizador de Roupas Vertical Pro': 'garment steamer clothes',
    'Luminária de Piso Industrial Design': 'industrial floor lamp',
    'Conjunto de Toalhas Algodão Egípcio (5 peças)': 'luxury bath towels folded',
    'Manta em Tricô para Sofá Classic': 'cozy throw blanket sofa',
    'Vaso em Cristal Murano Legítimo': 'murano crystal vase',
    'Mixer de Mão Multifuncional 4 em 1': 'hand immersion blender kitchen',
    'Jogo de Taças de Cristal para Degustação (12 un)': 'crystal wine glasses',
    'Kit Churrasco Profissional em Maleta Inox': 'bbq grill tool set',
    'Cooler Vintage para Bebidas e Lounge': 'vintage drink cooler',
    'Difusor de Ambiente Ultrassônico e Aromas': 'essential oil diffuser ultrasonic',
    'Espelho Adnet com Alça de Couro Premium': 'round leather strap mirror',
    'Garden Seat em Cerâmica Marroquina': 'moroccan ceramic garden seat',
    'Abajur de Mesa em Metal Escovado Modernist': 'modern desk lamp metal',
    'Champanheira em Inox Martelar Design': 'hammered stainless ice bucket',
    'Kit de Lavabo Luxo (Saboneteira e Difusor)': 'luxury bathroom soap dispenser',
    'Jogo de Almofadas Veludo Maison': 'velvet sofa pillows',
    'Bandeja Master para Café na Cama': 'breakfast bed tray wooden',
    'Lixeira de Embutir Gourmet Inox': 'stainless steel kitchen trash can',
    'Relógio de Parede Industrial Grand Central': 'large industrial wall clock',
    'Kit de Velas Aromáticas Gourmet Premium': 'luxury scented candles',
    'Cesto de Organização em Fibra Natural': 'woven storage basket natural',
    'Conjunto de Facas Artificiais para Queijos e Vinhos': 'cheese knife wine set',
    'Petisqueira em Bambu Sustentável (5 divs)': 'bamboo serving tray platter',
    'Organizador de Maquiagem/Joias em Acrílico Diamond': 'acrylic makeup jewelry organizer',
    'Suporte Ergonômico para Home Office em Alumínio': 'aluminum laptop stand ergonomic',
    'Cafeteira Francesa em Vidro Borossilicato': 'french press coffee maker',
    'Saca-Rolhas Elétrico Recarregável One-Touch': 'electric wine opener corkscrew',
    'Balança de Cozinha Digital Ultra Slim': 'digital kitchen scale food',
    'Moedor Duplo de Pimenta e Sal Elétrico Inox': 'electric salt pepper grinder',
    'Porta-Retrato em Prata Martelada Legacy': 'silver picture frame',
    'Jogo de Copos Baixos Old Fashioned (6 un)': 'old fashioned whiskey glasses',
    'Porta-Condimentos Giratório em Inox (12 potes)': 'rotating spice rack stainless',
    'Set de Potes de Cerâmica Herméticos Modernos': 'ceramic food storage jars',
    'Tábua de Corte Profissional em Ardósia Natural': 'slate cutting board platter',
    'Cabides de Veludo Slim Antiderrapantes (20 un)': 'velvet clothes hangers closet',
    'Organizador de Gavetas Ajustável Premium': 'adjustable drawer organizer closet',
    'Centrífuga de Saladas Manual Ergonomica': 'salad spinner bowl kitchen',
    'Infusor de Chá em Porcelana e Filtro Inox': 'porcelain tea infuser mug',
    'Capacho de Entrada Welcome Design Edition': 'welcome door mat entrance',
    'Set de Assadeiras Antiaderentes Professional': 'nonstick baking pans oven',
    'Descanso de Panelas em Cortiça Estilizada (3 un)': 'cork trivet hot pads',
    'Descascador de Legumes Giratório Soft-Touch': 'vegetable peeler kitchen tool',
    'Ralador 4 Faces Professional em Aço Escovado': 'stainless steel box grater',
    'Assadeira com Grelha Interna para Roast': 'roasting pan with rack',
    'Kit de Utensílios de Silicone (7 itens)': 'silicone kitchen utensils set'
};

function generateFallback(name) {
    if(!name) return 'kitchen appliance';
    return name.split(' ').slice(0, 3).join(' ') + ' kitchen';
}

async function populateExcel() {
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheetName = 'Open House';
    
    if (!workbook.SheetNames.includes(sheetName)) {
        console.error(`Sheet ${sheetName} not found.`);
        return;
    }
    
    const ws = workbook.Sheets[sheetName];
    // Create an array of arrays representing rows
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
    
    // Set headers
    if(data.length > 0) {
        data[0][1] = 'link1';
        data[0][2] = 'link2';
        data[0][3] = 'link3';
    }

    console.log(`Iniciando busca no Pixabay para ${data.length - 1} itens do Open House...`);

    // Começa na linha 1 (ignora header 0)
    for (let r = 1; r < data.length; r++) {
        const row = data[r];
        if (!row || !row[0]) continue;
        
        const itemName = row[0].trim();
        let query = searchQueryMap[itemName] || generateFallback(itemName);
        
        const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3`;
        
        try {
            const res = await fetch(url);
            const json = await res.json();
            
            if (json.hits && json.hits.length > 0) {
                row[1] = json.hits[0] ? json.hits[0].largeImageURL : '';
                row[2] = json.hits[1] ? json.hits[1].largeImageURL : '';
                row[3] = json.hits[2] ? json.hits[2].largeImageURL : '';
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
        
        // Delay to respect API limits (100 req/min usually)
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Write back
    const newWs = xlsx.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = newWs;
    
    xlsx.writeFile(workbook, EXCEL_PATH);
    console.log('\n✅ Planilha atualizada com sucesso! Todas as URLs salvas no presentes.xlsx.');
}

populateExcel();
