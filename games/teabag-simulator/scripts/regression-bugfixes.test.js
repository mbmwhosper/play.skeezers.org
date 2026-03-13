const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const REPO_ROOT = path.resolve(__dirname, "..");

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function findMatchingDelimiter(source, startIndex, openChar, closeChar) {
  let depth = 0;
  let quoteChar = null;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (quoteChar) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quoteChar) {
        quoteChar = null;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quoteChar = char;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error(`Unmatched delimiter starting at ${startIndex}`);
}

function extractFunction(source, functionName) {
  const signature = `function ${functionName}(`;
  const startIndex = source.indexOf(signature);
  if (startIndex === -1) {
    throw new Error(`Could not find ${functionName}`);
  }
  const bodyStart = source.indexOf("{", startIndex);
  const bodyEnd = findMatchingDelimiter(source, bodyStart, "{", "}");
  return source.slice(startIndex, bodyEnd + 1);
}

function extractConst(source, constName) {
  const prefix = `const ${constName} = `;
  const startIndex = source.indexOf(prefix);
  if (startIndex === -1) {
    throw new Error(`Could not find const ${constName}`);
  }

  let valueStart = startIndex + prefix.length;
  while (/\s/.test(source[valueStart])) {
    valueStart += 1;
  }

  const openChar = source[valueStart];
  const closeChar = openChar === "[" ? "]" : openChar === "{" ? "}" : null;
  if (!closeChar) {
    throw new Error(`Unsupported const initializer for ${constName}`);
  }

  const valueEnd = findMatchingDelimiter(source, valueStart, openChar, closeChar);
  const statementEnd = source.indexOf(";", valueEnd);
  return source.slice(startIndex, statementEnd + 1);
}

function parseSoundDefsSource(capturedText) {
  const match = capturedText.match(/const SOUND_DEFS = ([\s\S]+);$/);
  if (!match) {
    throw new Error("Could not parse SOUND_DEFS export");
  }
  return JSON.parse(match[1]);
}

test("designer payload registry resolves payload files relative to the index path", async () => {
  const gameSource = readRepoFile("teabag-simulator.html");
  const loadDesignerPayloadRegistry = extractFunction(gameSource, "loadDesignerPayloadRegistry");
  const fetchCalls = [];

  const context = {
    DESIGNER_PAYLOAD_INDEX_PATH: "./data/npc_payloads/index.json",
    DESIGNER_PAYLOAD_REGISTRY: {
      loadPromise: null,
      status: "idle",
      error: null,
      payloads: new Map(),
      indexEntries: []
    },
    normalizePayloadIndexEntries: () => [
      {
        id: "npc_strict_valid",
        file: "strict-valid.json",
        designCenterX: 480,
        designBaselineY: 400
      }
    ],
    normalizeDesignerPayload: () => ({ id: "npc_strict_valid" }),
    fetch: async (url) => {
      fetchCalls.push(url);
      if (url === "./data/npc_payloads/index.json") {
        return { ok: true, json: async () => ({}) };
      }
      if (url === "http://example.com/data/npc_payloads/strict-valid.json") {
        return { ok: true, json: async () => ({ id: "npc_strict_valid" }) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    },
    console: { warn: () => {} },
    location: { href: "http://example.com/teabag-simulator.html" },
    URL,
    Map
  };

  vm.runInNewContext(loadDesignerPayloadRegistry, context);
  await context.loadDesignerPayloadRegistry();

  assert.equal(fetchCalls[1], "http://example.com/data/npc_payloads/strict-valid.json");
});

test("gallery mode blocks hidden gameplay updates", () => {
  const gameSource = readRepoFile("teabag-simulator.html");
  const update = extractFunction(gameSource, "update");
  const calls = [];
  const context = {
    updateMenuState: () => {
      calls.push("menu");
      return false;
    },
    updatePauseState: () => {
      calls.push("pause");
      return false;
    },
    updatePlayingState: () => {
      calls.push("playing");
    }
  };

  vm.runInNewContext(update, context);
  context.update({ state: { galleryMode: true } }, 1 / 60);

  assert.deepEqual(calls, []);
});

test("touch crouch state clears even if touch release happens while paused", () => {
  const gameSource = readRepoFile("teabag-simulator.html");
  const crouchDown = extractFunction(gameSource, "crouchDown");
  const applyTouch = extractFunction(gameSource, "applyTouch");
  const context = {
    keys: {},
    sprintLocked: false,
    touch: {
      left: false,
      right: false,
      jump: false,
      jumpJust: false,
      crouch: false,
      sprint: false,
      upJust: false,
      downJust: false,
      leftJust: false,
      rightJust: false,
      bagJust: false,
      pauseJust: false,
      upHeld: false,
      downHeld: false,
      bagHeld: false
    },
    touchDTap: { left: 0, right: 0 },
    DTAP_WINDOW: 0.25,
    performance: { now: () => 1000 },
    gameState: "playing",
    isDown: () => false
  };

  vm.runInNewContext(`${crouchDown}\n${applyTouch}`, context);

  context.applyTouch("down", true);
  assert.equal(context.crouchDown(), true);

  context.gameState = "paused";
  context.applyTouch("down", false);
  assert.equal(context.crouchDown(), false);
});

test("nearby spawn logic uses active NPC count instead of all lingering NPC records", () => {
  const gameSource = readRepoFile("teabag-simulator.html");
  const updateNPCSpawning = extractFunction(gameSource, "updateNPCSpawning");
  const spawnCalls = [];
  const context = {
    TUNING: {
      spawn: {
        visibleSpawnMargin: 20,
        offscreenSpawnMin: 100,
        offscreenSpawnMax: 100,
        sprintAheadDistance: 250,
        sprintAheadMinCount: 2,
        sprintSpawnMin: 50,
        sprintSpawnMax: 50
      }
    },
    npcs: [
      { state: "walking", x: 50 },
      { state: "ko", x: -500 },
      { state: "ko", x: -600 },
      { state: "ko", x: -700 }
    ],
    cam: { x: 0 },
    W: 100,
    MIN_NPCS_ON_SCREEN: 2,
    MAX_NPCS: 4,
    rand: (min) => min,
    spawnNPC: (x) => {
      spawnCalls.push(x);
    },
    Math: { random: () => 0.9 }
  };

  vm.runInNewContext(updateNPCSpawning, context);
  context.updateNPCSpawning({ isSprinting: false, facing: 1, x: 0 });

  assert.equal(spawnCalls.length, 1);
});

test("sprint-ahead spawn logic also uses active NPC count instead of all lingering NPC records", () => {
  const gameSource = readRepoFile("teabag-simulator.html");
  const updateNPCSpawning = extractFunction(gameSource, "updateNPCSpawning");
  const spawnCalls = [];
  const context = {
    TUNING: {
      spawn: {
        visibleSpawnMargin: 20,
        offscreenSpawnMin: 100,
        offscreenSpawnMax: 100,
        sprintAheadDistance: 250,
        sprintAheadMinCount: 2,
        sprintSpawnMin: 50,
        sprintSpawnMax: 50
      }
    },
    npcs: [
      { state: "walking", x: -40 },
      { state: "ko", x: -500 },
      { state: "ko", x: -600 },
      { state: "ko", x: -700 }
    ],
    cam: { x: 0 },
    W: 100,
    MIN_NPCS_ON_SCREEN: 0,
    MAX_NPCS: 4,
    rand: (min) => min,
    spawnNPC: (x) => {
      spawnCalls.push(x);
    },
    Math: { random: () => 0.9 }
  };

  vm.runInNewContext(updateNPCSpawning, context);
  context.updateNPCSpawning({ isSprinting: true, facing: 1, x: 0 });

  assert.equal(spawnCalls.length, 1);
});

test("service worker precaches first-load sound and sprite assets needed for offline startup", () => {
  const swSource = readRepoFile("sw.js");
  const assetsDeclaration = extractConst(swSource, "ASSETS");
  const context = {};

  vm.runInNewContext(`${assetsDeclaration}\nthis.ASSETS = ASSETS;`, context);

  assert.ok(context.ASSETS.includes("./sfx/sounds.js"));
  assert.ok(context.ASSETS.includes("./sprites/mchat.png"));
  assert.ok(context.ASSETS.includes("./sprites/busstop.png"));
});

test("sound designer JS export materializes every sound slot before serializing", async () => {
  const soundDesignerSource = readRepoFile("sound-designer.html");
  const slotsDeclaration = extractConst(soundDesignerSource, "SLOTS");
  const defaultLayer = extractFunction(soundDesignerSource, "defaultLayer");
  const defaultSound = extractFunction(soundDesignerSource, "defaultSound");
  const migrateSound = extractFunction(soundDesignerSource, "migrateSound");
  const getSound = extractFunction(soundDesignerSource, "getSound");
  const buildExportableSoundDefs = extractFunction(soundDesignerSource, "buildExportableSoundDefs");
  const copyJS = extractFunction(soundDesignerSource, "copyJS");
  let capturedText = "";

  const context = {
    navigator: {
      clipboard: {
        writeText: async (text) => {
          capturedText = text;
        }
      }
    },
    setStatus: () => {}
  };

  const source = `
    ${slotsDeclaration}
    ${defaultLayer}
    ${defaultSound}
    ${migrateSound}
    let sounds = {};
    let selectedSlot = 'jump';
    ${getSound}
    ${buildExportableSoundDefs}
    ${copyJS}
    this.SLOTS = SLOTS;
  `;

  vm.runInNewContext(source, context);

  context.getSound("jump");
  context.copyJS();
  await Promise.resolve();

  const exportedDefs = parseSoundDefsSource(capturedText);

  assert.equal(Object.keys(exportedDefs).length, context.SLOTS.length);
  for (const slot of context.SLOTS) {
    assert.ok(slot.id in exportedDefs);
  }
});

test("npc designer runtime base list includes all shipped zone-specific archetypes", () => {
  const constraints = require(path.join(REPO_ROOT, "npc-designer-constraints.js"));
  const runtimeBaseNames = new Set(
    constraints.getRuntimeBaseDefs().map((definition) => definition.name)
  );

  for (const requiredName of ["shopaholic", "influencer", "jogger", "dog_walker", "club_dude"]) {
    assert.ok(runtimeBaseNames.has(requiredName), `${requiredName} is missing`);
  }
});
