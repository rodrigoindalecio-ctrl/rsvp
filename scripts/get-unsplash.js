const fs = require('fs');

async function getUrl() {
    try {
        const fetch = require('node-fetch');
        const res = await fetch('https://unsplash.com/photos/ZkWMfHPNWpw');
        const text = await res.text();
        const match = text.match(/https:\/\/images\.unsplash\.com\/photo-[^"\?]+/);
        if (match) {
            const rawUrl = match[0];
            const file = 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\lib\\gift-templates.ts';
            let content = fs.readFileSync(file, 'utf8');
            const newUrl = `${rawUrl}?auto=format&fit=crop&q=80&w=800`;
            
            // Substitui apenas o Refrigerador
            content = content.replace(/(name:\s*['"]Cota para Refrigerador Multidoor Smart['"][^}]+imageUrl:\s*['"])[^'"]+(['"])/g, `$1${newUrl}$2`);
            
            fs.writeFileSync(file, content);
            console.log('✅ SUBSTITUIDO COM SUCESSO: ' + newUrl);
        } else {
            console.log('URL não encontrada no HTML');
        }
    } catch(e) {
        console.log('Erro:', e.message);
    }
}
getUrl();
