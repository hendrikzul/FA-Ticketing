#!/bin/sh
set -eu

cd /app

if [ ! -d node_modules ] || [ ! -f node_modules/.package-lock.json ]; then
  echo "Installing frontend dependencies..."
  npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
fi

echo "Starting Next.js in development mode..."
exec npm run dev