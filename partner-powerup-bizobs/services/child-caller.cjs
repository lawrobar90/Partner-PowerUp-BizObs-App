const http = require('http');

const SERVICE_PORTS = {
  'discovery-service': 4101,
  'awareness-service': 4102,
  'consideration-service': 4103,
  'purchase-service': 4104,
  'retention-service': 4105,
  'advocacy-service': 4106
};

function getServiceNameFromStep(stepName) {
  // Dynamic mapping: any stepName maps to corresponding service
  // Discovery -> discovery-service, Exploration -> exploration-service, etc.
  if (!stepName) return null;
  const normalizedStep = String(stepName).toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalizedStep}-service`;
}

function getServicePortFromStep(stepName) {
  // Generate port numbers dynamically based on step index
  const stepMap = {
    'discovery': 4101, 'exploration': 4102, 'selection': 4103,
    'checkoutprocess': 4104, 'checkout': 4104, 'confirmation': 4105, 
    'postpurchase': 4106, 'awareness': 4102, 'consideration': 4103,
    'purchase': 4104, 'retention': 4105, 'advocacy': 4106
  };
  const normalizedStep = String(stepName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return stepMap[normalizedStep] || (4100 + (normalizedStep.charCodeAt(0) % 6) + 1);
}

function callService(serviceName, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    // Extract stepName from serviceName and get port dynamically
    const stepName = serviceName.replace('-service', '');
    const port = getServicePortFromStep(stepName) || SERVICE_PORTS[serviceName];
    if (!port) return reject(new Error(`Unknown service: ${serviceName}`));
    const options = {
      hostname: '127.0.0.1',
      port,
      path: '/process',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end(JSON.stringify(payload || {}));
  });
}

module.exports = { SERVICE_PORTS, getServiceNameFromStep, getServicePortFromStep, callService };
