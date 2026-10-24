#!/usr/bin/env bash
set -euo pipefail

firefox_id="{92FAAAD1-58C8-461B-8447-0A43AE6CF002}"
if [[ ( $# -eq 1 || $# -eq 2 ) && "$1" == "--firefox" ]]; then
  browser="firefox"
  extension_id="$firefox_id"
  bundle_arg="${2:-}"
elif [[ $# -eq 2 ]]; then
  browser="chrome"
  extension_id="$1"
  bundle_arg="$2"
  [[ "$extension_id" =~ ^[a-p]{32}$ ]] || { echo "Invalid Chrome extension ID." >&2; exit 2; }
else
  echo "Usage: $0 <Chrome extension ID> <extracted Linux Tor Expert Bundle directory>" >&2
  echo "   or: $0 --firefox <extracted Linux Tor Expert Bundle directory>" >&2
  exit 2
fi
if [[ -n "$bundle_arg" ]]; then
  bundle_dir="$(realpath "$bundle_arg")"
  [[ -d "$bundle_dir" ]] || { echo "Bundle directory does not exist." >&2; exit 2; }
fi
command -v python3 >/dev/null || { echo "Python 3 is required. Install your distribution's python3 package first." >&2; exit 1; }

base="${XDG_DATA_HOME:-$HOME/.local/share}/TorChrome"
runtime="$base/runtime"
if [[ "$browser" == "firefox" ]]; then
  native_dir="$HOME/.mozilla/native-messaging-hosts"
else
  native_dir="$HOME/.config/google-chrome/NativeMessagingHosts"
fi
install -d -m 700 "$base" "$runtime/bundle" "$native_dir"
if [[ -n "$bundle_arg" ]]; then
  tor_path="$(find "$bundle_dir" -type f \( -name tor -o -name tor.real \) -perm -u+x -print -quit)"
  transport_path="$(find "$bundle_dir" -type f \( -name lyrebird -o -name lyrebird-linux \) -perm -u+x -print -quit)"
  [[ -n "$tor_path" && -n "$transport_path" ]] || {
    echo "Could not find executable tor and lyrebird files. Use the extracted Linux Tor Expert Bundle." >&2
    exit 1
  }
  cp -a "$bundle_dir/." "$runtime/bundle/"
  printf '%s\n' "${tor_path#"$bundle_dir"/}" > "$runtime/tor-path"
  printf '%s\n' "${transport_path#"$bundle_dir"/}" > "$runtime/transport-path"
else
  tor_relative="$(cat "$runtime/tor-path" 2>/dev/null || true)"
  transport_relative="$(cat "$runtime/transport-path" 2>/dev/null || true)"
  [[ -n "$tor_relative" && -n "$transport_relative" && -x "$runtime/bundle/$tor_relative" && -x "$runtime/bundle/$transport_relative" ]] || {
    echo "No usable Tor installation was found. Supply the extracted Tor Expert Bundle directory." >&2
    exit 1
  }
  echo "Reusing the existing Tor installation."
fi
curl --fail --location --silent --show-error \
  "https://raw.githubusercontent.com/Tor-Connect/extension/main/native/tor-chrome-helper.py" \
  --output "$base/tor-chrome-helper.py"
chmod 700 "$base/tor-chrome-helper.py"
chmod 600 "$runtime/tor-path" "$runtime/transport-path"
if [[ "$browser" == "chrome" ]]; then
  printf '%s\n' "$extension_id" > "$base/extension-id"
  chmod 600 "$base/extension-id"
fi
python3 - "$base/tor-chrome-helper.py" "$native_dir/org.torconnect.torchrome.json" "$extension_id" "$browser" <<'PY'
import json, pathlib, sys
script, manifest, extension_id, browser = sys.argv[1:]
host = {
    "name": "org.torconnect.torchrome",
    "description": "Local Tor connection helper",
    "path": str(pathlib.Path(script).resolve()),
    "type": "stdio",
}
host["allowed_extensions" if browser == "firefox" else "allowed_origins"] = [
    extension_id if browser == "firefox" else f"chrome-extension://{extension_id}/"
]
pathlib.Path(manifest).write_text(json.dumps(host, indent=2) + "\n", encoding="utf-8")
PY
chmod 600 "$native_dir/org.torconnect.torchrome.json"
echo "Installed the Linux Tor helper for $browser. Restart $browser before connecting."
