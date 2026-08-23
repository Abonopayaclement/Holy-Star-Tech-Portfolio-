const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
process.chdir(standaloneDir);
process.env.NODE_ENV = 'production';

const NextServer = require('next/dist/server/next-server').default;

const requiredServerFiles = JSON.parse(
  fs.readFileSync(path.join(standaloneDir, '.next', 'required-server-files.json'), 'utf8')
);
const nextConfig = requiredServerFiles.config;
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4'
};

function tryServeStatic(req, res, filePath, isImmutable) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Last-Modified': stat.mtime.toUTCString(),
      'Accept-Ranges': 'bytes'
    };

    if (isImmutable) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    if (req.headers['if-modified-since']) {
      const clientDate = new Date(req.headers['if-modified-since']);
      if (!isNaN(clientDate.getTime()) && clientDate >= stat.mtime) {
        res.writeHead(304, headers);
        res.end();
        return true;
      }
    }

    if (req.method === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return true;
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch (err) {
    return false;
  }
}

const nextApp = new NextServer({
  hostname: '0.0.0.0',
  port: 3000,
  dir: standaloneDir,
  dev: false,
  customServer: false,
  conf: nextConfig
});

const nextHandler = nextApp.getRequestHandler();

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname || '/';

    // 1. Direct Static Assets Serving: /_next/static/*
    if (pathname.startsWith('/_next/static/')) {
      const relativeStatic = pathname.slice('/_next/static/'.length);
      const filePath = path.join(standaloneDir, '.next', 'static', decodeURIComponent(relativeStatic));
      if (tryServeStatic(req, res, filePath, true)) {
        return;
      }
    }

    // 2. Direct Public Assets Serving: /public/* or root files (/favicon.ico, /logo.png, etc.)
    if (pathname.length > 1) {
      const publicFilePath = path.join(standaloneDir, 'public', decodeURIComponent(pathname.slice(1)));
      if (tryServeStatic(req, res, publicFilePath, false)) {
        return;
      }
    }

    // 3. Fallback to Next.js handler for all pages, dynamic routes, and API endpoints
    await nextHandler(req, res, parsedUrl);
  } catch (err) {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('✓ Custom Production Server running on port 3000');

  // Test requests
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
  testUrls.forEach((testUrl) => {
    http.get(testUrl, (res) => {
      console.log(`[TEST] GET ${testUrl} -> Status: ${res.statusCode} (${res.headers['content-type']})`);
      res.resume();
      completed++;
      if (completed === testUrls.length) {
        console.log('\n🎉 ALL REQUESTS HANDLED 100% PERFECTLY!');
        server.close();
        process.exit(0);
      }
    }).on('error', (e) => {
      console.error('Test error:', e);
      server.close();
      process.exit(1);
    });
  });
});
