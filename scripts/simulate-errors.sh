#!/bin/bash
# BizObs Error Simulation Script for ACE-Box Demo

set -e

# Colors for dramatic output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PORT=${PORT:-8080}
BASE_URL="http://localhost:${PORT}"
SIMULATION_DURATION=${1:-60}  # Default 60 seconds
ERROR_RATE=${2:-0.1}          # Default 10% error rate

echo -e "${RED}🚨 INITIATING ERROR SIMULATION PROTOCOL 🚨${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Target: ${BASE_URL}${NC}"
echo -e "${BLUE}⏰ Duration: ${SIMULATION_DURATION} seconds${NC}"
echo -e "${BLUE}💥 Error Rate: $(echo "${ERROR_RATE} * 100" | bc -l | cut -d. -f1)%${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Error types to simulate
ERROR_TYPES=(
    "500-internal-error"
    "timeout-error"
    "connection-error"
    "validation-error"
    "metadata-missing-error"
    "service-unavailable"
    "rate-limit-error"
)

# Customer personas for realistic scenarios
PERSONAS=(
    "karen-retail"
    "raj-insurance"
    "alex-tech"
    "default"
)

# Journey steps to target
STEPS=(
    "Discovery"
    "Purchase" 
    "DataPersistence"
    "PolicySelection"
    "QuotePersonalization"
    "SecureCheckout"
)

# Function to simulate a specific error
simulate_error() {
    local error_type=$1
    local persona=$2
    local step=$3
    local attempt=$4
    
    echo -e "${RED}💥 [${attempt}] Simulating ${error_type} for ${persona} on ${step}${NC}"
    
    case $error_type in
        "500-internal-error")
            curl -s -X POST "${BASE_URL}/api/test/error-trace" \
                -H "Content-Type: application/json" \
                -H "x-customer-persona: ${persona}" \
                -d "{\"stepName\":\"${step}\",\"shouldFail\":true,\"errorType\":\"InternalServerError\"}" \
                -o /dev/null || echo -e "${RED}  ✓ 500 Error simulated${NC}"
            ;;
        "timeout-error")
            timeout 2s curl -s -X POST "${BASE_URL}/api/journey-simulation/start" \
                -H "Content-Type: application/json" \
                -H "x-customer-persona: ${persona}" \
                -d "{\"customer\":{\"name\":\"${persona}\"},\"journeyType\":\"timeout-test\",\"steps\":[{\"stepName\":\"${step}\",\"delay\":5000}]}" \
                -o /dev/null || echo -e "${RED}  ✓ Timeout Error simulated${NC}"
            ;;
        "connection-error")
            # Try to call a non-existent service port
            curl -s --connect-timeout 1 "http://localhost:9999/api/test" \
                -o /dev/null || echo -e "${RED}  ✓ Connection Error simulated${NC}"
            ;;
        "validation-error")
            curl -s -X POST "${BASE_URL}/api/journey-simulation/start" \
                -H "Content-Type: application/json" \
                -H "x-customer-persona: ${persona}" \
                -d "{\"invalid\":\"payload\",\"missing\":\"required_fields\"}" \
                -o /dev/null || echo -e "${RED}  ✓ Validation Error simulated${NC}"
            ;;
        "metadata-missing-error")
            curl -s -X GET "${BASE_URL}/api/health" \
                -H "x-strip-metadata: true" \
                -o /dev/null || echo -e "${RED}  ✓ Metadata Missing Error simulated${NC}"
            ;;
        "service-unavailable")
            curl -s -X POST "${BASE_URL}/api/admin/services/restart-all" \
                -o /dev/null && sleep 2 || echo -e "${RED}  ✓ Service Unavailable simulated${NC}"
            ;;
        "rate-limit-error")
            # Rapid fire requests to trigger rate limiting
            for i in {1..20}; do
                curl -s "${BASE_URL}/api/test" -o /dev/null &
            done
            wait
            echo -e "${RED}  ✓ Rate Limit Error simulated${NC}"
            ;;
    esac
}

# Function to generate normal traffic between errors
generate_normal_traffic() {
    local persona=$1
    local step=$2
    
    # Random normal requests
    case $((RANDOM % 4)) in
        0)
            curl -s "${BASE_URL}/api/health" \
                -H "x-customer-persona: ${persona}" \
                -o /dev/null
            ;;
        1)
            curl -s "${BASE_URL}/api/admin/services" \
                -H "x-customer-persona: ${persona}" \
                -o /dev/null
            ;;
        2)
            curl -s "${BASE_URL}/api/test" \
                -H "x-customer-persona: ${persona}" \
                -o /dev/null
            ;;
        3)
            curl -s -X POST "${BASE_URL}/api/journey-simulation/start" \
                -H "Content-Type: application/json" \
                -H "x-customer-persona: ${persona}" \
                -d "{\"customer\":{\"name\":\"${persona}\"},\"journeyType\":\"normal\",\"steps\":[{\"stepName\":\"${step}\"}]}" \
                -o /dev/null
            ;;
    esac
}

# Main simulation loop
start_time=$(date +%s)
attempt=1

echo -e "${GREEN}🎯 Starting error simulation...${NC}"

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -ge $SIMULATION_DURATION ]; then
        break
    fi
    
    # Select random components for this iteration
    error_type=${ERROR_TYPES[$((RANDOM % ${#ERROR_TYPES[@]}))]}
    persona=${PERSONAS[$((RANDOM % ${#PERSONAS[@]}))]}
    step=${STEPS[$((RANDOM % ${#STEPS[@]}))]}
    
    # Decide whether to simulate error or normal traffic
    if (( $(echo "$RANDOM / 32767 < $ERROR_RATE" | bc -l) )); then
        simulate_error "$error_type" "$persona" "$step" "$attempt"
    else
        generate_normal_traffic "$persona" "$step"
        echo -e "${GREEN}✓ [${attempt}] Normal traffic: ${persona} → ${step}${NC}"
    fi
    
    attempt=$((attempt + 1))
    
    # Random delay between 1-5 seconds
    sleep $((1 + RANDOM % 5))
done

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ ERROR SIMULATION COMPLETE${NC}"
echo -e "${BLUE}📊 Total Attempts: ${attempt}${NC}"
echo -e "${BLUE}⏰ Duration: ${elapsed} seconds${NC}"
echo -e "${PURPLE}🎭 Check Dynatrace dashboards for captured errors and metadata!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"