const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 4003;

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
    '.ico': 'image/x-icon',
    '.md': 'text/markdown'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html for root path
    if (pathname === '/') {
        pathname = '/bdd-interface.html';
    }
    
    // Construct file path
    const filePath = path.join(__dirname, pathname);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - File Not Found</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #f44336; }
                        p { color: #666; }
                        a { color: #2196f3; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <h1>404 - File Not Found</h1>
                    <p>The requested file <code>${pathname}</code> was not found.</p>
                    <p><a href="/">Go to BDD Diagramming Interface</a></p>
                </body>
                </html>
            `);
            return;
        }
        
        // Get file extension and MIME type
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - Internal Server Error</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #f44336; }
                            p { color: #666; }
                            a { color: #2196f3; text-decoration: none; }
                            a:hover { text-decoration: underline; }
                        </style>
                    </head>
                    <body>
                        <h1>500 - Internal Server Error</h1>
                        <p>Error reading file: ${err.message}</p>
                        <p><a href="/">Go to BDD Diagramming Interface</a></p>
                    </body>
                    </html>
                `);
                return;
            }
            
            // Set appropriate headers
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(data);
        });
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`🟢 BDD Diagramming Interface Server running at:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   http://127.0.0.1:${PORT}`);
    console.log('');
    console.log('📋 Features Available:');
    console.log('   • BDD Methodology Header (Fixed Top-Right)');
    console.log('   • Flow & Sequence Diagram Support');
    console.log('   • Markdown Import/Export');
    console.log('   • Business Outcomes Visualization');
    console.log('   • Interactive Canvas with Pan/Zoom');
    console.log('   • Shape Creation & Connection Tools');
    console.log('   • Properties Panel & Layers');
    console.log('');
    console.log('🎯 Press Ctrl+C to stop the server');
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down BDD Diagramming Interface Server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
