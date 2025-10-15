#!/usr/bin/env node

/**
 * Startup Validation Script for BizObs Application
 * Validates that all essential services and dependencies are running
 */

const http = require('http');

// Configuration
const config = {
  mainServerPort: process.env.PORT || 4000,
  timeout: 5000,
  retries: 3
};

// Essential endpoints to validate
const essentialEndpoints = [
  { name: 'Main Server Health', path: '/api/health' },
  { name: 'Service List', path: '/api/admin/services' },
  { name: 'Service Status', path: '/api/admin/services/status' },
  { name: 'Web Interface', path: '/', method: 'GET' }
];

// Core services that should be running
const expectedCoreServices = [
  'DiscoveryService',
  'AwarenessService', 
  'ConsiderationService',
  'PurchaseService',
  'CompletionService',
  'RetentionService',
  'AdvocacyService',
  'DataPersistenceService'
];

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: config.mainServerPort,
      path,
      method,
      timeout: config.timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Validate endpoint with retries
async function validateEndpoint(endpoint, retries = config.retries) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await makeRequest(endpoint.path, endpoint.method);
      if (result.statusCode === 200) {
        return { success: true, result };
      }
      console.warn(`⚠️  ${endpoint.name}: HTTP ${result.statusCode} (attempt ${i + 1}/${retries})`);
    } catch (error) {
      console.warn(`⚠️  ${endpoint.name}: ${error.message} (attempt ${i + 1}/${retries})`);
    }
    
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { success: false };
}

// Main validation function
async function validateStartup() {
  console.log('🔍 BizObs Startup Validation');
  console.log('================================');
  console.log(`Target server: http://localhost:${config.mainServerPort}`);
  console.log('');

  let overallSuccess = true;
  const results = {};

  // 1. Validate essential endpoints
  console.log('📡 Validating Essential Endpoints...');
  for (const endpoint of essentialEndpoints) {
    const validation = await validateEndpoint(endpoint);
    results[endpoint.name] = validation.success;
    
    if (validation.success) {
      console.log(`✅ ${endpoint.name}`);
    } else {
      console.log(`❌ ${endpoint.name}`);
      overallSuccess = false;
    }
  }

  console.log('');

  // 2. Validate core services are running
  console.log('🏗️  Validating Core Services...');
  try {
    const servicesResult = await makeRequest('/api/admin/services');
    if (servicesResult.statusCode === 200 && servicesResult.data.services) {
      const runningServices = servicesResult.data.services.map(s => s.service);
      
      for (const expectedService of expectedCoreServices) {
        if (runningServices.includes(expectedService)) {
          console.log(`✅ ${expectedService}`);
          results[expectedService] = true;
        } else {
          console.log(`❌ ${expectedService} (not running)`);
          results[expectedService] = false;
          overallSuccess = false;
        }
      }
      
      const extraServices = runningServices.filter(s => !expectedCoreServices.includes(s));
      if (extraServices.length > 0) {
        console.log(`ℹ️  Additional services running: ${extraServices.join(', ')}`);
      }
    } else {
      console.log('❌ Unable to retrieve service list');
      overallSuccess = false;
    }
  } catch (error) {
    console.log(`❌ Service validation failed: ${error.message}`);
    overallSuccess = false;
  }

  console.log('');

  // 3. Validate service health
  console.log('💓 Validating Service Health...');
  try {
    const statusResult = await makeRequest('/api/admin/services/status');
    if (statusResult.statusCode === 200 && statusResult.data.services) {
      const serviceCount = statusResult.data.totalServices;
      const runningCount = statusResult.data.runningServices;
      
      console.log(`📊 Services: ${runningCount}/${serviceCount} running`);
      
      if (runningCount === serviceCount && serviceCount >= expectedCoreServices.length) {
        console.log('✅ All services healthy');
      } else {
        console.log('⚠️  Some services may not be healthy');
      }
    }
  } catch (error) {
    console.log(`❌ Health validation failed: ${error.message}`);
  }

  console.log('');
  console.log('================================');
  
  if (overallSuccess) {
    console.log('🎉 STARTUP VALIDATION PASSED');
    console.log('All essential services and dependencies are running correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  STARTUP VALIDATION FAILED');
    console.log('Some services or dependencies are not working correctly.');
    console.log('Check the logs above for details.');
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  validateStartup().catch(error => {
    console.error('❌ Validation script error:', error.message);
    process.exit(1);
  });
}

module.exports = { validateStartup };