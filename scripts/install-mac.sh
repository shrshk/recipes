#!/usr/bin/env bash
# Run the Highchair Chef server as a macOS LaunchAgent (starts at login, restarts if it stops).
#   bash scripts/install-mac.sh            # build first: pnpm install && pnpm build
# Settings come from the environment, with the server's defaults otherwise:
#   RECIPES_PORT (8726), RECIPES_HOST (127.0.0.1), RECIPES_DATA_DIR (~/.local/share/recipes/custom)
# Update later: git pull && pnpm install && pnpm build && launchctl kickstart -k gui/$UID/dev.highchair-chef
set -euo pipefail
REPO=$(cd "$(dirname "$0")/.." && pwd)
LABEL=dev.highchair-chef
PLIST=$HOME/Library/LaunchAgents/$LABEL.plist
NODE=$(command -v node) || { echo "node not found on PATH" >&2; exit 1; }
[ -f "$REPO/dist-server/main.js" ] || { echo "not built: run pnpm install && pnpm build" >&2; exit 1; }

env_entry() { [ -n "${2:-}" ] && printf '    <key>%s</key><string>%s</string>\n' "$1" "$2"; return 0; }
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>$NODE</string><string>$REPO/dist-server/main.js</string></array>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>EnvironmentVariables</key>
  <dict>
$(env_entry RECIPES_PORT "${RECIPES_PORT:-}")
$(env_entry RECIPES_HOST "${RECIPES_HOST:-}")
$(env_entry RECIPES_DATA_DIR "${RECIPES_DATA_DIR:-}")
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/highchair-chef.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/highchair-chef.log</string>
</dict>
</plist>
PLIST
plutil -lint "$PLIST" >/dev/null
launchctl bootout "gui/$UID/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID" "$PLIST"
echo "installed $LABEL: logs in ~/Library/Logs/highchair-chef.log"
