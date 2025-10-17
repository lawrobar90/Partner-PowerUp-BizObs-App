#!/bin/bash

# BizObs Application Start Script
cd "$(dirname "$0")"

echo "🚀 Starting BizObs Application..."

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo "📦 Using PM2 for process management..."
    pm2 start ecosystem.config.js
    pm2 save
    echo "✅ BizObs Application started with PM2"
    echo "📊 Access the app at: http://localhost:4000"
    echo "📋 View logs with: pm2 logs bizobs-app"
    echo "📈 View status with: pm2 status"
else
    echo "📦 Starting with npm (PM2 not available)..."
    # Kill any existing processes first
    pkill -f "partner-powerup-bizobs" 2>/dev/null || true
    sleep 2
    
    # Start in background
    npm start > logs/bizobs.log 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > server.pid
    
    echo "✅ BizObs Application started with PID: $SERVER_PID"
    echo "📊 Access the app at: http://localhost:4000"
    echo "📋 View logs with: tail -f logs/bizobs.log"
    echo "🛑 Stop with: ./stop.sh"
fi

# Wait a moment and check if it's responsive
sleep 3
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed - application is responding"
else
    echo "⚠️  Health check failed - application may still be starting"
    echo "   Check logs for any issues"
fi