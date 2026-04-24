const fs = require('fs');
const xlsx = require('xlsx');

const filePath = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\lib\\gift-templates.ts';
const content = fs.readFileSync(filePath, 'utf8');

function extractNames(arrayName) {
    const list = [];
    let capture = false;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(`const ${arrayName}: GiftTemplate[]`)) {
            capture = true;
            continue;
        }
        if (capture) {
            if (line.startsWith('];')) {
                break;
            }
            const match = line.match(/name:\s*['"]([^'"]+)['"]/);
            if (match) {
                list.push([match[1]]);
            }
        }
    }
    return list;
}

const openHouseNames = extractNames('OPEN_HOUSE_ITEMS');
const casamentoNames = extractNames('PRESENTES_CASAMENTO_ITEMS');
const luaDeMelNames = extractNames('COTAS_LUA_DE_MEL_ITEMS');

const excelPath = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\docs\\presentes.xlsx';
const workbook = xlsx.readFile(excelPath);

function updateSheet(sheetName, data) {
    if (workbook.SheetNames.includes(sheetName)) {
        // Create an array of arrays representing rows
        // Add a header if needed, but let's just write the data in the first column starting from row 1 (or 2)
        const ws = xlsx.utils.aoa_to_sheet([['Nome do Presente'], ...data]);
        workbook.Sheets[sheetName] = ws;
    } else {
        console.log(`Sheet "${sheetName}" not found!`);
    }
}

updateSheet('Open House', openHouseNames);
updateSheet('Presentes de Casamento', casamentoNames);
updateSheet('Cotas de Lua de Mel', luaDeMelNames);

xlsx.writeFile(workbook, excelPath);
console.log('Excel file updated successfully!');
