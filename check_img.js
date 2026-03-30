const https = require('https');
const ids = [
  'photo-1418985991508-e47386d96a71', // snowboard/ski?
  'photo-1542990253-0d0f5be5f0ed', // hot chocolate?
  'photo-1549448107-160bf0cc473e', 
  'photo-1550547660-d9450f859349',
  'photo-1481070555726-e2fe8357725c',
  'photo-1582196016295-f8c8bd4b3a99',
  'photo-1484723091792-c195640306c4',
  'photo-1541592102781-6bf733e04688',
  'photo-1522906456132-bb443a0172cd'
];

ids.forEach(id => {
  https.request(`https://images.unsplash.com/${id}?w=100`, {method: 'HEAD'}, res => {
    console.log(id, res.statusCode);
  }).end();
});
