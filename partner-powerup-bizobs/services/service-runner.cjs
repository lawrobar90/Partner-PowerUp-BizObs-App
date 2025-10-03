/**
 * Generic service runner for Dynatrace Business Observability
 * Isolated Node.js processes that Dynatrace can track as separate services
 */
const express = require('express');
const http = require('http');
const crypto = require('crypto');

// Extract company context from environment (exact field names for Dynatrace filtering)
const companyName = process.env.COMPANY_NAME || 'DefaultCompany';
const domain = process.env.DOMAIN || 'default.com';
const industryType = process.env.INDUSTRY_TYPE || 'general';
const stepNameEnv = process.env.STEP_NAME || 'UnknownStep';

function createService(serviceName, mountFn) {
  // CRITICAL: Set process identity for Dynatrace detection immediately
  try { 
    // Set process title - this is what Dynatrace sees as the service name
    process.title = serviceName; 
    
    // Set environment variables for Dynatrace service detection
    process.env.DT_APPLICATION_ID = serviceName;
    process.env.DT_SERVICE_NAME = serviceName;
    process.env.DYNATRACE_SERVICE_NAME = serviceName;
    process.env.DT_LOGICAL_SERVICE_NAME = serviceName;
    
    // CRITICAL: Set process argv[0] to help with service detection
    // This changes what 'ps' shows as the command name
    if (process.argv && process.argv.length > 0) {
      process.argv[0] = serviceName;
    }
    
    console.log(`[service-runner] Service identity set to: ${serviceName} (PID: ${process.pid})`);
  } catch (e) {
    console.error(`[service-runner] Failed to set service identity: ${e.message}`);
  }
  
  const app = express();
  app.use((req, res, next) => {
    // Capture inbound W3C Trace Context and custom correlation
    const inboundTraceparent = req.headers['traceparent'];
    const inboundTracestate = req.headers['tracestate'];
    const inboundCorrelation = req.headers['x-correlation-id'];
    const payload = req.body || {};
    // Always use the actual service name for Dynatrace tracing
    const dynatraceServiceName = process.env.SERVICE_NAME || serviceName;
    const stepName = payload.stepName || process.env.STEP_NAME || serviceName.replace('Service', '').replace('-service', '');

    // Critical headers for Dynatrace service separation
    res.setHeader('X-Dynatrace-Service', dynatraceServiceName);
    res.setHeader('X-Dynatrace-Version', '1.0.0');
    res.setHeader('X-Dynatrace-Environment', 'business-observability');
    res.setHeader('X-Service-Instance', `${dynatraceServiceName}-${process.pid}`);

    // Process identification for Dynatrace PurePath
    res.setHeader('X-dynaTrace-PC', dynatraceServiceName); // Process Name Component
    res.setHeader('X-dynaTrace-PG', `${dynatraceServiceName}-group`); // Process Group
    res.setHeader('dt-logicalServiceName', dynatraceServiceName); // Logical Service Name
    res.setHeader('service.name', dynatraceServiceName); // OpenTelemetry compatible
    res.setHeader('dt.service.name', dynatraceServiceName); // Additional Dynatrace header
    res.setHeader('X-Service-Name', dynatraceServiceName); // Standard service name header

    // Set custom attributes for better service identification
    res.setHeader('dt.custom.service_type', 'business_journey_step');
    res.setHeader('dt.custom.journey_step', stepName);

    // Custom journey tracking headers
    if (payload.journeyId) {
      res.setHeader('x-journey-id', payload.journeyId);
    }
    if (stepName) {
      res.setHeader('x-journey-step', stepName);
    }
    if (payload.domain) {
      res.setHeader('x-customer-segment', payload.domain);
    }

    // Add/propagate correlation ID
    req.correlationId = inboundCorrelation || crypto.randomBytes(8).toString('hex');
    req.dynatraceHeaders = {};
    if (inboundTraceparent) req.dynatraceHeaders.traceparent = inboundTraceparent;
    if (inboundTracestate) req.dynatraceHeaders.tracestate = inboundTracestate;
    req.serviceName = dynatraceServiceName; // Use the actual service name

    // Log service identification for debugging
    console.log(`[${dynatraceServiceName}] Service identified with PID ${process.pid}, handling ${req.method} ${req.path}`);

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