#!/usr/bin/env node

import http from 'http';

// Test payload with all the fields we want to verify
const testPayload = {
  journeyName: "Test AdditionalFields Fix",
  companyName: "TestCorp", 
  numberOfCustomers: 1,
  steps: [{"stepName": "ProductSelection"}],
  additionalFields: {
    ProductId: ["SKU12345", "SKU67890"],
    ProductName: ["Premium Widget", "Standard Widget"],
    deviceType: "mobile",
    source: "mobile-app"
  },
  customerProfile: {
    userId: "test123",
    segment: "premium",
    region: "US"
  },
  traceMetadata: {
    source: "test",
    campaign: "summer2025",
    channel: "mobile"
  }
};

function makeRequest() {
  const postData = JSON.stringify(testPayload);

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/journey-simulation/simulate-journey',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🔍 Testing additionalFields fix...');
  
  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(responseData);
        
        console.log('\n📊 Test Results:');
        console.log('================');
        console.log(`✅ Success: ${response.success}`);
        
        if (response.success && response.sampleJourney) {
          console.log(`🆔 Correlation ID: ${response.sampleJourney.correlationId}`);
          
          console.log('\n🔍 AdditionalFields in Response:');
          console.log(JSON.stringify(response.sampleJourney.additionalFields, null, 2));
          
          console.log('\n👤 CustomerProfile in Response:');
          console.log(JSON.stringify(response.sampleJourney.customerProfile, null, 2));
          
          console.log('\n🏷️  TraceMetadata in Response:');
          console.log(JSON.stringify(response.sampleJourney.traceMetadata, null, 2));
          
          // Verify the fix worked
          const hasAdditionalFields = response.sampleJourney.additionalFields && 
                                    Object.keys(response.sampleJourney.additionalFields).length > 0;
          const hasCustomerProfile = response.sampleJourney.customerProfile && 
                                   Object.keys(response.sampleJourney.customerProfile).length > 0;
          const hasTraceMetadata = response.sampleJourney.traceMetadata && 
                                 Object.keys(response.sampleJourney.traceMetadata).length > 0;
          
          console.log(`\n🎉 Fix Status:`);
          console.log(`   AdditionalFields: ${hasAdditionalFields ? '✅ FIXED' : '❌ Missing'}`);
          console.log(`   CustomerProfile:  ${hasCustomerProfile ? '✅ FIXED' : '❌ Missing'}`);
          console.log(`   TraceMetadata:    ${hasTraceMetadata ? '✅ FIXED' : '❌ Missing'}`);
          
        } else {
          console.log(`❌ Error: ${response.error || 'Unknown error'}`);
        }
        
      } catch (e) {
        console.log('❌ Error parsing response:', e.message);
        console.log('Raw response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.log(`❌ Request error: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

// Wait a moment then make the request
setTimeout(makeRequest, 2000);