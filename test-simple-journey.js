#!/usr/bin/env node

// Simple test script to verify journey simulation works
import http from 'http';

const testPayload = {
  journeyName: "Simple Test",
  companyName: "TestCorp", 
  numberOfCustomers: 1,
  steps: [{
    stepName: "ProductSelection"
  }]
};

console.log('🧪 Testing simple journey simulation...');

const data = JSON.stringify(testPayload);
const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/journey-simulation/simulate-journey',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  timeout: 15000
};

const req = http.request(options, (res) => {
  console.log(`✅ Response status: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      console.log('✅ Journey simulation result:', {
        success: result.success,
        customersProcessed: result.loadTestSummary?.customersProcessed,
        successfulCustomers: result.loadTestSummary?.successfulCustomers,
        failedCustomers: result.loadTestSummary?.failedCustomers
      });
    } catch (e) {
      console.log('📄 Raw response:', body.substring(0, 500));
    }
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ Request error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('⏰ Request timeout after 15 seconds');
  req.destroy();
  process.exit(1);
});

req.write(data);
req.end();

setTimeout(() => {
  console.error('🚨 Test script timeout after 20 seconds');
  process.exit(1);
}, 20000);