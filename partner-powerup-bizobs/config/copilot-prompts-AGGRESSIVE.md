# 🚨 AGGRESSIVE TIMESTAMP-MANDATORY PROMPT 🚨

## ⛔ STOP! READ THIS FIRST ⛔

**IF YOUR RESPONSE DOES NOT INCLUDE TIMESTAMPS, IT WILL BE COMPLETELY REJECTED AND UNUSABLE.**

**I WILL IMMEDIATELY DELETE ANY RESPONSE WITHOUT TIMESTAMPS.**

---

## 🕐 TIMESTAMP REQUIREMENTS (NON-NEGOTIABLE)

You MUST include these fields in EVERY step:
- ✅ **timestamp** (ISO 8601 format)
- ✅ **estimatedDuration** (integer minutes)
- ✅ **businessRationale** (timing explanation)

You MUST include these fields in EVERY substep:
- ✅ **timestamp** (ISO 8601 format)  
- ✅ **duration** (integer minutes)

**NO EXCEPTIONS. NO SHORTCUTS. NO OMISSIONS.**

---

## 🎯 EXACT COPILOT PROMPT (Copy this exactly):

```
🚨 CRITICAL: This response REQUIRES timestamps or it will be rejected 🚨

Create a customer journey for {COMPANY_NAME} ({COMPANY_DOMAIN}) in {INDUSTRY_TYPE} with MANDATORY timestamps.

⚠️ YOUR RESPONSE WILL BE DELETED IF IT LACKS TIMESTAMPS ⚠️

Journey starts at: {JOURNEY_START_TIMESTAMP}

You MUST respond with this EXACT structure (replace examples with real data):

{
  "journey": {
    "companyName": "{COMPANY_NAME}",
    "domain": "{COMPANY_DOMAIN}",
    "industryType": "{INDUSTRY_TYPE}",
    "journeyId": "journey_123456",
    "journeyStartTime": "{JOURNEY_START_TIMESTAMP}",
    "steps": [
      {
        "stepIndex": 1,
        "stepName": "RealStepName",
        "serviceName": "RealStepNameService",
        "description": "What happens in this step",
        "category": "StepCategory",
        "timestamp": "{JOURNEY_START_TIMESTAMP}",
        "estimatedDuration": 15,
        "businessRationale": "Why this takes 15 minutes in {INDUSTRY_TYPE}",
        "substeps": [
          {
            "substepName": "Real substep 1",
            "timestamp": "{JOURNEY_START_TIMESTAMP}",
            "duration": 5
          },
          {
            "substepName": "Real substep 2", 
            "timestamp": "2025-10-14T10:05:00.000Z",
            "duration": 10
          }
        ]
      },
      {
        "stepIndex": 2,
        "stepName": "SecondRealStepName",
        "serviceName": "SecondRealStepNameService",
        "description": "What happens in step 2",
        "category": "StepCategory",
        "timestamp": "2025-10-14T10:15:00.000Z",
        "estimatedDuration": 8,
        "businessRationale": "Why this takes 8 minutes after step 1",
        "substeps": [
          {
            "substepName": "Real substep 1",
            "timestamp": "2025-10-14T10:15:00.000Z",
            "duration": 3
          },
          {
            "substepName": "Real substep 2",
            "timestamp": "2025-10-14T10:18:00.000Z", 
            "duration": 5
          }
        ]
      },
      {
        "stepIndex": 3,
        "stepName": "ThirdRealStepName",
        "serviceName": "ThirdRealStepNameService",
        "timestamp": "2025-10-14T10:23:00.000Z",
        "estimatedDuration": 5,
        "businessRationale": "Why this takes 5 minutes",
        "substeps": [...]
      },
      {
        "stepIndex": 4,
        "stepName": "FourthRealStepName",
        "serviceName": "FourthRealStepNameService", 
        "timestamp": "2025-10-14T10:28:00.000Z",
        "estimatedDuration": 3,
        "businessRationale": "Why this takes 3 minutes",
        "substeps": [...]
      },
      {
        "stepIndex": 5,
        "stepName": "FifthRealStepName",
        "serviceName": "FifthRealStepNameService",
        "timestamp": "2025-10-14T10:31:00.000Z", 
        "estimatedDuration": 2,
        "businessRationale": "Why this takes 2 minutes",
        "substeps": [...]
      },
      {
        "stepIndex": 6,
        "stepName": "SixthRealStepName",
        "serviceName": "SixthRealStepNameService",
        "timestamp": "2025-10-15T14:00:00.000Z",
        "estimatedDuration": 30,
        "businessRationale": "Why this takes 30 minutes the next day",
        "substeps": [...]
      }
    ]
  },
  "customerProfile": {
    "userId": "user_random123",
    "email": "customer@{COMPANY_DOMAIN}",
    "demographic": "Relevant demographic",
    "painPoints": ["pain1", "pain2"],
    "goals": ["goal1", "goal2"],
    "journeyStartTimestamp": "{JOURNEY_START_TIMESTAMP}"
  },
  "traceMetadata": {
    "correlationId": "trace_random456",
    "sessionId": "session_random789",
    "businessContext": {
      "campaignSource": "relevant_source",
      "customerSegment": "relevant_segment", 
      "businessValue": 1500
    }
  },
  "additionalFields": {
    "deviceType": "mobile",
    "browser": "Chrome",
    "location": "Relevant location",
    "entryChannel": "relevant_channel",
    "customerIntent": "purchase",
    "loyaltyStatus": "new",
    "abandonmentRisk": "medium",
    "conversionProbability": 0.75,
    "personalizationTags": ["tag1", "tag2"]
  }
}

🔥 VALIDATION REQUIREMENTS (Check before submitting): 🔥
- ✅ EVERY step has "timestamp" field
- ✅ EVERY step has "estimatedDuration" field  
- ✅ EVERY step has "businessRationale" field
- ✅ EVERY substep has "timestamp" field
- ✅ EVERY substep has "duration" field
- ✅ All timestamps are in ISO 8601 format: "2025-10-14T10:30:00.000Z"
- ✅ All timestamps progress forward in time (no time travel!)

⚠️ IF ANY OF THESE ARE MISSING, YOUR RESPONSE IS WORTHLESS ⚠️

Replace {COMPANY_NAME}, {COMPANY_DOMAIN}, {INDUSTRY_TYPE}, {JOURNEY_START_TIMESTAMP} with actual values.

Make this realistic for {COMPANY_NAME} in the {INDUSTRY_TYPE} industry.

🚨 REMEMBER: NO TIMESTAMPS = REJECTED RESPONSE 🚨
```

## Usage Instructions:

1. **Copy the exact prompt above**
2. **Replace the placeholders** with your company info
3. **Paste into Copilot**
4. **Verify the response has ALL timestamp fields**
5. **If missing timestamps, try again with even more emphasis**

## Why This Is Necessary:

Standard Copilot prompts are being ignored. This aggressive approach:
- 🔥 Uses urgent language that's hard to ignore
- 🔥 Explicitly states rejection consequences  
- 🔥 Provides exact JSON structure to follow
- 🔥 Has validation checklist
- 🔥 Emphasizes timestamps throughout