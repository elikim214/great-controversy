#!/bin/bash
# Mac Mini auto-deploy for great-controversy.
# Runs every minute via cron. No-op unless origin/main has new commits.
#
# Setup (one time on the Mini):
#   1. Place ANTHROPIC_API_KEY in ~/.great-controversy.env (chmod 600)
#   2. chmod +x scripts/autodeploy.sh
#   3. crontab -e and add:
#        * * * * * /Users/elikim/great-controversy/scripts/autodeploy.sh >> /tmp/gc-autodeploy.log 2>&1

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Load secrets (ANTHROPIC_API_KEY, optional NTFY_TOPIC override)
if [ -f "$HOME/.great-controversy.env" ]; then
  set -a
  . "$HOME/.great-controversy.env"
  set +a
fi
NTFY_TOPIC="${NTFY_TOPIC:-cleardrm-baa-f6cdd7ca2f9c1c52}"

REPO="$HOME/great-controversy"
cd "$REPO"

# Prevent overlapping deploys. Lock is a directory (atomic mkdir).
LOCK=/tmp/gc-autodeploy.lock
# Clear stale lock if older than 10 minutes (assume crashed deploy)
if [ -d "$LOCK" ] && find "$LOCK" -mmin +10 -print -quit 2>/dev/null | grep -q .; then
  rmdir "$LOCK" 2>/dev/null || true
fi
if ! mkdir "$LOCK" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

# Check for new commits upstream
git fetch origin main --quiet 2>/dev/null || exit 0
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
[ "$LOCAL" = "$REMOTE" ] && exit 0

echo "================================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploying ${LOCAL:0:7} -> ${REMOTE:0:7}"

# On any failure below, send a push notification before exiting
fail() {
  curl -s \
    -H "Title: great-controversy deploy FAILED" \
    -H "Priority: high" \
    -H "Tags: rotating_light" \
    -d "Commit ${REMOTE:0:7} failed during $1. Check /tmp/gc-autodeploy.log on the Mini." \
    "https://ntfy.sh/$NTFY_TOPIC" >/dev/null 2>&1 || true
  exit 1
}

git pull --quiet || fail "git pull"

# Only npm install if dependency files changed
if git diff --name-only "$LOCAL" "$REMOTE" | grep -qE '^(package(-lock)?\.json|pnpm-lock\.yaml)$'; then
  echo "[$(date '+%H:%M:%S')] Dependencies changed — running npm install"
  npm install --silent || fail "npm install"
fi

rm -rf .next
npm run build || fail "npm run build"

# Restart the launchd-managed service. -k stops the running instance and
# launches a fresh one, so the new build + env file are picked up cleanly.
# Fighting launchd with kill+nohup doesn't work — KeepAlive respawns instantly.
SERVICE="gui/$(id -u)/com.apps.great-controversy"
launchctl kickstart -k "$SERVICE" || fail "launchctl kickstart"
sleep 4

# Sanity check: did the service come back listening?
if ! lsof -ti :3001 >/dev/null 2>&1; then
  fail "server startup (nothing listening on :3001 after launchctl restart)"
fi

COMMIT_MSG=$(git log -1 --format='%s' "$REMOTE")
curl -s \
  -H "Title: great-controversy deployed" \
  -H "Tags: white_check_mark" \
  -H "Click: https://game.givefreely.org" \
  -d "${REMOTE:0:7} - $COMMIT_MSG" \
  "https://ntfy.sh/$NTFY_TOPIC" >/dev/null 2>&1 || true

echo "[$(date '+%H:%M:%S')] Deploy complete: ${REMOTE:0:7}"
