# Universal Copilot Prompt for Any Company & Industry

## Generic Customer Journey Generation Prompt (Sequential Timestamps Guaranteed)

```
Create a realistic customer journey for {COMPANY_NAME} ({COMPANY_DOMAIN}) in the {INDUSTRY_TYPE} industry. You must generate step names that reflect the actual customer experience for this specific company and industry with REALISTIC SEQUENTIAL TIMESTAMPS that mirror real-world business timelines.

CRITICAL: You are the AI expert on {COMPANY_NAME} and {INDUSTRY_TYPE} industry. Use your comprehensive knowledge to create an authentic journey specific to this company's business model and industry practices.

CONTEXT:
- Company: {COMPANY_NAME}
- Domain: {COMPANY_DOMAIN}  
- Industry: {INDUSTRY_TYPE}
- Journey Start Time: {JOURNEY_START_TIMESTAMP}

TIMESTAMP SEQUENCE REQUIREMENTS (ABSOLUTELY CRITICAL):
1. **SEQUENTIAL ONLY**: Each step timestamp MUST be chronologically AFTER the previous step timestamp
2. **NO TIME TRAVEL**: Never create a timestamp that is before the previous step
3. **PROGRESSIVE TIME**: Each timestamp should advance forward in time from the previous step
4. **VALIDATION**: Before finalizing, verify each timestamp is later than the previous step

INDUSTRY-INTELLIGENT TIMING:
Use your AI knowledge of {INDUSTRY_TYPE} to determine realistic timing between steps. Consider the specific business model of {COMPANY_NAME}:

**Universal Timing Patterns (Adapt to {INDUSTRY_TYPE}):**
- **Immediate Actions**: User interactions, form submissions, selections (seconds to minutes)
- **System Processing**: Automated validations, payments, confirmations (seconds to minutes) 
- **Human Processing**: Reviews, approvals, manual tasks (minutes to hours to days)
- **Physical Processes**: Shipping, delivery, installations, physical services (hours to days to weeks)
- **Customer Actions**: Decision making, document gathering, external tasks (minutes to days)

**Business Logic for {INDUSTRY_TYPE}:**
- **Working Hours**: Apply 09:00-17:00 business days for business processes when relevant to {INDUSTRY_TYPE}
- **Customer Flexibility**: Customers can act anytime, consider peak usage patterns for {INDUSTRY_TYPE}
- **Automated Systems**: Can run 24/7 for {COMPANY_NAME}'s digital processes
- **Industry Standards**: Apply standard processing times for {INDUSTRY_TYPE}

**Guaranteed Sequential Timeline:**
Step 1: {JOURNEY_START_TIMESTAMP} (Journey begins)
Step 2: {STEP_1_TIMESTAMP + REALISTIC_DELAY} (MUST be after Step 1)
Step 3: {STEP_2_TIMESTAMP + REALISTIC_DELAY} (MUST be after Step 2)
Step 4: {STEP_3_TIMESTAMP + REALISTIC_DELAY} (MUST be after Step 3)
Step 5: {STEP_4_TIMESTAMP + REALISTIC_DELAY} (MUST be after Step 4)
Step 6: {STEP_5_TIMESTAMP + REALISTIC_DELAY} (MUST be after Step 5)

Respond with this EXACT JSON structure (replace ALL {} placeholders with actual values):
{
  "journey": {
    "companyName": "{COMPANY_NAME}",
    "domain": "{COMPANY_DOMAIN}",
    "industryType": "{INDUSTRY_TYPE}",
    "journeyId": "journey_{UNIQUE_TIMESTAMP_ID}",
    "journeyStartTime": "{JOURNEY_START_TIMESTAMP}",
    "businessHours": {
      "timezone": "UTC",
      "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "workingHours": "09:00-17:00"
    },
    "steps": [
      {
        "stepIndex": 1,
        "stepName": "{SPECIFIC_STEP_NAME_FOR_COMPANY_INDUSTRY}",
        "serviceName": "{STEP_NAME}Service",
        "description": "{REALISTIC_DESCRIPTION_FOR_COMPANY}",
        "category": "{LOGICAL_CATEGORY}",
        "timestamp": "{JOURNEY_START_TIMESTAMP}",
        "estimatedDuration": {REALISTIC_MINUTES_INTEGER},
        "businessRationale": "{WHY_THIS_TIMING_FOR_COMPANY_INDUSTRY}",
        "substeps": [
          {
            "substepName": "{SPECIFIC_SUBSTEP_1}",
            "timestamp": "{JOURNEY_START_TIMESTAMP}",
            "duration": {SUBSTEP_MINUTES_INTEGER}
          },
          {
            "substepName": "{SPECIFIC_SUBSTEP_2}", 
            "timestamp": "{SUBSTEP_1_END_TIME}",
            "duration": {SUBSTEP_MINUTES_INTEGER}
          }
        ]
      },
      {
        "stepIndex": 2,
        "stepName": "{SPECIFIC_STEP_NAME_2_FOR_COMPANY_INDUSTRY}",
        "serviceName": "{STEP_NAME_2}Service", 
        "description": "{REALISTIC_DESCRIPTION_FOR_COMPANY}",
        "category": "{LOGICAL_CATEGORY}",
        "timestamp": "{STEP_1_END_TIME_PLUS_REALISTIC_DELAY}",
        "estimatedDuration": {REALISTIC_MINUTES_INTEGER},
        "businessRationale": "{WHY_THIS_TIMING_FOR_COMPANY_INDUSTRY}",
        "substeps": [
          {
            "substepName": "{SPECIFIC_SUBSTEP_1}",
            "timestamp": "{STEP_2_START_TIME}",
            "duration": {SUBSTEP_MINUTES_INTEGER}
          },
          {
            "substepName": "{SPECIFIC_SUBSTEP_2}",
            "timestamp": "{STEP_2_SUBSTEP_1_END_TIME}",
            "duration": {SUBSTEP_MINUTES_INTEGER}
          }
        ]
      },
      {
        "stepIndex": 3,
        "stepName": "{SPECIFIC_STEP_NAME_3_FOR_COMPANY_INDUSTRY}",
        "serviceName": "{STEP_NAME_3}Service",
        "description": "{REALISTIC_DESCRIPTION_FOR_COMPANY}",
        "category": "{LOGICAL_CATEGORY}",
        "timestamp": "{STEP_2_END_TIME_PLUS_REALISTIC_DELAY}",
        "estimatedDuration": {REALISTIC_MINUTES_INTEGER},
        "businessRationale": "{WHY_THIS_TIMING_FOR_COMPANY_INDUSTRY}",
        "substeps": [...]
      },
      {
        "stepIndex": 4,
        "stepName": "{SPECIFIC_STEP_NAME_4_FOR_COMPANY_INDUSTRY}",
        "serviceName": "{STEP_NAME_4}Service",
        "description": "{REALISTIC_DESCRIPTION_FOR_COMPANY}",
        "category": "{LOGICAL_CATEGORY}",
        "timestamp": "{STEP_3_END_TIME_PLUS_REALISTIC_DELAY}",
        "estimatedDuration": {REALISTIC_MINUTES_INTEGER},
        "businessRationale": "{WHY_THIS_TIMING_FOR_COMPANY_INDUSTRY}",
        "substeps": [...]
      },
      {
        "stepIndex": 5,
        "stepName": "{SPECIFIC_STEP_NAME_5_FOR_COMPANY_INDUSTRY}",
        "serviceName": "{STEP_NAME_5}Service",
        "description": "{REALISTIC_DESCRIPTION_FOR_COMPANY}",
        "category": "{LOGICAL_CATEGORY}",
        "timestamp": "{STEP_4_END_TIME_PLUS_REALISTIC_DELAY}",
        "estimatedDuration": {REALISTIC_MINUTES_INTEGER},
        "businessRationale": "{WHY_THIS_TIMING_FOR_COMPANY_INDUSTRY}",
        "substeps": [...]
      },
      {
        "stepIndex": 6,
        "stepName": "{SPECIFIC_STEP_NAME_6_FOR_COMPANY_INDUSTRY}",
        "serviceName": "{STEP_NAME_6}Service",
        "description": "{REALISTIC_DESCRIPTION_FOR_COMPANY}",
        "category": "{LOGICAL_CATEGORY}",
        "timestamp": "{STEP_5_END_TIME_PLUS_REALISTIC_DELAY}",
        "estimatedDuration": {REALISTIC_MINUTES_INTEGER},
        "businessRationale": "{WHY_THIS_TIMING_FOR_COMPANY_INDUSTRY}",
        "substeps": [...]
      }
    ]
  },
  "customerProfile": {
    "userId": "user_{RANDOM_ID}",
    "email": "customer@{COMPANY_DOMAIN}",
    "demographic": "{APPROPRIATE_DEMOGRAPHIC_FOR_INDUSTRY}",
    "painPoints": ["{INDUSTRY_SPECIFIC_PAIN_1}","{INDUSTRY_SPECIFIC_PAIN_2}"],
    "goals": ["{INDUSTRY_SPECIFIC_GOAL_1}","{INDUSTRY_SPECIFIC_GOAL_2}"],
    "journeyStartTimestamp": "{JOURNEY_START_TIMESTAMP}"
  },
  "traceMetadata": {
    "correlationId": "trace_{UNIQUE_TIMESTAMP_ID}",
    "sessionId": "session_{RANDOM_ID}",
    "businessContext": {
      "campaignSource": "{APPROPRIATE_SOURCE_FOR_INDUSTRY}", 
      "customerSegment": "{SEGMENT_FOR_INDUSTRY}", 
      "businessValue": {REALISTIC_VALUE_FOR_INDUSTRY},
      "journeyTimezone": "UTC"
    }
  },
  "additionalFields": {
    "deviceType": "{DEVICE_TYPE}", 
    "browser": "{BROWSER_TYPE}", 
    "location": "{REALISTIC_LOCATION}", 
    "entryChannel": "{CHANNEL_APPROPRIATE_FOR_INDUSTRY}",
    "customerIntent": "{INTENT_SPECIFIC_TO_INDUSTRY}", 
    "loyaltyStatus": "{STATUS_LEVEL}", 
    "abandonmentRisk": "{RISK_LEVEL}",
    "conversionProbability": {DECIMAL_0_TO_1_REALISTIC_FOR_INDUSTRY}, 
    "personalizationTags": ["{TAG1_FOR_INDUSTRY}","{TAG2_FOR_INDUSTRY}"],
    "journeyVelocity": "{FAST_NORMAL_OR_SLOW_FOR_INDUSTRY}",
    "timezoneBehavior": "{TIMEZONE_IMPACT_FOR_INDUSTRY}"
  }
}

ABSOLUTE REQUIREMENTS:
1. **Company Expertise**: Use your knowledge of {COMPANY_NAME} to create steps that match their actual business model
2. **Industry Intelligence**: Apply your understanding of {INDUSTRY_TYPE} to create realistic processes and timing
3. **Sequential Timestamps**: EVERY step timestamp must be chronologically after the previous step timestamp
4. **No Generic Names**: Never use "Step1", "Process2" - use specific terminology appropriate for {COMPANY_NAME} in {INDUSTRY_TYPE}
5. **Realistic Durations**: Base timing on actual {INDUSTRY_TYPE} business processes as they apply to {COMPANY_NAME}
6. **PascalCase Services**: All serviceName fields must be in PascalCase + "Service" format
7. **Authentic Business Logic**: Steps should reflect how {COMPANY_NAME} actually operates in {INDUSTRY_TYPE}

TIMESTAMP VALIDATION CHECKLIST (Verify before submitting):
- [ ] Step 1 timestamp = Journey start time
- [ ] Step 2 timestamp > Step 1 timestamp  
- [ ] Step 3 timestamp > Step 2 timestamp
- [ ] Step 4 timestamp > Step 3 timestamp
- [ ] Step 5 timestamp > Step 4 timestamp
- [ ] Step 6 timestamp > Step 5 timestamp
- [ ] All substep timestamps are sequential within each step
- [ ] All timestamps use ISO 8601 format: "2025-10-14T10:30:00.000Z"

ERROR SIMULATION (Optional):
You MAY add realistic error hints based on {COMPANY_NAME} and {INDUSTRY_TYPE} business challenges:
"errorHint": { 
  "type": "payment_gateway_timeout", 
  "httpStatus": 503, 
  "likelihood": 0.4, 
  "industryContext": "Common during peak hours in {INDUSTRY_TYPE}",
  "companySpecific": "Relevant to {COMPANY_NAME}'s infrastructure" 
}

REMEMBER: You are the expert on {COMPANY_NAME} and {INDUSTRY_TYPE}. Create an authentic, company-specific journey that reflects their real business processes with guaranteed sequential timing. The app relies entirely on your response - make it accurate and realistic for the specific company and industry provided.
```

## Implementation Instructions:

1. **Replace Placeholders in App**: 
   - {COMPANY_NAME} → User-selected company from app interface
   - {COMPANY_DOMAIN} → Automatically derived or user-entered domain  
   - {INDUSTRY_TYPE} → User-selected industry from app interface
   - {JOURNEY_START_TIMESTAMP} → Current timestamp when generating

2. **Copy to Copilot**: Use this complete prompt in your Copilot interface

3. **Validate Response**: Verify all timestamps are sequential before using

4. **App Integration**: App accepts any valid JSON response that follows the structure

## Key Benefits:

- ✅ **100% Generic**: Works for any company in any industry
- ✅ **AI-Driven**: Leverages Copilot's knowledge of specific companies and industries  
- ✅ **Sequential Guarantee**: Enforces chronological timestamp ordering
- ✅ **No Hardcoding**: App has zero industry-specific logic
- ✅ **Authentic Results**: Steps reflect actual company business models
- ✅ **Flexible Integration**: Compatible with any valid Copilot response