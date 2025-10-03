const http = require('http');
const crypto = require('crypto');

const SERVICE_PORTS = {
  'discovery-service': 4101,
  'awareness-service': 4102,
  'consideration-service': 4103,
  'purchase-service': 4104,
  'retention-service': 4105,
  'advocacy-service': 4106
};

function getServiceNameFromStep(stepName) {
  // Normalize: preserve CamelCase (ProductDiscovery -> ProductDiscoveryService) and handle spaces/underscores/hyphens
  if (!stepName) return null;
  if (/Service$/.test(String(stepName))) return String(stepName);
  const cleaned = String(stepName).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
  const spaced = cleaned
    .replace(/[\-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  const serviceBase = spaced
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  const serviceName = `${serviceBase}Service`;
  console.log(`[child-caller] Converting step "${stepName}" to service "${serviceName}"`);
  return serviceName;
}

function getServicePortFromStep(stepName) {
  // Convert stepName to serviceName first
  const serviceName = getServiceNameFromStep(stepName);
  if (!serviceName) return null;
  
  // Create a consistent hash-based port allocation (same as eventService)
  let hash = 0;
  for (let i = 0; i < serviceName.length; i++) {
    const char = serviceName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Map to port range 4101-4199
  const port = 4101 + (Math.abs(hash) % 99);
  console.log(`[child-caller] Service "${serviceName}" mapped to port ${port}`);
  return port;
}

function callService(serviceName, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    // Get port using the service name directly (it should already be in ServiceName format)
    const port = getServicePortFromStep(serviceName.replace('Service', '')) || SERVICE_PORTS[serviceName];
    if (!port) return reject(new Error(`Unknown service: ${serviceName}`));
    
    // Prepare headers with complete Dynatrace trace propagation
    const requestHeaders = {
      'Content-Type': 'application/json',
      // Forward all incoming tracing headers first
      ...headers
    };
    
    // Only create new traceparent if none exists (preserve existing trace context)
    if (!requestHeaders.traceparent && !requestHeaders['x-dynatrace']) {
      const traceId = crypto.randomBytes(16).toString('hex');
      const spanId = crypto.randomBytes(8).toString('hex');
      requestHeaders.traceparent = `00-${traceId}-${spanId}-01`;
    }
    
    // Add custom journey tracking headers for Dynatrace (only if not already present)
    if (payload) {
      if (payload.journeyId && !requestHeaders['x-journey-id']) {
        requestHeaders['x-journey-id'] = payload.journeyId;
      }
      if (payload.stepName && !requestHeaders['x-journey-step']) {
        requestHeaders['x-journey-step'] = payload.stepName;
      }
      if (payload.domain && !requestHeaders['x-customer-segment']) {
        requestHeaders['x-customer-segment'] = payload.domain;
      }
      if (payload.correlationId && !requestHeaders['x-correlation-id']) {
        requestHeaders['x-correlation-id'] = payload.correlationId;
      }
    }
    
    const options = {
      hostname: '127.0.0.1',
      port,
      path: '/process',
      method: 'POST',
      headers: requestHeaders
    };
    
  console.log(`🔗 [${serviceName}] Calling service on port ${port} with trace headers:`, Object.keys(requestHeaders).filter(h => h.startsWith('x-') || h === 'traceparent'));
    
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { 
          const result = body ? JSON.parse(body) : {};
          console.log(`✅ [${serviceName}] Service call completed successfully`);
          resolve(result); 
        } catch (e) { 
          console.error(`❌ [${serviceName}] Failed to parse response:`, e.message);
          reject(e); 
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ [${serviceName}] Service call failed:`, err.message);
      reject(err);
    });
    
    req.end(JSON.stringify(payload || {}));
  });
}

module.exports = { SERVICE_PORTS, getServiceNameFromStep, getServicePortFromStep, callService };
