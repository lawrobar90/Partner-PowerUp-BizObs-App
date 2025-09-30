#!/bin/bash

# Vegas Slots LoadRunner SRG - API Import Script
# This script imports the Site Reliability Guardian into your Dynatrace tenant via API

# Configuration - UPDATE THESE VALUES
DYNATRACE_TENANT="https://YOUR_TENANT.live.dynatrace.com"  # Replace with your tenant URL
API_TOKEN="dt0c01.YOUR_API_TOKEN"                          # Replace with your API token

# File to import
SRG_FILE="vegas-slots-srg-simple-api.json"

echo "🎰 Vegas Slots LoadRunner SRG - API Import"
echo "============================================"
echo "Tenant: $DYNATRACE_TENANT"
echo "File: $SRG_FILE"
echo

# Check if file exists
if [ ! -f "$SRG_FILE" ]; then
    echo "❌ Error: $SRG_FILE not found!"
    echo "Make sure the SRG JSON file is in the current directory."
    exit 1
fi

# Validate JSON format
echo "🔍 Validating JSON format..."
if ! cat "$SRG_FILE" | python3 -m json.tool > /dev/null 2>&1; then
    echo "❌ Error: Invalid JSON format in $SRG_FILE"
    exit 1
fi
echo "✅ JSON format is valid"

# Import the SRG
echo "🚀 Importing Site Reliability Guardian..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Authorization: Api-Token $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$SRG_FILE" \
    "$DYNATRACE_TENANT/api/v2/settings/objects")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📊 Response Status: $HTTP_STATUS"

# Check result
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ Site Reliability Guardian imported successfully!"
    echo
    echo "📋 Response:"
    echo "$RESPONSE_BODY" | python3 -m json.tool
    echo
    echo "🎯 Next Steps:"
    echo "1. Go to your Dynatrace tenant"
    echo "2. Navigate to Observe and explore → Site Reliability Guardian"
    echo "3. Find 'Vegas Slots LoadRunner SRG'"
    echo "4. Review and activate the guardian"
    echo "5. Run LoadRunner tests to see it in action"
else
    echo "❌ Failed to import Site Reliability Guardian"
    echo
    echo "📋 Error Response:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
    echo
    echo "🔧 Troubleshooting:"
    echo "1. Verify your API token has 'Write settings' permissions"
    echo "2. Check your tenant URL is correct"
    echo "3. Ensure request attributes are configured:"
    echo "   - LoadRunner Source ID"
    echo "   - LoadRunner Test Step Name"
    echo "   - LoadRunner Virtual User"
    echo "4. Verify the JSON schema matches your Dynatrace version"
fi

echo
echo "📚 For more information:"
echo "- API Documentation: https://www.dynatrace.com/support/help/dynatrace-api/environment-api/settings/"
echo "- SRG Documentation: https://www.dynatrace.com/support/help/platform-modules/applications-and-microservices/site-reliability-guardian/"