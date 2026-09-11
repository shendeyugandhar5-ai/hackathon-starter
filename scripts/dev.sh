#!/bin/bash
# Helper script for Linux/macOS teammates to run backend or frontend

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$(dirname "$DIR")"

case "$1" in
  backend)
    echo "⚡ Starting FastAPI Backend..."
    cd "$ROOT_DIR/backend"
    if [ ! -d ".venv" ]; then
      python3 -m venv .venv
    fi
    source .venv/bin/activate
    pip install -r requirements.txt -q
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ;;
  frontend)
    echo "⚡ Starting React + Vite Frontend..."
    cd "$ROOT_DIR/frontend"
    npm install
    npm run dev
    ;;
  postgres)
    echo "⚡ Starting PostgreSQL via Docker Compose..."
    cd "$ROOT_DIR"
    docker compose up -d postgres
    ;;
  *)
    echo "Usage: ./scripts/dev.sh [backend|frontend|postgres]"
    exit 1
    ;;
esac
