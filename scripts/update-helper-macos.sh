#!/bin/bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
app_support="$HOME/Library/Application Support/TorChrome"
helper_path="$app_support/tor-chrome-helper"
host_manifest="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts/org.torconnect.torchrome.json"

if [[ ! -f "$host_manifest" || ! -f "$app_support/extension-id" ]]; then
  echo "The Chrome helper is not installed yet. Follow the setup page in the extension first." >&2
  exit 1
fi

swiftc "$root_dir/native/tor-chrome-helper.swift" -o "$helper_path"
chmod 700 "$helper_path"
echo "Updated the Tor helper. Quit and reopen Chrome, then try Connect again."
