#!/bin/bash

# BizObs Application Restart Script - EasyTravel ACE-Box Edition
cd "$(dirname "$0")"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Colors for dramatic output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════╗
║  🔄 BUSINESS OBSERVABILITY ENGINE RESTART PROTOCOL 🔄                ║
║                                                                       ║
║              ⚡ Performing Graceful System Restart ⚡               ║
╚═══════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

PORT=${PORT:-8080}

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🎯 INITIATING RESTART SEQUENCE${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check current status
echo -e "${BLUE}📊 Checking current application status...${NC}"

# Check if PM2 is managing the app
if command -v pm2 &> /dev/null && pm2 describe bizobs-app > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PM2 managed process detected${NC}"
    echo -e "${BLUE}📋 Current PM2 status:${NC}"
    pm2 describe bizobs-app | grep -E "(name|status|cpu|memory)" || true
    
    echo -e "${YELLOW}🔄 Executing PM2 restart...${NC}"
    pm2 restart bizobs-app
    
    echo -e "${GREEN}✅ PM2 restart completed${NC}"
    echo -e "${BLUE}📋 New PM2 status:${NC}"
    pm2 describe bizobs-app | grep -E "(name|status|cpu|memory)" || true
    
elif [ -f "server.pid" ]; then
    SERVER_PID=$(cat server.pid)
    echo -e "${GREEN}✅ Manual process detected (PID: ${SERVER_PID})${NC}"
    
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo -e "${BLUE}� Process is running, performing graceful restart...${NC}"
    else
        echo -e "${YELLOW}⚠️  Process not running, will perform fresh start...${NC}"
    fi
    
    echo -e "${YELLOW}🛑 Stopping current instance...${NC}"
    ./stop.sh
    
    echo -e "${BLUE}⏰ Waiting for clean shutdown...${NC}"
    sleep 3
    
    echo -e "${YELLOW}🚀 Starting fresh instance...${NC}"
    ./start.sh
else
    echo -e "${YELLOW}⚠️  No active instance detected${NC}"
    echo -e "${BLUE}🚀 Performing fresh start...${NC}"
    ./start.sh
fi

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🔍 POST-RESTART VALIDATION${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Give the application time to start
echo -e "${BLUE}⏳ Allowing startup time (5 seconds)...${NC}"
sleep 5

# Perform health checks
HEALTH_CHECK_PASSED=false
for attempt in {1..3}; do
    echo -e "${BLUE}🏥 Health Check Attempt $attempt/3...${NC}"
    
    if curl -s "http://localhost:${PORT}/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check PASSED!${NC}"
        HEALTH_CHECK_PASSED=true
        break
    else
        echo -e "${YELLOW}⏳ Still starting... (attempt $attempt)${NC}"
        sleep 2
    fi
done

# Display results
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$HEALTH_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}🎉 RESTART SUCCESSFUL! SYSTEM ONLINE! 🎉${NC}"
    echo -e "${GREEN}🚀 BizObs Engine ready for EasyTravel ACE-Box integration${NC}"
    
    # Fetch system status
    STATUS_RESPONSE=$(curl -s "http://localhost:${PORT}/api/admin/services/status" | head -c 200 2>/dev/null || echo "Status unavailable")
    if [[ "$STATUS_RESPONSE" != "Status unavailable" ]]; then
        echo -e "${BLUE}📊 Quick Status Check:${NC}"
        echo -e "${BLUE}   • Response received: OK${NC}"
        echo -e "${BLUE}   • Service endpoint: Active${NC}"
    fi
    
    echo -e "${CYAN}🌐 Access Points:${NC}"
    echo -e "${CYAN}   • Main UI: http://localhost:${PORT}/ui${NC}"
    echo -e "${CYAN}   • API: http://localhost:${PORT}/api${NC}"
    echo -e "${CYAN}   • Health: http://localhost:${PORT}/health${NC}"
    echo -e "${CYAN}   • Admin: http://localhost:${PORT}/api/admin/services/status${NC}"
    
    echo -e "${PURPLE}🎭 Demo Tools:${NC}"
    echo -e "${PURPLE}   • Error Simulation: ./scripts/simulate-errors.sh${NC}"
    echo -e "${PURPLE}   • Load Generation: node scripts/load-simulation.js${NC}"
    echo -e "${PURPLE}   • System Status: ./status.sh${NC}"
else
    echo -e "${RED}❌ RESTART FAILED - HEALTH CHECK UNSUCCESSFUL${NC}"
    echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
    echo -e "${YELLOW}   • Check logs: tail -f logs/bizobs.log${NC}"
    echo -e "${YELLOW}   • Check status: ./status.sh${NC}"
    echo -e "${YELLOW}   • Manual check: curl http://localhost:${PORT}/api/health${NC}"
fi

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"