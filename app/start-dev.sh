#!/bin/bash

echo "🚀 Starting Dynatrace BizObs Generator in development mode..."

# Source environment
if [ -f .devcontainer/runlocal/.env ]; then
    source .devcontainer/runlocal/.env
fi

# Start the application
npm start
