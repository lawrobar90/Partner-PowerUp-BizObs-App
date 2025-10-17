#!/bin/bash
cd /home/ec2-user/partner-powerup-bizobs

echo "Starting Partner PowerUp BizObs server..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Kill any existing processes
pkill -f "node server.js" || true

# Disable Dynatrace RUM injection to prevent API calls
export DT_JAVASCRIPT_INJECTION=false
export DT_JAVASCRIPT_INLINE_INJECTION=false  
export DT_RUM_INJECTION=false
export DT_BOOTSTRAP_INJECTION=false
export DT_ACTIVEGATE_URL=""

# Wait a moment
sleep 2

# Set environment variables for Dynatrace service detection
export DT_SERVICE_NAME="customer-journey-simulator"
export DT_APPLICATION_NAME="partner-powerup-bizobs"
export NODE_ENV="development"
export SERVICE_VERSION="1.0.0"
export DT_CLUSTER_ID="customer-journey-cluster"
export DT_NODE_ID="journey-node-001"

# Additional Dynatrace configuration for better service splitting
export DT_CUSTOM_PROP="service.splitting=enabled"
export DT_TAGS="environment=development,application=customer-journey"

# Start the server
echo "Starting server with Dynatrace service identification..."
node server.js &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"

# Wait for server to start
sleep 3


# Keep the server running
wait $SERVER_PID
