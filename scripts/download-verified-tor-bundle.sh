#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <Tor bundle platform, e.g. linux-x86_64> <output .tar.gz path>" >&2
  exit 2
fi
platform="$1"
output="$(mkdir -p "$(dirname "$2")" && cd "$(dirname "$2")" && pwd -P)/$(basename "$2")"
root_dir="$(cd "$(dirname "$0")/.." && pwd -P)"
version="$(tr -d '[:space:]' < "$root_dir/installer/tor-expert-bundle-version.txt")"
fingerprint="EF6E286DDA85EA2A4BA7DE684E2C6E8793298290"
source_name="tor-expert-bundle-$platform-$version.tar.gz"
source_url="https://dist.torproject.org/torbrowser/$version/$source_name"
temporary="$(mktemp -d "${TMPDIR:-/tmp}/tor-connect-tor-verify.XXXXXX")"
trap 'rm -rf "$temporary"' EXIT

curl --fail --location --silent --show-error --retry 3 "$source_url" -o "$temporary/$source_name"
curl --fail --location --silent --show-error --retry 3 "$source_url.asc" -o "$temporary/$source_name.asc"
curl --fail --location --silent --show-error --retry 3 \
  "https://keys.openpgp.org/vks/v1/by-fingerprint/$fingerprint" -o "$temporary/tor-signing-key.asc"
key_info="$(gpg --batch --with-colons --show-keys "$temporary/tor-signing-key.asc")"
primary_count="$(printf '%s\n' "$key_info" | awk -F: '$1 == "pub" { count++ } END { print count + 0 }')"
actual="$(printf '%s\n' "$key_info" | awk -F: '$1 == "fpr" { print $10; exit }')"
if [[ "$primary_count" != "1" || "$actual" != "$fingerprint" ]]; then
  echo "Tor Project signing key fingerprint did not match the pinned fingerprint." >&2
  exit 1
fi
gpg --batch --yes --dearmor --output "$temporary/tor-signing-keyring.gpg" "$temporary/tor-signing-key.asc"
gpgv --keyring "$temporary/tor-signing-keyring.gpg" "$temporary/$source_name.asc" "$temporary/$source_name"
mv "$temporary/$source_name" "$output"
echo "Verified Tor Expert Bundle $version ($platform): $output"
