/**
 * Enhanced Event Service for Business Observability
 * Now works with separate child processes for proper Dynatrace service splitting
 */

import { v4 as uuidv4 } from 'uuid';
import http from 'http';

const eventService = {
  // Dynamic service mapping for journey steps
  getServiceNameFromStep(stepName) {
    // Normalize: preserve CamelCase and handle spaces/underscores/hyphens
    if (/Service$/.test(String(stepName || ''))) return String(stepName);
    const cleaned = String(stepName || '').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
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
    console.log(`[EventService] Converting step "${stepName}" to service "${serviceName}"`);
    return serviceName;
  },

  // Get port for service (dynamic allocation starting from 4101)
  getServicePort(serviceName) {
    // Create a consistent hash-based port allocation
    let hash = 0;
    for (let i = 0; i < serviceName.length; i++) {
      const char = serviceName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Map to port range 4101-4199
    const port = 4101 + (Math.abs(hash) % 99);
    console.log(`[EventService] Service "${serviceName}" mapped to port ${port}`);
    return port;
  },

  // Call a child service via HTTP
  callChildService(serviceName, payload, port) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: port,
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
  },

  // Enhanced event emission using separate processes
  async emitEvent(eventType, data) {
    try {
      const { stepName, substeps } = data;
      const correlationId = data.correlationId || uuidv4();
      
      console.log(`📊 Processing ${eventType} for step: ${stepName}`);
      
      if (substeps && substeps.length > 0) {
        // Process each substep through its dedicated service
        const results = [];
        
        for (const substep of substeps) {
          const serviceName = this.getServiceNameFromStep(substep.stepName || stepName);
          const servicePort = this.getServicePort(serviceName);
          
          if (servicePort) {
            try {
              // Call the dedicated service
              const payload = {
                ...substep,
                correlationId,
                parentStep: stepName,
                timestamp: new Date().toISOString()
              };
              
              const result = await this.callChildService(serviceName, payload, servicePort);
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
        
        return { success: true, correlationId, results };
      }
      
      return { success: true, correlationId, message: 'No substeps to process' };
    } catch (error) {
      console.error('Event emission error:', error);
      return { success: false, error: error.message };
    }
  }
};

export default eventService;

// Legacy export for compatibility
export function buildEventPayload(data) {
  return {
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    ...data
  };
}

export async function emitEvent(eventType, data) {
  return eventService.emitEvent(eventType, data);
}

// Simulation functions for compatibility
export async function simulateEvents({ io, journey, customerProfile, traceMetadata, additionalFields, ratePerSecond = 2, durationSeconds = 10, correlationId, frontendHostLabel }) {
  const total = ratePerSecond * durationSeconds;
  const start = Date.now();
  let emitted = 0;

  const stepsArr = journey?.steps?.length ? journey.steps : null;
  const domain = inferDomain(journey);
  const journeyId = journey?.journeyId || journey?.id;
  
  // Use the enhanced event service for processing
  if (stepsArr && stepsArr.length > 0) {
    const processStep = async (step) => {
      try {
        await eventService.emitEvent('customer_journey_step', {
          stepName: step.stepName,
          substeps: step.substeps || [{
            stepName: step.stepName,
            substepName: step.stepName.replace(/\s+/g, '_'),
            action: step.eventType || `${step.stepName.toLowerCase()}_completed`,
            duration: step.duration || 1000,
            metadata: step.metadata || {}
          }],
          correlationId: correlationId || `sim_${Date.now()}`,
          journeyId,
          domain
        });
      } catch (error) {
        console.error(`Error processing step ${step.stepName}:`, error);
      }
    };

    // Simulate events at the specified rate
    const interval = setInterval(async () => {
      const remaining = total - emitted;
      if (remaining <= 0) {
        clearInterval(interval);
        return;
      }
      
      for (let i = 0; i < Math.min(ratePerSecond, remaining); i++) {
        const randomStep = stepsArr[Math.floor(Math.random() * stepsArr.length)];
        await processStep(randomStep);
        emitted++;
      }
    }, 1000);

    setTimeout(() => clearInterval(interval), durationSeconds * 1000 + 500);
  }

  return { totalPlanned: total, durationSeconds, ratePerSecond, start };
}

export function inferDomain(journeyOrPayload) {
  const jt = (journeyOrPayload?.journeyType || '').toLowerCase();
  const site = (journeyOrPayload?.website || '').toLowerCase();
  const details = (journeyOrPayload?.details || '').toLowerCase();
  const text = `${jt} ${site} ${details}`;
  if (/retail|cart|checkout|product|shop|e-?commerce|order/.test(text)) return 'retail';
  if (/travel|booking|flight|hotel|holiday|trip/.test(text)) return 'travel';
  if (/insurance|quote|policy|claim/.test(text)) return 'insurance';
  if (/bank|onboarding|account|payment|fintech/.test(text)) return 'banking';
  return 'generic';
}