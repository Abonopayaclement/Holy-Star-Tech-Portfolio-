const fs = require('fs');

if (fs.existsSync('.env')) {
  const content = fs.readFileSync('.env', 'utf8');
  const lines = content.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      const raw = trimmed.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
      try {
        const u = new URL(raw.replace('mysql://', 'http://'));
        console.log('--- LOCAL DATABASE_URL STRUCTURE ---');
        console.log('Username:', u.username);
        console.log('Has Password:', Boolean(u.password));
        console.log('Password length:', u.password ? u.password.length : 0);
        console.log('Host in .env:', u.hostname);
        console.log('Port in .env:', u.port || '3306');
        console.log('Database Name in .env:', u.pathname.replace(/^\//, ''));
        console.log('Query Params in .env:', u.search);
      } catch (err) {
        console.log('Error parsing DATABASE_URL:', err.message);
      }
    }
  });
}
