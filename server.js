import { createServer } from 'http';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5173;

// Simple development server that serves the index.html for all routes
// This helps with client-side routing
const server = createServer((req, res) => {
  // Get the path from the request URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Check if the request is for a static file
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    try {
      // Try to serve the static file
      const filePath = resolve(__dirname, 'dist', path.substring(1));
      const content = readFileSync(filePath);
      
      // Set appropriate content type
      const ext = path.split('.').pop();
      const contentType = {
        js: 'application/javascript',
        css: 'text/css',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        ico: 'image/x-icon',
        svg: 'image/svg+xml'
      }[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (e) {
      // If file not found, serve 404
      res.writeHead(404);
      res.end('File not found');
    }
  } else {
    // For all other requests, serve the index.html
    try {
      const content = readFileSync(resolve(__dirname, 'dist', 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch (e) {
      res.writeHead(500);
      res.end('Error loading index.html');
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
