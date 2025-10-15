# Partner PowerUp BizObs App - Complete Deployment Guide

## Overview

The Partner PowerUp BizObs App is a sophisticated microservices simulation platform designed for Dynatrace demonstrations. It creates realistic customer journeys across multiple microservices with full observability integration, including business events capture, distributed tracing, and AI-generated customer scenarios.

## Prerequisites

### System Requirements
- Amazon Linux 2, CentOS 7/8, Ubuntu 18.04+, or similar Linux distribution
- Minimum 2GB RAM, 2 CPU cores
- 10GB available disk space
- Internet connectivity for package installation

### Required Software
1. **Node.js 18+ and npm**
2. **Git**
3. **Dynatrace OneAgent** (for full observability features)
4. **Curl** (for testing endpoints)

## Step 1: Prepare the EC2 Instance

### 1.1 Update System
```bash
# Amazon Linux 2 / CentOS / RHEL
sudo yum update -y

# Ubuntu / Debian
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js 18+
```bash
# Amazon Linux 2 / CentOS / RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.3 Install Git
```bash
# Amazon Linux 2 / CentOS / RHEL
sudo yum install -y git

# Ubuntu / Debian
sudo apt install -y git
```

### 1.4 Verify Installations
```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 8.x or higher
git --version   # Any recent version
```

## Step 2: Deploy the Application

### 2.1 Clone the Repository
```bash
cd /home/ec2-user  # or your preferred directory
git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
cd Partner-PowerUp-BizObs-App/partner-powerup-bizobs
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Configuration Setup

#### Environment Variables (Optional)
Create a `.env` file if you need custom configuration:
```bash
cp .env.template .env
```

Edit `.env` with your settings:
```env
# Application Configuration
PORT=4000
NODE_ENV=production

# Dynatrace Configuration (Optional)
DT_TENANT_URL=https://your-tenant.dynatrace.com
DT_API_TOKEN=your-api-token

# Business Events Configuration
ENABLE_BUSINESS_EVENTS=true
```

#### Firewall Configuration
Ensure the following ports are accessible:
- **Port 4000**: Main BizObs application
- **Ports 4001-4010**: Dynamic microservices (auto-assigned)

```bash
# Amazon Linux 2 / CentOS / RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=4000-4010/tcp
sudo firewall-cmd --reload

# Ubuntu / Debian (ufw)
sudo ufw allow 4000:4010/tcp
```

## Step 3: Install Dynatrace OneAgent (Recommended)

### 3.1 Download and Install OneAgent
1. Log into your Dynatrace environment
2. Go to **Deploy Dynatrace > Start installation > Linux**
3. Copy the wget command and run it on your EC2 instance:

```bash
# Example (use your actual download command)
wget -O Dynatrace-OneAgent-Linux.sh "https://your-tenant.live.dynatrace.com/api/v1/deployment/installer/agent/unix/default/latest?arch=x86&flavor=default" --header="Authorization: Api-Token YOUR-API-TOKEN"

sudo /bin/sh Dynatrace-OneAgent-Linux.sh --set-app-log-content-access=true --set-infra-only=false
```

### 3.2 Configure Business Events
The application automatically configures business events capture when OneAgent is present. No additional configuration required.

## Step 4: Launch the Application

### 4.1 Start the Application
```bash
# Production start
npm start

# Development start (with auto-restart)
npm run dev

# Using PM2 (recommended for production)
npm install -g pm2
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

### 4.2 Verify Deployment
```bash
# Check if the application is running
curl http://localhost:4000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-10-15T10:30:00.000Z","services":"ready"}
```

### 4.3 Test Journey Simulation
```bash
# Test single customer journey
curl -X POST http://localhost:4000/api/journey-simulation/simulate-journey \
  -H "Content-Type: application/json" \
  -d '{
    "journey": {
      "companyName": "TestCorp",
      "domain": "testcorp.com",
      "industryType": "retail",
      "steps": [
        {
          "stepName": "ProductDiscovery",
          "serviceName": "ProductDiscoveryService",
          "description": "Customer browses products",
          "category": "Browsing",
          "estimatedDuration": 5,
          "businessRationale": "Quick product discovery"
        }
      ]
    }
  }'
```

## Step 5: Access the Application

### 5.1 Web Interface
Open your browser and navigate to:
```
http://your-ec2-public-ip:4000
```

### 5.2 Key Endpoints
- **Main Interface**: `http://your-ec2-public-ip:4000`
- **Health Check**: `http://your-ec2-public-ip:4000/api/health`
- **Journey Simulation**: `http://your-ec2-public-ip:4000/api/journey-simulation/simulate-journey`
- **Multiple Customers**: `http://your-ec2-public-ip:4000/api/journey-simulation/simulate-multiple-journeys`
- **Admin Reset**: `http://your-ec2-public-ip:4000/api/admin/reset-ports`

## Step 6: Monitoring and Maintenance

### 6.1 Application Logs
```bash
# View real-time logs
tail -f server.log

# Check PM2 logs (if using PM2)
pm2 logs
```

### 6.2 Service Management
```bash
# Check running services
ps aux | grep node

# Check port usage
netstat -tlnp | grep -E ":4[0-9]+"

# Reset dynamic services
curl -X POST http://localhost:4000/api/admin/reset-ports
```

### 6.3 Updates
```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies if needed
npm install

# Restart application
pm2 restart all  # or npm start
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check Node.js version
node --version

# Check port availability
netstat -tlnp | grep 4000

# Check logs for errors
cat server.log
```

#### Service Chain Not Working
```bash
# Reset dynamic services
curl -X POST http://localhost:4000/api/admin/reset-ports

# Check service status
curl http://localhost:4000/api/admin/list-services
```

#### OneAgent Not Capturing Data
1. Verify OneAgent is installed: `sudo systemctl status oneagent`
2. Check app-log-content-access is enabled
3. Restart application after OneAgent installation

### Performance Optimization

#### For High Load
1. **Increase Node.js memory**: `node --max-old-space-size=4096 server.js`
2. **Use PM2 cluster mode**: `pm2 start ecosystem.config.json --env production`
3. **Configure nginx reverse proxy** for load balancing

#### Resource Monitoring
```bash
# Monitor CPU and memory
top -p $(pgrep -f "node.*server.js")

# Check disk space
df -h

# Monitor network connections
ss -tulpn | grep :4000
```

## Security Considerations

### 1. Network Security
- Use security groups to restrict access to ports 4000-4010
- Consider running behind a reverse proxy (nginx/Apache)
- Enable HTTPS in production environments

### 2. Application Security
- Keep Node.js and dependencies updated
- Use environment variables for sensitive data
- Regular security scans with `npm audit`

### 3. System Security
- Keep OS updated
- Use non-root user for application
- Configure proper file permissions

## Advanced Configuration

### Auto-Start on Boot
```bash
# Using systemd
sudo tee /etc/systemd/system/bizobs.service > /dev/null <<EOF
[Unit]
Description=BizObs Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/Partner-PowerUp-BizObs-App/partner-powerup-bizobs
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable bizobs
sudo systemctl start bizobs
```

### Load Balancing Setup
For multiple instances, configure nginx:
```nginx
upstream bizobs_backend {
    server 127.0.0.1:4000;
    server 127.0.0.1:5000;  # Additional instances
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://bizobs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Support and Resources

### Documentation
- Application documentation: Check the `docs/` folder in the repository
- Dynatrace documentation: [Dynatrace Help](https://www.dynatrace.com/support/help/)

### Logs and Debugging
- Application logs: `server.log`
- PM2 logs: `pm2 logs`
- OneAgent logs: `/var/log/dynatrace/oneagent/`

### Health Checks
Regular health check endpoints are available for monitoring systems:
- Basic health: `GET /api/health`
- Detailed status: `GET /api/admin/status`

This completes the deployment guide. The application should now be fully functional and ready for Dynatrace demonstrations.