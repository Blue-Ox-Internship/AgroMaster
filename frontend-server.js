const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.FRONTEND_PORT || 8000;
const backendPort = process.env.BACKEND_PORT || 5000;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Proxy API requests to the backend server
  if (req.url.startsWith('/api/')) {
    const options = {
      hostname: 'localhost',
      port: backendPort,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${backendPort}` }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'Backend server not running on port ' + backendPort }));
    });

    req.pipe(proxyReq);
    return;
  }

  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = path.normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500);
      res.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }

    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(port, () => {
  console.log(`AgroDrop frontend running at http://localhost:${port}`);
  console.log(`API requests proxied to http://localhost:${backendPort}/api`);
});
