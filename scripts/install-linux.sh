#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <Chrome extension ID> <extracted Linux Tor Expert Bundle directory>" >&2
  exit 2
fi
extension_id="$1"
bundle_dir="$(realpath "$2")"
[[ "$extension_id" =~ ^[a-p]{32}$ ]] || { echo "Invalid Chrome extension ID." >&2; exit 2; }
[[ -d "$bundle_dir" ]] || { echo "Bundle directory does not exist." >&2; exit 2; }
command -v python3 >/dev/null || { echo "Python 3 is required. Install your distribution's python3 package first." >&2; exit 1; }

base="${XDG_DATA_HOME:-$HOME/.local/share}/TorChrome"
runtime="$base/runtime"
native_dir="$HOME/.config/google-chrome/NativeMessagingHosts"
tor_path="$(find "$bundle_dir" -type f \( -name tor -o -name tor.real \) -perm -u+x -print -quit)"
transport_path="$(find "$bundle_dir" -type f \( -name lyrebird -o -name lyrebird-linux \) -perm -u+x -print -quit)"
[[ -n "$tor_path" && -n "$transport_path" ]] || {
  echo "Could not find executable tor and lyrebird files. Use the extracted Linux Tor Expert Bundle." >&2
  exit 1
}

install -d -m 700 "$base" "$runtime/bundle" "$native_dir"
cp -a "$bundle_dir/." "$runtime/bundle/"
printf '%s\n' "${tor_path#"$bundle_dir"/}" > "$runtime/tor-path"
printf '%s\n' "${transport_path#"$bundle_dir"/}" > "$runtime/transport-path"
curl --fail --location --silent --show-error \
  "https://raw.githubusercontent.com/Tor-Connect/extension/main/native/tor-chrome-helper.py" \
  --output "$base/tor-chrome-helper.py"
chmod 700 "$base/tor-chrome-helper.py"
printf '%s\n' "$extension_id" > "$base/extension-id"
chmod 600 "$runtime/tor-path" "$runtime/transport-path" "$base/extension-id"
python3 - "$base/tor-chrome-helper.py" "$native_dir/org.torconnect.torchrome.json" "$extension_id" <<'PY'
import json, pathlib, sys
script, manifest, extension_id = sys.argv[1:]
pathlib.Path(manifest).write_text(json.dumps({
    "name": "org.torconnect.torchrome",
    "description": "Local Tor connection helper",
    "path": str(pathlib.Path(script).resolve()),
    "type": "stdio",
    "allowed_origins": [f"chrome-extension://{extension_id}/"],
}, indent=2) + "\n", encoding="utf-8")
PY
chmod 600 "$native_dir/org.torconnect.torchrome.json"
echo "Installed the Linux Tor helper for Google Chrome. Restart Chrome before connecting."
