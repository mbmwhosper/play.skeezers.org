# NPC Payload Runtime Reintegration Slices

Purpose: reintegrate designer JSON payloads into runtime rendering with strict fallback safety and no gameplay rebalance.

## Hard Invariants

- No gameplay constants/tuning changes.
- No spawn/combat/zone rebalance.
- No `npcPool` / spawn-selection edits.
- Update/render/frame-reset ordering unchanged.
- Non-designer NPC render parity unchanged.

## Scope

In scope:
- `teabag-simulator.html`
- `runtime/npc-render-shared.js`
- `data/npc_payloads/index.json`
- `data/npc_payloads/*.json` only if required for runtime sample wiring
- `README.md`
- `SCHEMATICS.md`
- `docs/planning/REFACTOR_SLICES.md`
- `docs/planning/REFACTOR_CHECKLIST.md`
- `docs/history/read-only/NPC_JSON_REINTEGRATION_READONLY.md`

Out of scope:
- `npc-designer.html`
- `npc-designer.css`
- `npc-designer.js`
- `npc-designer-constraints.js`
- `scripts/convert-npc-designer-json.js`

## Mechanical Slice Order

### Slice J1: Read-Only Artifacts (Required First)

Targets:
- `docs/history/read-only/NPC_JSON_REINTEGRATION_READONLY.md`
- `docs/planning/REFACTOR_SLICES.md`
- `docs/planning/REFACTOR_CHECKLIST.md`

Actions:
- Lock exact anchors and call graph.
- Define in/out scope and invariants.
- Define explicit failure-path fallback plan.

### Slice J2: Runtime Payload Registry Load + Normalize

Targets:
- `teabag-simulator.html`
- `data/npc_payloads/index.json` (if schema extension needed)

Actions:
- Add async loader for `data/npc_payloads/index.json`.
- Normalize payloads into in-memory map keyed by payload `id`.
- Keep loader failure non-fatal with warning-only behavior.

### Slice J3: Optional Payload Lookup + Pose Resolution Bridge

Targets:
- `teabag-simulator.html`

Actions:
- Add optional `designerPayloadId` handling in runtime character path.
- Resolve pose mapping:
  - `ko` -> `ko`
  - panic/flee -> `panic`
  - otherwise -> `normal`
- Keep unknown/missing id as legacy fallback.

### Slice J4: Shared Renderer Designer-Payload Draw Path

Targets:
- `runtime/npc-render-shared.js`

Actions:
- Add designer-layer draw branch for `rect|ellipse|line|curve|polygon`.
- Respect layer order, visibility, style, opacity.
- Preserve existing legacy draw body as default/fallback path.

### Slice J5: Gallery/Debug Sample Wiring (No Spawn Impact)

Targets:
- `teabag-simulator.html`
- `data/npc_payloads/*.json` only if needed

Actions:
- Wire one sample designer payload path as gallery-only or debug-gated.
- No spawn pool edits and no runtime gameplay routing changes.

### Slice J6: Docs + Validation + Finalization

Targets:
- `README.md`
- `SCHEMATICS.md`

Actions:
- Document runtime payload registry + fallback behavior.
- Update schematics anchors for new loader/lookup/render bridge.
- Run required checks, converter compatibility, parity guard, and mechanical guard diff.

## Slice Status

- [x] J1 Read-only artifacts
- [x] J2 Runtime payload registry load + normalize
- [x] J3 Optional payload lookup + pose resolution bridge
- [x] J4 Shared renderer designer-payload draw path
- [x] J5 Gallery/debug sample wiring
- [x] J6 Docs + validation + finalization

---

# 2026-02-22 NPC Designer Interaction UX Slices

Purpose: add rotate editing, undo/redo history, and collapsible sidebar accordions in `npc-designer` without touching gameplay/runtime balance paths.

## Hard Invariants

- No gameplay constants/tuning changes.
- No spawn/combat/zone behavior changes.
- No payload schema/converter contract changes.
- Runtime parity preview draw path remains functional.
- Existing non-designer runtime rendering remains unchanged.

## Scope

In scope:
- `npc-designer.html`
- `npc-designer.css`
- `npc-designer.js`
- `README.md` (feature documentation update)
- `docs/planning/REFACTOR_SLICES.md`
- `docs/planning/REFACTOR_CHECKLIST.md`

Out of scope:
- `teabag-simulator.html`
- `sound-designer.html`
- `index.html`
- `sw.js`
- `manifest.json`
- `scripts/convert-npc-designer-json.js`
- `data/npc_payloads/*`

## Entry Points / Exit Points

Entry points:
- Tool registry and pointer interaction flow (`setActiveTool`, `onCanvasPointerDown`, `onCanvasPointerMove`, `onCanvasPointerUp`)
- Keyboard shortcut flow (`onWindowKeyDown`)
- Mutation pathways (`stampUpdatedAt`, layer operations, import/reset flows)
- Sidebar section markup (`.panel-left .panel-block`, `.panel-right .panel-block`)

Exit points:
- Designer render remains stable (`renderAll`, `renderEditorCanvas`, previews)
- Export payload behavior unchanged (`buildDesignerRuntimePayload`, `mapLayerToRuntimePayloadLayer`)
- Session save/load still works

## Dependency Edges + Coupling Risks

- Pointer interaction uses geometry snapshot functions (`translateGeometryFromSnapshot`, `scaleLayerGeometryFromSnapshot`); rotate must share this snapshot model.
- Undo/redo must not conflict with autosave/session snapshot mechanisms.
- Accordion toggles must preserve existing controls and event bindings in both sidebars.
- Keyboard shortcut additions must not break existing delete/duplicate/polygon controls.

## Mechanical Slice Order

### Slice U1: History infrastructure (undo/redo state + controls)
- Add bounded undo/redo stacks and snapshot apply helpers in `npc-designer.js`.
- Add topbar undo/redo buttons and shortcut bindings.
- Ensure restore paths avoid recursive history writes.

### Slice U2: Rotate tool integration
- Add rotate tool button + tool id.
- Implement rotate pointer interaction using selected-layer geometry snapshots.
- Add rotation geometry helpers and snap behavior (Shift for angle snapping).

### Slice U3: Accordion behavior for both sidebars
- Add accordion toggles for all `.panel-block` sections in left and right sidebars.
- Keep default sections expanded and preserve accessible button semantics.
- Add CSS states for collapsed content.

### Slice U4: Docs + validation
- Update README designer feature list with rotate + undo/redo + accordion controls.
- Run syntax checks and scope guard.
- Report runtime validation/sound validation status.

---

# 2026-03-10 Multi-Surface Bugfix Sweep

Purpose: fix the confirmed runtime, offline, sound-designer, and NPC-designer regressions without widening scope or rebalancing gameplay.

## Hard Invariants

- No gameplay tuning changes.
- No new save fields or save-shape migration.
- No zone pool or spawn-selection edits.
- Update/render/frame-reset ordering stays intact except for a gallery-mode simulation short-circuit.
- Sound content in `sfx/sounds.js` remains unchanged.

## Scope

In scope:
- `teabag-simulator.html`
- `sw.js`
- `sound-designer.html`
- `npc-designer-constraints.js`
- `SCHEMATICS.md`
- `docs/planning/REFACTOR_SLICES.md`
- `docs/planning/REFACTOR_CHECKLIST.md`
- `docs/superpowers/specs/2026-03-10-bugfix-sweep-design.md`
- `docs/superpowers/plans/2026-03-10-bugfix-sweep.md`
- `scripts/regression-bugfixes.test.js`

Out of scope:
- `README.md`
- `manifest.json`
- `index.html`
- `npc-designer.js`
- `npc-designer.html`
- `runtime/npc-render-shared.js`
- `sfx/sounds.js`

## Entry Points / Exit Points

Entry points:
- payload registry loader in `teabag-simulator.html`
- gallery-mode toggle and update dispatcher in `teabag-simulator.html`
- mobile touch control state in `teabag-simulator.html`
- NPC spawn pressure logic in `teabag-simulator.html`
- service worker asset manifest in `sw.js`
- JS export path in `sound-designer.html`
- runtime archetype definitions in `npc-designer-constraints.js`

Exit points:
- gameplay render order remains stable
- pause/menu/title flow remains stable
- sound runtime still consumes `SOUND_DEFS`
- NPC designer runtime base picker remains sourced from `RUNTIME_BASE_DEFS`

## Dependency Edges + Coupling Risks

- Payload URL resolution must stay aligned with `data/npc_payloads/index.json` relative paths and offline cached payload files.
- Gallery-mode update gating must not break title, pause, or gameplay front-screen rendering rules.
- Touch crouch state must stay aligned with desktop crouch semantics and on-screen control hints.
- Spawn-cap accounting must preserve existing visibility heuristics and offscreen spawn placement.
- Offline cache additions must stay additive and not change fetch strategy behavior.
- Sound export must preserve slot order and existing default sound shape.

## Mechanical Slice Order

### Slice B1: Planning + regression harness
- Create the task-specific spec and implementation plan.
- Write the regression suite with failing coverage for all confirmed bugs.

### Slice B2: Runtime/gameplay fixes
- Fix payload URL resolution.
- Freeze update dispatch while gallery mode is active.
- Recompute touch crouch from held gameplay buttons.
- Use active NPC counts for spawn-cap gates.

### Slice B3: Tooling/offline fixes
- Expand the service worker precache manifest with first-load assets.
- Export fully materialized `SOUND_DEFS` from the sound designer.
- Restore missing shipped archetypes in `npc-designer-constraints.js`.

### Slice B4: Docs + verification
- Update `SCHEMATICS.md` because game files changed.
- Run regression, syntax, lint, format, and runtime smoke checks.
- Report runtime validation and sound-path validation status in the handoff.
