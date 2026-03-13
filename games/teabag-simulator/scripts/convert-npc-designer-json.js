#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const constraints = require(path.join(__dirname, "..", "npc-designer-constraints.js"));

const POSE_IDS = ["normal", "panic", "ko"];
const GAME_BOUNDS = Object.freeze({ w: 24, h: 46, editorScale: 3.2 });

function parseArgs(argv) {
  const args = {
    input: "",
    output: "",
    strictVisualRules: true,
    autoFixVisualIssues: true
  };
  let positionalOutput = "";

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      if (!args.input) {
        args.input = token;
      } else if (!positionalOutput) {
        positionalOutput = token;
      }
      continue;
    }
    if (token === "--out") {
      args.output = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (token === "--strict-visual") {
      const next = (argv[i + 1] || "").toLowerCase();
      args.strictVisualRules = next !== "off";
      i += 1;
      continue;
    }
    if (token === "--auto-fix") {
      const next = (argv[i + 1] || "").toLowerCase();
      args.autoFixVisualIssues = next !== "off";
      i += 1;
      continue;
    }
  }

  // Allow legacy positional output path while keeping --out as the precedence path.
  if (!args.output && positionalOutput) {
    args.output = positionalOutput;
  }

  return args;
}

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    die(`Failed to read JSON from ${filePath}: ${err.message}`);
  }
}

function normalizeInputDesignerDoc(raw) {
  const template = raw?.meta?.baseTemplate === "female_base" ? "female_base" : "male_base";
  const baseId = typeof raw?.meta?.id === "string" ? raw.meta.id : "npc_custom";
  const baseLabel = typeof raw?.meta?.label === "string" ? raw.meta.label : "Custom NPC";

  const out = {
    version: Number.isFinite(Number(raw?.version)) ? Number(raw.version) : 1,
    meta: {
      id: baseId,
      label: baseLabel,
      baseTemplate: template,
      createdAt:
        typeof raw?.meta?.createdAt === "string" ? raw.meta.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    poses: {},
    runtimeProfile: constraints.normalizeRuntimeProfile(raw?.runtimeProfile, template)
  };

  for (const poseId of POSE_IDS) {
    const layers = raw?.poses?.[poseId]?.layers;
    out.poses[poseId] = {
      layers: Array.isArray(layers) ? layers : []
    };
  }

  return out;
}

function createPayload(doc, validation) {
  const payload = {
    version: 1,
    id: doc.meta.id,
    label: doc.meta.label,
    baseTemplate: doc.meta.baseTemplate,
    runtimeProfile: validation.runtimeProfile,
    bounds: { ...GAME_BOUNDS },
    metadata: {
      convertedAt: new Date().toISOString(),
      validation: {
        summary: validation.summary,
        metadata: validation.metadata,
        hardFailures: (validation.hardFailures || []).map((entry) => ({
          target: entry.target,
          message: entry.message
        })),
        visualWarnings: (validation.visualWarnings || []).map((entry) => ({
          target: entry.target,
          message: entry.message
        })),
        autoFixes: (validation.autoFixes || []).slice()
      }
    },
    poses: {}
  };

  for (const poseId of POSE_IDS) {
    const layers = doc?.poses?.[poseId]?.layers || [];
    payload.poses[poseId] = layers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      type: layer.type,
      visible: layer.visible !== false,
      geometry: layer.geometry,
      style: layer.style
    }));
  }

  return payload;
}

(function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    die(
      "Usage: node scripts/convert-npc-designer-json.js <input.json> [output.json] [--out output.json] [--strict-visual on|off] [--auto-fix on|off]"
    );
  }

  const inputPath = path.resolve(process.cwd(), args.input);
  if (!fs.existsSync(inputPath)) {
    die(`Input file does not exist: ${inputPath}`);
  }

  const raw = readJson(inputPath);
  const doc = normalizeInputDesignerDoc(raw);
  const validation = constraints.validateDesignerDocument(doc, {
    strictVisualRules: args.strictVisualRules,
    autoFixVisualIssues: args.autoFixVisualIssues,
    applyAutoFix: true
  });

  if ((validation.hardFailures || []).length > 0) {
    console.error(`Conversion blocked by ${validation.hardFailures.length} hard safety issue(s).`);
    validation.hardFailures.forEach((entry, idx) => {
      console.error(`  ${idx + 1}. [${entry.target}] ${entry.message}`);
    });
    process.exit(2);
  }

  const payload = createPayload(validation.resolvedDocument || doc, validation);
  const output = JSON.stringify(payload, null, 2);

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    fs.writeFileSync(outputPath, output, "utf8");
    console.log(`Wrote ${outputPath}`);
  } else {
    process.stdout.write(`${output}\n`);
  }

  console.error(
    `Converted OK: hard=0 warnings=${validation.visualWarnings.length} strict=${args.strictVisualRules} autoFix=${args.autoFixVisualIssues}`
  );
})();
