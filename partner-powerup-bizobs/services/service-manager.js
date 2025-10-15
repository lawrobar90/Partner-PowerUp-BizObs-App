import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track running child services and their context
const childServices = {};
const childServiceMeta = {};
const portAllocations = new Map(); // Track port usage to prevent conflicts

// Check if a service port is ready to accept connections
export async function isServiceReady(port, timeout = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    
    function checkPort() {
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/health',
        method: 'GET',
        timeout: 1000
      }, (res) => {
        resolve(true);
      });
      
      req.on('error', () => {
        if (Date.now() - start < timeout) {
          setTimeout(checkPort, 200);
        } else {
          resolve(false);
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        if (Date.now() - start < timeout) {
          setTimeout(checkPort, 200);
        } else {
          resolve(false);
        }
      });
      
      req.end();
    }
    
    checkPort();
  });
}

// Convert step name to service format with enhanced dynamic generation
export function getServiceNameFromStep(stepName, context = {}) {
  if (!stepName) return null;
  
  // If already a proper service name, keep it
  if (/Service$|API$|Processor$|Manager$|Gateway$/.test(String(stepName))) {
    return String(stepName);
  }
  
  // Extract context information for more intelligent naming
  const description = context.description || '';
  const category = context.category || context.type || '';
  
  // Determine service suffix based on context
  let serviceSuffix = 'Service'; // default
  
  if (description.toLowerCase().includes('api') || context.endpoint) {
    serviceSuffix = 'API';
  } else if (description.toLowerCase().includes('process') || description.toLowerCase().includes('handle')) {
    serviceSuffix = 'Processor';
  } else if (description.toLowerCase().includes('manage') || description.toLowerCase().includes('control')) {
    serviceSuffix = 'Manager';
  } else if (description.toLowerCase().includes('gateway') || description.toLowerCase().includes('proxy')) {
    serviceSuffix = 'Gateway';
  } else if (category && !category.toLowerCase().includes('step')) {
    // Use category as suffix if it's meaningful
    serviceSuffix = category.charAt(0).toUpperCase() + category.slice(1) + 'Service';
  }
  
  // Normalize: handle spaces, underscores, hyphens, and existing CamelCase
  const cleaned = String(stepName).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
  // Insert spaces between camelCase boundaries to preserve capitalization
  const spaced = cleaned
    // Replace underscores/hyphens with space
    .replace(/[\-_]+/g, ' ')
    // Split CamelCase: FooBar -> Foo Bar
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  const serviceBase = spaced
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  
  const serviceName = `${serviceBase}${serviceSuffix}`;
  console.log(`[service-manager] Converting step "${stepName}" to dynamic service "${serviceName}" (context: ${JSON.stringify(context)})`);
  return serviceName;
}

// Get port for service using consistent hash-based allocation
export function getServicePort(stepName) {
  const serviceName = getServiceNameFromStep(stepName);
  if (!serviceName) return null;
  
  // Check if service already has a port allocated
  if (portAllocations.has(serviceName)) {
    const existingPort = portAllocations.get(serviceName);
    console.log(`[service-manager] Service "${serviceName}" already allocated to port ${existingPort}`);
    return existingPort;
  }
  
  // Create a consistent hash-based port allocation
  let hash = 0;
  for (let i = 0; i < serviceName.length; i++) {
    const char = serviceName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Map to port range 4101-4199, but ensure it's not already taken
  let port = 4101 + (Math.abs(hash) % 99);
  let attempts = 0;
  const maxAttempts = 99;
  
  // Find an available port
  while (attempts < maxAttempts) {
    const portInUse = Array.from(portAllocations.values()).includes(port);
    if (!portInUse) {
      portAllocations.set(serviceName, port);
      console.log(`[service-manager] Service "${serviceName}" mapped to port ${port}`);
      return port;
    }
    // Try next port in range
    port = 4101 + ((Math.abs(hash) + attempts + 1) % 99);
    attempts++;
  }
  
  // Fallback to any available port in range
  for (let p = 4101; p <= 4199; p++) {
    if (!Array.from(portAllocations.values()).includes(p)) {
      portAllocations.set(serviceName, p);
      console.log(`[service-manager] Service "${serviceName}" mapped to fallback port ${p}`);
      return p;
    }
  }
  
  console.error(`[service-manager] No available ports for service "${serviceName}"`);
  return null;
}

// Start child service process
export function startChildService(serviceName, scriptPath, env = {}) {
  // Use the original step name from env, not derived from service name
  const stepName = env.STEP_NAME;
  if (!stepName) {
    console.error(`[service-manager] No STEP_NAME provided for service ${serviceName}`);
    return null;
  }
  
  // Extract company context for tagging
  const companyName = env.COMPANY_NAME || 'DefaultCompany';
  const domain = env.DOMAIN || 'default.com';
  const industryType = env.INDUSTRY_TYPE || 'general';
  
  const port = getServicePort(stepName);
  console.log(`🚀 Starting child service: ${serviceName} on port ${port} for company: ${companyName} (domain: ${domain}, industry: ${industryType})`);
  
  const child = spawn('node', [scriptPath, '--service-name', serviceName], {
    env: { 
      ...process.env, 
      SERVICE_NAME: serviceName, 
      PORT: port,
      MAIN_SERVER_PORT: process.env.PORT || '4000',
      // Core company context for Dynatrace filtering
      COMPANY_NAME: companyName,
      DOMAIN: domain, 
      INDUSTRY_TYPE: industryType,
      // Plain env vars often captured by Dynatrace as [Environment] tags
      company: companyName,
      COMPANY: companyName,
      app: 'BizObs-CustomerJourney',
      APP: 'BizObs-CustomerJourney',
      service: serviceName,
      SERVICE: serviceName,
      // Dynatrace service identification
      DT_SERVICE_NAME: serviceName,
      DYNATRACE_SERVICE_NAME: serviceName,
      DT_LOGICAL_SERVICE_NAME: serviceName,
      // Process group identification
      DT_PROCESS_GROUP_NAME: serviceName,
      DT_PROCESS_GROUP_INSTANCE: `${serviceName}-${port}`,
      // Application context
      DT_APPLICATION_NAME: 'BizObs-CustomerJourney',
      DT_CLUSTER_ID: serviceName,
      DT_NODE_ID: `${serviceName}-node`,
      // Dynatrace tags - space separated for proper tag parsing
      DT_TAGS: `company=${companyName} app=BizObs-CustomerJourney service=${serviceName}`,
      // Optional custom props (many environments ignore these; kept for completeness)
      DT_CUSTOM_PROP: `company=${companyName};app=BizObs-CustomerJourney;service=${serviceName};domain=${domain};industryType=${industryType};service_type=customer_journey_step`,
      ...env 
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  child.stdout.on('data', d => console.log(`[${serviceName}] ${d.toString().trim()}`));
  child.stderr.on('data', d => console.error(`[${serviceName}][ERR] ${d.toString().trim()}`));
  child.on('exit', code => {
    console.log(`[${serviceName}] exited with code ${code}`);
    delete childServices[serviceName];
    delete childServiceMeta[serviceName];
    // Free up the port allocation
    if (portAllocations.has(serviceName)) {
      console.log(`[service-manager] Freeing port for service ${serviceName}`);
      portAllocations.delete(serviceName);
    }
  });
  
  // Track startup time and metadata
  child.startTime = new Date().toISOString();
  childServices[serviceName] = child;
  // Record metadata for future context checks
  childServiceMeta[serviceName] = { 
    companyName, 
    domain, 
    industryType, 
    startTime: child.startTime,
    port 
  };
  return child;
}

// Function to start services dynamically based on journey steps
export async function ensureServiceRunning(stepName, companyContext = {}) {
  console.log(`[service-manager] ensureServiceRunning called for step: ${stepName}`);
  
  // Use exact serviceName from payload if provided, otherwise auto-generate with context
  const stepContext = {
    description: companyContext.description || '',
    category: companyContext.category || companyContext.type || '',
    endpoint: companyContext.endpoint
  };
  
  const serviceName = companyContext.serviceName || getServiceNameFromStep(stepName, stepContext);
  console.log(`[service-manager] Dynamic service name: ${serviceName}`);
  
  // Extract company context with defaults
  const companyName = companyContext.companyName || 'DefaultCompany';
  const domain = companyContext.domain || 'default.com';
  const industryType = companyContext.industryType || 'general';
  const stepEnvName = companyContext.stepName || stepName;
  
  const desiredMeta = {
    companyName,
    domain,
    industryType
  };

  const existing = childServices[serviceName];
  const existingMeta = childServiceMeta[serviceName];

  const metaMismatch = existingMeta && (
    existingMeta.companyName !== desiredMeta.companyName ||
    existingMeta.domain !== desiredMeta.domain ||
    existingMeta.industryType !== desiredMeta.industryType
  );

  if (!existing || metaMismatch) {
    if (existing && metaMismatch) {
      console.log(`[service-manager] Context change detected for ${serviceName}. Restarting service to apply new tags:`, JSON.stringify({ from: existingMeta, to: desiredMeta }));
      try { existing.kill('SIGTERM'); } catch {}
      delete childServices[serviceName];
      delete childServiceMeta[serviceName];
      // Free the port allocation
      if (portAllocations.has(serviceName)) {
        portAllocations.delete(serviceName);
      }
    }
    console.log(`[service-manager] Service ${serviceName} not running, starting it for company: ${companyName}...`);
    // Try to start with existing service file, fallback to dynamic service
    const specificServicePath = path.join(__dirname, `${serviceName}.cjs`);
    const dynamicServicePath = path.join(__dirname, 'dynamic-step-service.cjs');
    // Create a per-service wrapper so the Node entrypoint filename matches the service name
    const runnersDir = path.join(__dirname, '.dynamic-runners');
    const wrapperPath = path.join(runnersDir, `${serviceName}.cjs`);
    try {
      // Check if specific service exists
      if (fs.existsSync(specificServicePath)) {
        console.log(`[service-manager] Starting specific service: ${specificServicePath}`);
        startChildService(serviceName, specificServicePath, { 
          STEP_NAME: stepEnvName,
          COMPANY_NAME: companyName,
          DOMAIN: domain,
          INDUSTRY_TYPE: industryType
        });
      } else {
        // Ensure runners directory exists
        if (!fs.existsSync(runnersDir)) {
          fs.mkdirSync(runnersDir, { recursive: true });
        }
        // Create/overwrite wrapper with service-specific entrypoint
        const wrapperSource = `// Auto-generated wrapper for ${serviceName}\n` +
`process.env.SERVICE_NAME = ${JSON.stringify(serviceName)};\n` +
`process.env.STEP_NAME = ${JSON.stringify(stepEnvName)};\n` +
`process.title = process.env.SERVICE_NAME;\n` +
`// Company context for tagging\n` +
`process.env.COMPANY_NAME = process.env.COMPANY_NAME || 'DefaultCompany';\n` +
`process.env.DOMAIN = process.env.DOMAIN || 'default.com';\n` +
`process.env.INDUSTRY_TYPE = process.env.INDUSTRY_TYPE || 'general';\n` +
`// Plain env tags often picked as [Environment] in Dynatrace\n` +
`process.env.company = process.env.COMPANY_NAME;\n` +
`process.env.app = 'BizObs-CustomerJourney';\n` +
`process.env.service = process.env.SERVICE_NAME;\n` +
`// Dynatrace service detection\n` +
`process.env.DT_SERVICE_NAME = process.env.SERVICE_NAME;\n` +
`process.env.DYNATRACE_SERVICE_NAME = process.env.SERVICE_NAME;\n` +
`process.env.DT_LOGICAL_SERVICE_NAME = process.env.SERVICE_NAME;\n` +
`process.env.DT_PROCESS_GROUP_NAME = process.env.SERVICE_NAME;\n` +
`process.env.DT_PROCESS_GROUP_INSTANCE = process.env.SERVICE_NAME + '-' + (process.env.PORT || '');\n` +
`process.env.DT_APPLICATION_NAME = 'BizObs-CustomerJourney';\n` +
`process.env.DT_CLUSTER_ID = process.env.SERVICE_NAME;\n` +
`process.env.DT_NODE_ID = process.env.SERVICE_NAME + '-node';\n` +
`// Dynatrace simplified tags - space separated for proper parsing\n` +
`process.env.DT_TAGS = 'company=' + process.env.COMPANY_NAME + ' app=BizObs-CustomerJourney service=' + process.env.SERVICE_NAME;\n` +
`// Optional aggregate custom prop\n` +
`process.env.DT_CUSTOM_PROP = 'company=' + process.env.COMPANY_NAME + ';app=BizObs-CustomerJourney;service=' + process.env.SERVICE_NAME + ';domain=' + process.env.DOMAIN + ';industryType=' + process.env.INDUSTRY_TYPE + ';service_type=customer_journey_step';\n` +
`// Override argv[0] for Dynatrace process detection\n` +
`if (process.argv && process.argv.length > 0) process.argv[0] = process.env.SERVICE_NAME;\n` +
`require(${JSON.stringify(dynamicServicePath)}).createStepService(process.env.SERVICE_NAME, process.env.STEP_NAME);\n`;
        fs.writeFileSync(wrapperPath, wrapperSource, 'utf-8');
        console.log(`[service-manager] Starting dynamic service via wrapper: ${wrapperPath}`);
        startChildService(serviceName, wrapperPath, { 
          STEP_NAME: stepEnvName,
          COMPANY_NAME: companyName,
          DOMAIN: domain,
          INDUSTRY_TYPE: industryType
        });
      }
    } catch (e) {
      console.error(`[service-manager] Failed to start service for step ${stepName}:`, e.message);
    }
  } else {
    console.log(`[service-manager] Service ${serviceName} already running`);
    // Verify the service is actually responsive
    const meta = childServiceMeta[serviceName];
    if (meta && meta.port) {
      const isReady = await isServiceReady(meta.port, 1000);
      if (!isReady) {
        console.log(`[service-manager] Service ${serviceName} not responding, restarting...`);
        try { existing.kill('SIGTERM'); } catch {}
        delete childServices[serviceName];
        delete childServiceMeta[serviceName];
        if (portAllocations.has(serviceName)) {
          portAllocations.delete(serviceName);
        }
        // Restart the service
        return ensureServiceRunning(stepName, companyContext);
      }
    }
  }
  return childServices[serviceName];
}

// Get all running services
export function getChildServices() {
  return childServices;
}

// Get service metadata
export function getChildServiceMeta() {
  return childServiceMeta;
}

// Stop all services
export function stopAllServices() {
  Object.values(childServices).forEach(child => {
    child.kill('SIGTERM');
  });
}

// Convenience helper: ensure a service is started and ready (health endpoint responding)
export async function ensureServiceReadyForStep(stepName, companyContext = {}, timeoutMs = 8000) {
  // Start if not running
  ensureServiceRunning(stepName, companyContext);
  const port = getServicePort(stepName);
  const start = Date.now();
  while (true) {
    const ready = await isServiceReady(port, 1000);
    if (ready) return port;
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Service for step ${stepName} not ready on port ${port} within ${timeoutMs}ms`);
    }
    // Nudge start in case child crashed
    ensureServiceRunning(stepName, companyContext);
  }
}