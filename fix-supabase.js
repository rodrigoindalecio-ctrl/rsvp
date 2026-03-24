const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') && fullPath !== 'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\api\\events\\save\\route.ts') {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Check if it imports supabase from '@/lib/supabase'
      if (content.includes("from '@/lib/supabase'") || content.includes('from "@/lib/supabase"')) {
        let originalContent = content;

        // Replace the import
        content = content.replace(/import\s+{\s*supabase\s*}\s+from\s+('@\/lib\/supabase'|"@\/lib\/supabase");?/g, "import { supabaseAdmin } from '@/lib/supabase-admin';");

        // Now replace usage of supabase with supabaseAdmin
        // We look for 'supabase.' avoiding 'supabaseAdmin.'
        // To be safe, let's use a regex looking for word boundary
        content = content.replace(/\bsupabase\./g, 'supabaseAdmin.');

        if (originalContent !== content) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  }
}

processDirectory('c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\api');
console.log('Done replacing supabase with supabaseAdmin in API routes.');
