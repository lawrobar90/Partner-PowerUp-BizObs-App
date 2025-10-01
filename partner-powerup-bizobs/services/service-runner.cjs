/**
 * Generic service runner for Dynatrace Business Observability
 * Creates isolated Node.js processes that Dynatrace can track as separate services
 */
const express = require('express');
const http = require('http');
const crypto = require('crypto');

function createService(serviceName, mountFn) {
  try { 
    // Set process title for Dynatrace service detection
    process.title = serviceName; 
  } catch (_) {
    // Ignore if process title can't be set
  }
  
  const app = express();
  app.use(express.json());
  
  // Enhanced Dynatrace headers middleware
  app.use((req, res, next) => {
    // Dynamic service naming based on stepName from payload
    const payload = req.body || {};
    const stepName = payload.stepName || payload.parentStep || 'Unknown';
    const dynamicServiceName = stepName ? `${stepName}Service` : serviceName;
    
    // Critical headers for Dynatrace service separation
    res.setHeader('X-Dynatrace-Service', dynamicServiceName);
    res.setHeader('X-Dynatrace-Version', '1.0.0');
    res.setHeader('X-Dynatrace-Environment', 'business-observability');
    res.setHeader('X-Service-Instance', `${dynamicServiceName}-${process.pid}`);
    
    // Process identification for Dynatrace
    res.setHeader('X-dynaTrace-PC', dynamicServiceName); // Process Name Component
    res.setHeader('X-dynaTrace-PG', `${dynamicServiceName}-group`); // Process Group
    res.setHeader('dt-logicalServiceName', dynamicServiceName); // Logical Service Name
    
    // Add correlation ID
    req.correlationId = crypto.randomBytes(8).toString('hex');
    req.serviceName = serviceName;
    
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: serviceName,
      pid: process.pid,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  });

  // Mount service-specific routes
  mountFn(app);

  const server = http.createServer(app);
  const port = process.env.PORT || 0; // Dynamic port assignment
  
  server.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === 'string' ? address : address.port;
    console.log(`[${serviceName}] Service running on port ${actualPort} with PID ${process.pid}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log(`[${serviceName}] Received SIGTERM, shutting down...`);
    server.close(() => {
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log(`[${serviceName}] Received SIGINT, shutting down...`);
    server.close(() => {
      process.exit(0);
    });
  });
}

module.exports = { createService };