import { v4 as uuidv4 } from 'uuid';
import { recordEvent } from './metricsService.js';
import http from 'http';

export function buildEventPayload({ userId, email, cost, npsScore, journeyStep, serviceName, traceId, spanId, domain = 'generic', journeyId, stepIndex, eventType, metadata = {} }) {
  // Extract the actual step name from the substep metadata or fallback to a default
  const actualStepName = metadata.stepName || extractStepNameFromJourneyStep(journeyStep) || `Step${stepIndex + 1}`;
  const substepName = metadata.substepName || 'generic-action';
  
  // Create service name based on actual stepName for clear service separation
  const dynamicServiceName = actualStepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service';
  
  return {
    eventId: uuidv4(),
    userId,
    email,
    cost,
    npsScore,
    journeyStep,
    serviceName: dynamicServiceName, // Use stepName-based service name
    traceId,
    spanId,
    domain,
    journeyId,
    stepIndex,
    eventType: eventType || `${domain}.${(journeyStep || 'step').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
    timestamp: new Date().toISOString(),
    // Enhanced Dynatrace service identification
    'dt.service': dynamicServiceName,
    'dt.trace_id': traceId,
    'dt.span_id': spanId,
    'service.name': dynamicServiceName,
    'service.version': '1.0.0',
    'service.environment': process.env.NODE_ENV || 'development',
    'process.service.name': dynamicServiceName,
    'process.pid': process.pid,
    'host.name': 'customer-journey-simulator',
    metadata: {
      ...metadata,
      // Ensure stepName is properly set
      stepName: actualStepName,
      substepName: substepName,
      // Service-specific metadata
      'service.type': 'customer-journey-step',
      'service.tier': getServiceTier(actualStepName),
      'business.step': actualStepName,
      'business.substep': substepName,
      'dt.entity.service': dynamicServiceName,
      'dt.entity.service_method': metadata.endpoint || '/api/default',
      'dt.entity.service_instance': `${dynamicServiceName}-${Math.random().toString(36).substr(2, 5)}`,
      'process.service.name': dynamicServiceName,
      'process.service.instance.id': `${dynamicServiceName}-instance-${Date.now().toString().slice(-6)}`,
      'telemetry.sdk.name': 'partner-powerup-bizobs',
      'telemetry.sdk.version': '1.0.0'
    }
  };
}

function extractStepNameFromJourneyStep(journeyStep) {
  if (!journeyStep) return null;
  
  // Extract step name from patterns like "StepName_SubstepName" or "Step1" 
  if (journeyStep.includes('_')) {
    return journeyStep.split('_')[0];
  }
  
  // Map generic step numbers to meaningful names
  if (journeyStep.match(/step\s*1/i)) return 'Discovery';
  if (journeyStep.match(/step\s*2/i)) return 'Exploration';
  if (journeyStep.match(/step\s*3/i)) return 'Selection';
  if (journeyStep.match(/step\s*4/i)) return 'Checkout';
  if (journeyStep.match(/step\s*5/i)) return 'Confirmation';
  if (journeyStep.match(/step\s*6/i)) return 'PostPurchase';
  
  return journeyStep;
}

function getServiceTier(stepName) {
  const step = stepName.toLowerCase();
  if (step.includes('discovery') || step.includes('search')) return 'frontend';
  if (step.includes('cart') || step.includes('selection')) return 'application';
  if (step.includes('payment') || step.includes('checkout')) return 'payment';
  if (step.includes('confirmation') || step.includes('notification')) return 'notification';
  return 'application';
}

export function emitEvent(io, payload) {
  io.emit('bizEvent', payload);
  
  // Create service-specific log entries that Dynatrace will recognize as separate services
  const serviceName = payload.serviceName || 'unknown-service';
  const stepName = payload.metadata?.stepName || 'unknown-step';
  
  // Create distinct service log with process mimicking for Dynatrace detection
  const serviceLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    // Make Dynatrace think this is a separate service process
    '@service': stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    '@process': stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    '@host': `${stepName.toLowerCase()}-host`,
    service: stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    serviceName: stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    processName: stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    application: stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    traceId: payload.traceId,
    spanId: payload.spanId,
    event: 'business_event',
    eventType: payload.eventType,
    journeyStep: payload.journeyStep,
    userId: payload.userId,
    cost: payload.cost,
    duration: payload.metadata?.duration || 0,
    endpoint: payload.metadata?.endpoint || '/api/unknown',
    method: payload.metadata?.httpMethod || 'POST',
    statusCode: payload.metadata?.httpStatusCode || 200,
    // Enhanced Dynatrace service separation metadata
    'service.name': stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    'service.instance.id': `${stepName.toLowerCase()}-instance-${Math.random().toString(36).substr(2, 6)}`,
    'service.version': '1.0.0',
    'service.namespace': 'customer-journey',
    'process.executable.name': stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    'process.executable.path': `/opt/${stepName.toLowerCase()}-service/bin/${stepName.toLowerCase()}-service`,
    'process.command_line': `node /opt/${stepName.toLowerCase()}-service/index.js`,
    'process.pid': Math.floor(Math.random() * 90000) + 10000, // Simulate different PIDs
    'host.name': `${stepName.toLowerCase()}-host-${Math.random().toString(36).substr(2, 4)}`,
    'host.ip': `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    'dt.service': stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    'dt.trace_id': payload.traceId,
    'dt.span_id': payload.spanId,
    'dt.process.name': stepName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-service',
    message: `[${stepName.toUpperCase()}-SERVICE] ${payload.eventType} processed for user ${payload.userId}`,
    // Additional context for separation
    stepName: stepName,
    substepName: payload.metadata?.substepName,
    correlationId: payload.metadata?.correlationId,
    sessionId: payload.metadata?.sessionId,
    // Container/Kubernetes simulation for better service detection
    'k8s.pod.name': `${stepName.toLowerCase()}-service-pod-${Math.random().toString(36).substr(2, 5)}`,
    'k8s.deployment.name': `${stepName.toLowerCase()}-service`,
    'k8s.namespace.name': 'customer-journey',
    'container.name': `${stepName.toLowerCase()}-service-container`,
    'container.id': `${stepName.toLowerCase()}-${Math.random().toString(36).substr(2, 12)}`
  };
  
  // Log with service-specific format that mimics different processes
  console.log(`[${stepName.toUpperCase()}-SERVICE-${serviceLogEntry['process.pid']}] ${JSON.stringify(serviceLogEntry)}`);
  
  recordEvent(payload);
}

export async function simulateEvents({ io, journey, customerProfile, traceMetadata, additionalFields, ratePerSecond = 2, durationSeconds = 10, correlationId, frontendHostLabel }) {
  const total = ratePerSecond * durationSeconds;
  const start = Date.now();
  let emitted = 0;

  const stepsArr = journey?.steps?.length ? journey.steps : null;
  const domain = inferDomain(journey);
  const journeyId = journey?.journeyId || journey?.id;
  
  // Flatten substeps for simulation
  const allSubsteps = [];
  if (stepsArr) {
    stepsArr.forEach(step => {
      if (step.substeps && step.substeps.length > 0) {
        step.substeps.forEach(substep => {
          allSubsteps.push({
            stepIndex: step.stepIndex,
            stepName: step.stepName,
            substepIndex: substep.substepIndex,
            substepName: substep.substepName,
            serviceName: substep.serviceName,
            endpoint: substep.endpoint,
            duration: substep.duration,
            eventType: substep.eventType,
            description: substep.description,
            metadata: substep.metadata || {}
          });
        });
      } else {
        // Fallback for steps without substeps
        allSubsteps.push({
          stepIndex: step.stepIndex,
          stepName: step.stepName,
          substepIndex: 1,
          substepName: step.stepName.replace(/\s+/g, '_'),
          serviceName: step.serviceName || `${step.stepName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-service`,
          endpoint: step.endpoint || `/api/${step.stepName.toLowerCase()}`,
          duration: step.duration || 1000,
          eventType: step.eventType || `${step.stepName.toLowerCase()}_completed`,
          description: step.description,
          metadata: step.metadata || {}
        });
      }
    });
  }

  const interval = setInterval(() => {
    const remaining = total - emitted;
    if (remaining <= 0) {
      clearInterval(interval);
      return;
    }
    
    for (let i = 0; i < Math.min(ratePerSecond, remaining); i++) {
      // Select random substep
      const substep = allSubsteps.length > 0 
        ? allSubsteps[Math.floor(Math.random() * allSubsteps.length)]
        : {
            stepIndex: 1,
            stepName: 'GenericStep',
            substepIndex: 1,
            substepName: 'Generic_Action',
            serviceName: 'generic-service',
            endpoint: '/api/generic',
            duration: 1000,
            eventType: 'generic_action',
            description: 'Generic customer action',
            metadata: {}
          };

      const userId = customerProfile?.userId || uuidv4();
      const email = customerProfile?.email || `${userId.slice(0,8)}@example.com`;
      const cost = Number((Math.random() * 2000 + 50).toFixed(2));
      const npsScore = Math.floor(Math.random() * 11) - 1; // -1 to 9
      
      const baseCorrelationId = traceMetadata?.correlationId || correlationId || `sim_${Date.now()}`;
      const sessionId = traceMetadata?.sessionId || `session_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create unique trace ID for this substep
      const traceId = `${baseCorrelationId}_step${substep.stepIndex}_sub${substep.substepIndex}_${Date.now()}`;
      const spanId = uuidv4().slice(0,16);
      
      // Journey step identifier for visibility
      const journeyStep = `${substep.stepName}_${substep.substepName}`;
      
      // Simulate service-specific processing time
      const processingTime = substep.duration || Math.floor(Math.random() * 1000) + 200;
      
      const eventPayload = buildEventPayload({
        userId,
        email,
        cost,
        npsScore,
        journeyStep,
        serviceName: substep.serviceName,
        traceId,
        spanId,
        domain,
        journeyId,
        stepIndex: substep.stepIndex,
        eventType: substep.eventType,
        metadata: {
          ...substep.metadata,
          correlationId: baseCorrelationId,
          sessionId,
          stepName: substep.stepName, // Ensure stepName is passed correctly
          substepName: substep.substepName,
          substepIndex: substep.substepIndex,
          endpoint: substep.endpoint,
          duration: processingTime,
          frontendHostLabel: frontendHostLabel || 'Local Dev',
          httpMethod: getHttpMethodForEndpoint(substep.endpoint),
          httpStatusCode: 200,
          requestSize: Math.floor(Math.random() * 1024) + 256,
          responseSize: Math.floor(Math.random() * 2048) + 512,
          ...additionalFields
        }
      });
      
      emitEvent(io, eventPayload);
      
      // HTTP calls temporarily disabled - focusing on enhanced logging for Dynatrace
      // makeServiceCall(substep, traceId, spanId).catch(err => {
      //   console.log(`Service call failed for ${substep.serviceName}: ${err.message}`);
      // });
      
      emitted++;
    }
  }, 1000);

  return { totalPlanned: total, durationSeconds, ratePerSecond, start, substepsCount: allSubsteps.length };
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

function getHttpMethodForEndpoint(endpoint = '') {
  if (endpoint.includes('/search') || endpoint.includes('/products') || endpoint.includes('/api/get')) return 'GET';
  if (endpoint.includes('/cart') || endpoint.includes('/payment') || endpoint.includes('/checkout')) return 'POST';
  if (endpoint.includes('/update') || endpoint.includes('/profile')) return 'PUT';
  if (endpoint.includes('/delete') || endpoint.includes('/remove')) return 'DELETE';
  return 'POST'; // Default
}

async function makeServiceCall(substep, traceId, spanId) {
  return new Promise((resolve, reject) => {
    const method = getHttpMethodForEndpoint(substep.endpoint);
    const postData = method === 'POST' ? JSON.stringify({
      userId: uuidv4(),
      action: substep.substepName,
      timestamp: new Date().toISOString()
    }) : null;
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: substep.endpoint || '/api/default',
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-ID': traceId,
        'X-Span-ID': spanId,
        'X-Service-Name': substep.serviceName,
        'User-Agent': `${substep.serviceName}/1.0.0`,
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}
