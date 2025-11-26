/**
 * BizObs Synthetic Load Generator
 * Creates realistic customer journey traffic for ACE-Box demos
 */

import http from 'http';
import { randomBytes } from 'crypto';

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:8080',
  duration: parseInt(process.env.LOAD_DURATION || '300'), // 5 minutes default
  concurrency: parseInt(process.env.LOAD_CONCURRENCY || '5'),
  requestsPerSecond: parseInt(process.env.LOAD_RPS || '10'),
  enableErrors: process.env.ENABLE_ERRORS === 'true',
  errorRate: parseFloat(process.env.ERROR_RATE || '0.05') // 5% error rate
};

// Customer personas with different journey patterns
const CUSTOMER_PERSONAS = {
  'karen-retail': {
    name: 'Karen Thompson',
    type: 'retail',
    behavior: 'impulsive',
    sessionDuration: [180, 600], // 3-10 minutes
    stepsPerSession: [3, 8],
    preferredSteps: ['Discovery', 'PolicySelection', 'Purchase', 'Completion'],
    errorProneness: 0.03
  },
  'raj-insurance': {
    name: 'Raj Patel', 
    type: 'insurance',
    behavior: 'analytical',
    sessionDuration: [300, 1200], // 5-20 minutes
    stepsPerSession: [5, 15],
    preferredSteps: ['Discovery', 'Consideration', 'QuotePersonalization', 'PolicySelection', 'SecureCheckout'],
    errorProneness: 0.02
  },
  'alex-tech': {
    name: 'Alex Rivera',
    type: 'technology', 
    behavior: 'efficiency-focused',
    sessionDuration: [120, 300], // 2-5 minutes
    stepsPerSession: [2, 6],
    preferredSteps: ['Discovery', 'Purchase', 'DataPersistence'],
    errorProneness: 0.01
  },
  'sophia-enterprise': {
    name: 'Sophia Chen',
    type: 'enterprise',
    behavior: 'thorough',
    sessionDuration: [600, 1800], // 10-30 minutes
    stepsPerSession: [8, 20],
    preferredSteps: ['Discovery', 'Awareness', 'Consideration', 'PolicySelection', 'QuotePersonalization', 'SecureCheckout', 'PolicyActivation'],
    errorProneness: 0.015
  }
};

// Journey step definitions with realistic metadata
const JOURNEY_STEPS = {
  'Discovery': {
    weight: 1.0,
    avgDuration: 2000,
    endpoints: ['/api/journey', '/api/steps'],
    metadata: { category: 'awareness', importance: 'high' }
  },
  'Awareness': {
    weight: 0.8,
    avgDuration: 3000,
    endpoints: ['/api/journey', '/api/simulate'],
    metadata: { category: 'awareness', importance: 'medium' }
  },
  'Consideration': {
    weight: 0.9,
    avgDuration: 4000,
    endpoints: ['/api/journey-simulation/start'],
    metadata: { category: 'evaluation', importance: 'high' }
  },
  'PolicySelection': {
    weight: 0.7,
    avgDuration: 5000,
    endpoints: ['/api/journey-simulation/start'],
    metadata: { category: 'decision', importance: 'critical' }
  },
  'QuotePersonalization': {
    weight: 0.6,
    avgDuration: 6000,
    endpoints: ['/api/journey-simulation/start'],
    metadata: { category: 'customization', importance: 'high' }
  },
  'Purchase': {
    weight: 0.5,
    avgDuration: 3000,
    endpoints: ['/api/journey-simulation/start'],
    metadata: { category: 'transaction', importance: 'critical' }
  },
  'SecureCheckout': {
    weight: 0.4,
    avgDuration: 4000,
    endpoints: ['/api/journey-simulation/start'],
    metadata: { category: 'transaction', importance: 'critical' }
  },
  'PolicyActivation': {
    weight: 0.3,
    avgDuration: 2000,
    endpoints: ['/api/journey-simulation/start'],
    metadata: { category: 'fulfillment', importance: 'high' }
  },
  'Completion': {
    weight: 0.4,
    avgDuration: 1500,
    endpoints: ['/api/journey-simulation/start'],
    metadata: { category: 'fulfillment', importance: 'medium' }
  },
  'DataPersistence': {
    weight: 0.8,
    avgDuration: 1000,
    endpoints: ['/api/admin/services'],
    metadata: { category: 'system', importance: 'high' }
  }
};

class SyntheticLoadGenerator {
  constructor() {
    this.activeRequests = new Set();
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      errorRequests: 0,
      sessions: 0,
      startTime: Date.now()
    };
    this.isRunning = false;
  }

  // Generate realistic customer session
  async generateCustomerSession(personaKey) {
    const persona = CUSTOMER_PERSONAS[personaKey];
    const sessionId = this.generateSessionId();
    
    console.log(`🎭 Starting session for ${persona.name} (${personaKey})`);
    
    // Determine session parameters
    const sessionDuration = this.randomBetween(...persona.sessionDuration) * 1000;
    const stepsCount = this.randomBetween(...persona.stepsPerSession);
    
    const sessionStart = Date.now();
    let stepCount = 0;
    
    while (Date.now() - sessionStart < sessionDuration && stepCount < stepsCount && this.isRunning) {
      const stepName = this.selectRandomStep(persona.preferredSteps);
      const stepConfig = JOURNEY_STEPS[stepName];
      
      if (stepConfig) {
        await this.executeJourneyStep(stepName, stepConfig, personaKey, sessionId, persona);
        stepCount++;
        
        // Realistic delay between steps
        const delay = this.randomBetween(500, stepConfig.avgDuration);
        await this.sleep(delay);
      }
    }
    
    console.log(`✅ Session complete for ${persona.name}: ${stepCount} steps in ${Math.round((Date.now() - sessionStart) / 1000)}s`);
    this.stats.sessions++;
  }

  // Execute a journey step with realistic request
  async executeJourneyStep(stepName, stepConfig, personaKey, sessionId, persona) {
    const endpoint = stepConfig.endpoints[Math.floor(Math.random() * stepConfig.endpoints.length)];
    const shouldError = CONFIG.enableErrors && (Math.random() < persona.errorProneness);
    
    const requestData = this.buildRequestData(stepName, personaKey, sessionId, shouldError);
    
    try {
      await this.makeHttpRequest(endpoint, requestData, personaKey, sessionId);
      this.stats.successfulRequests++;
      console.log(`  ✓ ${personaKey}: ${stepName} → ${endpoint}`);
    } catch (error) {
      this.stats.errorRequests++;
      console.log(`  ❌ ${personaKey}: ${stepName} → ${endpoint} (${error.message})`);
    }
    
    this.stats.totalRequests++;
  }

  // Build realistic request payload
  buildRequestData(stepName, personaKey, sessionId, shouldError = false) {
    const persona = CUSTOMER_PERSONAS[personaKey];
    const stepConfig = JOURNEY_STEPS[stepName];
    
    const baseData = {
      customer: {
        name: persona.name,
        type: persona.type,
        behavior: persona.behavior,
        sessionId: sessionId,
        persona: personaKey
      },
      journeyType: stepConfig.metadata.category,
      stepName: stepName,
      details: {
        timestamp: new Date().toISOString(),
        source: 'synthetic-load',
        importance: stepConfig.metadata.importance
      }
    };

    if (shouldError) {
      baseData.shouldFail = true;
      baseData.errorType = this.selectRandomErrorType();
    }

    // Add step-specific substeps
    if (stepName !== 'DataPersistence') {
      baseData.steps = [{
        stepName: stepName,
        description: `Synthetic ${stepName} for ${persona.name}`,
        category: stepConfig.metadata.category,
        delay: this.randomBetween(100, 1000)
      }];
    }

    return baseData;
  }

  // Make HTTP request with proper headers
  makeHttpRequest(endpoint, data, personaKey, sessionId) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, CONFIG.baseUrl);
      const isPost = endpoint.includes('simulation') || endpoint.includes('admin');
      
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'BizObs-SyntheticLoad/1.0',
        'x-customer-persona': personaKey,
        'x-session-id': sessionId,
        'x-synthetic-traffic': 'true',
        'x-load-test': 'true'
      };

      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: isPost ? 'POST' : 'GET',
        headers: headers,
        timeout: 30000
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve({ statusCode: res.statusCode, body });
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (isPost) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // Utility methods
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  selectRandomStep(preferredSteps) {
    return preferredSteps[Math.floor(Math.random() * preferredSteps.length)];
  }

  selectRandomErrorType() {
    const errorTypes = ['ValidationError', 'TimeoutError', 'ServiceUnavailable', 'InternalServerError'];
    return errorTypes[Math.floor(Math.random() * errorTypes.length)];
  }

  generateSessionId() {
    return `syn-${Date.now()}-${randomBytes(4).toString('hex')}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Start load generation
  async start() {
    console.log('🚀 BizObs Synthetic Load Generator Starting...');
    console.log(`📊 Configuration:`, CONFIG);
    console.log(`🎭 Personas: ${Object.keys(CUSTOMER_PERSONAS).length}`);
    console.log(`📋 Journey Steps: ${Object.keys(JOURNEY_STEPS).length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.isRunning = true;
    const endTime = Date.now() + (CONFIG.duration * 1000);

    // Start concurrent customer sessions
    const sessionPromises = [];
    
    while (Date.now() < endTime && this.isRunning) {
      // Ensure we don't exceed concurrency limit
      while (sessionPromises.length >= CONFIG.concurrency) {
        await Promise.race(sessionPromises);
        sessionPromises.splice(sessionPromises.findIndex(p => p.settled), 1);
      }

      // Start new session with random persona
      const personaKeys = Object.keys(CUSTOMER_PERSONAS);
      const randomPersona = personaKeys[Math.floor(Math.random() * personaKeys.length)];
      
      const sessionPromise = this.generateCustomerSession(randomPersona)
        .then(() => ({ settled: true }))
        .catch(error => {
          console.error(`Session error for ${randomPersona}:`, error.message);
          return { settled: true };
        });
      
      sessionPromises.push(sessionPromise);

      // Control request rate
      const delayMs = Math.max(100, 1000 / CONFIG.requestsPerSecond);
      await this.sleep(delayMs);
    }

    // Wait for remaining sessions to complete
    await Promise.all(sessionPromises);
    
    this.stop();
  }

  stop() {
    this.isRunning = false;
    const duration = (Date.now() - this.stats.startTime) / 1000;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Synthetic Load Generation Complete!');
    console.log(`📊 Final Statistics:`);
    console.log(`   • Duration: ${Math.round(duration)}s`);
    console.log(`   • Sessions: ${this.stats.sessions}`);
    console.log(`   • Total Requests: ${this.stats.totalRequests}`);
    console.log(`   • Successful: ${this.stats.successfulRequests}`);
    console.log(`   • Errors: ${this.stats.errorRequests}`);
    console.log(`   • Success Rate: ${Math.round((this.stats.successfulRequests / this.stats.totalRequests) * 100)}%`);
    console.log(`   • Avg RPS: ${Math.round(this.stats.totalRequests / duration)}`);
    console.log('🎭 Check Dynatrace for captured sessions and business events!');
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping load generation...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping load generation...');
  process.exit(0);
});

// Start the load generator if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new SyntheticLoadGenerator();
  generator.start().catch(error => {
    console.error('Load generation failed:', error);
    process.exit(1);
  });
}

export default SyntheticLoadGenerator;