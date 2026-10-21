#!/usr/bin/env python3
"""Set the extension version and build its Chrome Web Store ZIP for a release."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
EXTENSION_DIR = ROOT / "extension"
OUTPUT_DIR = ROOT / "dist" / "release"
SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$")


def tracked_extension_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z", "--cached", "extension"],
        cwd=ROOT,
        check=True,
        stdout=subprocess.PIPE,
    )
    return sorted(
        ROOT / item.decode("utf-8")
        for item in result.stdout.split(b"\0")
        if item and (ROOT / item.decode("utf-8")).is_file()
    )


def main() -> int:
    if len(sys.argv) != 2 or not SEMVER.fullmatch(sys.argv[1]):
        print("Usage: build-extension-package.py <semantic-release-version>", file=sys.stderr)
        return 2

    version = sys.argv[1]
    files = tracked_extension_files()
    manifest_path = EXTENSION_DIR / "manifest.json"
    if manifest_path not in files:
        raise RuntimeError("extension/manifest.json is not tracked by Git.")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["version"] = version
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    archive_path = OUTPUT_DIR / f"Tor-Connect-Chrome-Extension-{version}.zip"
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for source in files:
            relative_path = source.relative_to(EXTENSION_DIR)
            if relative_path.as_posix() == "manifest.json":
                payload = manifest_path.read_bytes()
            else:
                payload = source.read_bytes()
            archive.writestr(relative_path.as_posix(), payload)

    print(f"Built Chrome Web Store package: {archive_path.relative_to(ROOT)} (version {version})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
