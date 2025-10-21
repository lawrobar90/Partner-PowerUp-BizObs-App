#!/bin/bash

# Simple BizObs Deployment Script
# Downloads repo and deploys the app

set -e

# Configuration
REPO_URL="https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git"
APP_NAME="partner-powerup-bizobs"
NODE_VERSION="18"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Banner
echo ""
echo "🚀 BizObs Simple Deployment Script"
echo "=================================="

# Install Git if needed
if ! command -v git &> /dev/null; then
    log "Installing Git..."
    if command -v yum &> /dev/null; then
        sudo yum install -y git
    elif command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y git
    else
        echo "❌ Please install git manually"
        exit 1
    fi
fi

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    log "Installing Node.js $NODE_VERSION..."
    if command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs
    elif command -v apt &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt install -y nodejs
    else
        echo "❌ Please install Node.js manually"
        exit 1
    fi
fi

success "Prerequisites ready"
log "Node.js version: $(node --version)"
log "Git version: $(git --version)"

# Stop existing processes
log "Cleaning up existing processes..."
pkill -f "node server.js" || true
sleep 2

# Backup existing installation if it exists
if [ -d "$APP_NAME" ]; then
    warning "Backing up existing installation..."
    mv "$APP_NAME" "${APP_NAME}.backup.$(date +%s)"
fi

# Clone the repository
log "Cloning BizObs repository..."
git clone "$REPO_URL" "$APP_NAME"
success "Repository cloned"

# Navigate to app directory
cd "$APP_NAME"

# Install dependencies
log "Installing dependencies..."
npm ci --only=production
success "Dependencies installed"

# Set executable permissions
log "Setting permissions..."
chmod +x start-server.sh
chmod +x scripts/*.sh 2>/dev/null || true
success "Permissions set"

# Start the application
log "Starting BizObs application..."
./start-server.sh &

# Wait for server to start
sleep 5

# Health check
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    success "BizObs is running!"
else
    warning "Health check failed - check logs"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo "🌐 Access: http://localhost:4000"
echo "📊 Health: http://localhost:4000/health"
echo ""
echo "🔧 Commands:"
echo "  Stop: pkill -f 'node server.js'"
echo "  Restart: cd $APP_NAME && ./start-server.sh"
echo ""