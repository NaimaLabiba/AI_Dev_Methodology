#!/usr/bin/env python3
"""
Simple HTTP server for the diagramming interface.
This resolves CORS issues when loading local files.
"""

import http.server
import socketserver
import os
import sys

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"Server running at http://localhost:{PORT}/")
            print("Press Ctrl+C to stop the server")
            print("\nOpen your browser and go to:")
            print(f"http://localhost:{PORT}/index.html")
            print("\nThis will allow the methodology viewer to load properly!")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except OSError as e:
        if e.errno == 10048:  # Port already in use on Windows
            print(f"Port {PORT} is already in use. Try a different port or stop the existing server.")
        else:
            print(f"Error starting server: {e}")
        sys.exit(1)
