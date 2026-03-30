const https = require('https');
const ids = ['1590523277543-a94d2e4eb00b', '1544551763-46a013bb70d5', '1469474968028-56623f02e42e', '1508739773434-c26b3d09e071', '1440342359743-84fcb8c21f21', '1506905925346-21bda4d32df4', '1559827260-dc66d52bef19', '1414235077428-338989a2e8c0', '1535827841776-24afc1e255ac', '1502680390469-be75c86b636f', '1482784160316-6eb046863ece', '1551244072-5d12893278bc', '1419242902214-272b3f66ee7a', '1505118380757-91f5f5632de0', '1531379410502-63bfe8cdaf6f'];
ids.forEach(id => {
  https.get(`https://unsplash.com/photos/${id}`, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const match = body.match(/<title>(.*?)<\/title>/);
      console.log(id, '=>', match ? match[1] : 'No title');
    });
  }).on('error', console.error);
});
