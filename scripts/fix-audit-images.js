const fs = require('fs');

const path = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\lib\\gift-templates.ts';
let content = fs.readFileSync(path, 'utf8');

const repls = {
    'Passeio ao Lago Negro': 'photo-1542128859-9941a3160100',
    'Museu do Chocolate Artesanal': 'photo-1481391243133-f96216dcb5d2',
    'Workshop de Fondue': 'photo-1550547660-d9450f859349',
    'Visita ao Olivas de Gramado': 'photo-1502672260266-1c1ef2d93688',
    'Sessão de Fotos no Belvédère': 'photo-1519741497674-611481863552',
    'Chá da Tarde em Estilo Inglês': 'photo-1542314831-068cd1dbfeeb',
    'Dia de Compras no Centro': 'photo-1441986300917-64674bd600d8',
    'Entrada para o Mini Mundo': 'photo-1563298723-dcfebaa3a2ec',
    'Almoço Típico Alemão': 'photo-1481070555726-e2fe8357725c',
    'Jantar em Restaurante Temático': 'photo-1514362545857-3bc16c4c7d1b',
    'Ticket para o Museu de Cera Dreamland': 'photo-1594909122845-11baa439b7bf',
    'Honeymoon Fund: "Amor na Serra"': 'photo-1501785888041-af3ef285b470',
    'Update: Seguro Viagem Serra Gaúcha': 'photo-1544731612-de7f96afe55f',
    'Mimo: Jogo de Cristais de Gramado': 'photo-1581783898377-1c85bf937427',
    'Pôr do Sol no Mirante do Boldró': 'photo-1508739773434-c26b3d09e071',
    'Aluguel de Buggy por 1 Dia': 'photo-1506905925346-21bda4d32df4',
    'Observação de Golfinhos': 'photo-1572949645841-01634f59a643',
    'Trilha Noturna Guiada': 'photo-1419242902214-272b3f66ee7a',
    'Passeio de Caiaque': 'photo-1482784160316-6eb046863ece',
    'Jantar com Vista para o Mar': 'photo-1514362545857-3bc16c4c7d1b',
    'Passeio de Barco ao Entardecer': 'photo-1505118380757-91f5f5632de0',
    'Entrada para o Parque Nacional Marinho': 'photo-1594909122845-11baa439b7bf',
    'Update: Seguro Viagem Noronha': 'photo-1544731612-de7f96afe55f',
    'Mimo: Lembrança de Artesanato Local': 'photo-1441986300917-64674bd600d8',
    'Degustação de Frutos do Mar': 'photo-1514362545857-3bc16c4c7d1b',
    'Passeio de Bike Elétrica na Orla': 'photo-1485965120184-e220f721d03e',
    'Tour de Fotos "Amanhecer em Noronha"': 'photo-1519741497674-611481863552',
    'Mimo: Toalha de Banho Premium Bordada': 'photo-1584622781564-1d9876a3e7db',
    'Jantar Romântico sob as Estrelas': 'photo-1514362545857-3bc16c4c7d1b',
    'Passeio de Mão Dada ao Pôr do Sol': 'photo-1501785888041-af3ef285b470',
    'Aventura Radical: Voo de Asa Delta ou Balão': 'photo-1533228892549-51cf2c5da992',
    'Transporte Executivo VIP (Aeroporto-Hotel)': 'photo-1503376780353-7e6692767b70',
    'Fotos Profissionais do Casal no Destino': 'photo-1519741497674-611481863552',
    'Seleção de Compras em Boutique Local': 'photo-1441986300917-64674bd600d8',
    'Seguro Viagem Master para o Casal': 'photo-1544731612-de7f96afe55f',
    'Frigobar Liberado por toda a Viagem': 'photo-1543332171-3321a5ebad3c',
    'Pacote de Internet Ilimitada (Roaming)': 'photo-1520333789090-1afc82db536a',
    'Cesta de Frutas e Chocolates Belgas': 'photo-1493770348161-369560ae357d',
    'Café da Manhã Flutuante na Piscina': 'photo-1533089860892-a7c6f0a88666',
    'Champagne Gelado na Chegada ao Quarto': 'photo-1543834313-0f7fc3f9cb90',
    'Aluguel de Bicicletas Retrô por um dia': 'photo-1485965120184-e220f721d03e',
    'Happy Hour em Rooftop Badalado': 'photo-1514362545857-3bc16c4c7d1b',
    'Entrada para Museu ou Galeria de Arte': 'photo-1518998053574-53f1f61f9b86',
    'Ajuda com o Excesso de Bagagem (Compras!)': 'photo-1551107696-a4b0c5a0d9a2',
    'Sobremesa Especial com Assinatura do Chef': 'photo-1551024506-0bcad19a4ad3',
    'Check-in Prioritário e Sala VIP': 'photo-1544731612-de7f96afe55f',
    'Piquenique Gourmet no Parque Local': 'photo-1515238152791-8216bfdf89a7',
    'Cota para Refrigerador Multidoor Smart': 'photo-1626803775151-61d756612f97',
    'Robô Aspirador de Última Geração': 'photo-1518133835878-5a93cc3f89e5',
    'Máquina de Café Espresso Profissional': 'photo-1495474472287-4d71bcdd2085',
    'Adega Climatizada para Seleção de Rótulos': 'photo-1584622650111-993a426fbf0a',
    'Soundbar de Cinema para o Living': 'photo-1595928642581-f50f4f3453a5',
    'Jogo de Panelas em Cerâmica Copper (10 pçs)': 'photo-1584284778588-a5b2b4e8ee5f',
    'Batedeira Planetária de Alta Performance': 'photo-1594833246416-65be797fc7de',
    'Enxoval Real de Cama (1.000 Fios)': 'photo-1505691938895-1758d7eaa511',
    'Tapete Artesanal sob Medida para Sala': 'photo-1562184552-997c461abbe6',
    'Fritadeira Elétrica Airfryer Digital XL': 'photo-1581439645268-ea7bbe6bd091'
};

let counter = 0;
// We split the file by lines to do safe replacements
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    for (const [name, imgId] of Object.entries(repls)) {
        if (lines[i].includes(`name: '${name}'`) || lines[i].includes(`name: "${name}"`)) {
            const oldLine = lines[i];
            const newLine = oldLine.replace(/imageUrl:\s*['"][^'"]+['"]/, `imageUrl: 'https://images.unsplash.com/${imgId}?auto=format&fit=crop&q=80&w=800'`);
            
            if (oldLine !== newLine) {
                lines[i] = newLine;
                counter++;
            }
        }
    }
}

fs.writeFileSync(path, lines.join('\n'));
console.log(`Successfully replaced ${counter} images.`);
