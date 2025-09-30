// Generic service runner that mounts only its own routes
const express = require('express');
const http = require('http');

function createService(name, mountFn) {
  try { process.title = name; } catch (_) {}
  const app = express();
  app.use(express.json());

  // Basic health
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: name }));

  // Mount service-specific routes
  mountFn(app);

  const server = http.createServer(app);
  const port = process.env.PORT || 0; // dynamic by default
  server.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === 'string' ? address : address.port;
    console.log(`[${name}] listening on port ${actualPort}`);
  });
}

module.exports = { createService };
