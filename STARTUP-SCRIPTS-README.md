# Partner PowerUp BizObs - Setup Scripts

This repository includes enhanced setup scripts that handle everything from git clone to running the application.

## 🚀 Quick Start Options

### Option 1: Use Enhanced start-server.sh (Recommended)
The `start-server.sh` script now handles everything automatically:

```bash
# From anywhere on the system:
curl -O https://raw.githubusercontent.com/lawrobar90/Partner-PowerUp-BizObs-App/main/start-server.sh
chmod +x start-server.sh
./start-server.sh
```

**What it does:**
- ✅ Clones the repository from GitHub if not present
- ✅ Updates existing repository to latest version
- ✅ Installs all npm dependencies 
- ✅ Creates necessary directories
- ✅ Sets up proper permissions
- ✅ Starts the server with full configuration
- ✅ Shows complete quick start guide

### Option 2: Use setup-from-git.sh (Detailed Setup)
For more control over the setup process:

```bash
# Clone and setup only (doesn't start server)
curl -O https://raw.githubusercontent.com/lawrobar90/Partner-PowerUp-BizObs-App/main/setup-from-git.sh
chmod +x setup-from-git.sh
./setup-from-git.sh

# Then start the server
cd /home/ec2-user/partner-powerup-bizobs
./start-server.sh
```

### Option 3: Manual Git Clone
Traditional git clone approach:

```bash
git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
cd Partner-PowerUp-BizObs-App
npm install
./start-server.sh
```

## 📋 Script Features

### start-server.sh
- **Auto-detects** if running from project directory or needs to clone
- **Updates** existing repositories to latest version
- **Handles** npm module installation automatically
- **Creates** all necessary directories and permissions
- **Starts** server with complete Dynatrace configuration
- **Shows** comprehensive quick start guide

### setup-from-git.sh  
- **Advanced options** with command-line arguments
- **Backup handling** for existing installations
- **Detailed logging** of all setup steps
- **Prerequisite checking** (Node.js, npm, git)
- **Flexible configuration** (custom directories, branches)

## 🎯 Repository Information

- **Repository**: https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
- **Default Branch**: main
- **Installation Path**: /home/ec2-user/partner-powerup-bizobs
- **Server Port**: 4000

## 🔧 Key Features Included

- ✅ **Robust Port Management** - Prevents EADDRINUSE conflicts
- ✅ **Multi-Customer Support** - Isolated services per company
- ✅ **Enhanced Payload Handling** - AdditionalFields, CustomerProfile, TraceMetadata
- ✅ **Sidebar Functionality** - Working saved prompts system
- ✅ **Comprehensive API** - Journey simulation, health checks, admin endpoints
- ✅ **Dynatrace Integration** - Full service splitting and monitoring

## 🌐 Access Points

After running the script, access the application at:
- **Main App**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health  
- **Admin Panel**: http://localhost:4000/api/admin/service-status

## 🛠️ Troubleshooting

If you encounter issues:
1. **Port conflicts**: The enhanced port manager handles this automatically
2. **Permission issues**: Scripts automatically set correct permissions
3. **Git issues**: Scripts handle repository updates and backups
4. **Dependency issues**: `npm install` runs automatically

The scripts are designed to be robust and handle common setup scenarios automatically.