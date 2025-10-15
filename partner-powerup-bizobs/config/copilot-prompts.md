# Generic Copilot Prompt for Any Customer Journey

## Universal Customer Journey Generation Prompt (With Sequential Timestamps)

```
Create a realistic customer journey for [COMPANY_NAME] ([DOMAIN]) in the [INDUSTRY] industry. Generate step names that reflect the actual customer experience for this specific company and industry with REALISTIC TIMESTAMPS that are STRICTLY SEQUENTIAL (each timestamp must be after the previous step).

CONTEXT:
- Company: [COMPANY_NAME]
- Domain: [DOMAIN] 
- Industry: [INDUSTRY]
- Journey Start Time: [JOURNEY_START_TIMESTAMP]

CRITICAL TIMESTAMP REQUIREMENTS:
1. **STRICT SEQUENTIAL ORDER**: Each step timestamp MUST be chronologically after the previous step
2. **NO TIME TRAVEL**: Never create a timestamp that is before the previous step
3. **REALISTIC GAPS**: Use your knowledge of [INDUSTRY] to determine appropriate time gaps between steps
4. **BUSINESS LOGIC**: Consider business hours, customer behavior, and industry-specific processes for [COMPANY_NAME]

TIMESTAMP INTELLIGENCE FOR ANY INDUSTRY:
Use your knowledge of [INDUSTRY] and [COMPANY_NAME]'s business model to create realistic timing:

**Fast Digital Services** (Streaming, SaaS, Social Media):
- Step gaps: Seconds to minutes
- Example: Signup → Verification → First Use (5 minutes total)

**E-commerce/Retail** (Amazon, eBay, any online store):
- Browse → Select → Purchase: 15-30 minutes
- Purchase → Delivery: 1-3 days

**Financial Services** (Banks, Insurance, Investment):
- Application → Approval: Hours to weeks
- Consider compliance, verification steps

**Healthcare** (Hospitals, Clinics, Telehealth):
- Appointment → Treatment → Follow-up: Days to weeks
- Consider provider availability, treatment time

**Travel/Hospitality** (Airlines, Hotels, Booking):
- Search → Book → Experience: Hours to months ahead
- Consider seasonal patterns, advance booking

**B2B Services** (Consulting, Enterprise Software):
- Inquiry → Proposal → Implementation: Weeks to months
- Consider business cycles, procurement processes

**Manufacturing/Physical Products**:
- Order → Production → Delivery: Days to weeks
- Consider supply chain, customization time

BUSINESS LOGIC RULES (Apply based on [INDUSTRY]):
1. **Instant Steps**: Authentication, form submissions, digital confirmations
2. **Processing Steps**: Payments, approvals, automated checks (minutes to hours)
3. **Human Steps**: Reviews, consultations, custom work (hours to days)
4. **Physical Steps**: Manufacturing, shipping, installation (days to weeks)
5. **Business Hours**: Some industries only process during business hours
6. **Customer-Driven**: Some steps depend on customer action timing

Respond with this EXACT JSON structure:
{
  "journey": {
    "companyName": "[COMPANY_NAME]",
    "domain": "[DOMAIN]",
    "industryType": "[INDUSTRY]",
    "journeyId": "journey_[TIMESTAMP]",
    "journeyStartTime": "[JOURNEY_START_TIMESTAMP]",
    "businessContext": {
      "timezone": "UTC",
      "industryCharacteristics": "[DESCRIBE_INDUSTRY_TIMING_PATTERNS]",
      "companySpecifics": "[DESCRIBE_COMPANY_SPECIFIC_FACTORS]"
    },
    "steps": [
      {
        "stepIndex": 1,
        "stepName": "[COMPANY_AND_INDUSTRY_SPECIFIC_STEP_NAME]",
        "serviceName": "[STEP_NAME]Service",
        "description": "[REALISTIC_STEP_DESCRIPTION_FOR_THIS_COMPANY]",
        "category": "[STEP_CATEGORY]",
        "timestamp": "[JOURNEY_START_TIMESTAMP]",
        "estimatedDuration": "[REALISTIC_DURATION_MINUTES]",
        "businessRationale": "[WHY_THIS_TIMING_MAKES_SENSE_FOR_COMPANY_AND_INDUSTRY]",
        "substeps": [
          {
            "substepName": "[SUBSTEP_1]",
            "timestamp": "[SUBSTEP_TIMESTAMP_AFTER_STEP_START]",
            "duration": "[SUBSTEP_DURATION]"
          }
        ]
      },
      {
        "stepIndex": 2,
        "stepName": "[NEXT_LOGICAL_STEP_FOR_THIS_COMPANY]",
        "serviceName": "[STEP_NAME]Service", 
        "description": "[STEP_DESCRIPTION]",
        "category": "[STEP_CATEGORY]",
        "timestamp": "[TIMESTAMP_AFTER_STEP_1]",
        "estimatedDuration": "[DURATION_MINUTES]",
        "businessRationale": "[RATIONALE]",
        "substeps": [...]
      }
      // Continue for exactly 6 steps, each timestamp AFTER the previous
    ]
  },
  "customerProfile": {
    "userId": "user_[RANDOM_ID]",
    "email": "customer@[DOMAIN]",
    "demographic": "[APPROPRIATE_FOR_COMPANY_AND_INDUSTRY]",
    "painPoints": ["[INDUSTRY_SPECIFIC_PAIN_1]","[INDUSTRY_SPECIFIC_PAIN_2]"],
    "goals": ["[COMPANY_SPECIFIC_GOAL_1]","[COMPANY_SPECIFIC_GOAL_2]"]
  },
  "traceMetadata": {
    "correlationId": "trace_[TIMESTAMP]",
    "sessionId": "session_[RANDOM_ID]",
    "businessContext": {
      "campaignSource": "[APPROPRIATE_FOR_INDUSTRY]", 
      "customerSegment": "[SEGMENT_FOR_COMPANY]", 
      "businessValue": [REALISTIC_VALUE_FOR_INDUSTRY]
    }
  }
}

STEP NAMING REQUIREMENTS:
- Use your knowledge of [COMPANY_NAME] and [INDUSTRY] to create appropriate step names
- Steps should reflect the actual customer experience with [COMPANY_NAME]
- Each stepName becomes serviceName in PascalCase + 'Service'
- Be specific to the company and industry - no generic names
- Consider the company's actual business model and customer flow

EXAMPLES OF COMPANY-SPECIFIC STEPS:
- Netflix: AccountCreation → ContentBrowsing → StreamingExperience → BillingSetup
- Uber: RideRequest → DriverMatching → TripExecution → PaymentProcessing  
- Airbnb: PropertySearch → BookingRequest → StayExperience → ReviewSubmission
- Salesforce: DemoRequest → RequirementsGathering → TrialSetup → ContractNegotiation

TIMESTAMP SEQUENCING EXAMPLES:
✅ CORRECT:
Step 1: "2025-10-14T10:00:00.000Z" (Start)
Step 2: "2025-10-14T10:15:00.000Z" (15 minutes later)
Step 3: "2025-10-14T10:17:00.000Z" (2 minutes later)
Step 4: "2025-10-15T09:00:00.000Z" (Next business day)

❌ WRONG:
Step 1: "2025-10-14T10:00:00.000Z"
Step 2: "2025-10-14T09:45:00.000Z" (BEFORE step 1 - NEVER DO THIS)
Step 3: "2025-10-14T10:15:00.000Z"

CRITICAL: Every timestamp must be chronologically AFTER the previous step timestamp. No exceptions.
```

## Usage:
Replace [COMPANY_NAME], [DOMAIN], [INDUSTRY], and [JOURNEY_START_TIMESTAMP] with actual values. The AI will generate company and industry-specific steps with proper sequential timing.

Respond with this EXACT JSON structure:
{
  "journey": {
    "companyName": "[COMPANY_NAME]",
    "domain": "[DOMAIN]",
    "industryType": "[INDUSTRY]",
    "journeyId": "journey_[TIMESTAMP]",
    "journeyStartTime": "[JOURNEY_START_TIMESTAMP]",
    "businessHours": {
      "timezone": "UTC",
      "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "workingHours": "09:00-17:00"
    },
    "steps": [
      {
        "stepIndex": 1,
        "stepName": "[INDUSTRY_APPROPRIATE_STEP_NAME]",
        "serviceName": "[STEP_NAME]Service",
        "description": "[REALISTIC_STEP_DESCRIPTION]",
        "category": "[STEP_CATEGORY]",
        "timestamp": "[REALISTIC_TIMESTAMP_ISO_8601]",
        "estimatedDuration": "[REALISTIC_DURATION_MINUTES]",
        "businessRationale": "[WHY_THIS_TIMING_MAKES_SENSE]",
        "substeps": [
          {
            "substepName": "[SUBSTEP_1]",
            "timestamp": "[SUBSTEP_TIMESTAMP]",
            "duration": "[SUBSTEP_DURATION]"
          },
          {
            "substepName": "[SUBSTEP_2]", 
            "timestamp": "[SUBSTEP_TIMESTAMP]",
            "duration": "[SUBSTEP_DURATION]"
          }
        ]
      }
      // ... 6 total steps with realistic timestamps
    ]
  },
  "customerProfile": {
    "userId": "user_[RANDOM_ID]",
    "email": "customer@[DOMAIN]",
    "demographic": "[INDUSTRY_APPROPRIATE_DEMOGRAPHIC]",
    "painPoints": ["[INDUSTRY_PAIN_1]","[INDUSTRY_PAIN_2]"],
    "goals": ["[INDUSTRY_GOAL_1]","[INDUSTRY_GOAL_2]"],
    "journeyStartTimestamp": "[JOURNEY_START_TIMESTAMP]"
  },
  "traceMetadata": {
    "correlationId": "trace_[TIMESTAMP]",
    "sessionId": "session_[RANDOM_ID]",
    "businessContext": {
      "campaignSource": "[APPROPRIATE_SOURCE]", 
      "customerSegment": "[SEGMENT]", 
      "businessValue": [REALISTIC_VALUE],
      "journeyTimezone": "[CUSTOMER_TIMEZONE]"
    }
  },
  "additionalFields": {
    "deviceType": "[DEVICE]", 
    "browser": "[BROWSER]", 
    "location": "[REALISTIC_LOCATION]", 
    "entryChannel": "[CHANNEL]",
    "customerIntent": "[INTENT]", 
    "loyaltyStatus": "[STATUS]", 
    "abandonmentRisk": "[RISK_LEVEL]",
    "conversionProbability": [0.0-1.0], 
    "personalizationTags": ["[TAG1]","[TAG2]"],
    "journeyVelocity": "[FAST/NORMAL/SLOW]",
    "timezoneBehavior": "[TIMEZONE_IMPACT_ON_JOURNEY]"
  }
}

CRITICAL TIMESTAMP REQUIREMENTS:
1. **Sequential Logic**: Each step timestamp MUST be after the previous step
2. **Industry Realism**: Use actual business process timing for [INDUSTRY]
3. **Business Hours**: Respect working hours for human-involved processes
4. **Weekend Logic**: Account for weekends in business processes
5. **Time Zones**: Consider customer location for realistic timing
6. **Duration Consistency**: estimatedDuration should match the gap to next step
7. **ISO 8601 Format**: All timestamps in "2025-10-14T10:30:00.000Z" format

STEP NAMING REQUIREMENTS:
- Create exactly 6 steps using your knowledge of [INDUSTRY] to generate appropriate, professional step names
- Each step must use its stepName as the serviceName (in PascalCase, ending with 'Service')
- Each step must have 2-3 realistic substeps with their own timestamps
- Use industry-specific terminology and processes
- DO NOT use generic names like "Step1", "Process2" - be specific to [INDUSTRY]

ERROR SIMULATION (Important):
- The system automatically simulates realistic step-level failures based on timing and industry
- You MAY add error hints per step for demo purposes:
  "errorHint": { "type": "payment_gateway_timeout", "httpStatus": 503, "likelihood": 0.4, "peakHours": true }
- Supported error types: payment_gateway_timeout, inventory_service_down, authentication_failure, database_connection_lost, third_party_api_failure, rate_limit_exceeded, session_timeout, validation_error
- Consider time-based errors (higher failure rates during peak hours, system maintenance windows)

EXAMPLE REALISTIC TIMELINE (E-commerce):
Step 1: ProductDiscovery - "2025-10-14T10:00:00.000Z" (Customer starts browsing)
Step 2: ProductSelection - "2025-10-14T10:12:00.000Z" (12 minutes later - found product)
Step 3: CartAddition - "2025-10-14T10:15:00.000Z" (3 minutes later - decided to buy)  
Step 4: CheckoutProcess - "2025-10-14T10:17:00.000Z" (2 minutes later - checkout)
Step 5: OrderConfirmation - "2025-10-14T10:18:30.000Z" (90 seconds later - payment processed)
Step 6: OrderDelivered - "2025-10-16T14:30:00.000Z" (2+ days later - realistic delivery)
```

## Usage Instructions:

1. **Replace Placeholders**: 
   - [COMPANY_NAME] → Actual company name
   - [DOMAIN] → Company domain
   - [INDUSTRY] → Target industry
   - [JOURNEY_START_TIMESTAMP] → Starting timestamp

2. **Copy and Paste**: Use this prompt in your Copilot interface for realistic journey generation

3. **Customize**: Modify industry examples and timing rules based on specific use cases

## Benefits:

- ✅ **Realistic Timelines**: Journeys reflect actual business processes
- ✅ **Industry Intelligence**: AI understands industry-specific timing patterns  
- ✅ **Business Logic**: Accounts for working hours, weekends, holidays
- ✅ **Load Testing**: Creates historical data for realistic load testing
- ✅ **Trace Accuracy**: Timestamps enable proper distributed tracing
- ✅ **Customer Behavior**: Reflects real customer decision-making timelines

## Testing Examples:

**Fast E-commerce Journey** (same day):
- All steps within 4-6 hours, delivery next day

**Complex Insurance Journey** (multi-week):
- Initial inquiry to policy issuance: 2-4 weeks with realistic delays

**Banking Application** (3-5 business days):
- Application to account opening with proper approval workflows
