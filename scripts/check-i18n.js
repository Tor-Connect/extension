#!/usr/bin/env node
// Checks that every locale file has exactly the same set of keys.
// Run via: npm run check:i18n
// Exits 1 if any locale is missing a key that another locale has.

"use strict";

const fs   = require("fs");
const path = require("path");

const LANGS = [
  "en", "fa", "de", "es", "ar", "zh", "hi", "fr",
  "ru", "pt", "tr", "ur", "bn", "id", "my", "ro",
];

const I18N_DIR = path.join(__dirname, "../extension/i18n");

// ---------------------------------------------------------------------------
// Extract all string keys from a locale file by parsing the static block.
// Keys are the JS string literals used as object property names.
// ---------------------------------------------------------------------------
function extractKeys(source) {
  // Match lines like:   "some key": ...
  const keyRe = /^\s+"((?:[^"\\]|\\.)*)"\s*:/gm;
  const keys = [];
  let m;
  while ((m = keyRe.exec(source)) !== null) {
    keys.push(m[1]);
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Load all locales
// ---------------------------------------------------------------------------
const locales = {};
for (const lang of LANGS) {
  const file = path.join(I18N_DIR, `${lang}.js`);
  if (!fs.existsSync(file)) {
    console.error(`✗ Missing locale file: ${file}`);
    process.exit(1);
  }
  locales[lang] = extractKeys(fs.readFileSync(file, "utf8"));
}

// ---------------------------------------------------------------------------
// Build master key set (union of all keys across all locales)
// ---------------------------------------------------------------------------
const masterSet = new Set();
for (const keys of Object.values(locales)) {
  for (const k of keys) masterSet.add(k);
}

// ---------------------------------------------------------------------------
// Check each locale against the master set
// ---------------------------------------------------------------------------
let failed = false;

for (const lang of LANGS) {
  const langSet = new Set(locales[lang]);
  const missing = [...masterSet].filter(k => !langSet.has(k));
  if (missing.length > 0) {
    console.error(`\n✗ ${lang}.js is missing ${missing.length} key(s):`);
    for (const k of missing) {
      console.error(`    "${k}"`);
    }
    failed = true;
  }
}

if (failed) {
  console.error("\nRun: npm run build:i18n  (after adding the missing keys)\n");
  process.exit(1);
} else {
  console.log(`✓ All ${LANGS.length} locale files have the same ${masterSet.size} keys.`);
}
