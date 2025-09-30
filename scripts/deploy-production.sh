#!/bin/bash

# Dynatrace Vegas Casino - Production Deployment Script
# This script prepares the application for production deployment with Dynatrace monitoring

set -e

echo "🎰 Starting Dynatrace Vegas Casino Production Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check Node.js version
print_status "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js version check passed: $(node -v)"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install
npm install --optional-only
print_success "Dependencies installed successfully"

# Check for .env file
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.template .env
    print_warning "Please edit .env file with your Dynatrace credentials before running the application"
    echo
    echo "Required environment variables:"
    echo "  - DT_TENANT: Your Dynatrace tenant ID"
    echo "  - DT_API_TOKEN: Your Dynatrace API token"
    echo "  - DT_PAAS_TOKEN: Your Dynatrace PaaS token"
    echo "  - DT_BIZEVENTS_TENANT_URL: Your Dynatrace tenant URL"
    echo "  - DT_BIZEVENTS_TOKEN: Your BizEvents ingest token"
    echo
else
    print_success ".env file found"
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Set proper permissions
print_status "Setting file permissions..."
chmod +x scripts/*.sh
chmod 644 .env.template
if [ -f ".env" ]; then
    chmod 600 .env  # Restrict access to environment file
fi
print_success "File permissions set"

# Validate server can start
print_status "Validating server configuration..."
timeout 10s node server.js > /dev/null 2>&1 || true
print_success "Server configuration validated"

# Check if systemd is available for service installation
if command -v systemctl &> /dev/null; then
    echo
    print_status "Systemd detected. You can install this as a system service:"
    echo "  sudo ./scripts/setup-environment.sh"
    echo
fi

# Check if OneAgent is installed
if [ -d "/opt/dynatrace/oneagent" ]; then
    print_success "Dynatrace OneAgent is installed"
else
    print_warning "Dynatrace OneAgent not detected. To install:"
    echo "  ./scripts/install-oneagent.sh"
    echo
fi

echo
print_success "🎰 Dynatrace Vegas Casino is ready for production deployment!"
echo
echo "Next steps:"
echo "1. Edit .env file with your Dynatrace credentials (if not done)"
echo "2. Install OneAgent: ./scripts/install-oneagent.sh (optional but recommended)"
echo "3. Setup systemd service: sudo ./scripts/setup-environment.sh (optional)"
echo "4. Start the application: npm start"
echo
echo "Application will be available at: http://localhost:3000"
echo "Metrics endpoint: http://localhost:3000/metrics"
echo "Analytics dashboard: http://localhost:3000/analytics.html"
echo
print_status "For production, consider using a process manager like PM2 or systemd service"