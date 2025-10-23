#!/bin/bash

# BizObs Application Status Script - EasyTravel ACE-Box Edition
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

PORT=${PORT:-8080}

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════════════════╗
║  📊 BUSINESS OBSERVABILITY ENGINE STATUS REPORT 📊                          ║
║                                                                              ║
║                    🎯 EasyTravel ACE-Box Edition 🎯                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🔍 SYSTEM OVERVIEW${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${BLUE}📡 Configuration:${NC}"
echo -e "${BLUE}   • Main Port: ${PORT}${NC}"
echo -e "${BLUE}   • Service Range: ${SERVICE_PORT_MIN:-8081}-${SERVICE_PORT_MAX:-8094}${NC}"
echo -e "${BLUE}   • Company: ${DEFAULT_COMPANY:-Dynatrace}${NC}"
echo -e "${BLUE}   • Environment: ${DT_RELEASE_STAGE:-production}${NC}"

# Process Management Status
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🎛️  PROCESS MANAGEMENT STATUS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check PM2 status
if command -v pm2 &> /dev/null; then
    if pm2 describe bizobs-app > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PM2 Management Active${NC}"
        echo -e "${BLUE}� PM2 Process Details:${NC}"
        pm2 describe bizobs-app | grep -E "(name|status|cpu|memory|uptime|restart)" | sed 's/^/   /'
    else
        echo -e "${YELLOW}⚠️  PM2 Available but no bizobs-app process found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PM2 not installed - using manual process management${NC}"
fi

# Check manual PID file
if [ -f server.pid ]; then
    PID=$(cat server.pid)
    echo -e "${BLUE}📋 Manual PID File Status:${NC}"
    if kill -0 $PID 2>/dev/null; then
        PROCESS_INFO=$(ps -p $PID -o pid,ppid,pcpu,pmem,etime,cmd --no-headers)
        echo -e "${GREEN}   ✅ Process running with PID: $PID${NC}"
        echo -e "${BLUE}   📊 Process Details: $PROCESS_INFO${NC}"
    else
        echo -e "${RED}   ❌ Process not running (stale PID file)${NC}"
        echo -e "${YELLOW}   🧹 Consider removing server.pid${NC}"
    fi
fi

# Network Status
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🌐 NETWORK STATUS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check main port
if lsof -i :${PORT} > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Main Port ${PORT} is active${NC}"
    PORT_INFO=$(lsof -i :${PORT} | tail -n +2 | head -1)
    echo -e "${BLUE}   📊 Port Details: $PORT_INFO${NC}"
else
    echo -e "${RED}❌ Main Port ${PORT} is not in use${NC}"
fi

# Check service ports
echo -e "${BLUE}📡 Service Port Range Status:${NC}"
ACTIVE_SERVICES=0
for port in $(seq ${SERVICE_PORT_MIN:-8081} ${SERVICE_PORT_MAX:-8094}); do
    if lsof -i :${port} > /dev/null 2>&1; then
        ACTIVE_SERVICES=$((ACTIVE_SERVICES + 1))
    fi
done
echo -e "${BLUE}   • Active Services: ${ACTIVE_SERVICES}/$((${SERVICE_PORT_MAX:-8094} - ${SERVICE_PORT_MIN:-8081} + 1))${NC}"

# Health Check
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🏥 HEALTH CHECK STATUS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

HEALTH_STATUS="UNKNOWN"
HEALTH_RESPONSE=""

if HEALTH_RESPONSE=$(curl -s "http://localhost:${PORT}/api/health" 2>/dev/null); then
    echo -e "${GREEN}✅ Application is responding${NC}"
    HEALTH_STATUS="HEALTHY"
    
    echo -e "${BLUE}📊 Basic Health Details:${NC}"
    if command -v jq &> /dev/null; then
        echo "$HEALTH_RESPONSE" | jq . | sed 's/^/   /'
    else
        echo "$HEALTH_RESPONSE" | sed 's/^/   /'
    fi
else
    echo -e "${RED}❌ Application is not responding${NC}"
    HEALTH_STATUS="UNHEALTHY"
fi

# Detailed Status (if available)
if [ "$HEALTH_STATUS" = "HEALTHY" ]; then
    echo -e "${BLUE}🔍 Detailed System Status:${NC}"
    DETAILED_STATUS=$(curl -s "http://localhost:${PORT}/api/admin/services/status" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$DETAILED_STATUS" ]; then
        if command -v jq &> /dev/null; then
            echo "$DETAILED_STATUS" | jq . | sed 's/^/   /'
        else
            echo "$DETAILED_STATUS" | sed 's/^/   /'
        fi
    else
        echo -e "${YELLOW}   ⚠️  Detailed status unavailable${NC}"
    fi
    
    echo -e "${BLUE}📊 Port Allocation Status:${NC}"
    PORT_STATUS=$(curl -s "http://localhost:${PORT}/api/admin/ports" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$PORT_STATUS" ]; then
        if command -v jq &> /dev/null; then
            echo "$PORT_STATUS" | jq . | sed 's/^/   /'
        else
            echo "$PORT_STATUS" | sed 's/^/   /'
        fi
    else
        echo -e "${YELLOW}   ⚠️  Port status unavailable${NC}"
    fi
fi

# Running Processes
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🔍 SERVICE PROCESSES${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

PROCESSES=$(ps aux | grep -E "(node.*server\.js|node.*Service|bizobs)" | grep -v grep)
if [ -n "$PROCESSES" ]; then
    echo -e "${GREEN}✅ Active BizObs Processes:${NC}"
    echo "$PROCESSES" | sed 's/^/   /'
else
    echo -e "${RED}❌ No BizObs processes found${NC}"
fi

# Log Status
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}� LOG STATUS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f logs/bizobs.log ]; then
    LOG_SIZE=$(du -h logs/bizobs.log | cut -f1)
    LOG_LINES=$(wc -l < logs/bizobs.log)
    echo -e "${GREEN}✅ Log file available: logs/bizobs.log (${LOG_SIZE}, ${LOG_LINES} lines)${NC}"
    echo -e "${BLUE}📄 Recent log entries (last 5 lines):${NC}"
    tail -5 logs/bizobs.log | sed 's/^/   /'
elif command -v pm2 &> /dev/null; then
    echo -e "${BLUE}📄 PM2 log status:${NC}"
    pm2 logs bizobs-app --lines 5 --nostream 2>/dev/null | sed 's/^/   /' || echo -e "${YELLOW}   ⚠️  No PM2 logs available${NC}"
else
    echo -e "${YELLOW}⚠️  No log files found${NC}"
fi

# Access Information
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}🌍 ACCESS INFORMATION${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$HEALTH_STATUS" = "HEALTHY" ]; then
    echo -e "${GREEN}🌐 Application Endpoints:${NC}"
    echo -e "${GREEN}   • Main UI: http://localhost:${PORT}/ui${NC}"
    echo -e "${GREEN}   • API Root: http://localhost:${PORT}/api${NC}"
    echo -e "${GREEN}   • Health Check: http://localhost:${PORT}/health${NC}"
    echo -e "${GREEN}   • Detailed Health: http://localhost:${PORT}/api/health/detailed${NC}"
    echo -e "${GREEN}   • Admin Panel: http://localhost:${PORT}/api/admin/services/status${NC}"
    echo -e "${GREEN}   • Port Status: http://localhost:${PORT}/api/admin/ports${NC}"
else
    echo -e "${RED}❌ Application endpoints unavailable (application not responding)${NC}"
fi

echo -e "${PURPLE}🎭 Demo Tools:${NC}"
echo -e "${PURPLE}   • Error Simulation: ./scripts/simulate-errors.sh${NC}"
echo -e "${PURPLE}   • Load Generation: node scripts/load-simulation.js${NC}"
echo -e "${PURPLE}   • NGINX Setup: sudo scripts/setup-nginx.sh${NC}"

echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo -e "${BLUE}   • Start: ./start.sh${NC}"
echo -e "${BLUE}   • Stop: ./stop.sh${NC}"
echo -e "${BLUE}   • Restart: ./restart.sh${NC}"
echo -e "${BLUE}   • View Logs: tail -f logs/bizobs.log${NC}"

# Overall Status Summary
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}📋 OVERALL STATUS SUMMARY${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

case "$HEALTH_STATUS" in
    "HEALTHY")
        echo -e "${GREEN}🎉 STATUS: FULLY OPERATIONAL${NC}"
        echo -e "${GREEN}✅ Business Observability Engine is running optimally${NC}"
        echo -e "${GREEN}🚀 Ready for EasyTravel ACE-Box demo integration${NC}"
        ;;
    "UNHEALTHY")
        echo -e "${RED}⚠️  STATUS: SYSTEM DOWN${NC}"
        echo -e "${RED}❌ Business Observability Engine is not responding${NC}"
        echo -e "${YELLOW}🔧 Run ./start.sh to start the application${NC}"
        ;;
    *)
        echo -e "${YELLOW}❓ STATUS: UNKNOWN${NC}"
        echo -e "${YELLOW}⚠️  Unable to determine system status${NC}"
        ;;
esac

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"