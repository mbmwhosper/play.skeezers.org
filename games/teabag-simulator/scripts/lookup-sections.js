#!/usr/bin/env node
"use strict";

const DEFAULT_LIMIT = 40;

const SECTION_INDEX = Object.freeze([
  {
    file: "teabag-simulator.html",
    start: 1,
    end: 25,
    label: "HTML shell, canvas mount, script includes"
  },
  {
    file: "teabag-simulator.html",
    start: 26,
    end: 306,
    label: "WebAudio SFX runtime and playback graph"
  },
  {
    file: "teabag-simulator.html",
    start: 307,
    end: 347,
    label: "Asset bootstrap and canvas sizing"
  },
  {
    file: "teabag-simulator.html",
    start: 348,
    end: 537,
    label: "Core helpers, constants, gameplay tuning"
  },
  {
    file: "teabag-simulator.html",
    start: 538,
    end: 712,
    label: "Zones, progression state, and blend helpers"
  },
  { file: "teabag-simulator.html", start: 713, end: 1006, label: "NPC archetypes and zone pools" },
  {
    file: "teabag-simulator.html",
    start: 1007,
    end: 1230,
    label: "Day-night system and input (keyboard/touch)"
  },
  {
    file: "teabag-simulator.html",
    start: 1231,
    end: 1596,
    label: "Mobile UI, particles, matter debris helpers"
  },
  {
    file: "teabag-simulator.html",
    start: 1597,
    end: 2304,
    label: "Camera, world generation, city render systems"
  },
  {
    file: "teabag-simulator.html",
    start: 2305,
    end: 2935,
    label: "Cars, shared character bridge, gallery, entities"
  },
  {
    file: "teabag-simulator.html",
    start: 2936,
    end: 3042,
    label: "Score counters and global game state"
  },
  {
    file: "teabag-simulator.html",
    start: 3043,
    end: 3730,
    label: "Update pipeline (menu, pause, gameplay, world)"
  },
  {
    file: "teabag-simulator.html",
    start: 3731,
    end: 4175,
    label: "Render pipeline (world, entities, HUD, overlay)"
  },
  {
    file: "teabag-simulator.html",
    start: 4176,
    end: 4321,
    label: "Silhouettes, clouds, birds background systems"
  },
  {
    file: "teabag-simulator.html",
    start: 4322,
    end: 4623,
    label: "Title, mode-select, zone-picker, pause menus"
  },
  {
    file: "teabag-simulator.html",
    start: 4624,
    end: 4653,
    label: "Main loop, frame reset, boot, service worker"
  },

  {
    file: "npc-designer.html",
    start: 1,
    end: 68,
    label: "Head, topbar, template/session/history controls"
  },
  {
    file: "npc-designer.html",
    start: 72,
    end: 158,
    label: "Meta, runtime profile, managed face controls"
  },
  {
    file: "npc-designer.html",
    start: 160,
    end: 203,
    label: "Tool palette, refs toggles, JSON workspace"
  },
  {
    file: "npc-designer.html",
    start: 206,
    end: 271,
    label: "Editor canvas, readiness panel, layer/style controls"
  },
  {
    file: "npc-designer.html",
    start: 273,
    end: 338,
    label: "Live previews and runtime-parity preview panel"
  },
  {
    file: "npc-designer.html",
    start: 343,
    end: 345,
    label: "Runtime/constraints/designer script wiring"
  },

  {
    file: "npc-designer.js",
    start: 4,
    end: 430,
    label: "Constants, state, boot flow, UI cache setup"
  },
  {
    file: "npc-designer.js",
    start: 431,
    end: 913,
    label: "Event binding across profile and editor controls"
  },
  {
    file: "npc-designer.js",
    start: 915,
    end: 1743,
    label: "Canvas/session lifecycle and document sync"
  },
  {
    file: "npc-designer.js",
    start: 1744,
    end: 2443,
    label: "Base pose generators and managed face layers"
  },
  {
    file: "npc-designer.js",
    start: 2492,
    end: 3390,
    label: "Tool mode switching and pointer/keyboard interactions"
  },
  {
    file: "npc-designer.js",
    start: 3392,
    end: 4372,
    label: "Render orchestration, readiness, preview rendering"
  },
  {
    file: "npc-designer.js",
    start: 4374,
    end: 5290,
    label: "Runtime preview, hit-testing, geometry transforms, I/O"
  },
  { file: "npc-designer.js", start: 5292, end: 5503, label: "Utility helpers and DOM-ready boot" },

  { file: "npc-designer.css", start: 1, end: 140, label: "Theme tokens and shell layout" },
  {
    file: "npc-designer.css",
    start: 142,
    end: 359,
    label: "Panels, controls, tools, form primitives"
  },
  {
    file: "npc-designer.css",
    start: 361,
    end: 518,
    label: "Layer rows, preview framing, slider refinements"
  },
  {
    file: "npc-designer.css",
    start: 519,
    end: 605,
    label: "Readiness cards and responsive breakpoints"
  },

  { file: "sound-designer.html", start: 6, end: 62, label: "Inline CSS and editor layout" },
  { file: "sound-designer.html", start: 65, end: 95, label: "Toolbar and panel markup" },
  {
    file: "sound-designer.html",
    start: 97,
    end: 259,
    label: "Audio bootstrap, defaults, state persistence"
  },
  { file: "sound-designer.html", start: 261, end: 610, label: "Dynamic parameter panel builder" },
  {
    file: "sound-designer.html",
    start: 612,
    end: 810,
    label: "Visualization and custom bitcrusher node"
  },
  {
    file: "sound-designer.html",
    start: 812,
    end: 1361,
    label: "Playback graph, randomizer, import/export, boot"
  },

  {
    file: "runtime/npc-render-shared.js",
    start: 1,
    end: 28,
    label: "UMD wrapper and basic drawing helpers"
  },
  {
    file: "runtime/npc-render-shared.js",
    start: 29,
    end: 312,
    label: "Renderer factory, payload path, motion state"
  },
  {
    file: "runtime/npc-render-shared.js",
    start: 314,
    end: 541,
    label: "Role inference and payload draw branch"
  },
  {
    file: "runtime/npc-render-shared.js",
    start: 543,
    end: 1000,
    label: "Legacy renderer fallback and API export"
  },

  {
    file: "sfx/sounds.js",
    start: 1,
    end: 371,
    label: "SFX preset definitions (jump, combat, menu, zone)"
  },
  { file: "sw.js", start: 1, end: 39, label: "Service worker cache manifest and fetch strategy" },
  { file: "index.html", start: 1, end: 2, label: "Meta-refresh redirect entry" },
  { file: "manifest.json", start: 1, end: 14, label: "PWA metadata and icon manifest" },

  {
    file: "npc-designer-constraints.js",
    start: 1,
    end: 77,
    label: "Constraint constants and runtime base defaults"
  },
  {
    file: "npc-designer-constraints.js",
    start: 79,
    end: 185,
    label: "Normalization and runtime profile shaping"
  },
  {
    file: "npc-designer-constraints.js",
    start: 187,
    end: 394,
    label: "Validation engine and auto-fix decisions"
  },
  {
    file: "npc-designer-constraints.js",
    start: 396,
    end: 414,
    label: "Public constraints API export"
  },

  {
    file: "scripts/convert-npc-designer-json.js",
    start: 1,
    end: 180,
    label: "Designer JSON to runtime payload converter CLI"
  },
  {
    file: "scripts/city-gen-metrics-baseline.js",
    start: 1,
    end: 521,
    label: "Deterministic city generation metrics harness"
  },
  {
    file: "scripts/lookup-schematics.js",
    start: 1,
    end: 240,
    label: "SCHEMATICS section/task/truth lookup CLI"
  },
  { file: "scripts/lookup-source.js", start: 1, end: 188, label: "Source symbol/text lookup CLI" }
]);

function parseArgs(argv) {
  const cfg = {
    query: "",
    fileFilter: "",
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
    if (token === "--file") {
      cfg.fileFilter = (argv[i + 1] || "").trim();
      i += 1;
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
    if (!token.startsWith("--")) positional.push(token);
  }

  cfg.query = positional.join(" ").trim();
  return cfg;
}

function printUsage() {
  console.log(
    "Usage: node scripts/lookup-sections.js [query] [--file partial/path] [--limit N] [--json]"
  );
}

function matchesQuery(entry, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const hay = `${entry.file} ${entry.label}`.toLowerCase();
  return hay.includes(q);
}

function matchesFile(entry, fileFilter) {
  if (!fileFilter) return true;
  return entry.file.toLowerCase().includes(fileFilter.toLowerCase());
}

function selectEntries(cfg) {
  const filtered = SECTION_INDEX.filter(
    (entry) => matchesFile(entry, cfg.fileFilter) && matchesQuery(entry, cfg.query)
  );
  return filtered.slice(0, cfg.limit);
}

function groupByFile(entries) {
  const grouped = new Map();
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (!grouped.has(entry.file)) grouped.set(entry.file, []);
    grouped.get(entry.file).push(entry);
  }
  return grouped;
}

function printHuman(entries, cfg) {
  console.log(
    `Lookup sections: query="${cfg.query || "(none)"}" file=${cfg.fileFilter || "(all)"} limit=${cfg.limit}`
  );
  if (entries.length === 0) {
    console.log("No matches found.");
    return;
  }

  const grouped = groupByFile(entries);
  const files = Array.from(grouped.keys()).sort();

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    console.log("");
    console.log(`[${file}]`);
    const rows = grouped.get(file);
    for (let j = 0; j < rows.length; j += 1) {
      const row = rows[j];
      console.log(`- ${row.start}-${row.end}: ${row.label}`);
    }
  }
}

function main() {
  const cfg = parseArgs(process.argv.slice(2));
  if (cfg.help) {
    printUsage();
    process.exit(0);
  }

  const matches = selectEntries(cfg);
  if (cfg.json) {
    process.stdout.write(
      JSON.stringify(
        {
          query: cfg.query,
          file: cfg.fileFilter,
          limit: cfg.limit,
          count: matches.length,
          matches
        },
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
