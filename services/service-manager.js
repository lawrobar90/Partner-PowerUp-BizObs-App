import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import portManager from './port-manager.js';
import { propagateMetadata } from '../middleware/dynatrace-metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track running child services and their context
const childServices = {};
const childServiceMeta = {};

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

// Get port for service using robust port manager
export async function getServicePort(stepName, companyName = 'DefaultCompany') {
  const serviceName = getServiceNameFromStep(stepName);
  if (!serviceName) return null;
  
  try {
    // Check if service already has a port allocated
    const existingPort = portManager.getServicePort(serviceName, companyName);
    if (existingPort) {
      console.log(`[service-manager] Service "${serviceName}" for ${companyName} already allocated to port ${existingPort}`);
      return existingPort;
    }
    
    // Allocate new port using robust port manager
    const port = await portManager.allocatePort(serviceName, companyName);
    console.log(`[service-manager] Service "${serviceName}" for ${companyName} allocated port ${port}`);
    return port;
    
  } catch (error) {
    console.error(`[service-manager] Failed to allocate port for ${serviceName}: ${error.message}`);
    throw error;
  }
}

// Cleanup dead services using port manager
function cleanupDeadServices() {
  const deadServices = [];
  
  for (const [serviceName, child] of Object.entries(childServices)) {
    if (child.killed || child.exitCode !== null) {
      deadServices.push(serviceName);
    }
  }
  
  deadServices.forEach(serviceName => {
    console.log(`[service-manager] Cleaning up dead service: ${serviceName}`);
    delete childServices[serviceName];
    delete childServiceMeta[serviceName];
    
    // Free the port using port manager
    const meta = childServiceMeta[serviceName];
    if (meta && meta.port) {
      portManager.releasePort(meta.port, serviceName);
    }
  });
  
  console.log(`[service-manager] Cleanup completed: ${deadServices.length} dead services removed`);
}

// Start child service process
export async function startChildService(serviceName, scriptPath, env = {}) {
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
  
  try {
    const port = await getServicePort(stepName, companyName);
    console.log(`🚀 Starting child service: ${serviceName} on port ${port} for company: ${companyName} (domain: ${domain}, industry: ${industryType})`);
    
    const child = spawn('node', [scriptPath, '--service-name', serviceName], {
      env: { 
        ...process.env, 
        SERVICE_NAME: serviceName, 
        PORT: port,
        MAIN_SERVER_PORT: process.env.PORT || '8080',
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
        // Dynatrace service identification (OneAgent recognizes these)
        DT_SERVICE_NAME: serviceName,
        DYNATRACE_SERVICE_NAME: serviceName,
        DT_LOGICAL_SERVICE_NAME: serviceName,
        // Process group identification
        DT_PROCESS_GROUP_NAME: serviceName,
        DT_PROCESS_GROUP_INSTANCE: `${serviceName}-${port}`,
        // Application context
        DT_APPLICATION_NAME: `BizObs-${industryType}`,
        DT_CLUSTER_ID: 'ace-box-bizobs',
        DT_NODE_ID: `${serviceName}-node`,
        // Dynatrace tags and custom properties
        DT_TAGS: `Environment=ACE-Box,Project=Partner-PowerUp-BizObs,Company=${companyName},Industry=${industryType},Service=${serviceName}`,
        DT_CUSTOM_PROP: `company=${companyName};domain=${domain};industry=${industryType};port=${port}`,
        // Release information
        DT_RELEASE_PRODUCT: 'BizObs-Engine',
        DT_RELEASE_STAGE: 'production',
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
      // Free up the port using port manager
      portManager.releasePort(port, serviceName);
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
    
  } catch (error) {
    console.error(`[service-manager] Failed to start service ${serviceName}: ${error.message}`);
    // Release port if allocation succeeded but service start failed
    if (port) {
      portManager.releasePort(port, serviceName);
    }
    throw error;
  }
}// Function to start services dynamically based on journey steps
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

  // Check for company context mismatch FIRST
  const metaMismatch = existingMeta && (
    existingMeta.companyName !== desiredMeta.companyName ||
    existingMeta.domain !== desiredMeta.domain ||
    existingMeta.industryType !== desiredMeta.industryType
  );

  console.log(`[service-manager] DEBUG: Service ${serviceName}, existing: ${!!existing}, meta: ${!!existingMeta}`);
  if (existingMeta) {
    console.log(`[service-manager] DEBUG: Existing meta:`, JSON.stringify(existingMeta));
    console.log(`[service-manager] DEBUG: Desired meta:`, JSON.stringify(desiredMeta));
    console.log(`[service-manager] DEBUG: Meta mismatch: ${metaMismatch}`);
  }

  // If service exists and is still running AND context matches, return it immediately
  if (existing && !existing.killed && existing.exitCode === null && !metaMismatch) {
    console.log(`[service-manager] Service ${serviceName} already running (PID: ${existing.pid}), reusing existing instance for ${companyName}`);
    // Return the service info with its actual port
    return {
      service: existing,
      port: existingMeta?.port,
      serviceName: serviceName
    };
  }

  if (!existing || metaMismatch) {
    if (existing && metaMismatch) {
      console.log(`[service-manager] Context change detected for ${serviceName}. Restarting service to apply new tags:`, JSON.stringify({ from: existingMeta, to: desiredMeta }));
      try { existing.kill('SIGTERM'); } catch {}
      delete childServices[serviceName];
      delete childServiceMeta[serviceName];
      // Free up the port using port manager
      const meta = childServiceMeta[serviceName];
      if (meta && meta.port) {
        portManager.releasePort(meta.port, serviceName);
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
        const child = await startChildService(serviceName, specificServicePath, { 
          STEP_NAME: stepEnvName,
          COMPANY_NAME: companyName,
          DOMAIN: domain,
          INDUSTRY_TYPE: industryType
        });
        const meta = childServiceMeta[serviceName];
        return {
          service: child,
          port: meta?.port,
          serviceName: serviceName
        };
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
        const child = await startChildService(serviceName, wrapperPath, { 
          STEP_NAME: stepEnvName,
          COMPANY_NAME: companyName,
          DOMAIN: domain,
          INDUSTRY_TYPE: industryType
        });
        const meta = childServiceMeta[serviceName];
        return {
          service: child,
          port: meta?.port,
          serviceName: serviceName
        };
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
        // Free the port allocation and return to pool
        if (portAllocations.has(serviceName)) {
          const port = portAllocations.get(serviceName);
          portAllocations.delete(serviceName);
          portPool.add(port);
          console.log(`[service-manager] Freed port ${port} for unresponsive service ${serviceName}`);
        }
        // Restart the service
        return ensureServiceRunning(stepName, companyContext);
      }
    }
  }
  
  // Return service info with port
  const serviceInfo = childServices[serviceName];
  const meta = childServiceMeta[serviceName];
  return {
    service: serviceInfo,
    port: meta?.port,
    serviceName: serviceName
  };
}

// Get all running services
export function getChildServices() {
  return childServices;
}

// Get service metadata
export function getChildServiceMeta() {
  return childServiceMeta;
}

// Stop all services and free all ports
export function stopAllServices() {
  Object.values(childServices).forEach(child => {
    child.kill('SIGTERM');
  });
  
  // Clear all port allocations using port manager
  Object.keys(childServices).forEach(serviceName => {
    delete childServices[serviceName];
    delete childServiceMeta[serviceName];
  });
  console.log(`[service-manager] All services stopped and cleaned up`);
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

// Health monitoring function to detect and resolve port conflicts
export async function performHealthCheck() {
  const portStatus = portManager.getStatus();
  const healthResults = {
    totalServices: Object.keys(childServices).length,
    healthyServices: 0,
    unhealthyServices: 0,
    portConflicts: 0,
    availablePorts: portStatus.availablePorts,
    issues: []
  };
  
  for (const [serviceName, child] of Object.entries(childServices)) {
    const meta = childServiceMeta[serviceName];
    if (!meta || !meta.port) {
      healthResults.issues.push(`Service ${serviceName} has no port metadata`);
      continue;
    }
    
    try {
      const isHealthy = await isServiceReady(meta.port, 2000);
      if (isHealthy) {
        healthResults.healthyServices++;
      } else {
        healthResults.unhealthyServices++;
        healthResults.issues.push(`Service ${serviceName} not responding on port ${meta.port}`);
        
        // Try to restart unresponsive service
        console.log(`[service-manager] Health check: restarting unresponsive service ${serviceName}`);
        try {
          child.kill('SIGTERM');
          delete childServices[serviceName];
          delete childServiceMeta[serviceName];
          
          // Free the port using port manager
          if (meta && meta.port) {
            portManager.releasePort(meta.port, serviceName);
          }
          
          // Allow some time for cleanup
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          healthResults.issues.push(`Failed to restart service ${serviceName}: ${error.message}`);
        }
      }
    } catch (error) {
      healthResults.unhealthyServices++;
      healthResults.issues.push(`Health check failed for ${serviceName}: ${error.message}`);
    }
  }
  
  // Check for port conflicts using port manager status
  const pmStatus = portManager.getStatus();
  if (pmStatus.pendingAllocations > 0) {
    healthResults.issues.push(`${pmStatus.pendingAllocations} pending port allocations detected`);
  }
  
  return healthResults;
}

// Get comprehensive service status
export function getServiceStatus() {
  const portStatus = portManager.getStatus();
  return {
    activeServices: Object.keys(childServices).length,
    availablePorts: portStatus.availablePorts,
    allocatedPorts: portStatus.allocatedPorts,
    portRange: `${portManager.minPort || 8081}-${portManager.maxPort || 8094}`,
    services: Object.entries(childServices).map(([name, child]) => ({
      name,
      pid: child.pid,
      port: childServiceMeta[name]?.port || 'unknown',
      company: childServiceMeta[name]?.companyName || 'unknown',
      startTime: childServiceMeta[name]?.startTime || 'unknown',
      alive: !child.killed && child.exitCode === null
    }))
  };
}