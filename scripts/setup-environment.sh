#!/bin/bash

# Dynatrace Vegas Casino Environment Setup
# This script sets up all required environment variables for Dynatrace integration

echo "🎰 Dynatrace Vegas Casino Environment Setup"
echo "==========================================="

# Create .env file with Dynatrace configuration
cat > /home/ec2-user/.env << EOF
# Dynatrace Configuration
DT_TENANT=your-tenant-id
DT_API_TOKEN=your-api-token
DT_PAAS_TOKEN=your-paas-token
DT_INGEST_URL=https://your-tenant.live.dynatrace.com/api/v2

# Application Configuration
NODE_ENV=production
PORT=3000
SERVICE_NAME=dynatrace-vegas-casino
SERVICE_VERSION=2.0.0

# Vegas Casino Configuration
CASINO_NAME=Dynatrace Vegas
ENVIRONMENT=production
EOF

# Create systemd service file for the Vegas Casino application
sudo tee /etc/systemd/system/vegas-casino.service > /dev/null << EOF
[Unit]
Description=Dynatrace Vegas Casino Application
After=network.target
After=oneagent.service
Requires=oneagent.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user
Environment=NODE_ENV=production
Environment=DT_TENANT=${DT_TENANT}
Environment=DT_API_TOKEN=${DT_API_TOKEN}
Environment=DT_INGEST_URL=${DT_INGEST_URL}
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vegas-casino

[Install]
WantedBy=multi-user.target
EOF

echo "📝 Environment configuration created:"
echo "  • .env file with Dynatrace settings"
echo "  • systemd service file for Vegas Casino"
echo ""
echo "🔧 Next steps:"
echo ""
echo "1. Edit .env file with your Dynatrace credentials:"
echo "   nano .env"
echo ""
echo "2. Install OneAgent (if not already installed):"
echo "   ./scripts/install-oneagent.sh"
echo ""
echo "3. Install optional Dynatrace SDK:"
echo "   npm install --optional-only"
echo ""
echo "4. Start the Vegas Casino service:"
echo "   sudo systemctl enable vegas-casino"
echo "   sudo systemctl start vegas-casino"
echo ""
echo "5. Check service status:"
echo "   sudo systemctl status vegas-casino"
echo "   sudo journalctl -u vegas-casino -f"
echo ""
echo "🎯 Expected Dynatrace Services:"
echo "  • vegas-casino-main"
echo "  • vegas-slots-service"  
echo "  • vegas-roulette-service"
echo "  • vegas-dice-service"
echo "  • vegas-blackjack-service"
echo "  • vegas-analytics-service"
echo "  • vegas-leaderboard-service"