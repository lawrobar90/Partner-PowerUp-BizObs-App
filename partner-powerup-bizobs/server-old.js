/**
 * Dynatrace Partner Power-Up: Business Observability Server
 * Enhanced with separate child processes for proper service splitting in Dynatrace
 */

import express from 'express';
import http from 'http';
import { spawn } from 'child_process';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import journeyRouter from './routes/journey.js';
import simulateRouter from './routes/simulate.js';
import metricsRouter from './routes/metrics.js';
import stepsRouter from './routes/steps.js';
import flowRouter from './routes/flow.js';
import serviceProxyRouter from './routes/serviceProxy.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Configuration
const PORT = process.env.PORT || 4000;

// Child service management for separate processes (like vegas-casino approach)
const childServices = {};
const SERVICE_PORTS = {
  'discovery-service': 4101,
  'awareness-service': 4102,
  'consideration-service': 4103,
  'purchase-service': 4104,
  'retention-service': 4105,
  'advocacy-service': 4106
};

// Start child service process
function startChildService(serviceName, scriptPath, env = {}) {
  if (childServices[serviceName]) return childServices[serviceName];
  
  console.log(`🚀 Starting child service: ${serviceName} on port ${SERVICE_PORTS[serviceName]}`);
  
  const child = spawn('node', [scriptPath], {
    cwd: __dirname,
    env: { 
      ...process.env, 
      PORT: String(SERVICE_PORTS[serviceName]), 
      SERVICE_NAME: serviceName,
      NODE_ENV: 'production',
      ...env 
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  child.stdout.on('data', d => console.log(`[${serviceName}] ${d.toString().trim()}`));
  child.stderr.on('data', d => console.error(`[${serviceName}][ERR] ${d.toString().trim()}`));
  child.on('exit', code => {
    console.log(`[${serviceName}] exited with code ${code}`);
    delete childServices[serviceName];
  });
  
  childServices[serviceName] = child;
  return child;
}

// Proxy requests to child services
function proxyToChildService(targetPort, req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: '/process',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const proxyReq = http.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', err => {
    console.error(`Proxy error for port ${targetPort}:`, err);
    res.status(502).json({ error: 'Service unavailable', details: err.message });
  });
  
  if (req.body && Object.keys(req.body).length) {
    proxyReq.end(JSON.stringify(req.body));
  } else {
    proxyReq.end('{}');
  }
}

// Helper to call child service and get JSON response
function callChildService(serviceName, payload) {
  return new Promise((resolve, reject) => {
    const targetPort = SERVICE_PORTS[serviceName];
    const options = {
      hostname: '127.0.0.1',
      port: targetPort,
      path: '/process',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve(json);
        } catch (e) {
          reject(new Error(`Invalid JSON from ${serviceName}: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end(JSON.stringify(payload || {}));
  });
}
  
  next();
});

function extractStepFromPath(path) {
  if (path.includes('step1')) return 'discovery';
  if (path.includes('step2')) return 'exploration'; 
  if (path.includes('step3')) return 'selection';
  if (path.includes('step4')) return 'checkout';
  if (path.includes('step5')) return 'confirmation';
  if (path.includes('step6')) return 'postpurchase';
  return null;
}

function getServiceType(stepName) {
  if (!stepName) return 'application';
  const step = stepName.toLowerCase();
  if (step.includes('discovery')) return 'frontend';
  if (step.includes('checkout') || step.includes('payment')) return 'payment';
  if (step.includes('confirmation') || step.includes('postpurchase')) return 'notification';
  return 'application';
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Frontend host label (avoid showing raw 'localhost')
function hostToLabel(host) {
  if (!host) return 'Unknown Host';
  if (process.env.APP_DOMAIN_LABEL) return process.env.APP_DOMAIN_LABEL;
  if (host.includes('localhost') || host.startsWith('127.')) return 'Local Dev';
  return host;
}
app.use((req, res, next) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  req.frontendHostLabel = hostToLabel(host);
  res.setHeader('X-App-Domain-Label', req.frontendHostLabel);
  next();
});

// Serve static
app.use(express.static(path.join(__dirname, 'public')));

// Correlation ID middleware
app.use((req, res, next) => {
  const cid = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = cid;
  res.setHeader('x-correlation-id', cid);
  next();
});

// Socket.IO real-time metrics overlay
io.on('connection', (socket) => {
  socket.emit('metrics:init', { onlineUsers: io.engine.clientsCount, ts: Date.now() });
});

// Attach io to request for broadcasting from routes/services
app.use((req, res, next) => { req.io = io; next(); });

// Routes
app.use('/api', journeyRouter);
app.use('/api', simulateRouter);
app.use('/api', metricsRouter);
app.use('/api', stepsRouter);
app.use('/api', flowRouter);

// Service proxy routes for distributed tracing (temporarily disabled for testing)
// app.use('/', serviceProxyRouter);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Partner PowerUp BizObs running on http://0.0.0.0:${PORT}`);
});
