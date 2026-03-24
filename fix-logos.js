const fs = require('fs');

const filesToUpdate = {
  'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\login\\page.tsx': (content) => {
    return content.replace('/Logo-03.jpg', '/logo_marsala.png')
                  .replace('rounded-xl overflow-hidden shadow-2xl', 'flex items-center justify-center'); // remove background styles for the image div
  },
  'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\cadastrar-senha\\page.tsx': (content) => {
    return content.replace('/Logo-03.jpg', '/logo_marsala.png')
                  .replace('rounded-xl overflow-hidden shadow-2xl', 'flex items-center justify-center');
  },
  'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\[slug]\\presentes\\content.tsx': (content) => {
    return content.replace('/Logo-03.jpg', '/logo_marsala.png')
                  .replace('className="w-16 h-16 object-contain"', 'className="w-20 h-20 object-contain drop-shadow-md"');
  },
  'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\[slug]\\confirmar\\content.tsx': (content) => {
    return content.replace('/Logo-03.jpg', '/logo_marsala.png').replace('/Logo-03.jpg', '/logo_marsala.png')
                  .replace('className="w-16 h-16 object-contain"', 'className="w-20 h-20 object-contain drop-shadow-md"')
                  .replace('bg-white rounded-3xl shadow-lg border border-border-soft flex items-center justify-center mx-auto opacity-40 grayscale', 'flex items-center justify-center mx-auto opacity-70') // remove ugly boxes
                  .replace('className="w-12 h-12 object-contain"', 'className="w-20 h-20 object-contain"');
  },
  'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\[slug]\\content.tsx': (content) => {
    // There are 3 references:
    // 1st: Loading screen
    let c = content.replace('/Logo-03.jpg', '/logo_marsala.png')
                   .replace('className="w-16 h-16 object-contain"', 'className="w-20 h-20 object-contain drop-shadow-md"');
    // 2nd: Error screen
    c = c.replace('/Logo-03.jpg', '/logo_marsala.png')
         .replace('bg-white rounded-3xl shadow-lg border border-border-soft flex items-center justify-center mx-auto opacity-40 grayscale', 'flex items-center justify-center mx-auto opacity-70')
         .replace('className="w-12 h-12 object-contain"', 'className="w-20 h-20 object-contain"');
    // 3rd: Footer screen (should use WHITE logo!)
    c = c.replace('/Logo-03.jpg', '/logo_branco.png')
         .replace('w-10 h-10 rounded-xl overflow-hidden grayscale brightness-200 border border-white/10', 'w-16 h-16 flex justify-center items-center drop-shadow-md')
         .replace('className="w-full h-full object-cover"', 'className="w-full h-full object-contain"');
    return c;
  },
  'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\page.tsx': (content) => {
    // Footer
    return content.replace('/Logo-03.jpg', '/logo_marsala.png')
                  .replace('w-8 h-8 rounded-lg overflow-hidden grayscale brightness-150', 'w-12 h-12 flex justify-center items-center')
                  .replace('className="w-full h-full object-cover"', 'className="w-full h-full object-contain"');
  },
  'c:\\Users\\rodri\\Desktop\\App RSVP site\\Google Gravity\\tmp_app\\src\\app\\components\\shared-layout.tsx': (content) => {
    // Sidebar
    return content.replace('/Logo-03.jpg', '/logo_marsala.png')
                  .replace('w-10 h-10 rounded-xl overflow-hidden border border-brand/10 shadow-sm shrink-0', 'w-12 h-12 shrink-0 flex items-center justify-center')
                  .replace('className="w-full h-full object-cover"', 'className="w-full h-full object-contain"');
  }
};

for (const [filepath, replacer] of Object.entries(filesToUpdate)) {
  if (fs.existsSync(filepath)) {
    const content = fs.readFileSync(filepath, 'utf8');
    const newContent = replacer(content);
    if (content !== newContent) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log(`Updated UI in ${filepath}`);
    } else {
      console.log(`No changes made to ${filepath}`);
    }
  } else {
    console.log(`Not found: ${filepath}`);
  }
}
