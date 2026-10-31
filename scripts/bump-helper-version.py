#!/usr/bin/env python3
"""Bump the helper version constants when a helper file changed since the last release.

Usage: bump-helper-version.py <new-version> [<previous-tag>]

Checks whether native/tor-chrome-helper.py or native/tor-chrome-helper.swift
differ between <previous-tag> and HEAD. If either changed, rewrites the four
version constants to <new-version> and exits 0. If neither changed, exits 0
without modifying anything. Exits non-zero on error.

The four constants kept in sync:
  native/tor-chrome-helper.py   HELPER_VERSION = "..."
  native/tor-chrome-helper.swift  private let helperVersion = "..."
  extension/background.js       const MIN_HELPER_VERSION = "..."
  extension/setup.js            const SETUP_MIN_HELPER_VERSION = "..."
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEMVER = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$"
)

HELPER_FILES = [
    "native/tor-chrome-helper.py",
    "native/tor-chrome-helper.swift",
]

# (file path, regex to find the constant, replacement template)
VERSION_CONSTANTS = [
    (
        ROOT / "native" / "tor-chrome-helper.py",
        re.compile(r'^(HELPER_VERSION\s*=\s*")[^"]*(")', re.MULTILINE),
        r'\g<1>{version}\g<2>',
    ),
    (
        ROOT / "native" / "tor-chrome-helper.swift",
        re.compile(r'^(private let helperVersion\s*=\s*")[^"]*(")', re.MULTILINE),
        r'\g<1>{version}\g<2>',
    ),
    (
        ROOT / "extension" / "background.js",
        re.compile(r'^(const MIN_HELPER_VERSION\s*=\s*")[^"]*(")', re.MULTILINE),
        r'\g<1>{version}\g<2>',
    ),
    (
        ROOT / "extension" / "setup.js",
        re.compile(r'^(const SETUP_MIN_HELPER_VERSION\s*=\s*")[^"]*(")', re.MULTILINE),
        r'\g<1>{version}\g<2>',
    ),
]


def helper_changed_since(tag: str) -> bool:
    """Return True if any helper file differs between <tag> and HEAD."""
    result = subprocess.run(
        ["git", "diff", "--name-only", tag, "HEAD", "--"] + HELPER_FILES,
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        # tag may not exist (first release) — treat as changed
        return True
    return bool(result.stdout.strip())


def bump_constants(version: str) -> None:
    for path, pattern, template in VERSION_CONSTANTS:
        text = path.read_text(encoding="utf-8")
        replacement = template.replace("{version}", version)
        new_text, count = pattern.subn(replacement, text)
        if count == 0:
            raise RuntimeError(f"Could not find version constant in {path.relative_to(ROOT)}")
        path.write_text(new_text, encoding="utf-8")
        print(f"  Bumped {path.relative_to(ROOT)}")


def main() -> int:
    if len(sys.argv) < 2 or not SEMVER.fullmatch(sys.argv[1]):
        print(
            "Usage: bump-helper-version.py <new-version> [<previous-tag>]",
            file=sys.stderr,
        )
        return 2

    version = sys.argv[1]
    previous_tag = sys.argv[2] if len(sys.argv) >= 3 else f"v{version}"

    if not helper_changed_since(previous_tag):
        print(f"Helper files unchanged since {previous_tag} — skipping version bump.")
        return 0

    print(f"Helper files changed since {previous_tag} — bumping to {version}.")
    bump_constants(version)
    print(f"Helper version constants set to {version}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
