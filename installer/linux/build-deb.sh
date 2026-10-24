#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 <Chrome extension ID> <verified Linux Tor Expert Bundle .tar.gz> [output directory]" >&2
  exit 2
fi

extension_id="$1"
bundle_archive="$(realpath "$2")"
output_dir="${3:-$(cd "$(dirname "$0")/../../dist" && pwd -P)}"
root_dir="$(cd "$(dirname "$0")/../.." && pwd -P)"
version="$(tr -d '[:space:]' < "$root_dir/installer/tor-expert-bundle-version.txt")"
[[ "$extension_id" =~ ^[a-p]{32}$ ]] || { echo "Invalid Chrome extension ID." >&2; exit 2; }
[[ -f "$bundle_archive" ]] || { echo "Tor Expert Bundle archive does not exist." >&2; exit 2; }
command -v dpkg-deb >/dev/null || { echo "Install dpkg-deb to build the Linux package." >&2; exit 2; }

package_root="$(mktemp -d "${TMPDIR:-/tmp}/tor-connect-deb.XXXXXX")"
trap 'rm -rf "$package_root"' EXIT
install -d "$package_root/DEBIAN" "$package_root/opt/tor-connect/runtime/bundle" \
  "$package_root/etc/opt/chrome/native-messaging-hosts" \
  "$package_root/usr/lib/mozilla/native-messaging-hosts" "$output_dir"

python3 - "$bundle_archive" "$package_root/opt/tor-connect/runtime/bundle" <<'PY'
import pathlib, sys, tarfile
archive, destination = sys.argv[1:]
with tarfile.open(archive, "r:gz") as bundle:
    root = pathlib.PurePosixPath("/")
    for member in bundle.getmembers():
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or ".." in path.parts:
            raise SystemExit(f"Unsafe path in Tor bundle: {member.name}")
        if member.issym() or member.islnk():
            target = pathlib.PurePosixPath(member.linkname)
            resolved = (path.parent / target) if not target.is_absolute() else root
            if target.is_absolute() or ".." in resolved.parts:
                raise SystemExit(f"Unsafe link in Tor bundle: {member.name}")
    bundle.extractall(destination, filter="data")
PY

tor_path="$(find "$package_root/opt/tor-connect/runtime/bundle" -type f \( -name tor -o -name tor.real \) -perm -u+x -print -quit)"
transport_path="$(find "$package_root/opt/tor-connect/runtime/bundle" -type f \( -name lyrebird -o -name lyrebird-linux \) -perm -u+x -print -quit)"
if [[ -z "$tor_path" || -z "$transport_path" ]]; then
  echo "The verified bundle is missing executable Tor or Lyrebird files." >&2
  exit 1
fi

tor_relative="${tor_path#"$package_root/opt/tor-connect/runtime/bundle/"}"
transport_relative="${transport_path#"$package_root/opt/tor-connect/runtime/bundle/"}"
cat > "$package_root/opt/tor-connect/tor-chrome-host" <<HOST
#!/bin/sh
export TORCHROME_BUNDLE=/opt/tor-connect/runtime/bundle
export TORCHROME_TOR_PATH="/opt/tor-connect/runtime/bundle/$tor_relative"
export TORCHROME_TRANSPORT_PATH="/opt/tor-connect/runtime/bundle/$transport_relative"
exec /usr/bin/python3 /opt/tor-connect/tor-chrome-helper.py
HOST
install -m 755 "$root_dir/native/tor-chrome-helper.py" "$package_root/opt/tor-connect/tor-chrome-helper.py"
chmod 755 "$package_root/opt/tor-connect/tor-chrome-host"
python3 - "$package_root/etc/opt/chrome/native-messaging-hosts/org.torconnect.torchrome.json" "$extension_id" <<'PY'
import json, pathlib, sys
path, extension_id = sys.argv[1:]
pathlib.Path(path).write_text(json.dumps({
    "name": "org.torconnect.torchrome",
    "description": "Local Tor connection helper",
    "path": "/opt/tor-connect/tor-chrome-host",
    "type": "stdio",
    "allowed_origins": [f"chrome-extension://{extension_id}/"],
}, indent=2) + "\n", encoding="utf-8")
PY
python3 - "$package_root/usr/lib/mozilla/native-messaging-hosts/org.torconnect.torchrome.json" <<'PY'
import json, pathlib, sys
path = pathlib.Path(sys.argv[1])
path.write_text(json.dumps({
    "name": "org.torconnect.torchrome",
    "description": "Local Tor connection helper",
    "path": "/opt/tor-connect/tor-chrome-host",
    "type": "stdio",
    "allowed_extensions": ["{92FAAAD1-58C8-461B-8447-0A43AE6CF002}"],
}, indent=2) + "\n", encoding="utf-8")
PY

cat > "$package_root/DEBIAN/control" <<CONTROL
Package: tor-connect-setup
Version: $version
Section: net
Priority: optional
Architecture: amd64
Depends: python3
Maintainer: Tor Connect
Description: Tor Connect companion runtime for Chrome and Firefox
 Installs the Tor Expert Bundle and local browser native messaging helpers.
CONTROL

dpkg-deb --root-owner-group --build "$package_root" "$output_dir/Tor-Connect-Setup-Linux-x64.deb"
echo "Built $output_dir/Tor-Connect-Setup-Linux-x64.deb"
