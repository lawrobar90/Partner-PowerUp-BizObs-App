#!/bin/bash

# BizObs Auto-Start Setup Script for EC2 Instances
# This script configures the BizObs application to start automatically on EC2 instance boot

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIZOBS_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="bizobs"
SERVICE_FILE="$SCRIPT_DIR/bizobs.service"
SYSTEMD_DIR="/etc/systemd/system"

echo "🚀 Setting up BizObs auto-start for EC2 instance..."

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root or with sudo"
   echo "Usage: sudo ./setup-autostart.sh"
   exit 1
fi

# Verify Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Verify npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Verify BizObs directory structure
if [[ ! -f "$BIZOBS_DIR/server.js" ]]; then
    echo "❌ BizObs server.js not found in $BIZOBS_DIR"
    exit 1
fi

if [[ ! -f "$BIZOBS_DIR/package.json" ]]; then
    echo "❌ BizObs package.json not found in $BIZOBS_DIR"
    exit 1
fi

echo "✅ BizObs application found in $BIZOBS_DIR"

# Create log directory and set permissions
echo "📁 Creating log directory..."
mkdir -p /var/log
touch /var/log/bizobs.log
touch /var/log/bizobs-error.log
chown ec2-user:ec2-user /var/log/bizobs.log /var/log/bizobs-error.log
chmod 644 /var/log/bizobs.log /var/log/bizobs-error.log

# Install dependencies
echo "📦 Installing Node.js dependencies..."
cd "$BIZOBS_DIR"
sudo -u ec2-user npm install --production --silent

# Stop the service if it's already running
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "🛑 Stopping existing $SERVICE_NAME service..."
    systemctl stop "$SERVICE_NAME"
fi

# Copy service file to systemd directory
echo "⚙️  Installing systemd service..."
cp "$SERVICE_FILE" "$SYSTEMD_DIR/$SERVICE_NAME.service"
chown root:root "$SYSTEMD_DIR/$SERVICE_NAME.service"
chmod 644 "$SYSTEMD_DIR/$SERVICE_NAME.service"

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service to start on boot
echo "🎯 Enabling $SERVICE_NAME service for auto-start..."
systemctl enable "$SERVICE_NAME"

# Start the service
echo "🚀 Starting $SERVICE_NAME service..."
systemctl start "$SERVICE_NAME"

# Wait a moment for service to start
sleep 3

# Check service status
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ BizObs service is running successfully!"
    echo ""
    echo "📊 Service Status:"
    systemctl status "$SERVICE_NAME" --no-pager -l
    echo ""
    echo "🔗 Useful Commands:"
    echo "  • Check status: sudo systemctl status $SERVICE_NAME"
    echo "  • View logs: sudo journalctl -u $SERVICE_NAME -f"
    echo "  • Stop service: sudo systemctl stop $SERVICE_NAME"
    echo "  • Start service: sudo systemctl start $SERVICE_NAME"
    echo "  • Restart service: sudo systemctl restart $SERVICE_NAME"
    echo "  • Disable auto-start: sudo systemctl disable $SERVICE_NAME"
    echo ""
    echo "📝 Logs are also written to:"
    echo "  • /var/log/bizobs.log (stdout)"
    echo "  • /var/log/bizobs-error.log (stderr)"
    echo ""
    echo "🌐 Application should be available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-hostname):4000"
else
    echo "❌ Failed to start BizObs service"
    echo "�� Check logs with: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

echo ""
echo "🎉 BizObs auto-start setup completed successfully!"
echo "   The application will now start automatically when the EC2 instance boots."
