#!/usr/bin/env python3
"""Build a Firefox add-on ZIP from the shared extension source."""

from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "extension"
FIREFOX_MANIFEST = ROOT / "firefox" / "manifest.json"
OUTPUT_DIR = ROOT / "dist" / "firefox"
SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$")


def main() -> int:
    if len(sys.argv) > 2:
        print("Usage: build-firefox-package.py [version]", file=sys.stderr)
        return 2

    source_manifest = json.loads((SOURCE_DIR / "manifest.json").read_text(encoding="utf-8"))
    firefox_manifest = json.loads(FIREFOX_MANIFEST.read_text(encoding="utf-8"))
    version = sys.argv[1] if len(sys.argv) == 2 else source_manifest["version"]
    if not SEMVER.fullmatch(version):
        print("Version must be a valid semantic version.", file=sys.stderr)
        return 2
    firefox_manifest["version"] = version

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    archive_path = OUTPUT_DIR / f"Tor-Connect-Firefox-Extension-{version}.zip"
    sources = sorted(
        path for path in SOURCE_DIR.rglob("*")
        if path.is_file() and path.name not in {".DS_Store", "Archive.zip", "manifest.json"}
    )
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("manifest.json", json.dumps(firefox_manifest, indent=2, ensure_ascii=False) + "\n")
        for source in sources:
            archive.write(source, source.relative_to(SOURCE_DIR).as_posix())

    print(f"Built Firefox add-on package: {archive_path.relative_to(ROOT)} (version {version})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
