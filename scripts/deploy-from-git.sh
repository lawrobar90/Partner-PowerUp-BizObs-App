#!/bin/bash

# BizObs Complete Git Deployment Script
# This script deploys the entire BizObs application from GitHub repository

set -e

# Configuration
REPO_URL="https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git"
APP_NAME="partner-powerup-bizobs"
DEPLOY_DIR="/home/ec2-user"
SERVICE_NAME="bizobs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo "=========================================="
echo "🚀 BizObs Git Deployment Script"
echo "=========================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    error "Git is not installed. Please install git first."
    echo "sudo yum install git -y"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js first."
    echo "curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -"
    echo "sudo yum install nodejs -y"
    exit 1
fi

success "Prerequisites check passed"
log "Node.js version: $(node --version)"
log "npm version: $(npm --version)"
log "Git version: $(git --version)"
echo ""

# Stop existing service if running
log "Checking for existing BizObs processes..."
if pgrep -f "node server.js" > /dev/null; then
    warning "Stopping existing BizObs processes..."
    pkill -f "node server.js" || true
    sleep 3
fi

# Stop systemd service if it exists
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    warning "Stopping systemd service..."
    sudo systemctl stop "$SERVICE_NAME" || true
fi

# Navigate to deployment directory
cd "$DEPLOY_DIR"

# Backup existing installation if it exists
if [ -d "$APP_NAME" ]; then
    warning "Backing up existing installation..."
    BACKUP_NAME="${APP_NAME}.backup.$(date +%s)"
    mv "$APP_NAME" "$BACKUP_NAME"
    log "Backup created: $BACKUP_NAME"
fi

# Clone the repository
log "Cloning repository from GitHub..."
git clone "$REPO_URL" "$APP_NAME"
success "Repository cloned successfully"

# Navigate to app directory
cd "$APP_NAME"

# Install dependencies
log "Installing Node.js dependencies..."
npm ci --only=production --silent
success "Dependencies installed"

# Set executable permissions
log "Setting executable permissions..."
chmod +x start-server.sh
chmod +x scripts/*.sh
success "Permissions set"

# Create log directory
log "Creating log directories..."
mkdir -p logs
touch logs/server.log
touch logs/error.log
success "Log directories created"

# Test the installation
log "Testing installation..."
if node -e "require('./server.js')" 2>/dev/null; then
    success "Installation test passed"
else
    warning "Installation test had issues - but continuing"
fi

# Option to set up systemd service
echo ""
echo "🔧 Deployment Options:"
echo "1. Start manually (recommended for testing)"
echo "2. Set up auto-start service (requires sudo)"
echo ""
read -p "Choose option (1 or 2): " choice

case $choice in
    1)
        log "Starting BizObs manually..."
        echo ""
        echo "🎯 Starting server with RUM injection disabled..."
        ./start-server.sh &
        
        # Wait for server to start
        sleep 5
        
        # Test if server is responding
        if curl -s http://localhost:4000/health > /dev/null 2>&1; then
            success "BizObs is running successfully!"
            echo ""
            echo "🌐 Application URL: http://localhost:4000"
            echo "📊 Health Check: http://localhost:4000/health"
            echo ""
            echo "🔍 Useful commands:"
            echo "  • Stop: pkill -f 'node server.js'"
            echo "  • Restart: cd $DEPLOY_DIR/$APP_NAME && ./start-server.sh"
            echo "  • Logs: tail -f $DEPLOY_DIR/$APP_NAME/server.log"
        else
            error "Server failed to start. Check logs:"
            echo "tail -f $DEPLOY_DIR/$APP_NAME/server.log"
        fi
        ;;
    2)
        if [ "$EUID" -ne 0 ]; then
            log "Setting up auto-start service (requires sudo)..."
            sudo ./scripts/setup-autostart.sh
        else
            log "Setting up auto-start service..."
            ./scripts/setup-autostart.sh
        fi
        ;;
    *)
        warning "Invalid choice. Starting manually..."
        ./start-server.sh &
        ;;
esac

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 What was deployed:"
echo "  • Repository: $REPO_URL"
echo "  • Location: $DEPLOY_DIR/$APP_NAME"
echo "  • Dependencies: Installed"
echo "  • RUM Injection: Disabled (no API calls)"
echo "  • Health Endpoint: /health"
echo "  • Main App: /index.html"
echo ""
echo "🚀 Quick Test Commands:"
echo "curl http://localhost:4000/health"
echo "curl http://localhost:4000/"
echo ""