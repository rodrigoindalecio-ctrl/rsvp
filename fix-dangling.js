const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Only touch files that already import supabaseAdmin but still have dangling 'supabase' variables
      if (content.includes("import { supabaseAdmin } from '@/lib/supabase-admin';")) {
        let originalContent = content;

        // Replace standalone "supabase" (as a variable) with "supabaseAdmin",
        // making sure not to replace "supabaseAdmin" itself or "supabaseUrl"
        // Regex \b(supabase)\b but only if not followed by 'Admin'
        // Let's use negative lookahead: \bsupabase\b(?!(Admin|ServiceKey|Url))
        content = content.replace(/\bsupabase\b/g, (match, offset, string) => {
             // Check context, we don't want to replace inside import path like '@/lib/supabase'
             // Or if it's already supabaseAdmin (the word boundary handles that usually, but just in case)
             
             // If preceding chars are /lib/ then skip
             if (string.substring(Math.max(0, offset - 5), offset).includes('/lib/')) {
                 return match;
             }
             return 'supabaseAdmin';
        });

        if (originalContent !== content) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated dangling variables in: ${fullPath}`);
        }
      }
    }
  }
}

processDirectory('c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\api');
console.log('Done fixing dangling references.');
