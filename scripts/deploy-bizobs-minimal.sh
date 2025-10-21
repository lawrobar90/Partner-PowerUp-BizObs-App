#!/bin/bash
# Simple BizObs Deployment Script
# Downloads and deploys the BizObs app

set -e

REPO_URL="https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git"
APP_DIR="partner-powerup-bizobs"

echo "🚀 BizObs Simple Deployment"
echo "=========================="

# Check prerequisites
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Installing..."
    if command -v yum &> /dev/null; then
        sudo yum install -y git
    elif command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y git
    else
        echo "Please install git manually"
        exit 1
    fi
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    if command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    elif command -v apt &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    else
        echo "Please install Node.js manually"
        exit 1
    fi
fi

echo "✅ Prerequisites ready"
echo "Node.js: $(node --version)"
echo "Git: $(git --version)"

# Stop existing processes
echo "Stopping existing processes..."
pkill -f "node server.js" || true

# Remove existing directory
if [ -d "$APP_DIR" ]; then
    echo "Backing up existing installation..."
    mv "$APP_DIR" "${APP_DIR}.backup.$(date +%s)"
fi

# Clone and deploy
echo "Cloning repository..."
git clone "$REPO_URL" "$APP_DIR"

cd "$APP_DIR"

echo "Installing dependencies..."
npm ci --only=production

echo "Setting permissions..."
chmod +x start-server.sh scripts/*.sh

echo "Starting server..."
./start-server.sh &

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access at: http://localhost:4000"
echo "📊 Health: curl http://localhost:4000/health"