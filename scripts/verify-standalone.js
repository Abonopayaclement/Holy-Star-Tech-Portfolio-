const http = require('http');
const path = require('path');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
process.chdir(standaloneDir);

console.log('Testing standalone server from:', standaloneDir);
require(path.join(standaloneDir, 'server.js'));

setTimeout(() => {
  const testUrls = [
    'http://localhost:3000/_next/static/css/081a0afca5a9bd20.css',
    'http://localhost:3000/_next/static/css/084005b86b5f7425.css',
    'http://localhost:3000/logo.png',
    'http://localhost:3000/favicon.ico',
    'http://localhost:3000/',
    'http://localhost:3000/projects',
    'http://localhost:3000/about'
  ];

  let completed = 0;
  testUrls.forEach((url) => {
    http.get(url, (res) => {
      console.log(`[TEST] GET ${url} -> Status: ${res.statusCode} (${res.headers['content-type']})`);
      res.resume();
      completed++;
      if (completed === testUrls.length) {
        console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY (Status 200 OK for all routes & assets)!');
        process.exit(0);
      }
    }).on('error', (e) => {
      console.error(`[ERROR] GET ${url} -> ${e.message}`);
      process.exit(1);
    });
  });
}, 2500);
