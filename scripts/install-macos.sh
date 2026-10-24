#!/bin/bash
set -euo pipefail

firefox_id="{92FAAAD1-58C8-461B-8447-0A43AE6CF002}"
if [[ ( $# -eq 1 || $# -eq 2 ) && "$1" == "--firefox" ]]; then
  browser="firefox"
  extension_id="$firefox_id"
  bundle_dir="${2:-}"
elif [[ $# -eq 2 ]]; then
  browser="chrome"
  extension_id="$1"
  bundle_dir="$2"
  if [[ ! "$extension_id" =~ ^[a-p]{32}$ ]]; then
    echo "Extension ID must be 32 lowercase letters from a through p." >&2
    exit 2
  fi
else
  echo "Usage: $0 <Chrome extension ID> <Tor Expert Bundle .tar.gz file or extracted directory>" >&2
  echo "   or: $0 --firefox <Tor Expert Bundle .tar.gz file or extracted directory>" >&2
  exit 2
fi
temporary_bundle=""
temporary_helper_dir=""
cleanup() {
  if [[ -n "$temporary_bundle" ]]; then rm -rf "$temporary_bundle"; fi
  if [[ -n "$temporary_helper_dir" ]]; then rm -rf "$temporary_helper_dir"; fi
}
trap cleanup EXIT
app_support="$HOME/Library/Application Support/TorChrome"
runtime="$app_support/runtime"
if [[ -n "$bundle_dir" && -f "$bundle_dir" ]]; then
  case "$bundle_dir" in
    *.tar.gz|*.tgz) ;;
    *) echo "Choose the Tor Expert Bundle .tar.gz file or an extracted bundle folder." >&2; exit 2 ;;
  esac
  temporary_bundle="$(mktemp -d "${TMPDIR:-/tmp}/tor-chrome-bundle.XXXXXX")"
  tar -xzf "$bundle_dir" -C "$temporary_bundle"
  bundle_dir="$temporary_bundle"
elif [[ -n "$bundle_dir" && ! -d "$bundle_dir" ]]; then
  echo "Bundle archive or folder does not exist." >&2
  exit 2
fi
if [[ -n "$bundle_dir" ]]; then bundle_dir="$(cd "$bundle_dir" && pwd -P)"; fi

if [[ "$browser" == "firefox" ]]; then
  native_dir="$HOME/Library/Application Support/Mozilla/NativeMessagingHosts"
else
  native_dir="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
fi
mkdir -p "$runtime" "$native_dir"
chmod 700 "$app_support" "$runtime"

if [[ -n "$bundle_dir" ]]; then
  tor_path="$(find "$bundle_dir" -type f -name tor -perm -u+x -print -quit)"
  transport_path="$(find "$bundle_dir" -type f \( -name lyrebird -o -name lyrebird-macos \) -perm -u+x -print -quit)"
  if [[ -z "$tor_path" || -z "$transport_path" ]]; then
    echo "Could not find executable tor and lyrebird files in the supplied bundle." >&2
    echo "Use the macOS Tor Expert Bundle .tar.gz or its extracted folder." >&2
    exit 1
  fi
  mkdir -p "$runtime/bundle"
  ditto "$bundle_dir" "$runtime/bundle"
  tor_relative="${tor_path#"$bundle_dir"/}"
  transport_relative="${transport_path#"$bundle_dir"/}"
  code_files=("$runtime/bundle/$tor_relative" "$runtime/bundle/$transport_relative")
  while IFS= read -r -d '' dylib; do code_files+=("$dylib"); done < <(find "$runtime/bundle" -type f -name '*.dylib' -print0)
  for file in "${code_files[@]}"; do
    xattr -d com.apple.quarantine "$file" 2>/dev/null || true
    codesign --force --sign - --timestamp=none "$file"
    codesign --verify "$file"
  done
  printf '%s\n' "$tor_relative" > "$runtime/tor-path"
  printf '%s\n' "$transport_relative" > "$runtime/transport-path"
else
  tor_relative="$(cat "$runtime/tor-path" 2>/dev/null || true)"
  transport_relative="$(cat "$runtime/transport-path" 2>/dev/null || true)"
  if [[ -z "$tor_relative" || -z "$transport_relative" || ! -x "$runtime/bundle/$tor_relative" || ! -x "$runtime/bundle/$transport_relative" ]]; then
    echo "No usable Tor installation was found. Supply the Tor Expert Bundle archive or extracted folder." >&2
    exit 1
  fi
  echo "Reusing the existing Tor installation."
fi
chmod 600 "$runtime/tor-path" "$runtime/transport-path"
chmod -R go-rwx "$runtime/bundle"
if [[ "$browser" == "chrome" ]]; then
  printf '%s\n' "$extension_id" > "$app_support/extension-id"
  chmod 600 "$app_support/extension-id"
fi

temporary_helper_dir="$(mktemp -d "${TMPDIR:-/tmp}/tor-chrome-helper.XXXXXX")"
temporary_helper="$temporary_helper_dir/tor-chrome-helper.swift"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
repo_helper="$(cd "$script_dir/.." && pwd -P)/native/tor-chrome-helper.swift"
if [[ -f "$repo_helper" ]]; then
  cp "$repo_helper" "$temporary_helper"
else
  curl --fail --location --silent --show-error \
    "https://raw.githubusercontent.com/Tor-Connect/extension/main/native/tor-chrome-helper.swift" \
    --output "$temporary_helper"
fi
swiftc "$temporary_helper" -o "$app_support/tor-chrome-helper"
chmod 700 "$app_support/tor-chrome-helper"

if [[ "$browser" == "firefox" ]]; then
cat > "$native_dir/org.torconnect.torchrome.json" <<EOF
{
  "name": "org.torconnect.torchrome",
  "description": "Local Tor connection helper",
  "path": "$app_support/tor-chrome-helper",
  "type": "stdio",
  "allowed_extensions": ["$extension_id"]
}
EOF
else
cat > "$native_dir/org.torconnect.torchrome.json" <<EOF
{
  "name": "org.torconnect.torchrome",
  "description": "Local Tor connection helper",
  "path": "$app_support/tor-chrome-helper",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$extension_id/"]
}
EOF
fi
chmod 600 "$native_dir/org.torconnect.torchrome.json"
echo "Installed the private prototype helper for $browser. Restart $browser before connecting."
