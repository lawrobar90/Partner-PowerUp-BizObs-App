#!/bin/bash

# Dynatrace BizObs Generator - Post-Create Setup Script
# Following Dynatrace Enablement Framework patterns
# https://dynatrace-wwse.github.io/codespaces-framework/

set -e

echo "🚀 Starting Dynatrace BizObs Generator setup..."

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

# Set up environment
export SECONDS=0
export NODE_ENV=development
export CODESPACES=true

print_status "Setting up Node.js environment..."

# Install dependencies
npm install

# Create necessary directories
mkdir -p .devcontainer/runlocal
mkdir -p logs
mkdir -p temp

print_status "Setting up Dynatrace integration..."

# Install OneAgent if DT_PAAS_TOKEN is available
if [ -n "$DT_PAAS_TOKEN" ] && [ -n "$DT_ENVIRONMENT" ]; then
    print_status "Installing Dynatrace OneAgent..."
    
    # Download OneAgent installer
    if wget -O /tmp/Dynatrace-OneAgent-Linux.sh "${DT_ENVIRONMENT}/api/v1/deployment/installer/agent/unix/default/latest?arch=x86&flavor=default" \
        --header="Authorization: Api-Token ${DT_PAAS_TOKEN}" 2>/dev/null; then
        
        # Install OneAgent with proper permissions
        if sudo /bin/sh /tmp/Dynatrace-OneAgent-Linux.sh --set-app-log-content-access=true --set-infra-only=false 2>/dev/null; then
            print_success "OneAgent installed successfully"
            # Clean up installer
            rm -f /tmp/Dynatrace-OneAgent-Linux.sh
        else
            print_warning "OneAgent installation failed (may require elevated permissions)"
            print_warning "BizEvents will not be captured without OneAgent"
        fi
    else
        print_warning "Could not download OneAgent installer"
        print_warning "Check DT_ENVIRONMENT and DT_PAAS_TOKEN configuration"
    fi
else
    print_warning "DT_PAAS_TOKEN not set - OneAgent will not be installed"
    print_warning "Configure GitHub Codespaces secret: DT_PAAS_TOKEN"
    print_warning "BizEvents will not be captured without OneAgent"
fi

# Create environment template file
cat > .devcontainer/runlocal/.env.template << 'EOF'
# Dynatrace Environment Configuration
# Copy this file to .env and fill in your values

# Primary Dynatrace Environment (required)
DT_ENVIRONMENT=https://wkf10640.apps.dynatrace.com

# Dynatrace Tokens (required for full observability)
DT_OPERATOR_TOKEN=your_operator_token_here
DT_INGEST_TOKEN=your_ingest_token_here
DT_PAAS_TOKEN=your_paas_token_here

# Legacy support (backward compatibility)
DYNATRACE_URL=${DT_ENVIRONMENT}
DYNATRACE_TOKEN=${DT_INGEST_TOKEN}

# Application Configuration
NODE_ENV=development
CLOUD_MODE=true
CODESPACES=true

# Framework Configuration
FRAMEWORK_VERSION=2024.11
EOF

# Create default .env file if it doesn't exist
if [ ! -f .devcontainer/runlocal/.env ]; then
    cp .devcontainer/runlocal/.env.template .devcontainer/runlocal/.env
    print_warning "Created default .env file. Please configure your Dynatrace environment."
fi

# Set up comfort functions for environment management
print_status "Installing comfort functions..."

cat > selectEnvironment << 'EOF'
#!/bin/bash

# Comfort function for selecting Dynatrace environment
echo "🌐 Select Dynatrace Environment:"
echo "1) Playground (wkf10640.apps.dynatrace.com)"
echo "2) Demo Live (demo.live.dynatrace.com)"
echo "3) TacoCorp (tacocorp.live.dynatrace.com)"
echo "4) Custom Environment"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        export DT_ENVIRONMENT="https://wkf10640.apps.dynatrace.com"
        echo "DT_ENVIRONMENT=https://wkf10640.apps.dynatrace.com" > .devcontainer/runlocal/.env
        ;;
    2)
        export DT_ENVIRONMENT="https://demo.live.dynatrace.com"
        echo "DT_ENVIRONMENT=https://demo.live.dynatrace.com" > .devcontainer/runlocal/.env
        ;;
    3)
        export DT_ENVIRONMENT="https://tacocorp.live.dynatrace.com"
        echo "DT_ENVIRONMENT=https://tacocorp.live.dynatrace.com" > .devcontainer/runlocal/.env
        ;;
    4)
        read -p "Enter your Dynatrace environment URL: " custom_env
        export DT_ENVIRONMENT="$custom_env"
        echo "DT_ENVIRONMENT=$custom_env" > .devcontainer/runlocal/.env
        ;;
    *)
        echo "Invalid choice. Using playground environment."
        export DT_ENVIRONMENT="https://wkf10640.apps.dynatrace.com"
        echo "DT_ENVIRONMENT=https://wkf10640.apps.dynatrace.com" > .devcontainer/runlocal/.env
        ;;
esac

echo "✅ Environment set to: $DT_ENVIRONMENT"
echo "💡 Remember to restart the MCP Server if running"
EOF

chmod +x selectEnvironment

# Add to PATH
echo 'export PATH="$PWD:$PATH"' >> ~/.bashrc

print_status "Setting up GitHub Codespaces integration..."

# Create GitHub Codespaces specific configuration
cat > .github/workflows/codespaces-prebuilds.yml << 'EOF'
name: Codespaces Prebuilds

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  codespaces:
    runs-on: ubuntu-latest
    if: ${{ github.repository_owner == 'lawrobar90' }}
    steps:
      - name: Prebuild Codespaces
        uses: github/super-linter@v4
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
EOF

# Create GitHub Codespaces template
mkdir -p .github
cat > .github/codespaces-readme.md << 'EOF'
# 🚀 Dynatrace BizObs Generator - GitHub Codespaces

## Quick Start

1. Click "Code" → "Codespaces" → "Create codespace on main"
2. Wait for the environment to initialize (~2-3 minutes)
3. The application will automatically start on port 8080
4. Configure your Dynatrace environment using `selectEnvironment`

## Dynatrace Integration

This Codespace includes:
- 🤖 **Dynatrace MCP Server** for AI-powered observability
- 📊 **Business Event Generation** with 60+ metadata fields
- 🔍 **Real-time Journey Simulation** 
- 📈 **Dashboard Creation Guidance**

## Environment Configuration

Set your Dynatrace environment:
```bash
selectEnvironment
```

## Secrets Configuration

Configure these in your GitHub repository:
- `DT_ENVIRONMENT`: Your Dynatrace tenant URL
- `DT_OPERATOR_TOKEN`: Operator token for K8s monitoring
- `DT_INGEST_TOKEN`: Token for data ingestion
EOF

print_status "Configuring MCP Server integration..."

# Create MCP server configuration
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "dynatrace.mcp.environment": "${env:DT_ENVIRONMENT}",
  "dynatrace.mcp.autoStart": true,
  "dynatrace.mcp.logLevel": "info",
  "terminal.integrated.defaultProfile.linux": "bash",
  "workbench.startupEditor": "readme"
}
EOF

print_status "Setting up development scripts..."

# Create development helper scripts
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Dynatrace BizObs Generator in development mode..."

# Source environment
if [ -f .devcontainer/runlocal/.env ]; then
    source .devcontainer/runlocal/.env
fi

# Start the application
npm start
EOF

chmod +x start-dev.sh

cat > quick-setup.sh << 'EOF'
#!/bin/bash

echo "⚡ Quick Setup for Dynatrace BizObs Generator"
echo "============================================="
echo ""
echo "1. Configure your Dynatrace environment:"
echo "   selectEnvironment"
echo ""
echo "2. Start the application:"
echo "   npm start"
echo ""
echo "3. Open in browser:"
echo "   http://localhost:8080"
echo ""
echo "4. For MCP Server integration:"
echo "   - Install Dynatrace MCP extension in VS Code"
echo "   - Configure with your DT_ENVIRONMENT"
echo ""
echo "📚 Documentation: https://dynatrace-wwse.github.io/codespaces-framework/"
EOF

chmod +x quick-setup.sh

print_status "Finalizing setup..."

# Update package.json scripts if needed
if command -v jq &> /dev/null; then
    # Add development scripts to package.json
    jq '.scripts.dev = "node server.js" | .scripts.codespaces = "./quick-setup.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
fi

# Set up bash aliases
cat >> ~/.bashrc << 'EOF'

# Dynatrace BizObs Generator aliases
alias bizobs='npm start'
alias setup='./quick-setup.sh'
alias env='selectEnvironment'
alias logs='tail -f logs/*.log'

echo "🎯 Dynatrace BizObs Generator - Codespaces Edition"
echo "📚 Run 'setup' for quick start guide"
echo "🌐 Run 'env' to configure Dynatrace environment"
echo "🚀 Run 'bizobs' to start the application"
EOF

# Final status
duration=$SECONDS
print_success "Setup completed in ${duration} seconds!"
print_status "🎯 Next steps:"
echo "   1. Run 'selectEnvironment' to configure Dynatrace"
echo "   2. Run 'npm start' to launch the application"
echo "   3. Open http://localhost:8080 in your browser"
echo "   4. Install Dynatrace MCP extension for AI features"
echo ""
echo "📚 Documentation: https://dynatrace-wwse.github.io/codespaces-framework/"
echo "🔧 Framework version: 2024.11"
echo ""