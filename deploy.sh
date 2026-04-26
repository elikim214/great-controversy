#!/bin/bash
# Deploy Great Controversy to Mac Mini via Tailscale
# Usage: ./deploy.sh

set -e

MINI="elikim@100.122.9.46"
REMOTE_DIR="~/great-controversy"
NTFY_TOPIC="https://ntfy.sh/cleardrm-baa-f6cdd7ca2f9c1c52"

echo "🚀 Deploying Great Controversy to Mac Mini..."

# Step 1: Push latest code to GitHub
echo "Pushing to GitHub..."
git push origin main 2>/dev/null || git push origin HEAD 2>/dev/null

# Step 2: SSH to Mac Mini, pull, build, restart
echo "Building and restarting on Mac Mini..."
ssh "$MINI" "export PATH=\"/opt/homebrew/bin:\$PATH\" && \
  cd $REMOTE_DIR && \
  git pull && \
  rm -rf .next && \
  npm run build && \
  (lsof -ti :3001 | xargs kill -9 2>/dev/null || true) && \
  sleep 2 && \
  PORT=3001 NODE_ENV=production nohup npx tsx server/index.ts > /tmp/gc-server.log 2>&1 &"

# Step 3: Wait for server to come up
echo "Waiting for server..."
sleep 5

# Step 4: Health check
if ssh "$MINI" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001" | grep -q "200"; then
  echo "✅ Deploy successful! game.givefreely.org is live."
  curl -s -H "Title: Game deployed" -H "Priority: default" -H "Tags: rocket" \
    -d "Great Controversy deployed successfully to game.givefreely.org" \
    "$NTFY_TOPIC" > /dev/null 2>&1
else
  echo "❌ Health check failed. Check logs: ssh $MINI 'cat /tmp/gc-server.log'"
  curl -s -H "Title: Deploy FAILED" -H "Priority: high" -H "Tags: warning" \
    -d "Great Controversy deploy failed - check server logs" \
    "$NTFY_TOPIC" > /dev/null 2>&1
  exit 1
fi
