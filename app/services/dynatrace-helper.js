/**
 * Dynatrace OneAgent SDK Helper
 * Provides utilities for adding custom attributes to OneAgent spans
 */

let dynatraceSDK = null;

// Try to load OneAgent SDK if available
try {
  dynatraceSDK = require('@dynatrace/oneagent-sdk');
  console.log('✅ OneAgent SDK loaded successfully');
} catch (error) {
  console.log('⚠️  OneAgent SDK not available, using fallback mode');
}

/**
 * Add custom attributes to the current OneAgent span
 * @param {Object} attributes - Key-value pairs to add as span attributes
 */
function addCustomAttributes(attributes) {
  if (!dynatraceSDK) {
    // Fallback: Add as response headers for visibility
    return attributes;
  }

  try {
    const tracer = dynatraceSDK.createTracer();
    const span = tracer.getCurrentSpan();
    
    if (span) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.addCustomAttribute(key, value);
      });
    }
  } catch (error) {
    console.log('⚠️  Error adding custom attributes:', error.message);
  }
  
  return attributes;
}

/**
 * Create a custom span with OneAgent SDK
 * @param {string} operationName - Name of the operation
 * @param {Function} callback - Function to execute within the span
 */
function withCustomSpan(operationName, callback) {
  if (!dynatraceSDK) {
    // Fallback: Execute without custom span
    return callback();
  }

  try {
    const tracer = dynatraceSDK.createTracer();
    return tracer.startSpan(operationName, (span) => {
      return callback(span);
    });
  } catch (error) {
    console.log('⚠️  Error creating custom span:', error.message);
    return callback();
  }
}

/**
 * Add business event to Dynatrace
 * @param {string} eventType - Type of business event
 * @param {Object} data - Event data
 */
function sendBusinessEvent(eventType, data) {
  // This would integrate with Dynatrace BizEvents API
  console.log(`📊 Business Event [${eventType}]:`, JSON.stringify(data, null, 2));
}

module.exports = {
  addCustomAttributes,
  withCustomSpan,
  sendBusinessEvent,
  isSDKAvailable: () => !!dynatraceSDK
};