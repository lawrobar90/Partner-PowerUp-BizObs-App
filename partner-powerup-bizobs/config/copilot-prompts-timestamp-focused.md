# ENHANCED Universal Copilot Prompt - TIMESTAMP FOCUSED

## 🕐 CRITICAL: Timestamp-First Customer Journey Generation

```
⚠️ MANDATORY TIMESTAMP REQUIREMENTS ⚠️

You MUST include realistic timestamps for every step and substep. This is NOT optional.

Create a realistic customer journey for {COMPANY_NAME} ({COMPANY_DOMAIN}) in the {INDUSTRY_TYPE} industry with SEQUENTIAL TIMESTAMPS that reflect real-world timing.

TIMESTAMP FORMAT: Use ISO 8601 format: "2025-10-14T10:30:00.000Z"

🕐 TIMING EXAMPLES FOR {INDUSTRY_TYPE}:
- ProductDiscovery: "2025-10-14T10:00:00.000Z" (Journey starts)
- ProductSelection: "2025-10-14T10:15:00.000Z" (15 minutes later)
- CartAddition: "2025-10-14T10:17:00.000Z" (2 minutes later)
- CheckoutProcess: "2025-10-14T10:20:00.000Z" (3 minutes later)
- OrderConfirmation: "2025-10-14T10:21:00.000Z" (1 minute later)
- DeliveryTracking: "2025-10-15T14:00:00.000Z" (Next day delivery)

CONTEXT:
- Company: {COMPANY_NAME}
- Domain: {COMPANY_DOMAIN}  
- Industry: {INDUSTRY_TYPE}
- Journey Start: {JOURNEY_START_TIMESTAMP}

🎯 REQUIRED JSON STRUCTURE (Copy exactly, replace placeholders):

{
  "journey": {
    "companyName": "{COMPANY_NAME}",
    "domain": "{COMPANY_DOMAIN}",
    "industryType": "{INDUSTRY_TYPE}",
    "journeyId": "journey_{RANDOM_NUMBER}",
    "journeyStartTime": "{JOURNEY_START_TIMESTAMP}",
    "businessHours": {
      "timezone": "UTC",
      "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "workingHours": "09:00-17:00"
    },
    "steps": [
      {
        "stepIndex": 1,
        "stepName": "YourFirstStepName",
        "serviceName": "YourFirstStepNameService",
        "description": "What customer does in this step",
        "category": "StepCategory",
        "timestamp": "{JOURNEY_START_TIMESTAMP}",
        "estimatedDuration": 15,
        "businessRationale": "Why this timing makes sense for {INDUSTRY_TYPE}",
        "substeps": [
          {
            "substepName": "Specific action 1",
            "timestamp": "{JOURNEY_START_TIMESTAMP}",
            "duration": 5
          },
          {
            "substepName": "Specific action 2",
            "timestamp": "2025-10-14T10:05:00.000Z",
            "duration": 10
          }
        ]
      },
      {
        "stepIndex": 2,
        "stepName": "YourSecondStepName",
        "serviceName": "YourSecondStepNameService",
        "description": "What customer does in step 2",
        "category": "StepCategory",
        "timestamp": "2025-10-14T10:15:00.000Z",
        "estimatedDuration": 5,
        "businessRationale": "Why this timing after step 1",
        "substeps": [
          {
            "substepName": "Specific action 1",
            "timestamp": "2025-10-14T10:15:00.000Z",
            "duration": 2
          },
          {
            "substepName": "Specific action 2",
            "timestamp": "2025-10-14T10:17:00.000Z",
            "duration": 3
          }
        ]
      },
      {
        "stepIndex": 3,
        "stepName": "YourThirdStepName",
        "serviceName": "YourThirdStepNameService",
        "description": "What customer does in step 3",
        "category": "StepCategory",
        "timestamp": "2025-10-14T10:20:00.000Z",
        "estimatedDuration": 3,
        "businessRationale": "Why this timing after step 2",
        "substeps": [...]
      },
      {
        "stepIndex": 4,
        "stepName": "YourFourthStepName",
        "serviceName": "YourFourthStepNameService",
        "description": "What customer does in step 4",
        "category": "StepCategory",
        "timestamp": "2025-10-14T10:23:00.000Z",
        "estimatedDuration": 2,
        "businessRationale": "Why this timing after step 3",
        "substeps": [...]
      },
      {
        "stepIndex": 5,
        "stepName": "YourFifthStepName",
        "serviceName": "YourFifthStepNameService",
        "description": "What customer does in step 5",
        "category": "StepCategory",
        "timestamp": "2025-10-14T10:25:00.000Z",
        "estimatedDuration": 1,
        "businessRationale": "Why this timing after step 4",
        "substeps": [...]
      },
      {
        "stepIndex": 6,
        "stepName": "YourSixthStepName",
        "serviceName": "YourSixthStepNameService",
        "description": "What customer does in step 6",
        "category": "StepCategory",
        "timestamp": "2025-10-15T14:00:00.000Z",
        "estimatedDuration": 30,
        "businessRationale": "Why this timing after step 5",
        "substeps": [...]
      }
    ]
  },
  "customerProfile": {
    "userId": "user_{RANDOM_ID}",
    "email": "customer@{COMPANY_DOMAIN}",
    "demographic": "Target demographic for {INDUSTRY_TYPE}",
    "painPoints": ["Pain1", "Pain2"],
    "goals": ["Goal1", "Goal2"],
    "journeyStartTimestamp": "{JOURNEY_START_TIMESTAMP}"
  },
  "traceMetadata": {
    "correlationId": "trace_{RANDOM_ID}",
    "sessionId": "session_{RANDOM_ID}",
    "businessContext": {
      "campaignSource": "RelevantSource",
      "customerSegment": "RelevantSegment",
      "businessValue": 1500,
      "journeyTimezone": "UTC"
    }
  },
  "additionalFields": {
    "deviceType": "mobile",
    "browser": "Chrome",
    "location": "RelevantLocation",
    "entryChannel": "RelevantChannel",
    "customerIntent": "RelevantIntent",
    "loyaltyStatus": "RelevantStatus",
    "abandonmentRisk": "low",
    "conversionProbability": 0.75,
    "personalizationTags": ["tag1", "tag2"]
  }
}

🚨 VALIDATION CHECKLIST (Verify before submitting):
- [ ] Every step has "timestamp" field in ISO 8601 format
- [ ] Every step has "estimatedDuration" in minutes
- [ ] Every step has "businessRationale" explaining timing
- [ ] Every substep has "timestamp" and "duration" fields
- [ ] All timestamps are chronologically sequential (no time travel!)
- [ ] Timestamps reflect realistic {INDUSTRY_TYPE} business processes

⚠️ IF YOUR RESPONSE IS MISSING TIMESTAMPS, IT WILL BE REJECTED ⚠️

Replace ALL {PLACEHOLDERS} with actual values for {COMPANY_NAME} in {INDUSTRY_TYPE}.
```

## Key Timing Fields for Real-Life Waits:

1. **`step.timestamp`** - When this step should occur
2. **`step.estimatedDuration`** - How long this step takes (minutes)
3. **`substep.timestamp`** - When each substep occurs
4. **`substep.duration`** - How long each substep takes (minutes)

## Usage:
- Calculate wait time: `nextStep.timestamp - currentStep.timestamp`
- Use `estimatedDuration` for step processing time
- Use substep timings for detailed step breakdowns