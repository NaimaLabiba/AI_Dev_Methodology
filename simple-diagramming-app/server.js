const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Parse URL and remove query parameters
    let filePath = req.url.split('?')[0];
    
    // Default to index.html for root path
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Construct full file path
    const fullPath = path.join(__dirname, filePath);
    
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'text/plain';
    
    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>404 Not Found</title></head>
                <body>
                    <h1>404 - File Not Found</h1>
                    <p>The requested file <code>${filePath}</code> was not found.</p>
                    <p><a href="/">Go to Home</a></p>
                </body>
                </html>
            `);
            return;
        }
        
        // Read and serve the file
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head><title>500 Server Error</title></head>
                    <body>
                        <h1>500 - Internal Server Error</h1>
                        <p>Error reading file: ${err.message}</p>
                    </body>
                    </html>
                `);
                return;
            }
            
            // Set headers to prevent caching during development
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            
            res.end(data);
        });
    });
    
    // Log the request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
});

server.listen(PORT, () => {
    console.log('Simple Diagramming App Server');
    console.log(`Serving at http://localhost:${PORT}/`);
    console.log(`Open your browser and go to: http://localhost:${PORT}/index.html`);
    console.log('Press Ctrl+C to stop the server');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use.`);
        console.error('Please stop any other servers running on this port and try again.');
    } else {
        console.error(`Server error: ${err.message}`);
    }
    process.exit(1);
});
