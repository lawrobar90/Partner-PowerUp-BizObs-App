import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/config/copilot-prompt - Returns the CORRECTED AGGRESSIVE timestamp-mandatory prompt
router.get('/copilot-prompt', async (req, res) => {
  try {
    const { company = 'Smyths', domain = 'smyths.co.uk', industry = 'Retail' } = req.query;
    
    // Generate current timestamp for journey start
    const timestamp = Date.now();
    const journeyStartTime = new Date().toISOString();
    
    // Use the corrected aggressive prompt that FORCES timestamp inclusion
    const prompt = `🚨 CRITICAL: This response REQUIRES timestamps or it will be rejected 🚨

Create a customer journey for ${company} (${domain}) in ${industry} with MANDATORY timestamps.

⚠️ YOUR RESPONSE WILL BE DELETED IF IT LACKS TIMESTAMPS ⚠️

Journey starts at: ${journeyStartTime}

You MUST respond with this EXACT structure (replace examples with real data):

{
  "journey": {
    "companyName": "${company}",
    "domain": "${domain}",
    "industryType": "${industry}",
    "journeyId": "journey_${timestamp}",
    "journeyStartTime": "${journeyStartTime}",
    "steps": [
      {
        "stepIndex": 1,
        "stepName": "ProductBrowsing",
        "serviceName": "ProductBrowsingService",
        "description": "Customer explores toys and games online",
        "category": "Discovery",
        "timestamp": "${journeyStartTime}",
        "estimatedDuration": 12,
        "businessRationale": "Retail customers spend 10-15 minutes browsing products before selection",
        "substeps": [
          {
            "substepName": "Category navigation",
            "timestamp": "${journeyStartTime}",
            "duration": 4
          },
          {
            "substepName": "Product filtering", 
            "timestamp": "2025-10-14T15:21:00.000Z",
            "duration": 5
          },
          {
            "substepName": "Product comparison",
            "timestamp": "2025-10-14T15:26:00.000Z",
            "duration": 3
          }
        ]
      },
      {
        "stepIndex": 2,
        "stepName": "ProductSelection",
        "serviceName": "ProductSelectionService",
        "description": "Customer selects specific products for purchase",
        "category": "Selection",
        "timestamp": "2025-10-14T15:29:00.000Z",
        "estimatedDuration": 8,
        "businessRationale": "Product selection takes 5-10 minutes for detailed review",
        "substeps": [
          {
            "substepName": "Product details review",
            "timestamp": "2025-10-14T15:29:00.000Z",
            "duration": 3
          },
          {
            "substepName": "Stock availability check",
            "timestamp": "2025-10-14T15:32:00.000Z",
            "duration": 2
          },
          {
            "substepName": "Size and options selection",
            "timestamp": "2025-10-14T15:34:00.000Z",
            "duration": 3
          }
        ]
      },
      {
        "stepIndex": 3,
        "stepName": "CartManagement",
        "serviceName": "CartManagementService",
        "description": "Adding multiple products to shopping cart",
        "category": "Cart",
        "timestamp": "2025-10-14T15:37:00.000Z",
        "estimatedDuration": 6,
        "businessRationale": "Multi-product cart management takes 5-8 minutes",
        "substeps": [
          {
            "substepName": "Add first product to cart",
            "timestamp": "2025-10-14T15:37:00.000Z",
            "duration": 2
          },
          {
            "substepName": "Continue shopping for more items",
            "timestamp": "2025-10-14T15:39:00.000Z",
            "duration": 4
          }
        ]
      },
      {
        "stepIndex": 4,
        "stepName": "SecureCheckout",
        "serviceName": "SecureCheckoutService",
        "description": "Complete payment and shipping details",
        "category": "Purchase",
        "timestamp": "2025-10-14T15:43:00.000Z",
        "estimatedDuration": 10,
        "businessRationale": "Checkout with multiple items takes 8-12 minutes",
        "substeps": [
          {
            "substepName": "Shipping address entry",
            "timestamp": "2025-10-14T15:43:00.000Z",
            "duration": 4
          },
          {
            "substepName": "Payment processing",
            "timestamp": "2025-10-14T15:47:00.000Z",
            "duration": 6
          }
        ]
      },
      {
        "stepIndex": 5,
        "stepName": "OrderConfirmation",
        "serviceName": "OrderConfirmationService",
        "description": "Order confirmation and email receipt",
        "category": "Confirmation",
        "timestamp": "2025-10-14T15:53:00.000Z",
        "estimatedDuration": 3,
        "businessRationale": "Order confirmation is immediate but customer reviews details",
        "substeps": [
          {
            "substepName": "Confirmation display",
            "timestamp": "2025-10-14T15:53:00.000Z",
            "duration": 1
          },
          {
            "substepName": "Email receipt review",
            "timestamp": "2025-10-14T15:54:00.000Z",
            "duration": 2
          }
        ]
      },
      {
        "stepIndex": 6,
        "stepName": "DeliveryTracking",
        "serviceName": "DeliveryTrackingService",
        "description": "Track order delivery status",
        "category": "Fulfillment",
        "timestamp": "2025-10-15T09:00:00.000Z",
        "estimatedDuration": 1440,
        "businessRationale": "Next day delivery, customer tracks progress",
        "substeps": [
          {
            "substepName": "Order preparation notification",
            "timestamp": "2025-10-15T09:00:00.000Z",
            "duration": 60
          },
          {
            "substepName": "Delivery tracking updates",
            "timestamp": "2025-10-15T10:00:00.000Z",
            "duration": 1380
          }
        ]
      }
    ]
  },
  "customerProfile": {
    "userId": "user_${company.toLowerCase()}_${timestamp}",
    "email": "customer@example.com",
    "demographic": "Target demographic for ${industry}",
    "painPoints": ["stock availability", "delivery timing"],
    "goals": ["quality products", "competitive prices"],
    "journeyStartTimestamp": "${journeyStartTime}"
  },
  "traceMetadata": {
    "correlationId": "trace_${company.toLowerCase()}_${timestamp}",
    "sessionId": "session_${industry.toLowerCase()}_${timestamp}",
    "businessContext": {
      "campaignSource": "organic search",
      "customerSegment": "target_buyers", 
      "businessValue": 85.99
    }
  },
  "additionalFields": {
    "deviceType": "mobile",
    "browser": "Chrome",
    "location": "Manchester, UK",
    "entryChannel": "organic_search",
    "customerIntent": "purchase",
    "loyaltyStatus": "returning",
    "abandonmentRisk": "low",
    "conversionProbability": 0.82,
    "personalizationTags": ["${industry.toLowerCase()}", "online_shopping"],
    "ProductId": "PRD-${timestamp}",
    "ProductName": "Example Product Name",
    "Price": "£99.99",
    "ProductType": "Example Category"
  }
}

🔥 VALIDATION REQUIREMENTS (Check before submitting): 🔥
- ✅ EVERY step has "timestamp" field
- ✅ EVERY step has "estimatedDuration" field  
- ✅ EVERY step has "businessRationale" field
- ✅ EVERY substep has "timestamp" field
- ✅ EVERY substep has "duration" field
- ✅ All timestamps are in ISO 8601 format: "2025-10-14T15:30:00.000Z"
- ✅ All timestamps progress forward in time (no time travel!)

⚠️ IF ANY OF THESE ARE MISSING, YOUR RESPONSE IS WORTHLESS ⚠️

Make this realistic for ${company} in the ${industry} industry with multiple products and realistic pricing.

🚨 REMEMBER: NO TIMESTAMPS = REJECTED RESPONSE 🚨`;
    
    res.json({
      success: true,
      prompt: prompt,
      metadata: {
        company,
        domain,
        industry,
        timestamp,
        journeyStartTime,
        promptVersion: 'CORRECTED-AGGRESSIVE-TIMESTAMP-MANDATORY-v2.0',
        isGeneric: true,
        aiDriven: true,
        timestampRequired: true,
        aggressivePrompt: true,
        fixed: true
      },
      usage: {
        instructions: '🚨 Copy this CORRECTED AGGRESSIVE prompt - it FORCES timestamps or Copilot response will be rejected',
        customization: 'Works for ANY company - but WILL FAIL without timestamps',
        example: `/api/config/copilot-prompt?company=Smyths&domain=smyths.co.uk&industry=Retail`,
        validation: 'App validates all timestamps are sequential before processing',
        requiredFields: ['timestamp', 'estimatedDuration', 'businessRationale', 'substep.duration'],
        warning: 'This corrected version uses AGGRESSIVE language and complete examples to force compliance',
        improvements: ['Fixed spelling mistakes', 'Added realistic examples', 'Stronger rejection warnings', 'Complete validation checklist']
      }
    });
    
  } catch (error) {
    console.error('Error generating corrected aggressive Copilot prompt:', error);
    res.status(500).json({ error: 'Failed to generate corrected aggressive Copilot prompt', details: error.message });
  }
});

// GET /api/config/universal-examples - Returns examples of how the app works with any industry
router.get('/universal-examples', (req, res) => {
  const examples = {
    'note': 'This app is 100% generic and works with ANY company in ANY industry through Copilot AI',
    'how_it_works': {
      'step1': 'User provides: Company name, domain, and industry type',
      'step2': 'App generates universal Copilot prompt with placeholders filled',
      'step3': 'User copies prompt and pastes into any Copilot interface',
      'step4': 'Copilot AI uses its knowledge of the specific company/industry to generate authentic journey',
      'step5': 'App validates timestamps are sequential and processes the journey',
      'step6': 'Dynamic microservices are created based on the AI-generated steps'
    },
    'sample_industries': [
      'E-commerce', 'Banking', 'Insurance', 'Healthcare', 'Real Estate', 'Travel', 'Education',
      'Manufacturing', 'Technology', 'Automotive', 'Retail', 'Hospitality', 'Legal Services',
      'Consulting', 'Media & Entertainment', 'Telecommunications', 'Energy', 'Food & Beverage'
    ],
    'example_companies': [
      'Tesla (Automotive)', 'Netflix (Entertainment)', 'Stripe (Fintech)', 'Zoom (Technology)',
      'Airbnb (Hospitality)', 'Shopify (E-commerce)', 'Spotify (Music)', 'Uber (Transportation)',
      'Microsoft (Software)', 'Nike (Retail)', 'McDonald\'s (Food)', 'Goldman Sachs (Banking)'
    ],
    'ai_advantages': [
      'Copilot knows specific company business models',
      'AI understands industry-specific processes and timing',
      'Generates authentic step names and descriptions',
      'Applies realistic timing patterns for each industry',
      'No manual customization needed - everything is AI-driven'
    ],
    'timestamp_intelligence': [
      'AI considers business hours for B2B processes',
      'Applies industry-specific processing times',
      'Accounts for customer behavior patterns',
      'Ensures logical sequence of business operations',
      'Validates all timestamps are chronologically ordered'
    ]
  };
  
  res.json({
    success: true,
    universalApp: true,
    examples,
    usage: 'This demonstrates how the app works universally with any company/industry combination'
  });
});

// GET /api/config/timestamp-logic - Returns business logic for timestamp calculation
router.get('/timestamp-logic', (req, res) => {
  const logic = {
    businessRules: {
      workingHours: '09:00-17:00 UTC',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timezoneBehavior: 'Adjust for customer location when specified'
    },
    stepTypes: {
      immediate: {
        description: 'Real-time or near real-time actions',
        examples: ['Authentication', 'Cart actions', 'Form submissions'],
        timing: 'Seconds to minutes'
      },
      business: {
        description: 'Business process that requires human or system processing',
        examples: ['Approvals', 'Reviews', 'Verifications'],
        timing: 'Hours to business days',
        constraints: 'Respects business hours and holidays'
      },
      customer: {
        description: 'Customer-driven actions that can happen anytime',
        examples: ['Document gathering', 'Payment initiation', 'Information review'],
        timing: 'Minutes to days',
        behavior: 'Often happens outside business hours'
      },
      calendar: {
        description: 'Physical or logistics processes',
        examples: ['Shipping', 'Delivery', 'Installation'],
        timing: 'Days to weeks',
        constraints: 'Calendar days, weather, logistics'
      }
    },
    implementation: {
      weekend_handling: 'Business processes pause, customer actions continue',
      holiday_impact: 'Additional delays for business processes',
      peak_hours: 'Higher failure rates during system peak times',
      timezone_support: 'Customer location affects timing expectations'
    }
  };
  
  res.json({
    success: true,
    timestampLogic: logic,
    usage: 'Reference for understanding how realistic timestamps are calculated'
  });
});

export default router;