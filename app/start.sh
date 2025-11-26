#!/bin/bash

# BizObs Application Start Script - EasyTravel ACE-Box Edition
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

# ASCII Art Banner
echo -e "${PURPLE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════════════════╗
║  ____  _      ____  _            ______ _                                    ║
║ |  _ \(_)____/ __ \| |__  ___   |  ____| |                                   ║
║ | |_) | |_  / / _` | '_ \/ __|  | |__  | | ___  ___  _ __ ___                ║
║ |  _ <| |/ / | (_| | |_) \__ \  |  __| | |/ _ \/ _ \| '__/ _ \               ║
║ | |_) | / /__ \__,_|_.__/|___/  | |____| |  __/  __/| | |  __/               ║
║ |____/|____|                   |______|_|\___|\___|_|  \___|               ║
║                                                                              ║
║                     🚀 EasyTravel ACE-Box Edition 🚀                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🎯 INITIATING BUSINESS OBSERVABILITY ENGINE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Configuration display
PORT=${PORT:-8080}
echo -e "${BLUE}📡 Port Configuration:${NC}"
echo -e "${BLUE}   • Main Server: ${PORT}${NC}"
echo -e "${BLUE}   • Service Range: ${SERVICE_PORT_MIN:-8081}-${SERVICE_PORT_MAX:-8094}${NC}"
echo -e "${BLUE}   • Port Offset: ${PORT_OFFSET:-0}${NC}"

echo -e "${BLUE}🏢 Company Context:${NC}"
echo -e "${BLUE}   • Company: ${DEFAULT_COMPANY:-Dynatrace}${NC}"
echo -e "${BLUE}   • Domain: ${DEFAULT_DOMAIN:-dynatrace.com}${NC}"
echo -e "${BLUE}   • Industry: ${DEFAULT_INDUSTRY:-technology}${NC}"

echo -e "${BLUE}🎭 ACE-Box Integration:${NC}"
echo -e "${BLUE}   • EasyTravel Compat: ${EASYTRAVEL_COMPAT:-true}${NC}"
echo -e "${BLUE}   • Owner: ${DT_OWNER:-ace-box-demo}${NC}"
echo -e "${BLUE}   • Release Stage: ${DT_RELEASE_STAGE:-production}${NC}"
echo -e "${BLUE}   • Customer ID: ${DT_CUSTOMER_ID:-dynatrace-demo}${NC}"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create logs directory
mkdir -p logs

# Pre-flight checks
echo -e "${YELLOW}🔍 PERFORMING PRE-FLIGHT CHECKS...${NC}"

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "NOT_FOUND")
if [ "$NODE_VERSION" = "NOT_FOUND" ]; then
    echo -e "${RED}❌ Node.js not found! Please install Node.js first.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
fi

# Check npm dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check port availability
if command -v netstat &> /dev/null && netstat -tuln | grep -q ":${PORT} "; then
    echo -e "${YELLOW}⚠️  Port ${PORT} is already in use. Attempting to stop existing process...${NC}"
    ./stop.sh 2>/dev/null || true
    sleep 2
elif command -v ss &> /dev/null && ss -tuln | grep -q ":${PORT} "; then
    echo -e "${YELLOW}⚠️  Port ${PORT} is already in use. Attempting to stop existing process...${NC}"
    ./stop.sh 2>/dev/null || true
    sleep 2
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🚀 LAUNCHING APPLICATION ENGINE...${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}📦 Detected PM2 - Using professional process management${NC}"
    
    # Stop any existing PM2 processes
    pm2 delete bizobs-app 2>/dev/null || true
    
    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save
    
    echo -e "${GREEN}✅ BizObs Engine launched with PM2 orchestration${NC}"
    echo -e "${BLUE}📊 Access Points:${NC}"
    echo -e "${BLUE}   • Main UI: http://localhost:${PORT}/ui${NC}"
    echo -e "${BLUE}   • API: http://localhost:${PORT}/api${NC}"
    echo -e "${BLUE}   • Health: http://localhost:${PORT}/health${NC}"
    echo -e "${BLUE}📋 Management Commands:${NC}"
    echo -e "${BLUE}   • View logs: pm2 logs bizobs-app${NC}"
    echo -e "${BLUE}   • View status: pm2 status${NC}"
    echo -e "${BLUE}   • Restart: pm2 restart bizobs-app${NC}"
else
    echo -e "${YELLOW}📦 PM2 not available - Using direct Node.js launch${NC}"
    
    # Kill any existing processes first
    pkill -f "partner-powerup-bizobs" 2>/dev/null || true
    pkill -f "server.js" 2>/dev/null || true
    sleep 2
    
    # Start in background with enhanced logging
    echo -e "${BLUE}📝 Starting server with enhanced logging...${NC}"
    nohup npm start > logs/bizobs.log 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > server.pid
    
    echo -e "${GREEN}✅ BizObs Engine launched with PID: $SERVER_PID${NC}"
    echo -e "${BLUE}📊 Access Points:${NC}"
    echo -e "${BLUE}   • Main UI: http://localhost:${PORT}/ui${NC}"
    echo -e "${BLUE}   • API: http://localhost:${PORT}/api${NC}"
    echo -e "${BLUE}   • Health: http://localhost:${PORT}/health${NC}"
    echo -e "${BLUE}📋 Management Commands:${NC}"
    echo -e "${BLUE}   • View logs: tail -f logs/bizobs.log${NC}"
    echo -e "${BLUE}   • Stop server: ./stop.sh${NC}"
    echo -e "${BLUE}   • Restart: ./restart.sh${NC}"
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🔄 PERFORMING POST-LAUNCH VALIDATION...${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Wait for startup and perform health checks
echo -e "${YELLOW}⏰ Waiting for application startup...${NC}"
for i in {1..10}; do
    sleep 1
    echo -n "."
done
echo ""

# Health check with retries
HEALTH_CHECK_PASSED=false
for attempt in {1..5}; do
    echo -e "${BLUE}🏥 Health Check Attempt $attempt/5...${NC}"
    
    if curl -s "http://localhost:${PORT}/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check PASSED - Application is responding!${NC}"
        HEALTH_CHECK_PASSED=true
        break
    else
        echo -e "${YELLOW}⏳ Application still starting... (attempt $attempt)${NC}"
        sleep 2
    fi
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    echo -e "${RED}❌ Health check FAILED - Application may have startup issues${NC}"
    echo -e "${YELLOW}📋 Check logs for details:${NC}"
    echo -e "${YELLOW}   • tail -f logs/bizobs.log${NC}"
    echo -e "${YELLOW}   • ./status.sh${NC}"
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$HEALTH_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}🎉 BUSINESS OBSERVABILITY ENGINE ONLINE! 🎉${NC}"
    echo -e "${GREEN}🚀 Ready for EasyTravel ACE-Box Demo Integration${NC}"
    
    if [ "$ACE_BOX_MODE" = "true" ]; then
        echo -e "${PURPLE}🎭 ACE-Box Demo Mode Active${NC}"
        echo -e "${PURPLE}   • Error Simulation: ./scripts/simulate-errors.sh${NC}"
        echo -e "${PURPLE}   • Load Generation: node scripts/load-simulation.js${NC}"
        echo -e "${PURPLE}   • NGINX Setup: sudo scripts/setup-nginx.sh${NC}"
    fi
    
    echo -e "${BLUE}🎯 Journey Management Features:${NC}"
    echo -e "${BLUE}   • New Customer Journey: Clear all services for fresh start${NC}"
    echo -e "${BLUE}   • Service Status Monitor: Real-time port and service tracking${NC}"
    echo -e "${BLUE}   • Expanded Port Range: ${SERVICE_PORT_MIN:-8081}-${SERVICE_PORT_MAX:-8120} (40 total ports)${NC}"
else
    echo -e "${RED}⚠️  STARTUP INCOMPLETE - CHECK LOGS FOR ISSUES${NC}"
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"