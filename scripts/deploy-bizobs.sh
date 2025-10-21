#!/bin/bash

# Quick BizObs Git Deployment Script
# Run this from anywhere to deploy BizObs from GitHub

REPO_URL="https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git"
APP_DIR="/home/ec2-user/partner-powerup-bizobs"

echo "🚀 Quick BizObs Deployment from GitHub"
echo "====================================="

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