#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_LIMIT = 8;
const VALID_TYPES = new Set(["all", "section", "task", "truth", "helper", "command"]);

function parseArgs(argv) {
  const cfg = {
    query: "",
    type: "all",
    limit: DEFAULT_LIMIT,
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
    if (token === "--type") {
      const value = (argv[i + 1] || "").toLowerCase();
      if (VALID_TYPES.has(value)) {
        cfg.type = value;
        i += 1;
      }
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
    if (!token.startsWith("--")) {
      positional.push(token);
    }
  }

  cfg.query = positional.join(" ").trim();
  return cfg;
}

function printUsage() {
  console.log(
    "Usage: node scripts/lookup-schematics.js [query] [--type all|section|task|truth|helper|command] [--limit N] [--json]"
  );
}

function readLines(filePath) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/);
}

function getHeadingSlice(lines, headingPattern) {
  let headingIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (headingPattern.test(lines[i])) {
      headingIndex = i;
      break;
    }
  }
  if (headingIndex < 0) return null;
  let endIndex = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      endIndex = i;
      break;
    }
  }
  return {
    startLine: headingIndex + 1,
    lines: lines.slice(headingIndex + 1, endIndex)
  };
}

function parsePipeTable(slice, kind, titleCol, detailCol) {
  const out = [];
  if (!slice) return out;

  for (let i = 0; i < slice.lines.length; i += 1) {
    const line = slice.lines[i].trim();
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) continue;

    const cols = line
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
    if (cols.length <= Math.max(titleCol, detailCol)) continue;
    if (cols[titleCol].toLowerCase() === "area") continue;
    if (cols[titleCol].toLowerCase() === "task") continue;
    if (cols[titleCol].toLowerCase() === "concern") continue;

    out.push({
      kind,
      title: cols[titleCol],
      detail: cols[detailCol],
      sourceLine: slice.startLine + i
    });
  }

  return out;
}

function parseHelpers(slice) {
  const out = [];
  if (!slice) return out;

  for (let i = 0; i < slice.lines.length; i += 1) {
    const line = slice.lines[i].trim();
    const match = line.match(/^- `(.+?)` at `([^`]+)`/);
    if (!match) continue;
    out.push({
      kind: "helper",
      title: match[1],
      detail: match[2],
      sourceLine: slice.startLine + i
    });
  }

  return out;
}

function parseCommands(slice) {
  const out = [];
  if (!slice) return out;

  for (let i = 0; i < slice.lines.length; i += 1) {
    const line = slice.lines[i].trim();
    const match = line.match(/^- `(rg -n .+)`/);
    if (!match) continue;
    out.push({
      kind: "command",
      title: "search",
      detail: match[1],
      sourceLine: slice.startLine + i
    });
  }

  return out;
}

function buildIndex(lines) {
  const sectionMap = getHeadingSlice(lines, /^##\s+Section Map/);
  const helperMap = getHeadingSlice(lines, /^##\s+Update\/Render Dispatch Helpers/);
  const truthMap = getHeadingSlice(lines, /^##\s+Truth Surface Table/);
  const taskMap = getHeadingSlice(lines, /^##\s+High-Value Edit Entry Points/);
  const commandMap = getHeadingSlice(lines, /^##\s+Search Cheatsheet/);

  return []
    .concat(parsePipeTable(sectionMap, "section", 0, 1))
    .concat(parsePipeTable(taskMap, "task", 0, 1))
    .concat(parsePipeTable(truthMap, "truth", 0, 1))
    .concat(parseHelpers(helperMap))
    .concat(parseCommands(commandMap));
}

function matchesQuery(entry, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = `${entry.kind} ${entry.title} ${entry.detail}`.toLowerCase();
  return haystack.includes(q);
}

function filterEntries(entries, cfg) {
  const typed = cfg.type === "all" ? entries : entries.filter((entry) => entry.kind === cfg.type);
  const queried = typed.filter((entry) => matchesQuery(entry, cfg.query));
  return queried.slice(0, cfg.limit);
}

function groupByKind(entries) {
  const order = ["section", "task", "truth", "helper", "command"];
  const groups = new Map(order.map((kind) => [kind, []]));

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (!groups.has(entry.kind)) groups.set(entry.kind, []);
    groups.get(entry.kind).push(entry);
  }

  return { groups, order };
}

function printHuman(entries, cfg) {
  const { groups, order } = groupByKind(entries);
  console.log(
    `Lookup schematics: query="${cfg.query || "(none)"}" type=${cfg.type} limit=${cfg.limit}`
  );
  if (entries.length === 0) {
    console.log("No matches found.");
    return;
  }

  for (let i = 0; i < order.length; i += 1) {
    const kind = order[i];
    const rows = groups.get(kind) || [];
    if (rows.length === 0) continue;
    console.log("");
    console.log(`[${kind}]`);
    for (let j = 0; j < rows.length; j += 1) {
      const row = rows[j];
      console.log(`- ${row.title} -> ${row.detail} (SCHEMATICS.md:${row.sourceLine})`);
    }
  }
}

function main() {
  const cfg = parseArgs(process.argv.slice(2));
  if (cfg.help) {
    printUsage();
    process.exit(0);
  }

  const schematicsPath = path.join(__dirname, "..", "SCHEMATICS.md");
  if (!fs.existsSync(schematicsPath)) {
    console.error(`Missing file: ${schematicsPath}`);
    process.exit(1);
  }

  const lines = readLines(schematicsPath);
  const index = buildIndex(lines);
  const matches = filterEntries(index, cfg);

  if (cfg.json) {
    process.stdout.write(
      JSON.stringify(
        { query: cfg.query, type: cfg.type, limit: cfg.limit, count: matches.length, matches },
        null,
        2
      )
    );
    process.stdout.write("\n");
    return;
  }

  printHuman(matches, cfg);
}

main();
