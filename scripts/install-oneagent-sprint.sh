#!/bin/bash

# Dynatrace OneAgent Installation Script for Vegas Casino
# Using Sprint Labs Configuration: bko67471.sprint.dynatracelabs.com
# This script installs OneAgent with your specific credentials

set -e

echo "🎰 Dynatrace OneAgent Installation for Vegas Casino"
echo "=============================================="
echo "📡 Target: Sprint Labs (bko67471.sprint.dynatracelabs.com)"
echo ""

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

# Check if running as root (required for OneAgent installation)
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   echo "Usage: sudo ./install-oneagent-sprint.sh"
   exit 1
fi

# Sprint Labs Configuration (from your provided config)
DT_TENANT_URL="https://bko67471.sprint.dynatracelabs.com"
DT_API_TOKEN="dt0c01.PUWR5ZARZBNG22IOXOXOC5FZ.6UOYSOBWCTYYEGITBAOMXV6HLQYDD2FEE62X3QXN2QEEVMBJPVAATYCIUJUA3JG4"
INSTALLER_NAME="Dynatrace-OneAgent-Linux-1.325.17.20250926-212657.sh"

print_status "Sprint Labs Tenant: bko67471.sprint.dynatracelabs.com"

# Determine system architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "x86_64" ]]; then
    ARCH="x86"
elif [[ "$ARCH" == "aarch64" ]]; then
    ARCH="arm"
else
    print_error "Unsupported architecture: $ARCH"
    exit 1
fi

print_status "Detected architecture: $ARCH"

# OneAgent download URL (using your exact configuration)
ONEAGENT_URL="${DT_TENANT_URL}/api/v1/deployment/installer/agent/unix/default/latest?arch=${ARCH}"

print_status "Downloading OneAgent installer from Sprint Labs..."

# Download OneAgent installer using your exact wget command
wget -O "$INSTALLER_NAME" "$ONEAGENT_URL" --header="Authorization: Api-Token $DT_API_TOKEN"

if [ $? -ne 0 ]; then
    print_error "Failed to download OneAgent installer"
    exit 1
fi

print_success "OneAgent installer downloaded: $INSTALLER_NAME"

# Verify installer file
if [ ! -f "$INSTALLER_NAME" ]; then
    print_error "OneAgent installer not found: $INSTALLER_NAME"
    exit 1
fi

# Check file size (OneAgent should be several MB)
INSTALLER_SIZE=$(stat -f%z "$INSTALLER_NAME" 2>/dev/null || stat -c%s "$INSTALLER_NAME" 2>/dev/null)
if [ "$INSTALLER_SIZE" -lt 1000000 ]; then
    print_error "Downloaded file seems too small (${INSTALLER_SIZE} bytes). Check your API token."
    exit 1
fi

print_success "Installer file size: $(echo "scale=2; $INSTALLER_SIZE/1024/1024" | bc -l) MB"

# Optional: Download and verify signature (as per your instructions)
print_status "Downloading Dynatrace root certificate for signature verification..."
if wget -q https://ca.dynatrace.com/dt-root.cert.pem; then
    print_status "Verifying installer signature..."
    if ( echo 'Content-Type: multipart/signed; protocol="application/x-pkcs7-signature"; micalg="sha-256"; boundary="--SIGNED-INSTALLER"'; echo ; echo ; echo '----SIGNED-INSTALLER' ; cat "$INSTALLER_NAME" ) | openssl cms -verify -CAfile dt-root.cert.pem > /dev/null 2>&1; then
        print_success "Installer signature verified successfully"
    else
        print_warning "Could not verify installer signature (proceeding anyway)"
    fi
else
    print_warning "Could not download root certificate (proceeding without signature verification)"
fi

# Make installer executable
chmod +x "$INSTALLER_NAME"
print_status "Made installer executable"

# Install OneAgent with your specified parameters
print_status "Installing OneAgent with full-stack monitoring..."
print_status "Command: /bin/sh $INSTALLER_NAME --set-monitoring-mode=fullstack --set-app-log-content-access=true"

/bin/sh "$INSTALLER_NAME" --set-monitoring-mode=fullstack --set-app-log-content-access=true

if [ $? -eq 0 ]; then
    print_success "OneAgent installation completed successfully!"
else
    print_error "OneAgent installation failed"
    exit 1
fi

# Verify OneAgent is running
sleep 5
if systemctl is-active --quiet oneagent; then
    print_success "OneAgent service is running"
elif service oneagent status > /dev/null 2>&1; then
    print_success "OneAgent service is running"
else
    print_warning "OneAgent service status unknown - check manually with: systemctl status oneagent"
fi

# Configure Vegas Casino specific settings
print_status "Configuring OneAgent for Vegas Casino application..."

# Set custom properties for the application
ONEAGENT_CONFIG="/var/lib/dynatrace/oneagent/agent/config/customproperties.conf"
if [ -f "$ONEAGENT_CONFIG" ] || touch "$ONEAGENT_CONFIG" 2>/dev/null; then
    echo "# Vegas Casino Custom Properties" >> "$ONEAGENT_CONFIG"
    echo "application=vegas-casino" >> "$ONEAGENT_CONFIG"
    echo "environment=sprint-labs" >> "$ONEAGENT_CONFIG"
    echo "team=observability-demo" >> "$ONEAGENT_CONFIG"
    echo "version=2.0.0" >> "$ONEAGENT_CONFIG"
    print_success "Custom properties configured"
else
    print_warning "Could not configure custom properties file"
fi

# Create service detection rules (if directory exists)
SERVICE_DETECTION_DIR="/var/lib/dynatrace/oneagent/agent/config/servicedetection"
if [ -d "$SERVICE_DETECTION_DIR" ] || mkdir -p "$SERVICE_DETECTION_DIR" 2>/dev/null; then
    cat > "$SERVICE_DETECTION_DIR/vegas_casino_services.json" << 'EOF'
{
  "version": "1.0",
  "revision": 1,
  "rules": [
    {
      "name": "Vegas Casino Main Service",
      "enabled": true,
      "entityId": "SERVICE-VEGAS-CASINO-MAIN",
      "conditions": [
        {
          "attribute": "PORT",
          "compareOperator": "EQUALS",
          "textValue": "3000"
        }
      ],
      "serviceNaming": {
        "namingPattern": "vegas-casino-main"
      }
    },
    {
      "name": "Vegas Casino Games",
      "enabled": true,
      "conditions": [
        {
          "attribute": "REQUEST_HEADER",
          "compareOperator": "BEGINS_WITH",
          "textValue": "/api/"
        }
      ],
      "serviceNaming": {
        "namingPattern": "{RequestHeader:X-Dynatrace-Service}"
      }
    }
  ]
}
EOF
    print_success "Service detection rules configured"
else
    print_warning "Could not create service detection rules"
fi

# Cleanup
rm -f "$INSTALLER_NAME" dt-root.cert.pem

print_success "🎰 OneAgent installation completed for Vegas Casino!"
print_status "OneAgent is now monitoring your application on Sprint Labs tenant"
print_status "Tenant URL: $DT_TENANT_URL"

echo ""
echo "🔍 Next Steps:"
echo "1. Restart your Vegas Casino application: sudo systemctl restart vegas-casino"
echo "2. Check OneAgent logs: sudo journalctl -u oneagent -f"
echo "3. View your application in Dynatrace: $DT_TENANT_URL"
echo "4. Look for 'vegas-casino-main' service in Smartscape"
echo ""

print_success "Installation completed successfully! 🚀"