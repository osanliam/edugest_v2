const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const basePath = __dirname;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Log de requests
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    let filePath = req.url === '/' ? '/instrumentos/registro_calificaciones_v2.html' : req.url;
    filePath = path.join(basePath, filePath);

    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.normalize(basePath))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    try {
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }
        }

        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml'
            };

            const contentType = mimeTypes[ext] || 'application/octet-stream';
            const content = fs.readFileSync(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } else {
            res.writeHead(404);
            res.end('Not Found: ' + filePath);
        }
    } catch (err) {
        console.error('Error:', err.message);
        res.writeHead(500);
        res.end('Internal Server Error');
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ Servidor iniciado:`);
    console.log(`   http://localhost:${PORT}/`);
    console.log(`   http://127.0.0.1:${PORT}/`);
    console.log(`\n📍 Acceso directo:`);
    console.log(`   http://localhost:${PORT}/instrumentos/registro_calificaciones_v2.html`);
    console.log(`\n🛑 Para detener: Ctrl+C\n`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso`);
        process.exit(1);
    }
});
