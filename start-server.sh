#!/bin/bash

# Partner PowerUp BizObs - Complete Ace-Box Deployment Script
# Handles fresh environment setup, dependency installation, Dynatrace integration, and full deployment
# Repository: https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git

set -e  # Exit on any error

echo "🚀 Partner PowerUp BizObs - Complete Ace-Box Deployment"
echo "========================================================"

# Configuration
REPO_URL="https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git"
PROJECT_NAME="Partner-PowerUp-BizObs-App"
BASE_DIR="/home/dt_training"
PROJECT_DIR="$BASE_DIR/$PROJECT_NAME"
FORCE_CLONE=false
DRY_RUN=false
EXTERNAL_URL="http://bizobs.c469ba93-51c8-40eb-979d-1c9075a148a0.dynatrace.training"

# Check for command line arguments
for arg in "$@"; do
    case $arg in
        --force-clone)
            FORCE_CLONE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --follow-logs)
            FOLLOW_LOGS=true
            shift
            ;;
        *)
            echo "Unknown argument: $arg"
            echo "Usage: $0 [--force-clone] [--dry-run] [--follow-logs]"
            exit 1
            ;;
    esac
done

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

# System requirements check
echo "🔍 Checking system requirements..."

# Check if running as dt_training user (typical for ace-box)
if [[ "$(whoami)" != "dt_training" ]]; then
    echo "⚠️  Warning: Not running as 'dt_training' user. Some ace-box features may not work."
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installed successfully"
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        echo "⚠️  Node.js version $NODE_VERSION is too old. Updating to Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        echo "✅ Node.js updated successfully"
    else
        echo "✅ Node.js version check passed: $(node --version)"
    fi
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Installing npm..."
    sudo apt-get install -y npm
    echo "✅ npm installed successfully"
else
    echo "✅ npm version check passed: $(npm --version)"
fi

# Check git
if ! command -v git &> /dev/null; then
    echo "❌ git not found. Installing git..."
    sudo apt-get update
    sudo apt-get install -y git
    echo "✅ git installed successfully"
else
    echo "✅ git version check passed: $(git --version)"
fi

# Check curl and jq for API testing
if ! command -v curl &> /dev/null; then
    echo "Installing curl..."
    sudo apt-get install -y curl
fi

if ! command -v jq &> /dev/null; then
    echo "Installing jq for JSON processing..."
    sudo apt-get install -y jq
fi

# Check kubectl for Kubernetes integration
if ! command -v kubectl &> /dev/null; then
    echo "⚠️  kubectl not found. Kubernetes ingress features will be skipped."
    SKIP_K8S=true
else
    echo "✅ kubectl found: $(kubectl version --client --short 2>/dev/null || echo 'kubectl available')"
    SKIP_K8S=false
fi

# Check lsof for port management
if ! command -v lsof &> /dev/null; then
    echo "Installing lsof for port management..."
    sudo apt-get install -y lsof
fi

echo "✅ System requirements check complete"

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
pkill -f "Service" 2>/dev/null || true
sleep 2

# Clean up any leftover service processes
echo "🧹 Cleaning up service processes..."
ps aux | grep -E "(DesignEngineeringService|PurchaseService|DataPersistenceService|DiscoveryService)" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies from package.json..."
npm install
echo "✅ Dependencies installed successfully"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p services/.dynamic-runners
mkdir -p public/assets
mkdir -p middleware
mkdir -p routes
mkdir -p scripts

# Copy environment configuration
echo "🔧 Setting up environment configuration..."
if [[ ! -f ".env" && -f ".env.example" ]]; then
    cp .env.example .env
    echo "✅ Environment file created from template"
fi

# Make scripts executable
echo "🔧 Setting executable permissions..."
chmod +x start-server.sh 2>/dev/null || true
chmod +x deploy-external.sh 2>/dev/null || true
chmod +x restart.sh 2>/dev/null || true
chmod +x stop.sh 2>/dev/null || true
chmod +x status.sh 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

# Validate project structure
echo "🔍 Validating project structure..."
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

if [[ ! -f "server.js" ]]; then
    echo "❌ Error: server.js not found"
    exit 1
fi

if [[ ! -d "services" ]]; then
    echo "❌ Error: services directory not found"
    exit 1
fi

if [[ ! -d "public" ]]; then
    echo "❌ Error: public directory not found"
    exit 1
fi

echo "✅ Project structure validation complete!"

# Dry run mode
if [[ "$DRY_RUN" == "true" ]]; then
    echo "🧪 Dry run mode enabled. Skipping server start."
    echo "✅ All prerequisites checked and dependencies installed."
    echo "💡 Run without --dry-run to start the server."
    exit 0
fi

# Detect ace-box environment
echo "🔍 Detecting ace-box environment..."
ACE_BOX_ID=""
if [[ -f "/etc/machine-id" ]]; then
    ACE_BOX_ID=$(cat /etc/machine-id | head -c 8)
fi

# Try to get the public hostname for ace-box
if command -v curl &> /dev/null; then
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "unknown")
else
    PUBLIC_IP=""
    INSTANCE_ID="unknown"
fi

# Set dynamic external URL if we can detect ace-box environment
if [[ -n "$PUBLIC_IP" && "$PUBLIC_IP" != "" ]]; then
    # Try to detect the ace-box domain pattern
    if [[ -n "$ACE_BOX_ID" ]]; then
        DYNAMIC_DOMAIN="${ACE_BOX_ID}.dynatrace.training"
        EXTERNAL_URL="http://bizobs.${DYNAMIC_DOMAIN}"
        echo "🌐 Detected ace-box environment: $DYNAMIC_DOMAIN"
    fi
fi

# Deploy Kubernetes ingress for external access (if kubectl available)
if [[ "$SKIP_K8S" == "false" ]]; then
    echo "📡 Deploying Kubernetes ingress for external access..."
    if [[ -f "k8s/bizobs-ingress.yaml" ]]; then
        # Update ingress file with current internal IP if needed
        INTERNAL_IP=$(hostname -I | awk '{print $1}')
        if [[ -n "$INTERNAL_IP" ]]; then
            sed -i "s/ip: [0-9.]*/ip: $INTERNAL_IP/" k8s/bizobs-ingress.yaml
            echo "✅ Updated ingress with internal IP: $INTERNAL_IP"
        fi
        
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
else
    echo "⚠️  Kubernetes not available, skipping ingress deployment"
fi

# Set environment variables for optimal Dynatrace integration
echo "🔧 Configuring Dynatrace environment..."
export DT_SERVICE_NAME="bizobs-main-server"
export DT_APPLICATION_NAME="BizObs-CustomerJourney"
export NODE_ENV="production"
export SERVICE_VERSION="1.0.0"
export DT_CLUSTER_ID="bizobs-cluster"
export DT_NODE_ID="bizobs-main-001"
export DT_TAGS="environment=production app=BizObs-CustomerJourney service=bizobs-main-server component=main-server"

# Ace-box specific Dynatrace integration
export DT_RELEASE_STAGE="demo"
export DT_RELEASE_PRODUCT="Partner-PowerUp-BizObs"
export DT_RELEASE_VERSION="1.0.0"
export DT_TENANT_TOKEN=""
export DT_CONNECTION_POINT=""

# Disable RUM injection to prevent conflicts with demo scenarios
export DT_JAVASCRIPT_INJECTION=false
export DT_JAVASCRIPT_INLINE_INJECTION=false  
export DT_RUM_INJECTION=false
export DT_BOOTSTRAP_INJECTION=false

# Company and industry context for demo scenarios
export COMPANY_NAME="Dynatrace"
export COMPANY_DOMAIN="dynatrace.com"  
export INDUSTRY_TYPE="technology"

# BizObs specific configuration
export BIZOBS_EXTERNAL_URL="$EXTERNAL_URL"
export BIZOBS_INSTANCE_ID="$INSTANCE_ID"
export BIZOBS_ACE_BOX_ID="$ACE_BOX_ID"

echo "✅ Environment configured for Dynatrace integration"

# Start the server
echo "🚀 Starting BizObs server with full observability..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ensure log directory exists and has proper permissions
mkdir -p logs
touch logs/bizobs.log

# Start server in background and capture PID
nohup node server.js > logs/bizobs.log 2>&1 &
SERVER_PID=$!

echo "📝 BizObs server started with PID: $SERVER_PID"
echo "$SERVER_PID" > server.pid

# Wait for server to start
echo "⏳ Waiting for server startup..."
for i in {1..30}; do
    if curl -s http://localhost:8080/health >/dev/null 2>&1; then
        echo "✅ Server is responding on port 8080"
        break
    fi
    if [[ $i -eq 30 ]]; then
        echo "❌ Server failed to start within 30 seconds"
        echo "📋 Last few log lines:"
        tail -20 logs/bizobs.log 2>/dev/null || echo "No log file found"
        echo ""
        echo "🔍 Process status:"
        ps aux | grep "node server.js" | grep -v grep || echo "No server process found"
        exit 1
    fi
    sleep 1
    echo -n "."
done

# Verify all services are running
echo ""
echo "🔍 Verifying service health..."
sleep 5

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

# Test a sample customer journey to ensure everything is working
echo "🧪 Testing customer journey simulation..."
JOURNEY_TEST=$(curl -s -X POST http://localhost:8080/api/journey-simulation/simulate-journey \
  -H "Content-Type: application/json" \
  -d '{"journey": {"companyName": "Demo Corp", "domain": "demo.com", "industryType": "Technology", "steps": [{"stepName": "UserRegistration", "serviceName": "RegistrationService", "category": "Onboarding"}]}}' 2>/dev/null || echo "failed")

if [[ "$JOURNEY_TEST" != "failed" ]]; then
    SUCCESS=$(echo "$JOURNEY_TEST" | jq -r '.success // false' 2>/dev/null || echo "false")
    if [[ "$SUCCESS" == "true" ]]; then
        echo "✅ Customer journey simulation test passed"
    else
        echo "⚠️  Customer journey simulation test had issues"
    fi
else
    echo "⚠️  Could not test customer journey simulation"
fi

# Test external access if ingress was deployed
if [[ "$SKIP_K8S" == "false" ]] && kubectl get ingress bizobs-ingress >/dev/null 2>&1; then
    echo "🔍 Testing external access..."
    sleep 2
    if curl -s "$EXTERNAL_URL/health" >/dev/null 2>&1; then
        echo "✅ External access verified"
    else
        echo "⚠️  External access not yet available (DNS propagation may be pending)"
    fi
fi

# Set up monitoring and management scripts
echo "🔧 Setting up management utilities..."

# Create enhanced status script
cat > status.sh << 'EOF'
#!/bin/bash
echo "📊 BizObs Server Status"
echo "====================="
if [[ -f "server.pid" ]]; then
    PID=$(cat server.pid)
    if ps -p $PID > /dev/null; then
        echo "✅ Server is running (PID: $PID)"
        echo "💾 Memory usage: $(ps -p $PID -o %mem= | xargs)%"
        echo "⏱️  CPU usage: $(ps -p $PID -o %cpu= | xargs)%"
    else
        echo "❌ Server is not running (stale PID file)"
    fi
else
    echo "❓ No PID file found"
fi

if curl -s http://localhost:8080/health > /dev/null; then
    echo "🌐 HTTP endpoint responding"
    curl -s http://localhost:8080/api/admin/services/status | jq -r '"🎯 Services: " + (.runningServices | tostring) + "/" + (.totalServices | tostring) + " running"' 2>/dev/null || echo "🎯 Services: Status unknown"
else
    echo "❌ HTTP endpoint not responding"
fi
EOF

# Create enhanced stop script
cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping BizObs Server..."
if [[ -f "server.pid" ]]; then
    PID=$(cat server.pid)
    if ps -p $PID > /dev/null; then
        echo "Stopping server (PID: $PID)..."
        kill $PID
        sleep 3
        if ps -p $PID > /dev/null; then
            echo "Force killing server..."
            kill -9 $PID
        fi
        echo "✅ Server stopped"
    else
        echo "Server was not running"
    fi
    rm -f server.pid
else
    echo "No PID file found"
fi

# Clean up any remaining processes
pkill -f "node server.js" 2>/dev/null || true
pkill -f "Service" 2>/dev/null || true
echo "✅ Cleanup complete"
EOF

chmod +x status.sh stop.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 BIZOBS ACE-BOX DEPLOYMENT COMPLETE! 🎉"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 ACCESS INFORMATION:"
echo "  • External URL: $EXTERNAL_URL/"
echo "  • Local URL:    http://localhost:8080/"
if [[ -n "$PUBLIC_IP" ]]; then
echo "  • Public IP:    http://$PUBLIC_IP:8080/"
fi
echo ""
echo "📊 KEY ENDPOINTS:"
echo "  • Main UI:           $EXTERNAL_URL/"
echo "  • Health Check:      $EXTERNAL_URL/health"
echo "  • Admin Panel:       $EXTERNAL_URL/api/admin/services/status"
echo "  • Detailed Health:   $EXTERNAL_URL/api/health/detailed" 
echo "  • Journey Simulation: $EXTERNAL_URL/api/journey-simulation/simulate-journey"
echo "  • Load Generation:   $EXTERNAL_URL/api/load-gen/start"
echo ""
echo "🎭 DEMO FEATURES READY:"
echo "  ✓ Customer Journey Simulation (Insurance, Retail, Tech, Enterprise)"
echo "  ✓ Multi-persona Load Generation (Karen, Raj, Alex, Sophia)"  
echo "  ✓ Dynatrace Metadata Injection (13+ headers per request)"
echo "  ✓ Real-time Observability & Metrics"
echo "  ✓ Error Simulation & Synthetic Traffic"
echo "  ✓ Service Mesh with Dynamic Service Creation"
echo "  ✓ Company-specific Service Isolation"
echo ""
echo "🔧 MANAGEMENT COMMANDS:"
echo "  • View Status:  ./status.sh"
echo "  • Stop Server:  ./stop.sh"
echo "  • Restart:      ./restart.sh"
echo "  • View Logs:    tail -f logs/bizobs.log"
echo "  • Follow Logs:  ./start-server.sh --follow-logs"
echo ""
echo "🎯 SAMPLE DEMO JOURNEYS:"
echo "  Insurance: PolicyDiscovery → QuoteGeneration → PolicySelection → PaymentProcessing"
echo "  Retail:    ProductBrowsing → CartManagement → CheckoutProcess → OrderFulfillment"
echo "  Tech:      UserOnboarding → FeatureExploration → DataProcessing → AnalyticsReporting"
echo "  Banking:   AccountCreation → KYCVerification → ProductSelection → TransactionProcessing"
echo ""
echo "🚀 READY FOR DYNATRACE OBSERVABILITY DEMONSTRATIONS!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Keep the script running to show logs in real-time (optional)
if [[ "${FOLLOW_LOGS:-false}" == "true" ]]; then
    echo ""
    echo "📋 Following logs (Ctrl+C to exit):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -f logs/bizobs.log
fi
