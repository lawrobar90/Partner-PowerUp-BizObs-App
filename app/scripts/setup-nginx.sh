#!/bin/bash
# BizObs NGINX Setup Script for ACE-Box Integration

set -e

echo "🔧 Setting up NGINX for BizObs EasyTravel Compatibility..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)" 
   exit 1
fi

# Install NGINX if not present
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing NGINX..."
    apt-get update
    apt-get install -y nginx
fi

# Create directory for configuration snippets
mkdir -p /etc/nginx/snippets

# Copy the main configuration
echo "📋 Installing BizObs NGINX configuration..."
cp nginx/bizobs-easytravel.conf /etc/nginx/sites-available/

# Create symbolic link to enable the site
ln -sf /etc/nginx/sites-available/bizobs-easytravel.conf /etc/nginx/sites-enabled/

# Remove default NGINX site to avoid conflicts
rm -f /etc/nginx/sites-enabled/default

# Test NGINX configuration
echo "🧪 Testing NGINX configuration..."
nginx -t

# Create log directory
mkdir -p /var/log/nginx

# Restart NGINX to apply changes
echo "🔄 Restarting NGINX..."
systemctl restart nginx
systemctl enable nginx

echo "✅ NGINX setup complete!"
echo "📊 Access BizObs at:"
echo "   - Main UI: http://localhost/ui/"
echo "   - API: http://localhost/api/"
echo "   - Health: http://localhost/health"
echo "   - BizObs: http://localhost/bizobs/"

# Display NGINX status
systemctl status nginx --no-pager -l