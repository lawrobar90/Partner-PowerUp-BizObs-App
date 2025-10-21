#!/bin/bash

# Partner PowerUp BizObs - Complete Setup & Startup Script
# Handles fresh git repo clone, dependency installation, and server startup
# Repository: https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git

set -e  # Exit on any error

echo "🚀 Partner PowerUp BizObs - Complete Setup & Startup"
echo "===================================================="

# Configuration
REPO_URL="https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git"
PROJECT_NAME="partner-powerup-bizobs"
BASE_DIR="/home/ec2-user"
PROJECT_DIR="$BASE_DIR/$PROJECT_NAME"
FORCE_CLONE=false
DRY_RUN=false

# Force clone logic
if [[ "$FORCE_CLONE" == "true" ]]; then
    echo "🔁 Force cloning enabled. Backing up and cloning fresh..."
    cd "$BASE_DIR"
    mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    echo "✅ Fresh repository cloned (forced)"
    echo ""
    echo "=============================================================================="
    echo "📦 REPOSITORY CLONE COMPLETE"
    echo "=============================================================================="
    echo "Repo: $REPO_URL"
    echo "Directory: $PROJECT_DIR"
    echo "=============================================================================="
    echo ""
else
    # Check if we're running from existing project directory
    if [[ -f "package.json" && -f "server.js" ]]; then
        PROJECT_DIR="$(pwd)"
        echo "📂 Running from existing project directory: $PROJECT_DIR"
        cd "$PROJECT_DIR"
    else
        echo "📂 Setting up project in: $PROJECT_DIR"
        if [[ -d "$PROJECT_DIR" ]]; then
            echo "📁 Project directory exists, checking status..."
            cd "$PROJECT_DIR"
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
                    cd "$BASE_DIR"
                    mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
                    git clone "$REPO_URL" "$PROJECT_DIR"
                    cd "$PROJECT_DIR"
                    echo "✅ Fresh repository cloned"
                fi
            else
                echo "📁 Directory exists but not a git repo. Backing up and cloning fresh..."
                cd "$BASE_DIR"
                mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
                git clone "$REPO_URL" "$PROJECT_DIR"
                cd "$PROJECT_DIR"
                echo "✅ Fresh repository cloned"
            fi
        else
            echo "📦 Cloning repository from GitHub..."
            cd "$BASE_DIR"
            git clone "$REPO_URL" "$PROJECT_DIR"
            cd "$PROJECT_DIR"
            echo "✅ Repository cloned successfully"
            echo "   From: $REPO_URL"
            echo "   To: $PROJECT_DIR"
        fi
    fi
fi

echo "📂 Working directory: $(pwd)"
echo "🟢 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Port conflict check
if lsof -i:4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Port 4000 is already in use. Attempting to free it..."
    lsof -i:4000 -sTCP:LISTEN -t | xargs kill -9
    sleep 2
    echo "✅ Port 4000 freed"
fi

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node server.js" || true
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

# Disable Dynatrace RUM injection
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
export DT_CUSTOM_PROP="service.splitting=enabled"
export DT_TAGS="environment=development,application=customer-journey"

# Start the server
echo "Starting server with Dynatrace service identification..."
node server.js &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"
sleep 3

# Show quick start guide (unchanged)
# [ ... retained from your original script ... ]

# Keep the server running
wait $SERVER_PID
