#!/bin/bash

# BizObs Application Status Script
cd "$(dirname "$0")"

echo "📊 BizObs Application Status"
echo "============================"

# Check PM2 status first
if command -v pm2 &> /dev/null; then
    echo ""
    echo "🔧 PM2 Process Status:"
    pm2 status bizobs-app 2>/dev/null || echo "   No PM2 processes found"
fi

# Check if server.pid exists
if [ -f server.pid ]; then
    PID=$(cat server.pid)
    echo ""
    echo "📋 PID File Status:"
    if kill -0 $PID 2>/dev/null; then
        echo "   ✅ Process running with PID: $PID"
    else
        echo "   ❌ Process not running (stale PID file)"
    fi
fi

# Check port status
echo ""
echo "🌐 Port Status:"
if lsof -i :4000 > /dev/null 2>&1; then
    echo "   ✅ Port 4000 is in use"
    lsof -i :4000 | head -2
else
    echo "   ❌ Port 4000 is not in use"
fi

# Health check
echo ""
echo "🔗 Health Check:"
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "   ✅ Application is responding"
    echo ""
    echo "📊 Basic Health Status:"
    curl -s http://localhost:4000/api/health | jq . 2>/dev/null || curl -s http://localhost:4000/api/health
    
    echo ""
    echo "🎯 Port Allocation Status:"
    curl -s http://localhost:4000/api/admin/ports | jq . 2>/dev/null || curl -s http://localhost:4000/api/admin/ports
else
    echo "   ❌ Application is not responding"
fi

# Service processes
echo ""
echo "🔍 Service Processes:"
ps aux | grep -E "(node.*server\.js|node.*Service)" | grep -v grep || echo "   No service processes found"

echo ""
echo "📁 Recent Logs (last 10 lines):"
if [ -f logs/bizobs.log ]; then
    tail -10 logs/bizobs.log
elif command -v pm2 &> /dev/null; then
    pm2 logs bizobs-app --lines 10 --nostream 2>/dev/null || echo "   No PM2 logs available"
else
    echo "   No log files found"
fi

echo ""
echo "🌍 Access URLs:"
echo "   Web Interface: http://localhost:4000"
echo "   Health Check:  http://localhost:4000/api/health"
echo "   Detailed Health: http://localhost:4000/api/health/detailed"
echo "   Port Status:   http://localhost:4000/api/admin/ports"