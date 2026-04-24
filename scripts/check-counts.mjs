
import fs from 'fs';
const content = fs.readFileSync('c:/Users/rodri/Desktop/App RSVP site/Google Gravity/tmp_app/src/lib/gift-templates.ts', 'utf-8');

const regex = /const ([A-Z_]+_ITEMS): GiftTemplate\[\] = \[([\s\S]*?)\];/g;
let match;
const counts = [];

while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    const itemsContent = match[2];
    const itemCount = (itemsContent.match(/\{/g) || []).length;
    counts.push({ name, count: itemCount });
}

console.log(JSON.stringify(counts, null, 2));
