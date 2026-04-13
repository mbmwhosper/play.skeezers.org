# NPC JSON Runtime Reintegration (Read-Only Plan)

## Phase

- Phase 1 (read-only) completed before implementation edits.

## Required Inputs Read

- `SCHEMATICS.md` (required initialization map)
- `docs/planning/REFACTOR_SLICES.md`
- `docs/planning/REFACTOR_CHECKLIST.md`
- `README.md`
- `AGENTS.md` file is not present in this branch; applied AGENTS instructions from provided task prompt.

## In-Scope Files

- `teabag-simulator.html`
- `runtime/npc-render-shared.js`
- `data/npc_payloads/index.json`
- `data/npc_payloads/*.json` only if runtime sample wiring requires it
- `README.md`
- `SCHEMATICS.md`
- `docs/planning/REFACTOR_SLICES.md`
- `docs/planning/REFACTOR_CHECKLIST.md`
- `docs/history/read-only/NPC_JSON_REINTEGRATION_READONLY.md`

## Out-of-Scope Files (Hard)

- `npc-designer.html`
- `npc-designer.css`
- `npc-designer.js`
- `npc-designer-constraints.js`
- `scripts/convert-npc-designer-json.js`

## Exact Target Anchors

### `teabag-simulator.html`

- Include anchor for shared renderer: line 22 (`runtime/npc-render-shared.js`)
- Runtime renderer wrapper:
  - `SHARED_CHARACTER_RENDERER`: lines 2104-2106
  - `drawCharacter(x, y, w, h, opts)`: lines 2108-2113
- Gallery sample insertion point:
  - `GALLERY_TYPES`: lines 2136-2159
  - `drawGallery()`: lines 2254-2328
- NPC visual option bridge:
  - `npcVisualOpts(npc)`: lines 2346-2348
- Spawn path reference (must not rebalance pools/selection):
  - `pickNPCType(zone)`: lines 2353-2366
  - `spawnNPC(x)`: lines 2368-2418
  - Zone pools (`npcPool`) in `ZONES`: lines 503, 518, 533, 548, 563, 578 (read-only guard)
- Runtime render call sites:
  - `drawBusStopNPCs(...)`: lines 1497-1521
  - `renderEntityLayer()`: lines 3281-3360
- Frame-end order invariant:
  - `endFrameInputReset(gameCtx)`: lines 4038-4043
  - `loop(gameCtx, timestamp)`: lines 4045-4052

### `runtime/npc-render-shared.js`

- Renderer factory anchor: `createCharacterRenderer(runtime)` line 29
- Main draw entrypoint: `drawCharacter(x, y, w, h, opts)` line 40
- Existing return surface: `{ drawCharacter }` near file end

### Payload Data

- Registry file: `data/npc_payloads/index.json`
- Candidate fixtures: `data/npc_payloads/strict-valid.json`, `data/npc_payloads/visual-override.json`, `data/npc_payloads/hard-fail.json`

## Planned Function Signatures (Additive)

### In `teabag-simulator.html`

- `loadDesignerPayloadRegistry()` async boot-time loader
- `normalizeDesignerPayload(rawPayload, sourceHint)` safe payload normalization
- `resolveDesignerPayloadById(designerPayloadId)` map lookup helper
- `resolveDesignerPayloadPose(opts)` pose mapping helper (`ko` / `panic` / `normal`)

### In `runtime/npc-render-shared.js`

- Keep exported `createCharacterRenderer(runtime)` and `drawCharacter(...)` signatures unchanged.
- Add internal helpers only:
  - payload-aware draw branch (designer payload path)
  - shape primitives for `rect`, `ellipse`, `line`, `curve`, `polygon`
  - style/layer visibility/opacity handling
  - hard fallback to legacy renderer path on malformed layer geometry/style

## Caller/Callee Map (Required)

1. Payload index load path:
- `teabag-simulator.html` boot -> `loadDesignerPayloadRegistry()`
- `loadDesignerPayloadRegistry()` -> fetch `data/npc_payloads/index.json`
- index entries -> per-entry fetch payload JSON
- fetched payload -> `normalizeDesignerPayload(...)`
- normalized payload -> in-memory map keyed by payload `id`

2. Runtime lookup path:
- draw caller (`drawGallery`, `drawBusStopNPCs`, `renderEntityLayer`) -> `drawCharacter(..., opts)`
- `drawCharacter(...)` wrapper checks optional `opts.designerPayloadId`
- wrapper calls `resolveDesignerPayloadById(id)` and `resolveDesignerPayloadPose(opts)`
- wrapper forwards payload metadata to shared renderer draw call

3. Shared renderer path:
- `runtime/npc-render-shared.js::drawCharacter(...)`
- if designer payload + pose valid: draw payload layers (pose-specific)
- else: execute existing legacy draw body unchanged

## Hard Invariants to Preserve

- No gameplay constants/tuning changes.
- No spawn/combat/zone rebalance.
- No `npcPool`/spawn-selection logic edits.
- No update/render dispatch order changes.
- No frame-end input reset ordering changes.
- Non-designer NPC render parity remains unchanged.

## Failure-Path Plan (Explicit)

1. Registry/index/load/parse failures:
- Any index fetch or parse failure: set registry status to failed; keep empty map; never throw from render path.
- Any individual payload fetch/parse/normalize failure: skip that payload entry only; continue loading others.
- All failures log warning only and fall back to legacy rendering.

2. Unknown/missing `designerPayloadId`:
- Lookup miss returns `null` and draw continues via legacy renderer path.
- Non-designer NPC paths unchanged because they do not provide `designerPayloadId`.

3. Payload draw-time malformed layer:
- If layer geometry/style invalid, skip layer or abort payload branch safely and fall back to legacy character draw.

## Regression Risk Checks

- Renderer parity drift if shared draw body changes outside payload branch.
- Gallery sample accidentally affecting spawn pools (must remain gallery-only/debug-gated).
- Pose mapping mismatch (`panic/flee` not mapped consistently).
- Runtime exception risk from async payload load timing (map not ready at first frame).
- Input/frame reset/order regressions from unrelated movement in main loop (must remain untouched).

## Validation Plan

- Syntax checks on changed JS.
- Converter compatibility checks:
  - strict-valid fixture success
  - visual-override deterministic success (`--strict-visual off --auto-fix off`)
  - hard-fail returns exit code 2
  - positional output + `--out` output form
  - precedence check (`--out` wins over positional output path)
- Mechanical spawn guard diff check for forbidden patterns.
- Baseline parity comparison against `656b34a` for non-designer rendering behavior.
- Runtime validation reported executed or explicitly skipped with exact reason.
- Sound-path validation reported as not required unless sound files/runtime touched.
