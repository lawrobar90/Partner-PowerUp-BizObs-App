#!/bin/bash

# Dynatrace OneAgent Installation Script for Vegas Casino
# This script installs and configures the Dynatrace OneAgent

set -e

echo "🎰 Dynatrace OneAgent Installation for Vegas Casino"
echo "=================================================="

# Configuration
DT_TENANT=${DT_TENANT:-""}
DT_API_TOKEN=${DT_API_TOKEN:-""}
DT_PAAS_TOKEN=${DT_PAAS_TOKEN:-""}

# Check if environment variables are set
if [ -z "$DT_TENANT" ] || [ -z "$DT_API_TOKEN" ] || [ -z "$DT_PAAS_TOKEN" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please set the following environment variables:"
    echo "  export DT_TENANT='your-tenant-id'"
    echo "  export DT_API_TOKEN='your-api-token'"
    echo "  export DT_PAAS_TOKEN='your-paas-token'"
    echo ""
    echo "Example:"
    echo "  export DT_TENANT='abc12345'"
    echo "  export DT_API_TOKEN='dt0c01.ST2EY...'"
    echo "  export DT_PAAS_TOKEN='dt0c01.XXXXXXXX...'"
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    ARCH="x86"
elif [ "$ARCH" = "aarch64" ]; then
    ARCH="arm"
else
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📥 Downloading OneAgent installer..."

# Download OneAgent
DOWNLOAD_URL="https://${DT_TENANT}.live.dynatrace.com/api/v1/deployment/installer/agent/unix/default/latest?arch=${ARCH}&flavor=default"

curl -L -H "Authorization: Api-Token ${DT_PAAS_TOKEN}" \
     -o "Dynatrace-OneAgent-Linux.sh" \
     "$DOWNLOAD_URL"

if [ ! -f "Dynatrace-OneAgent-Linux.sh" ]; then
    echo "❌ Failed to download OneAgent installer"
    exit 1
fi

echo "🔧 Installing OneAgent..."

# Make installer executable
chmod +x Dynatrace-OneAgent-Linux.sh

# Install OneAgent
sudo ./Dynatrace-OneAgent-Linux.sh \
    --set-app-log-content-access=true \
    --set-infra-only=false \
    --set-host-group="vegas-casino" \
    --set-host-tags="environment=production,application=vegas-casino,service=casino" \
    --set-host-property="Department=Digital-Experience" \
    --set-host-property="Application=Vegas-Casino"

echo "⚙️  Configuring OneAgent for Node.js..."

# Create OneAgent configuration directory
sudo mkdir -p /var/lib/dynatrace/oneagent/agent/config

# Create custom configuration for Vegas Casino
sudo tee /var/lib/dynatrace/oneagent/agent/config/custom.properties > /dev/null << EOF
# Vegas Casino Custom Configuration
[general]
hostgroup = vegas-casino
hosttags = environment:production,application:vegas-casino,service:casino

[nodejs]
enabled = true
logLevel = info
crashDumpEnabled = true

[log_analytics]
enabled = true

[rum]
enabled = true
applicationId = ${DT_TENANT}-vegas-casino

[synthetic]
enabled = true
EOF

echo "🎯 Setting up service detection rules..."

# Create service detection rule for Vegas Casino services
sudo tee /var/lib/dynatrace/oneagent/agent/config/service_detection.json > /dev/null << EOF
{
  "version": "1.0",
  "rules": [
    {
      "name": "Vegas Casino Main Service",
      "conditions": [
        {
          "attribute": "PROCESS_GROUP_NAME",
          "comparisonInfo": {
            "type": "STRING_CONTAINS",
            "value": "dynatrace-vegas-casino"
          }
        }
      ],
      "actions": [
        {
          "type": "OVERRIDE_SERVICE_NAME",
          "value": "vegas-casino-main"
        },
        {
          "type": "SET_TAG",
          "value": "VegasCasino"
        },
        {
          "type": "SET_TAG",
          "value": "Production"
        }
      ]
    },
    {
      "name": "Vegas Slots Service",
      "conditions": [
        {
          "attribute": "HTTP_REQUEST_HEADER",
          "comparisonInfo": {
            "type": "STRING_EQUALS",
            "value": "vegas-slots-service"
          },
          "key": "X-Dynatrace-Service"
        }
      ],
      "actions": [
        {
          "type": "OVERRIDE_SERVICE_NAME",
          "value": "vegas-slots-service"
        }
      ]
    },
    {
      "name": "Vegas Roulette Service",
      "conditions": [
        {
          "attribute": "HTTP_REQUEST_HEADER",
          "comparisonInfo": {
            "type": "STRING_EQUALS",
            "value": "vegas-roulette-service"
          },
          "key": "X-Dynatrace-Service"
        }
      ],
      "actions": [
        {
          "type": "OVERRIDE_SERVICE_NAME",
          "value": "vegas-roulette-service"
        }
      ]
    },
    {
      "name": "Vegas Dice Service",
      "conditions": [
        {
          "attribute": "HTTP_REQUEST_HEADER",
          "comparisonInfo": {
            "type": "STRING_EQUALS",
            "value": "vegas-dice-service"
          },
          "key": "X-Dynatrace-Service"
        }
      ],
      "actions": [
        {
          "type": "OVERRIDE_SERVICE_NAME",
          "value": "vegas-dice-service"
        }
      ]
    },
    {
      "name": "Vegas Blackjack Service",
      "conditions": [
        {
          "attribute": "HTTP_REQUEST_HEADER",
          "comparisonInfo": {
            "type": "STRING_EQUALS",
            "value": "vegas-blackjack-service"
          },
          "key": "X-Dynatrace-Service"
        }
      ],
      "actions": [
        {
          "type": "OVERRIDE_SERVICE_NAME",
          "value": "vegas-blackjack-service"
        }
      ]
    },
    {
      "name": "Vegas Analytics Service",
      "conditions": [
        {
          "attribute": "HTTP_REQUEST_HEADER",
          "comparisonInfo": {
            "type": "STRING_EQUALS",
            "value": "vegas-analytics-service"
          },
          "key": "X-Dynatrace-Service"
        }
      ],
      "actions": [
        {
          "type": "OVERRIDE_SERVICE_NAME",
          "value": "vegas-analytics-service"
        }
      ]
    },
    {
      "name": "Vegas Leaderboard Service",
      "conditions": [
        {
          "attribute": "HTTP_REQUEST_HEADER",
          "comparisonInfo": {
            "type": "STRING_EQUALS",
            "value": "vegas-leaderboard-service"
          },
          "key": "X-Dynatrace-Service"
        }
      ],
      "actions": [
        {
          "type": "OVERRIDE_SERVICE_NAME",
          "value": "vegas-leaderboard-service"
        }
      ]
    }
  ]
}
EOF

echo "🔄 Restarting OneAgent service..."
sudo systemctl restart oneagent

# Wait for service to start
sleep 5

echo "✅ Checking OneAgent status..."
sudo systemctl status oneagent

echo ""
echo "🎰 OneAgent installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify OneAgent is running: sudo systemctl status oneagent"
echo "2. Check OneAgent logs: sudo journalctl -u oneagent -f"
echo "3. Start your Vegas Casino application: npm start"
echo "4. Verify services appear in Dynatrace with correct names"
echo ""
echo "Service names that will appear in Dynatrace:"
echo "  • vegas-casino-main (main application)"
echo "  • vegas-slots-service (slots game)"
echo "  • vegas-roulette-service (roulette game)"
echo "  • vegas-dice-service (dice game)"
echo "  • vegas-blackjack-service (blackjack game)"
echo "  • vegas-analytics-service (analytics/metrics)"
echo "  • vegas-leaderboard-service (leaderboard)"

# Cleanup
cd /
rm -rf "$TEMP_DIR"