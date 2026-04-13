#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_LIMIT = 12;
const DEFAULT_FILE = "teabag-simulator.html";
const CORE_FILES = Object.freeze([
  "teabag-simulator.html",
  "npc-designer.html",
  "npc-designer.js",
  "npc-designer.css",
  "sound-designer.html",
  "runtime/npc-render-shared.js",
  "sfx/sounds.js",
  "npc-designer-constraints.js",
  "sw.js",
  "index.html",
  "manifest.json",
  "scripts/convert-npc-designer-json.js",
  "scripts/city-gen-metrics-baseline.js",
  "scripts/lookup-schematics.js",
  "scripts/lookup-source.js",
  "scripts/lookup-sections.js"
]);

function parseArgs(argv) {
  const cfg = {
    query: "",
    includeSymbols: true,
    includeText: true,
    limit: DEFAULT_LIMIT,
    files: [],
    allCore: false,
    json: false,
    help: false
  };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      cfg.help = true;
      continue;
    }
    if (token === "--json") {
      cfg.json = true;
      continue;
    }
    if (token === "--symbols-only") {
      cfg.includeSymbols = true;
      cfg.includeText = false;
      continue;
    }
    if (token === "--text-only") {
      cfg.includeSymbols = false;
      cfg.includeText = true;
      continue;
    }
    if (token === "--limit") {
      const value = Number(argv[i + 1]);
      if (Number.isFinite(value) && value > 0) {
        cfg.limit = Math.floor(value);
        i += 1;
      }
      continue;
    }
    if (token === "--file") {
      const value = (argv[i + 1] || "").trim();
      if (value) {
        cfg.files.push(value);
        i += 1;
      }
      continue;
    }
    if (token === "--all-core") {
      cfg.allCore = true;
      continue;
    }
    if (!token.startsWith("--")) {
      positional.push(token);
    }
  }

  cfg.query = positional.join(" ").trim();
  return cfg;
}

function printUsage() {
  console.log(
    "Usage: node scripts/lookup-source.js [query] [--symbols-only|--text-only] [--file path] [--all-core] [--limit N] [--json]"
  );
}

function readLines(filePath) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/);
}

function extractSymbols(lines) {
  const out = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    let match = raw.match(/^\s*function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
    let kind = "function";

    if (!match) {
      match = raw.match(/^\s*class\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*/);
      kind = "class";
    }
    if (!match) {
      match = raw.match(
        /^\s*const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][A-Za-z0-9_$]*\s*=>)/
      );
      kind = "const";
    }

    if (!match) continue;
    const name = match[1];
    const line = i + 1;
    const key = `${kind}:${name}:${line}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      kind,
      name,
      line,
      snippet: raw.trim()
    });
  }

  return out;
}

function resolveTargetFiles(cfg, rootDir) {
  let candidates = [];
  if (cfg.files.length > 0) {
    candidates = cfg.files.slice();
  } else if (cfg.allCore) {
    candidates = CORE_FILES.slice();
  } else {
    candidates = [DEFAULT_FILE];
  }

  const unique = [];
  const seen = new Set();

  for (let i = 0; i < candidates.length; i += 1) {
    const rel = candidates[i];
    const abs = path.resolve(rootDir, rel);
    if (!fs.existsSync(abs)) continue;
    const key = path.normalize(abs);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      rel: path.relative(rootDir, abs).replace(/\\/g, "/"),
      abs
    });
  }

  return unique;
}

function searchSymbols(symbols, query, limit) {
  if (!query) return symbols.slice(0, limit);
  const q = query.toLowerCase();
  return symbols
    .filter((symbol) =>
      `${symbol.name} ${symbol.kind} ${symbol.file || ""}`.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

function searchLines(lines, query, limit) {
  if (!query) return [];
  const q = query.toLowerCase();
  const out = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const normalized = raw.toLowerCase();
    if (!normalized.includes(q)) continue;
    out.push({
      line: i + 1,
      text: raw.trim()
    });
    if (out.length >= limit) break;
  }

  return out;
}

function printHuman(payload, cfg) {
  console.log(`Lookup source: query="${cfg.query || "(none)"}" limit=${cfg.limit}`);
  if ((payload.symbols || []).length === 0 && (payload.lines || []).length === 0) {
    console.log("No matches found.");
    return;
  }

  if ((payload.symbols || []).length > 0) {
    console.log("");
    console.log("[symbols]");
    for (let i = 0; i < payload.symbols.length; i += 1) {
      const row = payload.symbols[i];
      console.log(`- ${row.kind} ${row.name} (${row.file}:${row.line})`);
    }
  }

  if ((payload.lines || []).length > 0) {
    console.log("");
    console.log("[text hits]");
    for (let i = 0; i < payload.lines.length; i += 1) {
      const row = payload.lines[i];
      console.log(`- ${row.file}:${row.line} ${row.text}`);
    }
  }
}

function main() {
  const cfg = parseArgs(process.argv.slice(2));
  if (cfg.help) {
    printUsage();
    process.exit(0);
  }

  const repoRoot = path.join(__dirname, "..");
  const targets = resolveTargetFiles(cfg, repoRoot);
  if (targets.length === 0) {
    console.error("No valid target files found for lookup.");
    process.exit(1);
  }

  const allSymbols = [];
  const allLines = [];

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    const lines = readLines(target.abs);

    if (cfg.includeSymbols) {
      const symbols = extractSymbols(lines);
      for (let j = 0; j < symbols.length; j += 1) {
        allSymbols.push({ ...symbols[j], file: target.rel });
      }
    }

    if (cfg.includeText) {
      const textHits = searchLines(lines, cfg.query, cfg.limit);
      for (let j = 0; j < textHits.length; j += 1) {
        allLines.push({ ...textHits[j], file: target.rel });
      }
    }
  }

  const symbolMatches = cfg.includeSymbols ? searchSymbols(allSymbols, cfg.query, cfg.limit) : [];
  const lineMatches = cfg.includeText ? allLines.slice(0, cfg.limit) : [];

  const payload = {
    query: cfg.query,
    limit: cfg.limit,
    files: targets.map((target) => target.rel),
    symbols: symbolMatches,
    lines: lineMatches
  };

  if (cfg.json) {
    process.stdout.write(JSON.stringify(payload, null, 2));
    process.stdout.write("\n");
    return;
  }

  printHuman(payload, cfg);
}

main();
