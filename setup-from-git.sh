#!/bin/bash

# Complete Partner PowerUp BizObs setup from Git repository
# This script handles cloning, dependency installation, and initial setup

set -e  # Exit on any error

echo "🚀 Partner PowerUp BizObs - Complete Git Setup"
echo "=============================================="

# Configuration
REPO_URL="https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git"
INSTALL_DIR="/home/ec2-user/partner-powerup-bizobs"
BRANCH="main"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--directory)
            INSTALL_DIR="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -u|--url)
            REPO_URL="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -d, --directory DIR   Installation directory (default: $INSTALL_DIR)"
            echo "  -b, --branch BRANCH   Git branch to clone (default: $BRANCH)"
            echo "  -u, --url URL         Git repository URL (default: $REPO_URL)"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "📋 Setup Configuration:"
echo "   Repository: $REPO_URL"
echo "   Branch: $BRANCH"
echo "   Install Directory: $INSTALL_DIR"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    echo "   Visit: https://nodejs.org/ or use package manager"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

# Check git
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install git first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   Git: $(git --version)"

# Create parent directory if needed
mkdir -p "$(dirname "$INSTALL_DIR")"

# Clone or update repository
if [[ -d "$INSTALL_DIR" ]]; then
    echo "📂 Directory exists. Checking if it's a git repository..."
    cd "$INSTALL_DIR"
    
    if [[ -d ".git" ]]; then
        echo "🔄 Updating existing repository..."
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
        echo "✅ Repository updated to latest $BRANCH"
    else
        echo "⚠️  Directory exists but is not a git repository."
        echo "   Moving existing directory to backup..."
        mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
        
        echo "📥 Cloning fresh repository..."
        git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
        echo "✅ Repository cloned successfully"
    fi
else
    echo "📥 Cloning repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    echo "✅ Repository cloned successfully"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for optional dependencies installation
echo "🔍 Checking optional dependencies..."
if npm list @dynatrace/oneagent-sdk &> /dev/null; then
    echo "✅ Dynatrace OneAgent SDK available"
else
    echo "ℹ️  Dynatrace OneAgent SDK not installed (optional)"
fi

echo "✅ Dependencies installed successfully"

# Make scripts executable
echo "🔧 Setting up executable permissions..."
chmod +x start-server.sh 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x *.sh 2>/dev/null || true

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p services/.dynamic-runners

echo "✅ Setup complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Start the server: ./start-server.sh"
echo "2. Or run directly: node server.js"
echo "3. Access the app: http://localhost:4000"
echo ""
echo "📊 Health Check: http://localhost:4000/api/health"
echo "🔧 Service Status: http://localhost:4000/api/admin/service-status"
echo ""
echo "=============================================="
echo "✅ Partner PowerUp BizObs ready to launch! 🚀"
echo "=============================================="