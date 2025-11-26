/**
 * Dynatrace Metadata Injection Middleware
 * Injects business context headers for ACE-Box demo compatibility
 */

import { v4 as uuidv4 } from 'uuid';

// Default metadata values with environment variable support
const DEFAULT_METADATA = {
  'dt.owner': process.env.DT_OWNER || 'ace-box-demo',
  'dt.release-stage': process.env.DT_RELEASE_STAGE || 'production',
  'dt.customer-id': process.env.DT_CUSTOMER_ID || 'dynatrace-demo',
  'dt.environment': process.env.DT_ENVIRONMENT || 'ace-box',
  'dt.application': process.env.DT_APPLICATION || 'BizObs-CustomerJourney',
  'dt.service': process.env.DT_SERVICE_NAME || 'BizObs-MainServer'
};

// Customer persona data for demo scenarios
const CUSTOMER_PERSONAS = {
  'karen-retail': {
    'dt.customer-type': 'retail',
    'dt.customer-segment': 'high-value',
    'dt.customer-journey': 'purchase-oriented',
    'dt.user-experience': 'mobile-first'
  },
  'raj-insurance': {
    'dt.customer-type': 'insurance',
    'dt.customer-segment': 'enterprise',
    'dt.customer-journey': 'comparison-shopping',
    'dt.user-experience': 'web-desktop'
  },
  'alex-tech': {
    'dt.customer-type': 'technology',
    'dt.customer-segment': 'early-adopter',
    'dt.customer-journey': 'research-driven',
    'dt.user-experience': 'api-first'
  }
};

/**
 * Middleware to inject Dynatrace metadata into request/response headers
 */
export function injectDynatraceMetadata(req, res, next) {
  // Extract session and customer context
  const sessionId = req.headers['x-session-id'] || req.correlationId || uuidv4();
  const customerPersona = req.headers['x-customer-persona'] || req.query.persona || 'default';
  const businessContext = req.headers['x-business-context'] || req.query.context || 'demo';
  
  // Build metadata object
  const metadata = {
    ...DEFAULT_METADATA,
    'dt.session-id': sessionId,
    'dt.business-context': businessContext,
    'dt.request-timestamp': new Date().toISOString(),
    'dt.trace-context': req.headers.traceparent || 'auto-generated'
  };
  
  // Add persona-specific metadata if recognized
  if (CUSTOMER_PERSONAS[customerPersona]) {
    Object.assign(metadata, CUSTOMER_PERSONAS[customerPersona]);
  }
  
  // Add request-specific context
  metadata['dt.request-path'] = req.path;
  metadata['dt.request-method'] = req.method;
  metadata['dt.user-agent-type'] = getUserAgentType(req.headers['user-agent']);
  
  // Inject headers into response
  Object.entries(metadata).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Store metadata in request object for use by other middlewares
  req.dynatraceMetadata = metadata;
  
  // Add metadata validation flag
  res.setHeader('x-metadata-injected', 'true');
  res.setHeader('x-metadata-count', Object.keys(metadata).length.toString());
  
  next();
}

/**
 * Service-to-service metadata propagation
 */
export function propagateMetadata(originalHeaders, additionalContext = {}) {
  const propagatedHeaders = {};
  
  // Copy existing Dynatrace headers
  Object.keys(originalHeaders).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith('dt.') || 
        lowerKey.startsWith('x-dt-') ||
        lowerKey.startsWith('traceparent') ||
        lowerKey.startsWith('tracestate') ||
        lowerKey === 'x-correlation-id' ||
        lowerKey === 'x-session-id') {
      propagatedHeaders[key] = originalHeaders[key];
    }
  });
  
  // Add service-specific context
  propagatedHeaders['dt.service-call'] = 'true';
  propagatedHeaders['dt.call-timestamp'] = new Date().toISOString();
  
  // Merge additional context
  Object.entries(additionalContext).forEach(([key, value]) => {
    if (key.startsWith('dt.')) {
      propagatedHeaders[key] = value;
    }
  });
  
  return propagatedHeaders;
}

/**
 * Validate metadata presence in response
 */
export function validateMetadata(headers) {
  const validation = {
    hasMetadata: false,
    missingRequired: [],
    presentHeaders: [],
    score: 0
  };
  
  const requiredHeaders = ['dt.owner', 'dt.release-stage', 'dt.customer-id'];
  const optionalHeaders = ['dt.environment', 'dt.application', 'dt.service'];
  
  // Check required headers
  requiredHeaders.forEach(header => {
    if (headers[header]) {
      validation.presentHeaders.push(header);
      validation.score += 10;
    } else {
      validation.missingRequired.push(header);
    }
  });
  
  // Check optional headers
  optionalHeaders.forEach(header => {
    if (headers[header]) {
      validation.presentHeaders.push(header);
      validation.score += 5;
    }
  });
  
  validation.hasMetadata = validation.presentHeaders.length > 0;
  validation.isComplete = validation.missingRequired.length === 0;
  
  return validation;
}

/**
 * Business event metadata for Dynatrace capture
 */
export function createBusinessEventMetadata(eventType, stepName, additionalData = {}) {
  const timestamp = new Date().toISOString();
  const correlationId = uuidv4();
  
  return {
    'x-biz-event-type': eventType,
    'x-biz-correlation-id': correlationId,
    'x-biz-step-name': stepName,
    'x-biz-timestamp': timestamp,
    'x-biz-company': additionalData.companyName || 'default',
    'x-biz-domain': additionalData.domain || 'default.com',
    'x-biz-industry': additionalData.industryType || 'general',
    'x-biz-customer-id': additionalData.customerId || 'anonymous',
    'x-biz-session-id': additionalData.sessionId || correlationId,
    'x-biz-amount': additionalData.amount || '0',
    'x-biz-currency': additionalData.currency || 'USD',
    'x-biz-status': additionalData.status || 'completed',
    'x-biz-channel': additionalData.channel || 'web',
    'x-biz-source': additionalData.source || 'customer-journey'
  };
}

/**
 * Helper function to determine user agent type
 */
function getUserAgentType(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    return 'bot';
  } else {
    return 'desktop';
  }
}

/**
 * Error metadata injection for failed requests
 */
export function injectErrorMetadata(error, req, res) {
  const errorMetadata = {
    'dt.error-type': error.constructor.name,
    'dt.error-message': error.message,
    'dt.error-timestamp': new Date().toISOString(),
    'dt.error-correlation': req.correlationId || 'unknown',
    'dt.error-request-path': req.path,
    'dt.error-service': process.env.DT_SERVICE_NAME || 'unknown'
  };
  
  // Add stack trace hash for grouping
  if (error.stack) {
    const stackHash = require('crypto')
      .createHash('md5')
      .update(error.stack.split('\n').slice(0, 3).join('\n'))
      .digest('hex')
      .substring(0, 8);
    errorMetadata['dt.error-stack-hash'] = stackHash;
  }
  
  Object.entries(errorMetadata).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  return errorMetadata;
}

export default {
  injectDynatraceMetadata,
  propagateMetadata,
  validateMetadata,
  createBusinessEventMetadata,
  injectErrorMetadata,
  CUSTOMER_PERSONAS,
  DEFAULT_METADATA
};