#!/bin/bash

# Partner PowerUp BizObs - Complete Setup & Startup Script
# Handles fresh git repo clone, dependency installation, ingress deployment, and server startup
# Repository: https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git

set -e  # Exit on any error

echo "🚀 Partner PowerUp BizObs - Complete Setup & Startup"
echo "===================================================="

# Configuration
REPO_URL="https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git"
PROJECT_NAME="Partner-PowerUp-BizObs-App"
BASE_DIR="/home/dt_training"
PROJECT_DIR="$BASE_DIR/$PROJECT_NAME"
FORCE_CLONE=false
DRY_RUN=false
EXTERNAL_URL="http://bizobs.c469ba93-51c8-40eb-979d-1c9075a148a0.dynatrace.training"

# Function to check if we're in the correct directory
check_directory() {
    if [[ -f "package.json" && -f "server.js" && $(basename "$(pwd)") == "$PROJECT_NAME" ]]; then
        PROJECT_DIR="$(pwd)"
        echo "📂 Running from existing project directory: $PROJECT_DIR"
        return 0
    else
        return 1
    fi
}

# Check if we're already in the project directory
if ! check_directory; then
    # Force clone logic
    if [[ "$FORCE_CLONE" == "true" ]]; then
        echo "🔁 Force cloning enabled. Backing up and cloning fresh..."
        cd "$BASE_DIR" || exit 1
        [[ -d "$PROJECT_DIR" ]] && mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        git clone "$REPO_URL" "$PROJECT_DIR"
        cd "$PROJECT_DIR" || exit 1
        echo "✅ Fresh repository cloned (forced)"
    else
        echo "📂 Setting up project in: $PROJECT_DIR"
        if [[ -d "$PROJECT_DIR" ]]; then
            echo "📁 Project directory exists, checking status..."
            cd "$PROJECT_DIR" || exit 1
            if [[ -d ".git" ]]; then
                CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
                if [[ "$CURRENT_REMOTE" == "$REPO_URL" ]]; then
                    echo "🔄 Updating existing repository..."
                    git fetch origin
                    git reset --hard origin/main
                    git pull origin main
                    echo "✅ Repository updated to latest version"
                else
                    echo "⚠️  Different repository found. Backing up and cloning fresh..."
                    cd "$BASE_DIR" || exit 1
                    mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
                    git clone "$REPO_URL" "$PROJECT_DIR"
                    cd "$PROJECT_DIR" || exit 1
                    echo "✅ Fresh repository cloned"
                fi
            else
                echo "📁 Directory exists but not a git repo. Backing up and cloning fresh..."
                cd "$BASE_DIR" || exit 1
                mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
                git clone "$REPO_URL" "$PROJECT_DIR"
                cd "$PROJECT_DIR" || exit 1
                echo "✅ Fresh repository cloned"
            fi
        else
            echo "📦 Cloning repository from GitHub..."
            cd "$BASE_DIR" || exit 1
            git clone "$REPO_URL" "$PROJECT_DIR"
            cd "$PROJECT_DIR" || exit 1
            echo "✅ Repository cloned successfully"
            echo "   From: $REPO_URL"
            echo "   To: $PROJECT_DIR"
        fi
    fi
fi

# Ensure we're in the right directory
cd "$PROJECT_DIR" || exit 1

echo "📂 Working directory: $(pwd)"
echo "🟢 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Port conflict check and cleanup
echo "🧹 Cleaning up existing processes and ports..."
if lsof -i:8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 8080 is already in use. Stopping existing processes..."
    lsof -i:8080 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    sleep 2
    echo "✅ Port 8080 freed"
fi

# Kill any existing node processes for this app
pkill -f "node server.js" 2>/dev/null || true
pkill -f "BizObs" 2>/dev/null || true
sleep 2

# Install dependencies
echo "📦 Installing dependencies from package.json..."
npm install
echo "✅ Dependencies installed successfully"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p services/.dynamic-runners

# Make scripts executable
echo "🔧 Setting executable permissions..."
chmod +x start-server.sh 2>/dev/null || true
chmod +x deploy-external.sh 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

# Validate project structure
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

if [[ ! -f "server.js" ]]; then
    echo "❌ Error: server.js not found"
    exit 1
fi

echo "✅ Project setup complete!"

# Dry run mode
if [[ "$DRY_RUN" == "true" ]]; then
    echo "🧪 Dry run mode enabled. Skipping server start."
    exit 0
fi

# Deploy Kubernetes ingress for external access
echo "📡 Deploying Kubernetes ingress for external access..."
if [[ -f "k8s/bizobs-ingress.yaml" ]]; then
    kubectl apply -f k8s/bizobs-ingress.yaml
    echo "✅ Ingress deployed successfully"
    
    # Wait for ingress to be ready
    sleep 3
    
    # Verify ingress
    if kubectl get ingress bizobs-ingress >/dev/null 2>&1; then
        echo "✅ Ingress verification successful"
    else
        echo "⚠️  Ingress deployment may have issues, but continuing..."
    fi
else
    echo "⚠️  Ingress configuration not found, skipping external access setup"
fi

# Set environment variables for optimal Dynatrace integration
echo "🔧 Configuring Dynatrace environment..."
export DT_SERVICE_NAME="bizobs-main-server"
export DT_APPLICATION_NAME="partner-powerup-bizobs"
export NODE_ENV="production"
export SERVICE_VERSION="1.0.0"
export DT_CLUSTER_ID="bizobs-cluster"
export DT_NODE_ID="bizobs-main-001"
export DT_CUSTOM_PROP="service.splitting=enabled"
export DT_TAGS="environment=production,application=bizobs,component=main-server"

# Disable RUM injection to prevent conflicts
export DT_JAVASCRIPT_INJECTION=false
export DT_JAVASCRIPT_INLINE_INJECTION=false  
export DT_RUM_INJECTION=false
export DT_BOOTSTRAP_INJECTION=false
export DT_ACTIVEGATE_URL=""

# Company and industry context
export COMPANY_NAME="Dynatrace"
export COMPANY_DOMAIN="dynatrace.com"
export INDUSTRY_TYPE="technology"

echo "✅ Environment configured for Dynatrace integration"

# Start the server
echo "🚀 Starting BizObs server with full observability..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start server in background and capture PID
nohup node server.js > logs/bizobs.log 2>&1 &
SERVER_PID=$!

echo "📝 BizObs server started with PID: $SERVER_PID"
echo "$SERVER_PID" > server.pid

# Wait for server to start
echo "⏳ Waiting for server startup..."
for i in {1..15}; do
    if curl -s http://localhost:8080/health >/dev/null 2>&1; then
        echo "✅ Server is responding on port 8080"
        break
    fi
    if [[ $i -eq 15 ]]; then
        echo "❌ Server failed to start within 15 seconds"
        echo "📋 Last few log lines:"
        tail -10 logs/bizobs.log 2>/dev/null || echo "No log file found"
        exit 1
    fi
    sleep 1
    echo -n "."
done

# Verify all services are running
echo ""
echo "🔍 Verifying service health..."
sleep 3

HEALTH_CHECK=$(curl -s http://localhost:8080/api/admin/services/status 2>/dev/null || echo "failed")
if [[ "$HEALTH_CHECK" != "failed" ]]; then
    RUNNING_SERVICES=$(echo "$HEALTH_CHECK" | jq -r '.runningServices // 0' 2>/dev/null || echo "0")
    TOTAL_SERVICES=$(echo "$HEALTH_CHECK" | jq -r '.totalServices // 0' 2>/dev/null || echo "0")
    
    if [[ "$RUNNING_SERVICES" -gt 0 ]]; then
        echo "✅ Service health check passed: $RUNNING_SERVICES/$TOTAL_SERVICES services running"
    else
        echo "⚠️  Service health check inconclusive, but main server is responding"
    fi
else
    echo "⚠️  Could not verify service health, but main server is responding"
fi

# Test external access if ingress was deployed
if kubectl get ingress bizobs-ingress >/dev/null 2>&1; then
    echo "🔍 Testing external access..."
    if curl -s "$EXTERNAL_URL/health" >/dev/null 2>&1; then
        echo "✅ External access verified"
    else
        echo "⚠️  External access not yet available (DNS propagation may be pending)"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 BIZOBS SERVER STARTUP COMPLETE! 🎉"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 ACCESS INFORMATION:"
echo "  • External URL: $EXTERNAL_URL/"
echo "  • Local URL:    http://localhost:8080/"
echo ""
echo "📊 KEY ENDPOINTS:"
echo "  • Main UI:        $EXTERNAL_URL/"
echo "  • Health Check:   $EXTERNAL_URL/health"
echo "  • Admin Panel:    $EXTERNAL_URL/api/admin/services/status"
echo "  • Detailed Health: $EXTERNAL_URL/api/health/detailed"
echo ""
echo "🎭 DEMO FEATURES READY:"
echo "  ✓ Customer Journey Simulation (Insurance, Retail, Tech, Enterprise)"
echo "  ✓ Multi-persona Load Generation (Karen, Raj, Alex, Sophia)"
echo "  ✓ Dynatrace Metadata Injection (13 headers per request)"
echo "  ✓ Real-time Observability & Metrics"
echo "  ✓ Error Simulation & Synthetic Traffic"
echo ""
echo "🔧 MANAGEMENT COMMANDS:"
echo "  • View Status:  ./status.sh"
echo "  • Stop Server:  ./stop.sh"
echo "  • Restart:      ./restart.sh"
echo "  • View Logs:    tail -f logs/bizobs.log"
echo ""
echo "📈 SAMPLE CUSTOMER JOURNEY:"
echo "  Insurance: PolicyDiscovery → QuoteGeneration → PolicySelection → PaymentProcessing → PolicyActivation → OngoingEngagement"
echo ""
echo "🚀 Ready for Customer Journey Demonstrations with Dynatrace Observability!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Keep the script running to show logs in real-time (optional)
if [[ "${1:-}" == "--follow-logs" ]]; then
    echo ""
    echo "📋 Following logs (Ctrl+C to exit):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -f logs/bizobs.log
fi
