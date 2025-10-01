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
  'Step1Service': 4101,
  'Step2Service': 4102,
  'Step3Service': 4103,
  'Step4Service': 4104,
  'Step5Service': 4105,
  'Step6Service': 4106
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

// Middleware
app.use(cors());
app.use(compression());
// Request logging for easier debugging
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Frontend host label (avoid showing raw 'localhost')
function hostToLabel(host) {
  if (!host) return 'Unknown Host';
  if (process.env.APP_DOMAIN_LABEL) return process.env.APP_DOMAIN_LABEL;
  if (host.includes('localhost') || host.startsWith('127.')) return 'Local Dev';
  return host;
}

// Attach helpful request context
app.use((req, res, next) => {
  const cid = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = cid;
  res.setHeader('x-correlation-id', cid);

  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  req.frontendHostLabel = hostToLabel(host);
  res.setHeader('X-App-Domain-Label', req.frontendHostLabel);

  // Expose Socket.IO on request for route handlers
  req.io = io;
  next();
});

// Enhanced event service for separate process communication
const eventService = {
  async emitEvent(eventType, data) {
    try {
      const { stepName, substeps } = data;
      const correlationId = data.correlationId || uuidv4();
      
      console.log(`📊 Processing ${eventType} for step: ${stepName}`);
      
      if (substeps && substeps.length > 0) {
        // Process each substep through its dedicated service
        const results = [];
        
        for (const substep of substeps) {
          const serviceName = this.getServiceNameFromStep(substep.stepName);
          
          if (SERVICE_PORTS[serviceName]) {
            try {
              // Start the service if it's not running
              startChildService(serviceName, path.join('services', `${serviceName}.cjs`));
              
              // Wait a moment for service to be ready
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Call the dedicated service
              const payload = {
                ...substep,
                correlationId,
                parentStep: stepName,
                timestamp: new Date().toISOString()
              };
              
              const result = await callChildService(serviceName, payload);
              results.push(result);
              
              console.log(`✅ ${serviceName} processed successfully`);
            } catch (error) {
              console.error(`❌ Error processing ${serviceName}:`, error.message);
              results.push({
                stepName: substep.stepName,
                service: serviceName,
                status: 'error',
                error: error.message,
                correlationId
              });
            }
          }
        }
        
        // Emit results to connected clients
        io.emit('simulation_result', {
          correlationId,
          eventType,
          stepName,
          results,
          timestamp: new Date().toISOString()
        });
        
        return { success: true, correlationId, results };
      }
      
      return { success: true, correlationId, message: 'No substeps to process' };
    } catch (error) {
      console.error('Event emission error:', error);
      return { success: false, error: error.message };
    }
  },
  
  getServiceNameFromStep(stepName) {
    const stepToService = {
      'Discovery': 'discovery-service',
      'Awareness': 'awareness-service', 
      'Consideration': 'consideration-service',
      'Purchase': 'purchase-service',
      'Retention': 'retention-service',
      'Advocacy': 'advocacy-service'
    };
    
    return stepToService[stepName] || 'discovery-service';
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/journey', journeyRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/steps', stepsRouter);
app.use('/api/flow', flowRouter);
app.use('/api/service-proxy', serviceProxyRouter);

// Health check with service status
app.get('/api/health', (req, res) => {
  const serviceStatuses = Object.keys(SERVICE_PORTS).map(serviceName => ({
    service: serviceName,
    port: SERVICE_PORTS[serviceName],
    running: !!childServices[serviceName],
    pid: childServices[serviceName]?.pid || null
  }));
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mainProcess: {
      pid: process.pid,
      uptime: process.uptime(),
      port: PORT
    },
    childServices: serviceStatuses
  });
});

// Expose event service for routes
app.locals.eventService = eventService;

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start the server and initialize child services
server.listen(PORT, () => {
  console.log(`🚀 Business Observability Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  // Expose port to routes for internal HTTP calls
  app.locals.port = PORT;
  
  // Pre-start all child services for better performance
  console.log('🔧 Starting child services...');
  Object.keys(SERVICE_PORTS).forEach(serviceName => {
    const fileName = serviceName.toLowerCase().replace('service', '-service');
    startChildService(serviceName, path.join('services', `${fileName}.cjs`));
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  
  // Close child services
  Object.values(childServices).forEach(child => {
    child.kill('SIGTERM');
  });
  
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  
  // Close child services
  Object.values(childServices).forEach(child => {
    child.kill('SIGTERM');
  });
  
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

export default app;