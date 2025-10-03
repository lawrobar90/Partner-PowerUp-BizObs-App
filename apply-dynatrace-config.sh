#!/bin/bash

echo "🔧 Applying Dynatrace Service Flow Configuration..."

# Check if DT_TENANT and DT_API_TOKEN are set
if [ -z "$DT_TENANT" ] || [ -z "$DT_API_TOKEN" ]; then
    echo "⚠️  Environment variables DT_TENANT and DT_API_TOKEN must be set"
    echo "   Example: export DT_TENANT=abc12345.live.dynatrace.com"
    echo "   Example: export DT_API_TOKEN=dt0c01.xxx..."
    echo ""
    echo "📋 Manual Configuration Required:"
    echo "   1. Go to Settings → Processes and containers → Process group detection"
    echo "   2. Add new rule: 'BizObs Customer Journey Services'"
    echo "   3. Use environment variable: DT_PROCESS_GROUP_NAME"
    echo "   4. Condition: DT_APPLICATION_NAME = 'BizObs-CustomerJourney'"
    echo ""
    echo "   5. Go to Settings → Server-side service monitoring → Service detection rules" 
    echo "   6. Add new rule: 'BizObs Service Detection'"
    echo "   7. Use environment variable: DT_SERVICE_NAME"
    echo "   8. Condition: Process group name contains 'Service'"
    exit 1
fi

echo "🌐 Dynatrace Tenant: $DT_TENANT"

# Create Process Group Detection Rule
echo "📝 Creating Process Group Detection Rule..."
curl -X POST "https://$DT_TENANT/api/config/v1/processGroupDetection" \
  -H "Authorization: Api-Token $DT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "processDetection": {
      "processGroupNameFormat": "{ProcessGroup:Environment:DT_PROCESS_GROUP_NAME}",
      "fallbackToProcessGroupNameFromProcessName": false
    },
    "conditionalNamingRule": {
      "namingPattern": "{ProcessGroup:Environment:DT_PROCESS_GROUP_NAME}",
      "displayName": "BizObs Customer Journey Services"
    },
    "conditions": [
      {
        "key": {
          "attribute": "PROCESS_GROUP_PREDEFINED_METADATA",
          "type": "PROCESS_PREDEFINED_METADATA_KEY"
        },
        "comparisonInfo": {
          "type": "STRING",
          "operator": "EXISTS",
          "value": "DT_APPLICATION_NAME",
          "negate": false,
          "caseSensitive": false
        }
      },
      {
        "key": {
          "attribute": "PROCESS_GROUP_PREDEFINED_METADATA", 
          "type": "PROCESS_PREDEFINED_METADATA_KEY"
        },
        "comparisonInfo": {
          "type": "STRING",
          "operator": "EQUALS",
          "value": "BizObs-CustomerJourney",
          "negate": false,
          "caseSensitive": false
        }
      }
    ]
  }'

echo ""
echo "📝 Creating Service Detection Rule..."

# Create Service Detection Rule  
curl -X POST "https://$DT_TENANT/api/config/v1/service/detectionRules/FULL_WEB_SERVICE" \
  -H "Authorization: Api-Token $DT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "serviceNamingRule": {
      "namingPattern": "{Service:Environment:DT_SERVICE_NAME}",
      "enableManagement": true
    },
    "conditions": [
      {
        "attributeType": "PROCESS_GROUP_NAME",
        "comparisonInfo": {
          "type": "STRING", 
          "operator": "CONTAINS",
          "value": "Service",
          "negate": false,
          "caseSensitive": false
        }
      },
      {
        "attributeType": "PROCESS_GROUP_PREDEFINED_METADATA",
        "comparisonInfo": {
          "type": "STRING",
          "operator": "EXISTS", 
          "value": "DT_APPLICATION_NAME",
          "negate": false,
          "caseSensitive": false
        }
      }
    ]
  }'

echo ""
echo "✅ Dynatrace configuration applied!"
echo "⏳ Allow 2-3 minutes for rules to take effect"
echo "🚀 Run a journey simulation to test the horizontal service flow"