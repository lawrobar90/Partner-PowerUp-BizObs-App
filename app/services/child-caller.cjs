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

function getServicePortFromStep(stepNameOrServiceName) {
  // Accept either a step name or an exact service name; prefer using as-is if it already looks like a Service
  const serviceName = /Service$/.test(String(stepNameOrServiceName))
    ? String(stepNameOrServiceName)
    : getServiceNameFromStep(stepNameOrServiceName);
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

function callService(serviceName, payload, headers = {}, overridePort) {
  return new Promise((resolve, reject) => {
    // Use overridePort if provided, else hash-based mapping
    const port = overridePort || getServicePortFromStep(serviceName) || SERVICE_PORTS[serviceName];
    if (!port) return reject(new Error(`Unknown service: ${serviceName}`));
    
    // Prepare headers with proper Dynatrace trace propagation
    const requestHeaders = { 'Content-Type': 'application/json' };
    
    // Add custom journey headers
    if (payload) {
      if (payload.journeyId) requestHeaders['x-journey-id'] = payload.journeyId;
      if (payload.stepName) requestHeaders['x-journey-step'] = payload.stepName;
      if (payload.domain) requestHeaders['x-customer-segment'] = payload.domain;
      if (payload.correlationId) requestHeaders['x-correlation-id'] = payload.correlationId;
    }
    
    // CRITICAL: Add Dynatrace trace propagation headers
    // Use W3C Trace Context format for proper distributed tracing
    if (payload && payload.traceId && payload.spanId) {
      // W3C traceparent format: version-trace_id-parent_id-trace_flags
      const traceId32 = payload.traceId.replace(/-/g, '').substring(0, 32).padEnd(32, '0');
      const spanId16 = payload.spanId.replace(/-/g, '').substring(0, 16).padEnd(16, '0');
      requestHeaders['traceparent'] = `00-${traceId32}-${spanId16}-01`;
      
      // Also add Dynatrace-specific headers for better compatibility
      requestHeaders['x-dynatrace-trace-id'] = traceId32;
      requestHeaders['x-dynatrace-parent-span-id'] = spanId16;
    }
    
    // Pass through any existing trace headers from incoming request
    if (headers) {
      Object.keys(headers).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'traceparent' || 
            lowerKey === 'tracestate' ||
            lowerKey.startsWith('x-dynatrace') ||
            lowerKey.includes('trace') ||
            lowerKey.includes('span')) {
          requestHeaders[key] = headers[key];
        }
      });
    }
    
    const options = {
      hostname: '127.0.0.1',
      port,
      path: '/process',
      method: 'POST',
      headers: requestHeaders
    };
    
    console.log(`🔗 [${serviceName}] Calling service on port ${port} with Dynatrace headers:`, 
      Object.keys(requestHeaders).filter(k => 
        k.toLowerCase().includes('trace') || 
        k.toLowerCase().includes('span') || 
        k.toLowerCase().includes('dynatrace')
      ));
    
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { 
          const result = body ? JSON.parse(body) : {};
          console.log(`✅ [${serviceName}] Service call completed with trace propagation`);
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
