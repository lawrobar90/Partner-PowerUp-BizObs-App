# Ultra-Simplified JSON for OneAgent - Before vs After

## The Original Complex rqBody (BEFORE)
```json
{
  "journeyId": "journey_1760965525450",
  "customerId": "customer_1760965525450", 
  "correlationId": "4608b502-868d-4543-8475-9ec9e45c5d1f",
  "startTime": "2025-10-20T13:05:26.964Z",
  "companyName": "Next5",
  "domain": "www.next.co.uk",
  "industryType": "Retail",
  "stepName": "ProductSelection",
  "stepIndex": 2,
  "totalSteps": 6,
  "stepDescription": "Customer selects multiple products and adds them to cart",
  "stepCategory": "Selection",
  "estimatedDuration": 8,
  "businessRationale": "Selecting 2–3 items typically takes under 10 minutes once browsing is complete",
  "substeps": [
    {
      "substepName": "View product details and check availability",
      "duration": 3
    },
    {
      "substepName": "Select size and add to cart", 
      "duration": 5
    }
  ],
  "estimatedDurationMs": 480000,
  "subSteps": [],
  "hasError": false,
  "additionalFields": {
    "deviceType": "mobile",
    "browser": "Chrome",
    "location": "Manchester, UK",
    "entryChannel": "organic",
    "customerIntent": "purchase",
    "loyaltyStatus": "new",
    "abandonmentRisk": "medium",
    "conversionProbability": 0.75,
    "personalizationTags": ["shopping", "products"],
    "ProductId": ["SKU12345", "SKU67890", "SKU54321"],
    "ProductName": ["Men's Slim Fit Jeans", "Women's Winter Coat", "Kids' Graphic Hoodie"],
    "ProductCost": [39.99, 89, 25.5]
  },
  "customerProfile": {
    "userId": "user_i4ujg3zqh",
    "email": "customer@www.next.co.uk", 
    "demographic": "consumers aged 18-65",
    "painPoints": ["high prices", "limited selection"],
    "goals": ["quality products", "good prices"]
  },
  "traceMetadata": {
    "correlationId": "trace_1760958471116",
    "sessionId": "session_qp3euapii",
    "businessContext": {
      "campaignSource": "organic",
      "customerSegment": "consumer", 
      "businessValue": 1500
    }
  }
}
```

**DQL Problem**: Requires complex JSON parsing like:
```sql
SELECT JSON_VALUE(requestBody, "$.additionalFields.deviceType"),
       JSON_VALUE(requestBody, "$.customerProfile.userId"),
       JSON_VALUE(requestBody, "$.traceMetadata.businessContext.campaignSource")
FROM useraction 
WHERE application = "BizObs-CustomerJourney"
```

---

## The New Ultra-Simplified rqBody (AFTER)
```json
{
  "stepName": "ProductSelection",
  "companyName": "Next5", 
  "domain": "www.next.co.uk",
  "industryType": "Retail",
  "stepIndex": 2,
  "totalSteps": 6,
  "stepDescription": "Customer selects multiple products and adds them to cart",
  "stepCategory": "Selection",
  "estimatedDuration": 8,
  "businessRationale": "Selecting 2–3 items typically takes under 10 minutes once browsing is complete",
  "estimatedDurationMs": 480000,
  "hasError": false,
  
  // FLATTENED additionalFields - NO nested object!
  "additional_deviceType": "mobile",
  "additional_browser": "Chrome", 
  "additional_location": "Manchester, UK",
  "additional_entryChannel": "organic",
  "additional_customerIntent": "purchase",
  "additional_loyaltyStatus": "new",
  "additional_abandonmentRisk": "medium",
  "additional_conversionProbability": 0.75,
  "additional_personalizationTags": "shopping, products",
  "additional_ProductId": "SKU12345, SKU67890, SKU54321",
  "additional_ProductId_0": "SKU12345",
  "additional_ProductId_1": "SKU67890", 
  "additional_ProductId_2": "SKU54321",
  "additional_ProductName": "Men's Slim Fit Jeans, Women's Winter Coat, Kids' Graphic Hoodie",
  "additional_ProductName_0": "Men's Slim Fit Jeans",
  "additional_ProductName_1": "Women's Winter Coat",
  "additional_ProductName_2": "Kids' Graphic Hoodie",
  "additional_ProductCost": "39.99, 89, 25.5",
  "additional_ProductCost_0": 39.99,
  "additional_ProductCost_1": 89,
  "additional_ProductCost_2": 25.5,
  
  // FLATTENED customerProfile - NO nested object!
  "customer_userId": "user_i4ujg3zqh",
  "customer_email": "customer@www.next.co.uk",
  "customer_demographic": "consumers aged 18-65", 
  "customer_painPoints": "high prices, limited selection",
  "customer_goals": "quality products, good prices",
  
  // FLATTENED traceMetadata - NO nested objects!
  "trace_correlationId": "trace_1760958471116",
  "trace_sessionId": "session_qp3euapii",
  "business_campaignSource": "organic",
  "business_customerSegment": "consumer",
  "business_businessValue": 1500,
  
  // FLATTENED substeps - NO nested objects!
  "substeps_count": 2,
  "substep_0_name": "View product details and check availability",
  "substep_0_duration": 3,
  "substep_1_name": "Select size and add to cart",
  "substep_1_duration": 5
}
```

**DQL Solution**: Dead simple queries!
```sql
-- Get device types
SELECT additional_deviceType 
FROM useraction 
WHERE application = "BizObs-CustomerJourney"

-- Get customer info  
SELECT customer_userId, customer_email
FROM useraction
WHERE application = "BizObs-CustomerJourney"

-- Get business context
SELECT business_campaignSource, business_customerSegment
FROM useraction
WHERE application = "BizObs-CustomerJourney"

-- Get specific product costs
SELECT additional_ProductCost_0, additional_ProductCost_1, additional_ProductCost_2
FROM useraction
WHERE application = "BizObs-CustomerJourney"

-- Get substep details
SELECT substep_0_name, substep_0_duration, substep_1_name, substep_1_duration
FROM useraction
WHERE application = "BizObs-CustomerJourney"
```

---

## Summary

✅ **ELIMINATED** all nested JSON objects from the rqBody  
✅ **FLATTENED** everything to simple top-level fields  
✅ **SIMPLIFIED** DQL queries - no JSON parsing needed  
✅ **PRESERVED** array data with both list and indexed access  
✅ **CLEAR** naming conventions with intuitive prefixes  

**Result**: This is as simple as JSON can get while preserving all the data! 🎉