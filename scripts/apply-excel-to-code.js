const fs = require('fs');
const xlsx = require('xlsx');

const EXCEL_PATH = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\docs\\presentes.xlsx';
const FILE_PATH = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\lib\\gift-templates.ts';

function applyExcelToCode() {
    let content = fs.readFileSync(FILE_PATH, 'utf8');
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheetName = 'Open House';
    
    if (!workbook.SheetNames.includes(sheetName)) {
        console.error(`Sheet ${sheetName} not found.`);
        return;
    }
    
    const ws = workbook.Sheets[sheetName];
    // Pega as linhas do Excel
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
    
    console.log(`Lendo arquivo Excel e atualizando código para ${data.length - 1} itens do Open House...`);
    let modifications = 0;

    const lines = content.split('\n');

    for (let r = 1; r < data.length; r++) {
        const row = data[r];
        if (!row || !row[0] || !row[1]) continue;
        
        const itemName = row[0].trim();
        const unsplashLink1 = row[1].trim(); // Pega a primeira variação da coluna B
        
        if (unsplashLink1 && unsplashLink1 !== 'N/A' && unsplashLink1.includes('http')) {
            // Busca o item no TypeScript e substitui a imagem
            for (let i = 0; i < lines.length; i++) {
                if ((lines[i].includes(`name: '${itemName}'`) || lines[i].includes(`name: "${itemName}"`))) {
                    const newLine = lines[i].replace(/imageUrl:\s*['"][^'"]+['"]/, `imageUrl: '${unsplashLink1}'`);
                    if (lines[i] !== newLine) {
                        lines[i] = newLine;
                        modifications++;
                        console.log(`✓ Aplicado: ${itemName}`);
                    }
                }
            }
        }
    }
    
    if (modifications > 0) {
        fs.writeFileSync(FILE_PATH, lines.join('\n'));
        console.log(`\n🎉 Injeção Finalizada! ${modifications} itens do Open House receberam a foto do Excel no código-fonte.`);
    } else {
        console.log('\n⚠️ Nenhuma modificação feita. Talvez as URLs estivessem corretas ou com N/A.');
    }
}

applyExcelToCode();
