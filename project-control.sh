#!/usr/bin/env bash
# Project Control Script - Manage BizObs and Vegas Casino apps
# Usage: ./project-control.sh [start|stop|restart] [bizobs|vegas|all]

set -euo pipefail

BIZOBS_DIR="/home/ec2-user/partner-powerup-bizobs"
VEGAS_DIR="/home/ec2-user/vegas-casino"

# Helper functions
kill_like() {
  local pattern="$1"
  pids=$(pgrep -f "$pattern" || true)
  if [[ -n "${pids}" ]]; then
    echo "Killing processes matching: $pattern -> $pids"
    kill -9 $pids || true
  fi
}

kill_port() {
  local port="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"${port}" | xargs -r kill -9 2>/dev/null || true
  fi
  echo "Freed port $port"
}

health_check() {
  local app="$1"
  local port="$2"
  local tries=30
  
  for i in $(seq 1 $tries); do
    status=$(curl -sS --max-time 2 http://127.0.0.1:${port}/api/health | jq -r .status 2>/dev/null || true)
    if [[ "$status" == "ok" ]]; then
      echo "✅ $app is healthy on http://127.0.0.1:${port}"
      return 0
    fi
    sleep 1
  done
  
  echo "⚠️  $app health check did not return ok after $tries seconds"
  return 1
}

stop_bizobs() {
  echo "Stopping Partner PowerUp BizObs..."
  kill_like "${BIZOBS_DIR}/server.js"
  # Kill legacy named services
  kill_like "${BIZOBS_DIR}/services/(discovery|awareness|consideration|purchase|retention|advocacy)-service.cjs"
  # Kill dynamic runner-based services
  kill_like "${BIZOBS_DIR}/services/.dynamic-runners/.*Service.cjs"
  kill_like "${BIZOBS_DIR}/services/dynamic-step-service.cjs"
  # Free main port and full child service range 4101-4199 (hash-mapped)
  kill_port 4000
  for p in $(seq 4101 4199); do kill_port "$p"; done
  echo "✅ BizObs stopped"
}

start_bizobs() {
  local log_file="$BIZOBS_DIR/server.log"
  cd "$BIZOBS_DIR"
  echo "Starting Partner PowerUp BizObs in $(pwd)..."
  
  if [[ ! -d node_modules ]]; then
    echo "Installing BizObs dependencies..."
    npm ci || npm install
  fi
  
  echo "Starting BizObs... logs -> $log_file"
  nohup npm start >> "$log_file" 2>&1 &
  health_check "BizObs" 4000
}

stop_vegas() {
  echo "Stopping Vegas Casino..."
  kill_like "${VEGAS_DIR}/server.js"
  kill_port 3000
  echo "✅ Vegas Casino stopped"
}

start_vegas() {
  local log_file="$VEGAS_DIR/server.log"
  cd "$VEGAS_DIR"
  echo "Starting Vegas Casino in $(pwd)..."
  
  if [[ ! -d node_modules ]]; then
    echo "Installing Vegas dependencies..."
    npm ci || npm install
  fi
  
  echo "Starting Vegas Casino... logs -> $log_file"
  nohup npm start >> "$log_file" 2>&1 &
  health_check "Vegas Casino" 3000
}

# Main logic
ACTION="${1:-}"
TARGET="${2:-all}"

if [[ -z "$ACTION" ]]; then
  echo "Usage: $0 [start|stop|restart] [bizobs|vegas|all]"
  echo ""
  echo "Examples:"
  echo "  $0 start all          # Start both apps"
  echo "  $0 stop bizobs        # Stop only BizObs"
  echo "  $0 restart vegas      # Restart only Vegas"
  echo "  $0 restart            # Restart both apps (default)"
  exit 1
fi

case "$ACTION" in
  start)
    case "$TARGET" in
      bizobs) start_bizobs ;;
      vegas) start_vegas ;;
      all) start_bizobs && start_vegas ;;
      *) echo "Invalid target: $TARGET"; exit 1 ;;
    esac
    ;;
  stop)
    case "$TARGET" in
      bizobs) stop_bizobs ;;
      vegas) stop_vegas ;;
      all) stop_bizobs && stop_vegas ;;
      *) echo "Invalid target: $TARGET"; exit 1 ;;
    esac
    ;;
  restart)
    case "$TARGET" in
      bizobs) stop_bizobs && start_bizobs ;;
      vegas) stop_vegas && start_vegas ;;
      all) stop_bizobs && stop_vegas && start_bizobs && start_vegas ;;
      *) echo "Invalid target: $TARGET"; exit 1 ;;
    esac
    ;;
  *)
    echo "Invalid action: $ACTION"
    echo "Use: start, stop, or restart"
    exit 1
    ;;
esac