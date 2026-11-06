#!/usr/bin/env node
// Merges extension/i18n/*.js into extension/i18n-translations.js
// Run via: npm run build:i18n

"use strict";

const fs   = require("fs");
const path = require("path");

// Order for the static translations object (torTranslations)
const STATIC_ORDER = [
  "en", "fa", "de", "es", "ar", "zh", "hi", "fr",
  "ru", "pt", "tr", "ur", "bn", "id", "my", "ro",
];

const I18N_DIR = path.join(__dirname, "../extension/i18n");
const OUT_FILE = path.join(__dirname, "../extension/i18n-translations.js");

// ---------------------------------------------------------------------------
// Extract the inner text of the first block matching `  KEY: OPEN … CLOSE`
// Returns null when the block is empty (e.g. `static: {}`).
// ---------------------------------------------------------------------------
function extractInner(source, key, open, close) {
  const header  = `  ${key}: ${open}`;
  const start   = source.indexOf(header);
  if (start === -1) return null;

  const lineEnd = source.indexOf("\n", start);
  // Single-line empty block: "  static: {},"
  const restOfLine = source.slice(start + header.length, lineEnd).trim();
  if (restOfLine.startsWith(close)) return null;

  // Multi-line: walk forward tracking bracket depth
  let depth  = 1;
  let i      = lineEnd + 1;
  let endPos = -1;
  while (i < source.length && depth > 0) {
    const c = source[i];
    if (c === open[0])  depth++;
    if (c === close[0]) { depth--; if (depth === 0) { endPos = i; break; } }
    i++;
  }
  if (endPos === -1) return null;

  const inner = source.slice(lineEnd + 1, endPos).trimEnd();
  return inner.length > 0 ? inner : null;
}

// ---------------------------------------------------------------------------
// Load source files
// ---------------------------------------------------------------------------
const sources = {};
for (const lang of STATIC_ORDER) {
  const file = path.join(I18N_DIR, `${lang}.js`);
  if (!fs.existsSync(file)) {
    console.error(`Missing: ${file}`);
    process.exit(1);
  }
  sources[lang] = fs.readFileSync(file, "utf8");
}

// ---------------------------------------------------------------------------
// Build static section
// ---------------------------------------------------------------------------
const staticParts = [];
for (const lang of STATIC_ORDER) {
  const sInner = extractInner(sources[lang], "static", "{", "}");
  if (!sInner) {
    staticParts.push(`    ${lang}: {},`);
  } else {
    staticParts.push(`    ${lang}: {\n${sInner}\n    },`);
  }
}
// Last static entry has no trailing comma
staticParts[staticParts.length - 1] = staticParts[staticParts.length - 1].replace(/,$/, "");

// ---------------------------------------------------------------------------
// Assemble output
// ---------------------------------------------------------------------------
const output = [
  "  window.torTranslations = {",
  staticParts.join("\n"),
  "  };",
  "",
].join("\n");

fs.writeFileSync(OUT_FILE, output, "utf8");

const lineCount = output.split("\n").length;
console.log(`✓ Written ${path.relative(process.cwd(), OUT_FILE)} (${lineCount} lines)`);
