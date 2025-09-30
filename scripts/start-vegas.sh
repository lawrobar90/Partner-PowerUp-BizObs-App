#!/bin/bash

echo "🎰 Starting Vegas Backend Services..."

# Node.js services
cd ~/vegas-observability

SERVICES=("user-api" "order-api" "telemetry-service")
BASE_PORT=3001

for i in "${!SERVICES[@]}"; do
  SERVICE=${SERVICES[$i]}
  PORT=$((BASE_PORT + i))
  echo "🚀 Launching $SERVICE on port $PORT"
  SERVICE_NAME=$SERVICE PORT=$PORT node $SERVICE/server.js &
done

# Java-based spin-service
echo "🎰 Launching spin-service on port 8081"
cd ~/public/slot-backend/spin-service
mvn spring-boot:run &

# Frontend
echo "🖥️ Serving frontend from ~/public on port 8080"
cd ~/public
npx serve . -l 8080 &

echo "✅ All services launched. Access the app at: http://<your-EC2-public-IP>:8080/vegas-slots.html"
