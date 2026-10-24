#!/bin/bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd -P)"
extension_id="${TOR_EXTENSION_ID:-${EXTENSION_ID:-nhpflipfjhibgcopfbeoloeghdpoighk}}"
if [[ ! "$extension_id" =~ ^[a-p]{32}$ ]]; then
  echo "EXTENSION_ID must be 32 lowercase letters from a through p." >&2
  exit 2
fi

app="$root_dir/dist/Tor Connect Setup.app"
contents="$app/Contents"
rm -rf "$app"
mkdir -p "$contents/MacOS" "$contents/Resources"
cp "$root_dir/brand-assets/tor-connect-store-icon-128.png" "$contents/Resources/TorConnectIcon.png"
module_cache="$root_dir/dist/swift-module-cache"
mkdir -p "$module_cache"

arm_bundle="${TOR_BUNDLE_ARM64_ARCHIVE:-$root_dir/dist/tor-expert-bundle-macos-arm64.tar.gz}"
intel_bundle="${TOR_BUNDLE_X86_64_ARCHIVE:-$root_dir/dist/tor-expert-bundle-macos-x86_64.tar.gz}"
if [[ ! -f "$arm_bundle" || ! -f "$intel_bundle" ]]; then
  echo "Provide verified Tor Expert Bundle archives for Apple silicon and Intel." >&2
  echo "Set TOR_BUNDLE_ARM64_ARCHIVE and TOR_BUNDLE_X86_64_ARCHIVE to their .tar.gz paths." >&2
  exit 2
fi

for arch in arm64 x86_64; do
  swiftc -parse-as-library -O -target "$arch-apple-macos13.0" -module-cache-path "$module_cache" -framework AppKit \
    "$root_dir/installer/macos/TorConnectionSetup.swift" \
    -o "$contents/MacOS/TorConnectionSetup-$arch"
  swiftc -O -target "$arch-apple-macos13.0" -module-cache-path "$module_cache" \
    "$root_dir/native/tor-chrome-helper.swift" -o "$contents/Resources/tor-chrome-helper-$arch"
done
lipo -create "$contents/MacOS/TorConnectionSetup-arm64" "$contents/MacOS/TorConnectionSetup-x86_64" \
  -output "$contents/MacOS/TorConnectionSetup"
lipo -create "$contents/Resources/tor-chrome-helper-arm64" "$contents/Resources/tor-chrome-helper-x86_64" \
  -output "$contents/Resources/tor-chrome-helper"
rm "$contents/MacOS/TorConnectionSetup-arm64" "$contents/MacOS/TorConnectionSetup-x86_64" \
  "$contents/Resources/tor-chrome-helper-arm64" "$contents/Resources/tor-chrome-helper-x86_64"
chmod 700 "$contents/Resources/tor-chrome-helper"
cp "$arm_bundle" "$contents/Resources/tor-expert-bundle-macos-arm64.tar.gz"
cp "$intel_bundle" "$contents/Resources/tor-expert-bundle-macos-x86_64.tar.gz"

python3 - "$contents/Resources/InstallerConfig.plist" "$extension_id" <<'PY'
import plistlib, sys
with open(sys.argv[1], "wb") as output:
    plistlib.dump({"extensionId": sys.argv[2]}, output)
PY

cat > "$contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleDevelopmentRegion</key><string>en</string>
  <key>CFBundleExecutable</key><string>TorConnectionSetup</string>
  <key>CFBundleIdentifier</key><string>org.torconnect.setup</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>Tor Connect Setup</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSPrincipalClass</key><string>NSApplication</string>
</dict></plist>
PLIST

codesign --force --deep --sign - "$app"
archive="$root_dir/dist/Tor-Connect-Setup-macOS.zip"
ditto -c -k --sequesterRsrc --keepParent "$app" "$archive"
rm -rf "$module_cache"
echo "Built local test installer: $app"
echo "Packaged local test installer: $archive"
echo "Configured Chrome extension ID: $extension_id"
