#!/usr/bin/env bash
set -euo pipefail

# Read-only Proton Drive inventory probe.
# This intentionally performs NO upload, rename, move, trash, delete, or restore.

PROTON_DRIVE_BIN="${PROTON_DRIVE_BIN:-proton-drive}"
PROTON_REMOTE_ROOT="${PROTON_REMOTE_ROOT:-/my-files}"
STATE_DIR="${BRIDGE_HOST_STATE_DIR:-$HOME/.shannon-ai-file-bridge}"

mkdir -p "$STATE_DIR"

if ! command -v "$PROTON_DRIVE_BIN" >/dev/null 2>&1; then
  echo "ERROR: Proton Drive CLI not found: $PROTON_DRIVE_BIN" >&2
  exit 1
fi

echo "Bridge host inventory probe"
echo "CLI: $("$PROTON_DRIVE_BIN" version | head -n 1)"
echo "Remote root: $PROTON_REMOTE_ROOT"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$STATE_DIR/proton-inventory-$timestamp.json"

"$PROTON_DRIVE_BIN" filesystem list -j "$PROTON_REMOTE_ROOT" > "$output"

if [ ! -s "$output" ]; then
  echo "ERROR: Proton returned an empty inventory." >&2
  rm -f "$output"
  exit 1
fi

bytes="$(wc -c < "$output" | tr -d ' ')"

echo "Inventory captured successfully."
echo "Bytes: $bytes"
echo "Saved: $output"
echo
echo "Next step: inspect this real JSON before implementing recursive/event-driven synchronization."
