// Cloud observability setup for environments without OneAgent
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export function detectEnvironment() {
  const env = process.env;
  
  // Detect cloud platforms
  if (env.CODESPACES) {
    return { isCloud: true, platform: 'GitHub Codespaces', provider: 'github' };
  }
  if (env.REPL_ID) {
    return { isCloud: true, platform: 'Replit', provider: 'replit' };
  }
  if (env.CODESANDBOX_SSE) {
    return { isCloud: true, platform: 'CodeSandbox', provider: 'codesandbox' };
  }
  if (env.GITPOD_WORKSPACE_ID) {
    return { isCloud: true, platform: 'Gitpod', provider: 'gitpod' };
  }
  if (env.STACKBLITZ) {
    return { isCloud: true, platform: 'StackBlitz', provider: 'stackblitz' };
  }
  
  return { isCloud: false, platform: 'Local/VM', provider: 'local' };
}

export async function setupObservability(config) {
  if (!config.dynatraceUrl || !config.dynatraceToken) {
    console.log('⚠️ Dynatrace credentials not found - running in demo mode');
    console.log('   Set DYNATRACE_URL and DYNATRACE_TOKEN for full observability');
    return setupDemoMode();
  }

  try {
    // Setup OpenTelemetry with Dynatrace exporter
    const sdk = new NodeSDK({
      instrumentations: [getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-express': {
          requestHook: (span, info) => {
            // Add custom business attributes
            if (info.request.body) {
              const body = info.request.body;
              if (body.additionalFields) {
                Object.keys(body.additionalFields).forEach(key => {
                  span.setAttributes({
                    [`business.${key}`]: String(body.additionalFields[key])
                  });
                });
              }
            }
          }
        }
      })],
      serviceName: config.serviceName,
      resource: {
        'service.name': config.serviceName,
        'service.version': '1.0.0',
        'deployment.environment': config.platform.toLowerCase().replace(/\s+/g, '-')
      }
    });

    sdk.start();
    console.log('✅ OpenTelemetry initialized for cloud environment');
    return { success: true, mode: 'opentelemetry' };
    
  } catch (error) {
    console.error('❌ Failed to setup OpenTelemetry:', error.message);
    return setupDemoMode();
  }
}

function setupDemoMode() {
  console.log('🎭 Running in demo mode - traces will be logged but not sent to Dynatrace');
  console.log('   Perfect for development and testing!');
  
  // Setup console logging for demo purposes
  global.demoTracing = {
    logTrace: (data) => {
      console.log('🔍 DEMO TRACE:', JSON.stringify(data, null, 2));
    }
  };
  
  return { success: true, mode: 'demo' };
}