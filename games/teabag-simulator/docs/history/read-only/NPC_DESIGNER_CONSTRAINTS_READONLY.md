# NPC Designer Constraint UX + Runtime-Parity Read-Only Plan

Branch: `agent/npc-designer-refactor-rescue`
Base: `f2b3aa8`

Status: Phase 1 read-only complete. No implementation edits were made before this artifact.

## Prompt Alignment

This is an additive refactor of the existing full-featured NPC designer.

Required preserved capabilities:
- Tools: `select`, `move`, `rect`, `ellipse`, `line`, `curve`, `polygon`, `color`, `gradient`, `eyedropper`, `hand`, zoom controls.
- Layer workflow: reorder, lock/hide, multi-select, group transforms.
- Poses: `normal`, `panic`, `ko`.
- Existing JSON round-trip behavior and height reference workflow.

## Files Reviewed (Read-Only)

- `SCHEMATICS.md` (read first, per repo rule)
- `docs/planning/REFACTOR_SLICES.md`
- `docs/planning/REFACTOR_CHECKLIST.md`
- `README.md`
- `npc-designer.html`
- `npc-designer.css`
- `npc-designer.js`
- `teabag-simulator.html` renderer/NPC surfaces (`drawCharacter`, `npcVisualOpts`, `CHARACTER_DEFS`)

## Existing Capability Anchors (Preserve)

### Tool surface
- Tool registry: `npc-designer.js:5` (`TOOL_IDS`)
- Tool binding: `npc-designer.js:239-241`
- Pointer/tool gesture routing: `npc-designer.js:1129-1466`
- Zoom controls + wheel zoom: `npc-designer.js:218-224`, `npc-designer.js:1044-1076`

### Layers and transforms
- Layer list controls: `npc-designer.js:299-305`, `npc-designer.js:1586-1645`
- Reorder/duplicate/delete: `npc-designer.js:1695-1760`
- Multi-select + anchor/range: `npc-designer.js:1609-1627`, `npc-designer.js:1864-1889`
- Group move/resize: `npc-designer.js:1470-1545`

### Pose model
- Pose IDs: `npc-designer.js:4`
- Pose tabs/copy/reset: `npc-designer.js:188-196`, `npc-designer.js:1659-1692`
- Independent per-pose layer stores: `npc-designer.js:416-420`, `npc-designer.js:1874-1879`

### JSON round-trip and height references
- Export/import editable JSON: `npc-designer.js:2666-2697`
- Import normalization: `npc-designer.js:2699-2799`
- Compact export: `npc-designer.js:2814-2841`
- Height reference overlays: `npc-designer.js:2004-2072`

### Runtime render parity surfaces
- Runtime renderer body: `teabag-simulator.html:2103-2578` (`drawCharacter`)
- Runtime draw inputs: `teabag-simulator.html:2811-2813` (`npcVisualOpts`)
- Runtime character defs: `teabag-simulator.html:665-958` (`CHARACTER_DEFS`)
- Runtime draw call sites: `teabag-simulator.html:3780`, `teabag-simulator.html:3788`, `teabag-simulator.html:3815`

## Planned Edit Scope (Expected)

- `npc-designer.html`
- `npc-designer.css`
- `npc-designer.js`
- `npc-designer-constraints.js` (new shared constraints source)
- `runtime/npc-render-shared.js` (new shared renderer source)
- `teabag-simulator.html` (runtime wrapper wiring only)
- `scripts/convert-npc-designer-json.js` (new)
- `data/npc_payloads/index.json` (new)
- `data/npc_payloads/strict-valid.json` (new)
- `data/npc_payloads/visual-override.json` (new)
- `data/npc_payloads/hard-fail.json` (new)
- `README.md`
- `SCHEMATICS.md`
- `docs/planning/REFACTOR_SLICES.md`
- `docs/planning/REFACTOR_CHECKLIST.md`
- `docs/history/read-only/NPC_DESIGNER_CONSTRAINTS_READONLY.md`

## Hard Safety vs Visual Rules Contract

### Hard Safety rules (non-bypassable, export-blocking)
- Required meta and runtime profile fields exist and are type-safe.
- Runtime profile `wScale` / `hScale` within safe bounds.
- Runtime profile health bounds valid (`healthMin <= healthMax`, finite, positive).
- Runtime profile color/hair fields valid for runtime draw path.
- Designer document pose/layer structure valid and non-corrupt.
- Hard failures always block compact/runtime export and converter success.

### Visual rules (non-blocking when strict OFF)
- Contrast/readability warnings (body/leg/shoe distinctions).
- Stylization overflow warnings (large scale/silhouette drift).
- Dress/body coherence warnings.
- Empty-pose or low-detail warnings.

### Toggle semantics
- `Strict Visual Rules`: default ON.
- `Auto-fix Visual Issues`: default ON when strict ON.
- Strict OFF allows visual-rule violations as warnings.
- Hard Safety remains non-bypassable regardless of toggles.

## Caller/Callee Map: Runtime Preview Path

Designer runtime-preview path (planned):
1. UI changes in `npc-designer.html` controls
2. `npc-designer.js` collects current document + runtime profile + preview control state
3. `npc-designer.js` calls shared `validateDesignerConstraints(...)` from `npc-designer-constraints.js`
4. `npc-designer.js` builds runtime preview model
5. `npc-designer.js` calls `NPCRenderShared.createCharacterRenderer(...)`
6. Shared renderer draws via `drawCharacter(...)` implementation from `runtime/npc-render-shared.js`

Game runtime parity path (planned):
1. `teabag-simulator.html` loads `runtime/npc-render-shared.js`
2. `teabag-simulator.html` wrapper `drawCharacter(...)` delegates to shared renderer
3. Existing runtime call sites continue using `drawCharacter(...)`

Parity requirement:
- Shared module draw body must match baseline runtime draw body to keep non-designer NPC render output unchanged.

## Invariants and Non-Goals

Hard invariants:
- No gameplay constants/tuning changes.
- No spawn/combat/zone rebalance.
- Non-designer NPC render parity unchanged.
- Update/render ordering unchanged.
- End-of-frame input reset ordering unchanged.

Non-goals:
- Replacing existing layer/pose editor architecture.
- Removing or downgrading existing tools/workflows.

## Key Regression Risks

- Shared renderer extraction could alter draw semantics if wrapper context differs.
- New validation hooks could accidentally block existing editable JSON export path.
- UI additions could interfere with existing pointer/selection shortcuts.
- Import normalization could destructively rewrite unknown fields.

## Acceptance Checks and Validation Plan

1. Syntax checks
- `node --check npc-designer.js`
- `node --check npc-designer-constraints.js`
- `node --check runtime/npc-render-shared.js`
- `node --check scripts/convert-npc-designer-json.js`
- `node --check` extracted inline JS from `teabag-simulator.html`

2. Converter fixtures
- strict-valid fixture: success
- visual-override fixture: success with warnings metadata
- hard-fail fixture: explicit failure with hard blockers

3. Feature parity checks (existing designer)
- Tool list IDs unchanged and wired.
- Layer reorder/lock/hide/multi-select/group transform functions still present/wired.
- Pose tabs and normal/panic/ko independence intact.
- JSON round-trip functions still operational.
- Height-reference render path still operational.

4. Non-designer render parity
- Baseline drawCharacter body (from base commit) equals shared renderer body.
- Runtime wrapper wiring confirmed in `teabag-simulator.html`.
- Runtime shared renderer smoke draw over representative NPC/player options.

5. Runtime validation status
- Execute static/headless checks in this environment.
- If full browser run is skipped, report exact skip reason.

6. Sound-path validation
- Report not required unless sound files/runtime sound paths changed.
