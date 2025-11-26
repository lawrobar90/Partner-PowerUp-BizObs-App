/**
 * Enhanced Event Service for Business Observability
 * Now works with separate child processes for proper Dynatrace service splitting
 */

import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import { ensureServiceRunning, getServiceNameFromStep as mgrGetServiceNameFromStep, getServicePort as mgrGetServicePort } from './service-manager.js';

const eventService = {
  // Dynamic service mapping delegates to service-manager
  getServiceNameFromStep(stepName) {
    const name = mgrGetServiceNameFromStep(stepName);
    console.log(`[EventService] Converting step "${stepName}" to service "${name}"`);
    return name;
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
      const companyName = data.companyName || 'DefaultCompany';
      const domain = data.domain || 'default.com';
      const industryType = data.industryType || 'general';
      const correlationId = data.correlationId || uuidv4();
      
      console.log(`📊 Processing ${eventType} for step: ${stepName}`);
      
      if (substeps && substeps.length > 0) {
        // Start all substep services, then call only the first to initiate chaining
        const stepsArr = substeps.map(s => ({
          stepName: s.stepName || stepName,
          serviceName: this.getServiceNameFromStep(s.stepName || stepName)
        }));

        try {
          for (const s of stepsArr) {
            ensureServiceRunning(s.stepName, {
              companyName,
              domain,
              industryType,
              stepName: s.stepName,
              serviceName: s.serviceName
            });
          }
        } catch (e) {
          console.warn('[EventService] ensureServiceRunning error (non-fatal):', e.message);
        }

        // Give services a brief moment to boot
        await new Promise(r => setTimeout(r, 500));

        const first = stepsArr[0];
        const firstPort = mgrGetServicePort(first.stepName);
        const payload = {
          ...substeps[0],
          stepName: first.stepName,
          correlationId,
          parentStep: stepName,
          timestamp: new Date().toISOString(),
          companyName,
          domain,
          industryType,
          // Provide the full sequence for child chaining
          steps: stepsArr
        };

        const result = await this.callChildService(first.serviceName, payload, firstPort);
        return { success: true, correlationId, chained: true, result };
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
  const domain = journey?.domain || inferDomain(journey);
  const companyName = journey?.companyName || 'DefaultCompany';
  const industryType = journey?.industryType || 'general';
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
          domain,
          companyName,
          industryType
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