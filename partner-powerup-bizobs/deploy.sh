#!/bin/bash

# Partner PowerUp BizObs App - Complete Deployment Script
# This script sets up the Business Observability application on a fresh EC2 instance

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Partner PowerUp BizObs Deployment Script${NC}"
echo "=============================================="

# Function to print status messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    log_warning "Running as root. Consider using a non-root user for better security."
fi

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"

log_info "Application directory: $APP_DIR"

# Step 1: Update system packages
log_info "Updating system packages..."
if command -v yum &> /dev/null; then
    sudo yum update -y
    PACKAGE_MANAGER="yum"
elif command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get upgrade -y
    PACKAGE_MANAGER="apt"
else
    log_error "Unsupported package manager. This script supports yum (Amazon Linux/RHEL) and apt (Ubuntu/Debian)."
    exit 1
fi

log_success "System packages updated"

# Step 2: Install Node.js if not present
log_info "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js 18.x..."
    
    if [ "$PACKAGE_MANAGER" = "yum" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    NODE_VERSION=$(node --version)
    log_success "Node.js already installed: $NODE_VERSION"
fi

# Verify Node.js and npm versions
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_success "Node.js version: $NODE_VERSION"
log_success "npm version: $NPM_VERSION"

# Step 3: Install process manager (PM2) globally
log_info "Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    log_success "PM2 installed"
else
    log_success "PM2 already installed"
fi

# Step 4: Install application dependencies
log_info "Installing application dependencies..."
cd "$APP_DIR"

if [ ! -f "package.json" ]; then
    log_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

npm install
log_success "Dependencies installed"

# Step 5: Create necessary directories
log_info "Creating necessary directories..."
mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/services/.dynamic-runners"
chmod 755 "$APP_DIR/services/.dynamic-runners"
log_success "Directories created"

# Step 6: Set up environment variables
log_info "Setting up environment configuration..."
if [ ! -f "$APP_DIR/.env" ]; then
    cat > "$APP_DIR/.env" << EOF
# BizObs Application Configuration
NODE_ENV=production
PORT=4000

# Default Company Context
DEFAULT_COMPANY=DefaultCompany
DEFAULT_DOMAIN=default.com
DEFAULT_INDUSTRY=general

# Dynatrace Configuration (optional)
# DT_TENANT=
# DT_API_TOKEN=
# DT_CONNECTION_POINT=

# Application Settings
MAX_SERVICES=50
SERVICE_PORT_MIN=4101
SERVICE_PORT_MAX=4299
HEALTH_CHECK_INTERVAL=30000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/bizobs.log
EOF
    log_success "Environment file created at $APP_DIR/.env"
else
    log_info "Environment file already exists"
fi

# Step 7: Configure firewall (if applicable)
log_info "Configuring firewall rules..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=4000/tcp
    sudo firewall-cmd --permanent --add-port=4101-4299/tcp
    sudo firewall-cmd --reload
    log_success "Firewall configured (firewalld)"
elif command -v ufw &> /dev/null; then
    sudo ufw allow 4000/tcp
    sudo ufw allow 4101:4299/tcp
    log_success "Firewall configured (ufw)"
else
    log_warning "No firewall detected. Ensure ports 4000 and 4101-4299 are open."
fi

# Step 8: Create PM2 ecosystem file
log_info "Creating PM2 ecosystem configuration..."
cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'bizobs-app',
    script: 'server.js',
    cwd: '/home/ec2-user/partner-powerup-bizobs',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: 'logs/bizobs-error.log',
    out_file: 'logs/bizobs-out.log',
    log_file: 'logs/bizobs-combined.log',
    time: true,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
log_success "PM2 ecosystem configuration created"

# Step 9: Create service management scripts
log_info "Creating service management scripts..."

# Start script
cat > "$APP_DIR/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting BizObs Application..."
pm2 start ecosystem.config.js
pm2 save
echo "✅ BizObs Application started"
echo "📊 Access the app at: http://localhost:4000"
echo "📋 View logs with: pm2 logs bizobs-app"
echo "📈 View status with: pm2 status"
EOF

# Stop script
cat > "$APP_DIR/stop.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🛑 Stopping BizObs Application..."
pm2 stop bizobs-app
pm2 delete bizobs-app
echo "✅ BizObs Application stopped"
EOF

# Restart script
cat > "$APP_DIR/restart.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🔄 Restarting BizObs Application..."
pm2 restart bizobs-app
echo "✅ BizObs Application restarted"
EOF

# Status script
cat > "$APP_DIR/status.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📊 BizObs Application Status:"
echo "============================"
pm2 status bizobs-app
echo ""
echo "🔗 Health Check:"
curl -s http://localhost:4000/api/health | jq . 2>/dev/null || curl -s http://localhost:4000/api/health
echo ""
echo "🎯 Port Status:"
curl -s http://localhost:4000/api/admin/ports | jq . 2>/dev/null || curl -s http://localhost:4000/api/admin/ports
EOF

# Make scripts executable
chmod +x "$APP_DIR/start.sh"
chmod +x "$APP_DIR/stop.sh"
chmod +x "$APP_DIR/restart.sh"
chmod +x "$APP_DIR/status.sh"

log_success "Service management scripts created"

# Step 10: Install jq for JSON parsing (useful for health checks)
log_info "Installing jq for JSON parsing..."
if ! command -v jq &> /dev/null; then
    if [ "$PACKAGE_MANAGER" = "yum" ]; then
        sudo yum install -y jq
    else
        sudo apt-get install -y jq
    fi
    log_success "jq installed"
else
    log_success "jq already installed"
fi

# Step 11: Setup PM2 startup script
log_info "Configuring PM2 auto-startup..."
pm2 startup | grep -E "sudo.*pm2" | bash || log_warning "PM2 startup configuration may need manual setup"

# Step 12: Validate installation
log_info "Validating installation..."

# Check if all required files exist
REQUIRED_FILES=("server.js" "package.json" "services/service-manager.js" "routes/journey-simulation.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$APP_DIR/$file" ]; then
        log_error "Required file missing: $file"
        exit 1
    fi
done

log_success "All required files present"

# Final instructions
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉${NC}"
echo "=============================================="
echo ""
echo -e "${BLUE}Quick Start Commands:${NC}"
echo "  Start app:     ./start.sh"
echo "  Stop app:      ./stop.sh"
echo "  Restart app:   ./restart.sh"
echo "  Check status:  ./status.sh"
echo ""
echo -e "${BLUE}Direct PM2 Commands:${NC}"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 stop bizobs-app"
echo "  pm2 restart bizobs-app"
echo "  pm2 logs bizobs-app"
echo "  pm2 monit"
echo ""
echo -e "${BLUE}Health Check URLs:${NC}"
echo "  Basic:    http://localhost:4000/api/health"
echo "  Detailed: http://localhost:4000/api/health/detailed"
echo "  Ports:    http://localhost:4000/api/admin/ports"
echo "  Web UI:   http://localhost:4000"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Run ./start.sh to start the application"
echo "2. Check ./status.sh to verify everything is running"
echo "3. Access the web interface at http://localhost:4000"
echo "4. Review logs with: pm2 logs bizobs-app"
echo ""
echo -e "${BLUE}Configuration Files Created:${NC}"
echo "  - .env (environment variables)"
echo "  - ecosystem.config.js (PM2 configuration)"
echo "  - start.sh, stop.sh, restart.sh, status.sh (management scripts)"
echo ""
echo -e "${GREEN}Happy monitoring with BizObs! 📊${NC}"
EOF

chmod +x "$APP_DIR/deploy.sh"