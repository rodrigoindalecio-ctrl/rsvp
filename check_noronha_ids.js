const https = require('https');
const ids = [
  'photo-1544257121-7290ec591b5b',
  'photo-1544551763-46a013bb70d5',
  'photo-1582967788606-a171c1080cb0',
  'photo-1572949645841-094f3a9c4c94',
  'photo-1514362545857-3bc16c4c7d1b',
  'photo-1499793983690-e29da59ef1c2',
  'photo-1502680390469-be75c86b636f',
  'photo-1527661593950-058238cecb0f',
  'photo-1534008897995-27a23e859048',
  'photo-1513558161293-cdaf765ed2fd',
  'photo-1419242902214-272b3f66ee7a'
];
ids.forEach(id => {
  https.request(`https://images.unsplash.com/${id}?w=100`, {method: 'HEAD'}, res => {
    console.log(id, res.statusCode);
  }).end();
});
