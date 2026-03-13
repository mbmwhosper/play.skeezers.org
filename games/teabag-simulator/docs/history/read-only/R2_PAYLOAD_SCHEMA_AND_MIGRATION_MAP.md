# R2 Payload Schema and Migration Map

## Scope
Read-only discovery for shoulder-pivot persistence needs across designer export/import and in-game runtime load.

Primary anchors reviewed:
- `npc-designer.js:4550`, `npc-designer.js:4600`, `npc-designer.js:4749`, `npc-designer.js:4801`
- `npc-designer.js:15`, `npc-designer.js:887`, `npc-designer.js:1030`, `npc-designer.js:1070`, `npc-designer.js:1118`
- `npc-designer.js:498`, `npc-designer.js:150`, `npc-designer.js:3847`, `npc-designer.js:4006`
- `scripts/convert-npc-designer-json.js:71`, `scripts/convert-npc-designer-json.js:99`, `scripts/convert-npc-designer-json.js:144`
- `teabag-simulator.html:2162`, `teabag-simulator.html:2204`, `teabag-simulator.html:2225`, `teabag-simulator.html:2272`, `teabag-simulator.html:2282`, `teabag-simulator.html:4256`
- `runtime/npc-render-shared.js:343`, `runtime/npc-render-shared.js:382`, `runtime/npc-render-shared.js:413`, `runtime/npc-render-shared.js:437`
- `data/npc_payloads/index.json:22`

---

## 1) Current Payload Schema vs Workspace-Only State

### A. Currently exportable

1. Editable JSON export (`npc-designer.js:4550`):
- Exports `state.document` directly.
- Includes document-level authoring data (`meta`, `canvas`, `editor`, `runtimeProfile`, `poses`, validation snapshot).
- Import path (`npc-designer.js:4570`, `npc-designer.js:4600`) normalizes known fields and drops unknown top-level keys unless explicitly handled.

2. Compact integration payload export (`npc-designer.js:4801` via `buildDesignerRuntimePayload` at `npc-designer.js:4749`):
- Root: `version`, `id`, `label`, `bounds`, `origin`, `poses`, optional `baseTemplate`, `runtimeProfile`, `metadata.validation`.
- Layer mapping includes `partRole` (`npc-designer.js:4725`).

3. CLI converter output (`scripts/convert-npc-designer-json.js:99`):
- Root: `version`, `id`, `label`, `baseTemplate`, `runtimeProfile`, `bounds`, `metadata.validation`, `poses`.
- Important differences vs designer compact export:
  - No `origin` emitted.
  - `partRole` not emitted per layer (`scripts/convert-npc-designer-json.js:128`).

4. Runtime-normalized payload shape (`teabag-simulator.html:2162`):
- Runtime keeps `id`, `label`, `bounds`, `origin`, `poses`.
- Important: runtime normalizer currently drops `partRole` (`teabag-simulator.html:2127` -> `teabag-simulator.html:2145`), so shared renderer mostly relies on name/id inference for arm/leg part detection.

### B. Currently localStorage-only

Stored via:
- `WORKSPACE_STORAGE_KEY` (`npc_designer_workspace_v1`) at `npc-designer.js:15`
- `SNAPSHOTS_STORAGE_KEY` (`npc_designer_snapshots_v1`) at `npc-designer.js:16`
- `SNAPSHOT_SELECTION_STORAGE_KEY` at `npc-designer.js:17`

Workspace/snapshot payload contains (`npc-designer.js:887`, `npc-designer.js:1030`, `npc-designer.js:1070`, `npc-designer.js:1118`):
- Full document snapshot
- active pose, strict/auto-fix toggles
- style/face drafts
- runtime preview controls (`pose`, `facing`, `scale`, `tick`, `worldContext`)
- UI helpers (`copyToPose`, height filter, json workspace text)

### C. Current state for requested fields

- `panicPivotMode`: does not exist in export schema, converter schema, runtime normalized schema, or localStorage snapshot schema.
- `panicShoulderOffsetY`: exists only as in-memory live-preview state (`npc-designer.js:150`, `npc-designer.js:520`) used by local panic preview rendering (`npc-designer.js:3847`).
- `panicShoulderOffsetY` is not exported and also not persisted to localStorage (live-preview handlers do not call `touchWorkspace`; see `npc-designer.js:498`-`npc-designer.js:527` vs runtime preview handlers at `npc-designer.js:458`-`npc-designer.js:495`).

---

## 2) Proposed Schema Additions

Schema additions are needed if shoulder-pivot behavior must survive export/import and match in-game runtime.

### Proposed fields
- `panicPivotMode`
- `panicShoulderOffsetY`

### Recommended semantics
- `panicPivotMode`: enum
  - `"legacy"` = current runtime arm behavior (no shared shoulder-bar override)
  - `"shoulder_bar"` = apply shared shoulder-bar pivot in panic pose
- `panicShoulderOffsetY`: number (designer-space px), clamped to existing designer range `[-40, 40]` (`npc-designer.js:3849`-`npc-designer.js:3851`)

### Placement recommendation
Apply the same pair to both:
1. Editable designer document (so export/import JSON preserves it)
2. Runtime payload root (so in-game load consumes it)

Minimal payload shape addition:
```json
{
  "panicPivotMode": "legacy",
  "panicShoulderOffsetY": 0
}
```

Note: preserving `partRole` across converter/runtime-normalizer is strongly recommended with this migration; shoulder-pivot logic depends on stable arm-role identification.

---

## 3) Backward Compatibility Plan

### Missing-field defaults
- `panicPivotMode` missing -> default `"legacy"`
- `panicShoulderOffsetY` missing -> default `0`
- Unknown `panicPivotMode` value -> coerce to `"legacy"`
- Non-finite `panicShoulderOffsetY` -> `0`, then clamp range

### Old payload behavior
- Old payloads (without new fields) render exactly as today due `legacy` default.
- Existing runtime fallback behavior remains intact:
  - Missing/failed payload registry load falls back to legacy rendering (`teabag-simulator.html:2225`, `teabag-simulator.html:2256`, `teabag-simulator.html:2282`).
  - NPCs without `designerPayloadId` continue legacy branch (`teabag-simulator.html:2547`, `teabag-simulator.html:3522`).

### Migration style
- Prefer lazy migration on load/normalize rather than rewriting all existing payload files.
- Converter and runtime normalizer should both inject defaults so old fixture payloads in `data/npc_payloads/index.json` continue working unchanged.

---

## 4) Converter + Runtime Load Impact Map

| Touchpoint | Current behavior | Needed change for shoulder-pivot persistence | Command-path implication |
| --- | --- | --- | --- |
| `npc-designer.js:4600` (`normalizeImportedDocument`) | Imports known fields only | Read/normalize `panicPivotMode` + `panicShoulderOffsetY` into document state | Editable JSON import/export parity gains new keys; no CLI changes |
| `npc-designer.js:4749` (`buildDesignerRuntimePayload`) | Emits compact payload without panic pivot fields | Emit new fields into runtime payload root | Compact export gains two keys |
| `npc-designer.js:887` (`buildWorkspaceSnapshot`) | Persists runtime preview state, not live panic shoulder fields | Optional: persist new fields in document/snapshot if UX requires workspace continuity | Local autosave/snapshot shape change if implemented |
| `scripts/convert-npc-designer-json.js:71` | Normalizes input doc and drops unknown root fields | Parse + default new fields | Existing converter command remains same |
| `scripts/convert-npc-designer-json.js:99` | Emits payload root without panic pivot fields | Emit new fields in converter output | Existing converter command remains same: `node scripts/convert-npc-designer-json.js <input.json> [output.json] [--out ...] [--strict-visual ...] [--auto-fix ...]` |
| `teabag-simulator.html:2162` (`normalizeDesignerPayload`) | Normalizes payload but strips unknown root fields and `partRole` | Preserve/normalize new panic fields (and preserve `partRole`) | Runtime can consume fields from exported/converted payload JSONs |
| `runtime/npc-render-shared.js:343`, `runtime/npc-render-shared.js:382`, `runtime/npc-render-shared.js:413` | Rig/pivot comes from legacy motion + per-layer pivot; no payload panic mode/offset support | Add panic-mode branch in designer payload path: use shared shoulder-bar Y when `panicPivotMode=="shoulder_bar"` and pose panic | In-game motion can match designer shoulder-pivot behavior |
| `teabag-simulator.html:2225`, `teabag-simulator.html:2282`, `teabag-simulator.html:4256` | Registry load at boot, payload lookup in draw wrapper | No path change required; normalized payload just carries new fields through | Boot/load commands unchanged |

Additional migration risk surfaced by discovery:
- `partRole` is emitted by designer compact export (`npc-designer.js:4725`) but currently stripped by runtime payload normalizer (`teabag-simulator.html:2127`-`teabag-simulator.html:2145`) and converter output (`scripts/convert-npc-designer-json.js:128`).
- Shoulder-pivot accuracy is brittle without preserved `partRole`; name-based inference can misclassify layers.

---

## 5) Validation Matrix for Eventual Implementation

### A. Export/import parity checks

| Case | Steps | Expected |
| --- | --- | --- |
| Editable JSON round-trip | Set non-default panic fields -> export editable JSON -> import same JSON | Values restored exactly; no coercion for valid values |
| Compact export presence | Set non-default panic fields -> compact export | Payload includes `panicPivotMode` + `panicShoulderOffsetY` |
| Converter pass-through | Run converter on editable JSON containing new fields | Output payload includes normalized new fields |
| Default injection | Import old editable/payload JSON missing fields | Defaults applied (`legacy`, `0`) with no hard failure |

### B. Runtime fallback checks

| Case | Steps | Expected |
| --- | --- | --- |
| Shoulder mode active | Runtime payload `panicPivotMode="shoulder_bar"` + non-zero offset; render panic pose | Arm pivot behavior matches designer shoulder-bar intent |
| Legacy default | Omit both fields | Visual behavior matches current production runtime |
| Invalid values | Use unknown mode / non-numeric offset | Safe coercion to defaults; no throw; rendering continues |
| Registry/load failure | Break payload load/index fetch path | Existing legacy fallback path still renders (`teabag-simulator.html:2256`, `teabag-simulator.html:2296`) |

### C. Non-designer NPC no-regression checks

| Case | Steps | Expected |
| --- | --- | --- |
| No `designerPayloadId` NPCs | Run normal gameplay spawn/render | Behavior unchanged (legacy path still used) |
| Bus-stop NPC path | Render bus-stop NPCs with/without payload ids (`teabag-simulator.html:1500`) | Existing panic/open-mouth toggles still work |
| World NPC path | Render regular NPCs (`teabag-simulator.html:3522`) | Non-designer NPC visuals/animation unchanged |

---

## Recommended Implementation Order (for later edit phase)

1. Schema normalize/write in designer (`normalizeImportedDocument`, compact export, editable export).
2. Converter read/write of new fields.
3. Runtime payload normalizer pass-through for new fields (+ `partRole` preservation).
4. Shared renderer panic-pivot branch consuming new fields.
5. Validate matrix above in order: parity -> fallback -> non-designer regression.

No gameplay/code edits were performed in this discovery task.
