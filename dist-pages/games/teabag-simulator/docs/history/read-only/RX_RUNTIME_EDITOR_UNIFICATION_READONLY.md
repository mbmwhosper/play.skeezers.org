# RX Runtime/Editor Unification Read-Only Consolidation

## 1. Source Inventory (Exact Paths Used)

### Required sources read
- `AGENTS.md`
- `SCHEMATICS.md`
- `README.md`
- `runtime/npc-render-shared.js`
- `npc-designer.js`
- `npc-designer.html`
- `npc-designer.css`
- `scripts/convert-npc-designer-json.js`
- `teabag-simulator.html`

### Required discovery artifacts (requested names) status
- `docs/history/read-only/R0_RUNTIME_MOTION_SOURCE_MAP.md` -> `NOT FOUND`
- `R0_RUNTIME_MOTION_SOURCE_MAP.md` -> `NOT FOUND`
- `docs/history/read-only/R1_EDITOR_INTEGRATION_SURFACES.md` -> `NOT FOUND`
- `R1_EDITOR_INTEGRATION_SURFACES.md` -> `NOT FOUND`
- `docs/history/read-only/R2_PAYLOAD_SCHEMA_AND_MIGRATION_MAP.md` -> `NOT FOUND`
- `R2_PAYLOAD_SCHEMA_AND_MIGRATION_MAP.md` -> `NOT FOUND`

### Additional local discovery artifacts reviewed (used as substitute context only)
- `docs/history/read-only/NPC_LIVE_TO_RUNTIME_PARITY_READONLY.md`
- `docs/history/read-only/NPC_JSON_REINTEGRATION_READONLY.md`
- `docs/history/read-only/NPC_DESIGNER_READONLY.md`
- `docs/history/read-only/NPC_DESIGNER_CONSTRAINTS_READONLY.md`

## 2. Unified Caller/Callee Maps

### A) Game runtime panic path (authoritative in-game panic behavior)
1. `updateNPCFSM` (`teabag-simulator.html:3192`) advances panic-state movement (`npc.state === "panicking"`), `npc.walkPhase`, facing, calmdown transitions.
2. `updateBusStopAmbient` (`teabag-simulator.html:3275`) drives bus-stop ambient panic flags and panic phase (`bNpc.panicState`, `bNpc.panicPhase`).
3. `drawBusStopNPCs` (`teabag-simulator.html:1497`) maps bus-stop panic flags to render opts (`isFleeing`, `walkPhase`) and calls runtime `drawCharacter`.
4. `renderEntityLayer` (`teabag-simulator.html:3481`) maps world NPC state to render opts (`walkPhase`, `isFleeing`) and calls runtime `drawCharacter`.
5. Runtime wrapper `drawCharacter` (`teabag-simulator.html:2282`) resolves optional payload (`resolveDesignerPayloadById`) and pose (`resolveDesignerPayloadPose`) before delegating to shared renderer.
6. Shared renderer `drawCharacter` (`runtime/npc-render-shared.js:534`) routes:
   - payload branch: `drawDesignerPayloadCharacter` (`runtime/npc-render-shared.js:437`)
   - fallback branch: `getLegacyAnimationState` (`runtime/npc-render-shared.js:244`) + legacy procedural body.

### B) Runtime-parity preview path (designer panel that uses shared runtime renderer)
1. `initConstraintScaffold` (`npc-designer.js:313`) builds `state.runtimeRenderer` via `createCharacterRenderer` (`runtime/npc-render-shared.js:29`).
2. `bindRuntimePreviewEvents` (`npc-designer.js:457`) updates preview state from UI and toggles loop with `setRuntimePreviewLoopPlaying`.
3. `setRuntimePreviewLoopPlaying` (`npc-designer.js:1480`) and `stepRuntimePreviewLoop` (`npc-designer.js:1501`) drive continuous tick progression.
4. `renderRuntimePreview` (`npc-designer.js:4014`) builds live payload (`buildDesignerRuntimePayload`), checks usability (`getRuntimePreviewPayloadReadiness`), then calls shared renderer draw.
5. Shared renderer receives either:
   - payload parity mode (`designerPayload` + `designerPose`), or
   - legacy fallback opts-only mode.

### C) Live preview panic path (editor-local non-runtime panic visualization)
1. `renderPosePreview` (`npc-designer.js:3970`) chooses per-pose preview flow.
2. `getPosePreviewLayers` (`npc-designer.js:3818`) for `panic` merges normal geometry with panic face layer substitutions through `buildLivePanicPreviewLayers` (`npc-designer.js:3769`).
3. `renderLivePanicPosePreview` (`npc-designer.js:3950`) computes part bounds (`buildLivePreviewPartBounds`), derives shoulder bar Y (`resolveLivePanicShoulderBarY`), computes arm motion (`getLivePanicArmMotion`), and renders via `drawLayerWithPreviewMotion`.
4. This path does not call shared renderer; it is editor-local visualization logic.

## 3. Motion/Pivot Truth Surface

### Runtime truth (canonical motion/pivot behavior)
- Shared runtime rig source:
  - `getLegacyAnimationState` (`runtime/npc-render-shared.js:244`)
  - `getDesignerRigMotion` (`runtime/npc-render-shared.js:343`)
- Runtime part inference + pivot rules:
  - `inferDesignerLayerPart` (`runtime/npc-render-shared.js:314`)
  - `getDesignerLayerPivot` (`runtime/npc-render-shared.js:382`)
  - `getLegPivot` (`runtime/npc-render-shared.js:375`)
- Runtime per-part motion mapping:
  - `getDesignerLayerMotion` (`runtime/npc-render-shared.js:413`)
  - shoes inherit leg swing/pivot; mouth scaling is runtime-rig-driven.

### Editor-local duplicates (non-runtime panic rendering logic)
- `resolveLivePanicShoulderBarY` (`npc-designer.js:3847`)
- `getLivePanicArmMotion` (`npc-designer.js:3867`)
- `drawLayerWithPreviewMotion` (`npc-designer.js:3889`)
- `buildLivePanicPreviewLayers` (`npc-designer.js:3769`) for panic-face replacement strategy.

### Drift points
1. Live preview panic shoulder-bar logic is editor-only; runtime renderer has no shoulder-bar parameter.
2. Live preview panic motion affects arms only; runtime panic path also drives leg motion and mouth open via rig state.
3. Runtime part-role inference (`inferDesignerLayerPart`) and editor role inference (`inferRuntimePartRole`) can drift if role taxonomy changes without synchronized updates.
4. Runtime preview parity mode uses shared renderer, while live preview panic does not; visual differences are expected unless explicitly harmonized.

## 4. Decision Matrix

| Area | Current owner | Recommended source of truth | Notes |
| --- | --- | --- | --- |
| NPC panic animation used in game | `runtime/npc-render-shared.js` + `teabag-simulator.html` | Runtime | Keep gameplay-facing motion decisions runtime-owned. |
| Runtime preview rendering behavior | `npc-designer.js` via shared renderer | Runtime renderer | Keep preview as a consumer, not a duplicate renderer. |
| Live panic shoulder-bar controls | `npc-designer.js` | Editor-only | Keep as design aid unless promoted intentionally to runtime contract. |
| Payload pose routing (`normal/panic/ko`) | `teabag-simulator.html` | Runtime wrapper | Preserve `resolveDesignerPayloadPose` as runtime gateway. |
| Part-role vocabulary | editor + runtime | Shared contract | Keep both inference surfaces in lockstep using one role vocabulary. |

### Shoulder-bar policy recommendation
- Recommendation: keep shoulder-bar offset/spread controls editor-only and non-persistent in runtime payload contract.
- Rationale: runtime has no shoulder-bar field, and introducing one would expand payload schema + runtime motion API with gameplay-visible parity risk.

## 5. Data-Contract Plan

### Workspace-only vs payload fields

| Category | Fields | Owner |
| --- | --- | --- |
| Workspace-only state | `runtimePreview.*`, `livePreview.*`, editor pan/zoom/facing, snapshot slot metadata, unsaved flags | `npc-designer.js` local/session persistence |
| Payload core | `id`, `label`, `bounds`, `origin`, `poses[normal|panic|ko][]` | Shared renderer/runtime ingestion |
| Payload layer contract | `id`, `name`, `type`, `partRole`, `visible`, `geometry`, `style` | `mapLayerToRuntimePayloadLayer` + runtime layer draw |
| Runtime profile authoring metadata | `runtimeProfile.*` (used by preview + export payload metadata path) | Designer + converter + runtime indexing workflows |

### Backward compatibility defaults
- Runtime normalizer defaults in `teabag-simulator.html`:
  - `normalizeDesignerPayload` (`2162`) fallback bounds: `w=24`, `h=46`, `editorScale=3.2`
  - `origin` fallbacks: index hints (`designCenterX`, `designBaselineY`) then `480`/`430`
  - pose layer fallback to empty arrays when absent
- Runtime lookup fallback:
  - `resolveDesignerPayloadById` miss -> legacy render path via wrapper `drawCharacter`.

### Converter/runtime touchpoints
- Designer-side payload shaping:
  - `mapLayerToRuntimePayloadLayer` (`npc-designer.js:4725`)
  - `buildRuntimePayloadPoses` (`npc-designer.js:4738`)
  - `buildDesignerRuntimePayload` (`npc-designer.js:4749`)
- Converter shaping:
  - `normalizeInputDesignerDoc` (`scripts/convert-npc-designer-json.js:71`)
  - `createPayload` (`scripts/convert-npc-designer-json.js:99`)
- Runtime ingestion:
  - `normalizePayloadIndexEntries` (`teabag-simulator.html:2204`)
  - `normalizeDesignerPayload` (`teabag-simulator.html:2162`)
  - `loadDesignerPayloadRegistry` (`teabag-simulator.html:2225`)

## 6. Ordered Implementation Slices (Future Edit Pass)

### Slice 1: Lock discovery artifact baseline
- Scope: treat `docs/history/read-only/R0_RUNTIME_MOTION_SOURCE_MAP.md`, `docs/history/read-only/R1_EDITOR_INTEGRATION_SURFACES.md`, and `docs/history/read-only/R2_PAYLOAD_SCHEMA_AND_MIGRATION_MAP.md` as canonical inputs for all follow-on slices.
- Acceptance criteria:
  - all three baseline artifacts are present and referenceable by canonical path.
  - no ambiguity remains about discovery baseline provenance.

### Slice 2: Part-role and motion contract unification
- Scope: define one explicit role/motion contract consumed by both editor and runtime.
- Acceptance criteria:
  - editor/runtime role vocabularies match (`left_arm/right_arm/left_leg/right_leg/left_shoe/right_shoe/...`).
  - no role inferred in one surface is unknown in the other.

### Slice 3: Runtime preview parity hardening
- Scope: keep `renderRuntimePreview` payload-first and fallback-safe without introducing duplicate motion logic.
- Acceptance criteria:
  - payload parity path succeeds for all 3 poses when layers are valid.
  - fallback status is explicit and non-crashing when payload is invalid.

### Slice 4: Live preview panic policy alignment
- Scope: enforce policy boundary between editor-only shoulder controls and runtime truth.
- Acceptance criteria:
  - live preview controls are clearly marked editor-only.
  - runtime payload/schema unaffected unless policy explicitly changed.

### Slice 5: Payload + converter contract stabilization
- Scope: ensure exporter, converter, and runtime normalizer stay schema-compatible.
- Acceptance criteria:
  - exported payload passes converter validation expectations.
  - runtime normalizer accepts payload with stable defaults.

### Slice 6: Regression validation + handoff
- Scope: execute validation matrix and publish parity-risk disposition.
- Acceptance criteria:
  - all validation checks pass or are explicitly documented with reason.
  - parity and fallback behavior documented with evidence.

## 7. Regression Risk Map

| Risk | Trigger | Impact | Detection signal |
| --- | --- | --- | --- |
| Motion drift between live preview and runtime | editor-only panic logic diverges further | designers approve poses that do not match gameplay runtime | side-by-side panic comparison in preview matrix |
| Part-role drift | role names/inference change in one surface only | wrong pivots (especially shoes/arms) | role coverage checks on exported payloads |
| Payload contract drift | exporter/converter/runtime normalizer diverge | payload load failures or silent fallback | converter + runtime fixture pass/fail trend |
| Hidden fallback masking bugs | runtime preview silently uses legacy path | false confidence in payload parity | explicit status text requiring payload mode visibility |
| Discovery provenance drift | implementation references stale/non-canonical discovery docs | plan traceability gap and scope disputes | discovery-source audit fails |

## 8. Validation Matrix (For Future Edit Pass)

| Validation area | Command or method | Pass condition |
| --- | --- | --- |
| Anchor fidelity | `rg -n` per cited symbol | claimed lines equal actual lines |
| Role vocabulary parity | static compare of editor/runtime role sets | no missing/extra role tokens |
| Payload shape sanity | export sample + converter script run | converter succeeds for valid payloads and blocks hard-fail payloads |
| Runtime payload fallback safety | simulate missing/invalid payload entry | renderer falls back without crash |
| Panic parity check | compare live preview panic vs runtime preview panic | documented expected differences only (no unknown drift) |
| Regression smoke | designer controls (pose/facing/tick/loop), game NPC panic render | no runtime exceptions, status text accurate |

## 9. Open Questions (True Blockers Only)

1. Should shoulder-bar panic behavior remain editor-preview-only, or become payload/runtime-persistent (`panicPivotMode` + `panicShoulderOffsetY`)?

## 10. Go/No-Go Recommendation

- Recommendation: `GO` for implementation start.
- Constraint: resolve Open Question #1 (shoulder persistence policy) before starting slices that touch payload schema/runtime consumption (`Slice 3+`).

## Anchor Fidelity Table

| symbol | file | claimed_line | actual_line | status |
| --- | --- | --- | --- | --- |
| `DESIGNER_PAYLOAD_INDEX_PATH` | `teabag-simulator.html` | 2104 | 2104 | PASS |
| `normalizeDesignerLayer` | `teabag-simulator.html` | 2127 | 2127 | PASS |
| `normalizeDesignerPayload` | `teabag-simulator.html` | 2162 | 2162 | PASS |
| `normalizePayloadIndexEntries` | `teabag-simulator.html` | 2204 | 2204 | PASS |
| `loadDesignerPayloadRegistry` | `teabag-simulator.html` | 2225 | 2225 | PASS |
| `resolveDesignerPayloadById` | `teabag-simulator.html` | 2267 | 2267 | PASS |
| `resolveDesignerPayloadPose` | `teabag-simulator.html` | 2272 | 2272 | PASS |
| `drawCharacter` | `teabag-simulator.html` | 2282 | 2282 | PASS |
| `drawBusStopNPCs` | `teabag-simulator.html` | 1497 | 1497 | PASS |
| `npcVisualOpts` | `teabag-simulator.html` | 2546 | 2546 | PASS |
| `updateNPCFSM` | `teabag-simulator.html` | 3192 | 3192 | PASS |
| `updateBusStopAmbient` | `teabag-simulator.html` | 3275 | 3275 | PASS |
| `renderEntityLayer` | `teabag-simulator.html` | 3481 | 3481 | PASS |
| `loadDesignerPayloadRegistry()` boot call | `teabag-simulator.html` | 4256 | 4256 | PASS |
| `createCharacterRenderer` | `runtime/npc-render-shared.js` | 29 | 29 | PASS |
| `getLegacyAnimationState` | `runtime/npc-render-shared.js` | 244 | 244 | PASS |
| `inferDesignerLayerPart` | `runtime/npc-render-shared.js` | 314 | 314 | PASS |
| `getDesignerRigMotion` | `runtime/npc-render-shared.js` | 343 | 343 | PASS |
| `buildDesignerPartBounds` | `runtime/npc-render-shared.js` | 357 | 357 | PASS |
| `getLegPivot` | `runtime/npc-render-shared.js` | 375 | 375 | PASS |
| `getDesignerLayerPivot` | `runtime/npc-render-shared.js` | 382 | 382 | PASS |
| `getDesignerLayerMotion` | `runtime/npc-render-shared.js` | 413 | 413 | PASS |
| `drawDesignerPayloadCharacter` | `runtime/npc-render-shared.js` | 437 | 437 | PASS |
| `drawCharacter` | `runtime/npc-render-shared.js` | 534 | 534 | PASS |
| `RUNTIME_PART_ROLES` | `npc-designer.js` | 44 | 44 | PASS |
| `initConstraintScaffold` | `npc-designer.js` | 313 | 313 | PASS |
| `bindRuntimePreviewEvents` | `npc-designer.js` | 457 | 457 | PASS |
| `updateRuntimePreviewLabels` | `npc-designer.js` | 1447 | 1447 | PASS |
| `setRuntimePreviewLoopPlaying` | `npc-designer.js` | 1480 | 1480 | PASS |
| `stepRuntimePreviewLoop` | `npc-designer.js` | 1501 | 1501 | PASS |
| `renderRuntimePreview` | `npc-designer.js` | 4014 | 4014 | PASS |
| `inferRuntimePartRole` | `npc-designer.js` | 2031 | 2031 | PASS |
| `buildLivePanicPreviewLayers` | `npc-designer.js` | 3769 | 3769 | PASS |
| `getPosePreviewLayers` | `npc-designer.js` | 3818 | 3818 | PASS |
| `buildLivePreviewPartBounds` | `npc-designer.js` | 3829 | 3829 | PASS |
| `resolveLivePanicShoulderBarY` | `npc-designer.js` | 3847 | 3847 | PASS |
| `getLivePanicArmMotion` | `npc-designer.js` | 3867 | 3867 | PASS |
| `drawLayerWithPreviewMotion` | `npc-designer.js` | 3889 | 3889 | PASS |
| `renderLivePanicPosePreview` | `npc-designer.js` | 3950 | 3950 | PASS |
| `renderPosePreview` | `npc-designer.js` | 3970 | 3970 | PASS |
| `mapLayerToRuntimePayloadLayer` | `npc-designer.js` | 4725 | 4725 | PASS |
| `buildRuntimePayloadPoses` | `npc-designer.js` | 4738 | 4738 | PASS |
| `buildDesignerRuntimePayload` | `npc-designer.js` | 4749 | 4749 | PASS |
| `getRuntimePreviewPayloadReadiness` | `npc-designer.js` | 4780 | 4780 | PASS |
| `createDefaultRuntimeProfile` | `npc-designer.js` | 1324 | 1324 | PASS |
| `normalizeRuntimeProfile` | `npc-designer.js` | 1349 | 1349 | PASS |
| `ensureRuntimeProfile` | `npc-designer.js` | 1376 | 1376 | PASS |
| `parseArgs` | `scripts/convert-npc-designer-json.js` | 12 | 12 | PASS |
| `normalizeInputDesignerDoc` | `scripts/convert-npc-designer-json.js` | 71 | 71 | PASS |
| `createPayload` | `scripts/convert-npc-designer-json.js` | 99 | 99 | PASS |

Anchor fidelity result: `ANCHOR_FIDELITY=PASS`, `MISMATCH_COUNT=0`.
