#!/bin/bash

# BizObs Application Restart Script
cd "$(dirname "$0")"

echo "🔄 Restarting BizObs Application..."

# Check if PM2 is managing the app
if command -v pm2 &> /dev/null && pm2 describe bizobs-app > /dev/null 2>&1; then
    echo "📦 Restarting PM2 managed process..."
    pm2 restart bizobs-app
    echo "✅ BizObs Application restarted (PM2)"
else
    echo "📦 Restarting manually..."
    ./stop.sh
    sleep 2
    ./start.sh
fi

echo "✅ BizObs Application restarted"