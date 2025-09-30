#!/bin/bash

# Comprehensive Betting Test Script
# Tests all game APIs for hanging or incomplete transactions

echo "🎰 Starting Vegas Casino Comprehensive Betting Test..."

# Wait for server to start
sleep 3

# Function to test an endpoint with timeout
test_endpoint() {
    local endpoint=$1
    local data=$2
    local test_name=$3
    
    echo "Testing $test_name..."
    
    # Test with 10-second timeout
    response=$(curl -s --max-time 10 -X POST "http://localhost:3000$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✅ $test_name: SUCCESS"
        echo "   Response: $(echo $response | cut -c1-100)..."
    else
        echo "❌ $test_name: FAILED or TIMEOUT"
        echo "   Error: $response"
    fi
    echo
}

# Test rapid betting (simulate user clicking quickly)
echo "🚀 Testing rapid betting scenarios..."

echo "--- SLOTS TESTS ---"
test_endpoint "/api/slots/spin" '{"bet": 5, "userId": "rapid-tester"}' "Slots Spin #1"
test_endpoint "/api/slots/spin" '{"bet": 10, "userId": "rapid-tester"}' "Slots Spin #2"
test_endpoint "/api/slots/spin" '{"bet": 15, "userId": "rapid-tester"}' "Slots Spin #3"

echo "--- ROULETTE TESTS ---"
test_endpoint "/api/roulette/spin" '{"bet": 20, "number": 7, "userId": "rapid-tester"}' "Roulette Bet Red 7"
test_endpoint "/api/roulette/spin" '{"bet": 25, "number": 0, "userId": "rapid-tester"}' "Roulette Bet Green 0"
test_endpoint "/api/roulette/spin" '{"bet": 30, "color": "black", "userId": "rapid-tester"}' "Roulette Bet Black"

echo "--- DICE TESTS ---"
test_endpoint "/api/dice/roll" '{"bet": 15, "userId": "rapid-tester"}' "Dice Roll #1"
test_endpoint "/api/dice/roll" '{"bet": 20, "userId": "rapid-tester"}' "Dice Roll #2"
test_endpoint "/api/dice/roll" '{"bet": 25, "userId": "rapid-tester"}' "Dice Roll #3"

echo "--- BLACKJACK TESTS ---"
test_endpoint "/api/blackjack/deal" '{"bet": 10, "userId": "rapid-tester"}' "Blackjack Deal #1"
test_endpoint "/api/blackjack/deal" '{"bet": 15, "userId": "rapid-tester"}' "Blackjack Deal #2"
test_endpoint "/api/blackjack/deal" '{"bet": 20, "userId": "rapid-tester"}' "Blackjack Deal #3"

# Test blackjack actions
echo "--- BLACKJACK ACTION TESTS ---"
test_endpoint "/api/blackjack/hit" '{"sessionId": "test-session", "userId": "rapid-tester"}' "Blackjack Hit"
test_endpoint "/api/blackjack/stand" '{"sessionId": "test-session", "userId": "rapid-tester"}' "Blackjack Stand"
test_endpoint "/api/blackjack/double" '{"sessionId": "test-session", "userId": "rapid-tester"}' "Blackjack Double"

echo "--- SYSTEM TESTS ---"
test_endpoint "/api/metrics" '' "Metrics Endpoint (GET)"

# Test with invalid data
echo "--- ERROR HANDLING TESTS ---"
test_endpoint "/api/slots/spin" '{"bet": -5, "userId": "error-tester"}' "Negative Bet Test"
test_endpoint "/api/roulette/spin" '{"bet": 1000000, "userId": "error-tester"}' "Excessive Bet Test"
test_endpoint "/api/dice/roll" '{}' "Empty Data Test"

echo "🎯 Comprehensive betting test completed!"
echo
echo "📊 Checking server metrics..."
curl -s http://localhost:3000/api/metrics | grep -E '"total|active|errors"' | head -10
echo
echo "📝 Check server logs for any errors:"
echo "   tail -20 server.log"