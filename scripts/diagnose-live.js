const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== DIAGNOSING LIVE PRODUCTION URL: https://holystartech.me/ ===');
  try {
    const home = await fetchUrl('https://holystartech.me/');
    console.log('Home Status:', home.statusCode);
    console.log('Home Server Header:', home.headers['server'] || home.headers['x-powered-by']);
    console.log('All Headers:', home.headers);

    const cssMatches = home.body.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) || [];
    console.log('\nFound CSS Links:', cssMatches);

    const jsMatches = home.body.match(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
    console.log('\nFound Script Links:', jsMatches.slice(0, 5));

    for (const link of cssMatches) {
      const match = link.match(/href=["']([^"']+)["']/i);
      if (match) {
        const fullUrl = match[1].startsWith('http') ? match[1] : 'https://holystartech.me' + match[1];
        const cssRes = await fetchUrl(fullUrl);
        console.log(`\nCSS Request: ${fullUrl}`);
        console.log(`Status: ${cssRes.statusCode}`);
        console.log(`Content-Type: ${cssRes.headers['content-type']}`);
        console.log(`Body preview (first 200 chars): ${cssRes.body.slice(0, 200)}`);
      }
    }

    if (jsMatches.length > 0) {
      const firstJs = jsMatches[0].match(/src=["']([^"']+)["']/i)[1];
      const fullJsUrl = firstJs.startsWith('http') ? firstJs : 'https://holystartech.me' + firstJs;
      const jsRes = await fetchUrl(fullJsUrl);
      console.log(`\nJS Chunk Request: ${fullJsUrl}`);
      console.log(`Status: ${jsRes.statusCode}`);
      console.log(`Content-Type: ${jsRes.headers['content-type']}`);
    }

  } catch (err) {
    console.error('Diagnostic error:', err);
  }
}

run();
