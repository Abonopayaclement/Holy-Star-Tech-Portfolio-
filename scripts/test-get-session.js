const http = require('http');

async function testGetSession() {
  console.log('Testing GET http://localhost:3000/api/auth/get-session ...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/get-session',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Origin': 'http://localhost:3000',
      'Referer': 'http://localhost:3000/private'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    console.log('Status code:', res.statusCode);
    console.log('Headers:', res.headers);
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response body:', data);
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.setTimeout(5000, () => {
    console.error('Request TIMED OUT after 5s!');
    req.destroy();
  });

  req.end();
}

testGetSession();
