#!/bin/bash
# Wrapper invoked by the launchd agent com.apps.great-controversy.
# Sources the chmod-600 env file (where ANTHROPIC_API_KEY lives) so the
# key never has to be embedded in the plist itself.
set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

if [ -f "$HOME/.great-controversy.env" ]; then
  set -a
  . "$HOME/.great-controversy.env"
  set +a
fi

cd "$HOME/great-controversy"
exec /opt/homebrew/bin/node --import tsx server/index.ts
