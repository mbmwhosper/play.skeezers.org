# NPC Live->Runtime Parity Read-Only Discovery

## Scope + Constraints
- Phase: read-only discovery only (no gameplay/tuning/combat/spawn/zone edits).
- Required sources reviewed:
  - `SCHEMATICS.md`
  - `README.md`
  - `npc-designer.html`
  - `npc-designer.js`
  - `npc-designer.css`
  - `npc-designer-constraints.js`
  - `runtime/npc-render-shared.js`
  - `teabag-simulator.html` (renderer bridge/payload path)
  - `scripts/convert-npc-designer-json.js`
  - `data/npc_payloads/index.json`

## 1. Current Flow Map

### A) Live Preview path (designer layers)
1. UI surfaces:
   - Editor canvas + tools + layer controls in `npc-designer.html:121`, `npc-designer.html:166`, `npc-designer.html:197`, `npc-designer.html:234`.
2. Event bindings:
   - Central binding in `bindUI()` at `npc-designer.js:443`.
   - Canvas interaction handlers at `npc-designer.js:1559`, `npc-designer.js:1667`, `npc-designer.js:1719`.
3. Redraw scheduler:
   - `requestRender()` at `npc-designer.js:2334` (RAF-coalesced).
4. Frame render fan-out:
   - `renderAll()` at `npc-designer.js:2345`.
   - Live editor canvas path: `renderEditorCanvas()` at `npc-designer.js:2513` -> `getLayers()` at `npc-designer.js:2313` -> `drawLayer()` at `npc-designer.js:2676`.
   - Pose mini-preview path: `renderPosePreviews()` at `npc-designer.js:2887` -> `renderPosePreview()` at `npc-designer.js:2894` -> `drawLayer()` at `npc-designer.js:2676`.

### B) Runtime-Parity Preview path (current)
1. UI surfaces:
   - Runtime preview controls/canvas in `npc-designer.html:253`, `npc-designer.html:280`, `npc-designer.html:281`.
2. Event bindings:
   - `bindRuntimePreviewEvents()` at `npc-designer.js:377` -> updates `state.runtimePreview.*` and calls `requestRender()` (`npc-designer.js:382`, `npc-designer.js:387`, `npc-designer.js:393`, `npc-designer.js:399`, `npc-designer.js:404`).
3. Renderer creation:
   - `initConstraintScaffold()` at `npc-designer.js:235` creates runtime renderer via `NPCRenderShared.createCharacterRenderer(...)` at `npc-designer.js:254`.
4. Draw path:
   - `renderAll()` -> `renderRuntimePreview(validation)` at `npc-designer.js:2934`.
   - Runtime draw call: `state.runtimeRenderer.drawCharacter(...)` at `npc-designer.js:2996` with `drawOpts` built from `runtimeProfile` (`npc-designer.js:2971`).
   - Shared renderer entry: `drawCharacter()` at `runtime/npc-render-shared.js:314`.

## 2. Gap Analysis (why systems are parallel, not connected)
1. Runtime preview currently does not pass layer payload:
   - `renderRuntimePreview()` supplies runtime-profile opts only (`npc-designer.js:2971`).
   - No `designerPayload` or `designerPose` keys are provided to shared renderer.
2. Shared renderer payload branch is gated on `opts.designerPayload`:
   - `drawDesignerPayloadCharacter(...)` gate at `runtime/npc-render-shared.js:244` and branch call at `runtime/npc-render-shared.js:316`.
   - Without `designerPayload`, it falls back to legacy procedural body/face path (`runtime/npc-render-shared.js:317` onward).
3. Live layer edits are rendered by designer-local `drawLayer()`, not runtime payload path:
   - Designer live path uses `npc-designer.js:2676`; runtime payload path is unused in runtime preview.
4. Payload normalization/registry path exists in game runtime only:
   - `teabag-simulator.html:2162` (`normalizeDesignerPayload`), `teabag-simulator.html:2225` (`loadDesignerPayloadRegistry`), `teabag-simulator.html:2282` (`drawCharacter` wrapper).
   - Designer preview bypasses this bridge entirely.

## 3. Caller/Callee Map With Anchors

### Designer app flow edges
- Boot: `npc-designer.js:3842` (`DOMContentLoaded`) -> `npc-designer.js:105` (`initDesigner`).
- Init: `npc-designer.js:105` (`initDesigner`) -> `npc-designer.js:118` (`cacheUI`), `npc-designer.js:235` (`initConstraintScaffold`), `npc-designer.js:443` (`bindUI`), `npc-designer.js:660` (`loadInitialDocument`), `npc-designer.js:2334` (`requestRender`).
- Runtime preview controls: `npc-designer.js:377` (`bindRuntimePreviewEvents`) -> `npc-designer.js:2334` (`requestRender`).
- Runtime profile controls: `npc-designer.js:294` (`bindRuntimeProfileEvents`) -> `npc-designer.js:408`/`420`/`433` -> `npc-designer.js:2334`.
- Canvas edit flow: `npc-designer.js:1559`/`1667`/`1719` -> geometry/style mutations -> `npc-designer.js:2334`.
- Render scheduler: `npc-designer.js:2334` -> `npc-designer.js:2345`.
- Render fan-out: `npc-designer.js:2345` -> `npc-designer.js:2513`, `npc-designer.js:2887`, `npc-designer.js:2934`.
- Live draw: `npc-designer.js:2513` -> `npc-designer.js:2313` -> `npc-designer.js:2676`.
- Runtime preview draw: `npc-designer.js:2934` -> `npc-designer.js:2996` (`state.runtimeRenderer.drawCharacter`).

### Shared runtime renderer edges
- Factory: `runtime/npc-render-shared.js:29` (`createCharacterRenderer`) returns `drawCharacter`.
- Branch point: `runtime/npc-render-shared.js:314` (`drawCharacter`) -> `runtime/npc-render-shared.js:244` (`drawDesignerPayloadCharacter`) if `opts.designerPayload`.
- Payload path internals: `runtime/npc-render-shared.js:244` -> `runtime/npc-render-shared.js:45` (`getPoseLayers`) -> per-layer path/paint helpers (`runtime/npc-render-shared.js:58`, `runtime/npc-render-shared.js:221`).
- Legacy fallback path: `runtime/npc-render-shared.js:317` onward (procedural torso/legs/hair/face).

### Game runtime bridge edges (for parity reference)
- Registry boot: `teabag-simulator.html:4256` -> `teabag-simulator.html:2225` (`loadDesignerPayloadRegistry`).
- Index + payload normalize: `teabag-simulator.html:2234` -> `teabag-simulator.html:2204`; `teabag-simulator.html:2243` -> `teabag-simulator.html:2162`.
- Draw wrapper: `teabag-simulator.html:2282` -> `teabag-simulator.html:2267` (`resolveDesignerPayloadById`) and `teabag-simulator.html:2272` (`resolveDesignerPayloadPose`) -> shared renderer.
- Runtime callers that pass payload ids:
  - Bus stop draw opts include `designerPayloadId` at `teabag-simulator.html:1505`.
  - NPC opts projection includes `designerPayloadId` at `teabag-simulator.html:2547`.

## 4. Data Contract Mapping (field-by-field)

### A) Designer document -> compact payload (`npc-designer.js:3607`)
| Designer source | Compact payload field | Notes |
| --- | --- | --- |
| `meta.id` (`npc-designer.js:676`) | `id` (`npc-designer.js:3618`) | Runtime lookup key candidate. |
| `meta.label` (`npc-designer.js:677`) | `label` (`npc-designer.js:3619`) | Display metadata only. |
| `meta.baseTemplate` (`npc-designer.js:678`) | `baseTemplate` (`npc-designer.js:3620`) | Metadata only in renderer path. |
| `runtimeProfile.*` (`npc-designer.js:790`) | `runtimeProfile` (`npc-designer.js:3621`) | Used by preview legacy opts; not consumed by payload-layer branch directly. |
| constants (`GAME_BASE_W/H`, `GAME_TO_EDITOR_SCALE`) at `npc-designer.js:11`-`13` | `bounds.w/h/editorScale` (`npc-designer.js:3622`) | Required by payload renderer scaling. |
| `poses[pose].layers[]` (`npc-designer.js:2313`) | `poses[pose][]` (`npc-designer.js:3644`) | Layer array carries geometry/style. |
| `layer.id/name/type/visible/geometry/style` | same fields in payload layer (`npc-designer.js:3645`-`3650`) | `locked`/`transform` intentionally omitted. |

### B) Converter script output contract (`scripts/convert-npc-designer-json.js`)
| Script source | Script output | Notes |
| --- | --- | --- |
| normalized input doc (`scripts/convert-npc-designer-json.js:71`) | payload root (`scripts/convert-npc-designer-json.js:99`) | Includes `runtimeProfile`, `bounds`, `metadata.validation`, `poses`. |
| doc layers | `payload.poses[pose][]` (`scripts/convert-npc-designer-json.js:128`) | Shape-compatible with designer compact export. |
| hard failures | exit code `2` (`scripts/convert-npc-designer-json.js:160`) | Conversion blocked. |

### C) Runtime payload normalize (game path)
| Raw payload/index input | Normalized runtime field | Consumed at |
| --- | --- | --- |
| `rawPayload.id` or `rawPayload.meta.id` or `entry.id` | `id` (`teabag-simulator.html:2189`) | registry map key (`teabag-simulator.html:2248`). |
| `rawPayload.label` or `rawPayload.meta.label` | `label` (`teabag-simulator.html:2190`) | metadata only. |
| `rawPayload.bounds.*` | `bounds.w/h/editorScale` (`teabag-simulator.html:2191`) | payload scaling in shared renderer (`runtime/npc-render-shared.js:253`). |
| `rawPayload.origin.*` OR `metadata.origin.*` OR index defaults | `origin.centerX/baselineY` (`teabag-simulator.html:2196`) | alignment in shared renderer (`runtime/npc-render-shared.js:257`). |
| `rawPayload.poses[pose]` arrays/objects | `poses[pose]` normalized via `normalizeDesignerLayer` (`teabag-simulator.html:2173`, `teabag-simulator.html:2127`) | layer render loop (`runtime/npc-render-shared.js:276`). |

### D) Runtime renderer input mapping (current preview path)
| Runtime profile field | Draw option field | Consumed by shared renderer |
| --- | --- | --- |
| `runtimeProfile.npcType/baseType` | `opts.npcType` (`npc-designer.js:2973`) | `CHAR_BY_NAME` lookup (`runtime/npc-render-shared.js:329`). |
| `color/skinColor/hairColor/hairStyle/eyeColor/legColor/shoeColor` | same-named opts (`npc-designer.js:2974`-`2980`) | procedural branch values (`runtime/npc-render-shared.js:318` onward). |
| feminine/dress fields | `opts.feminineBody/bustScale/hasDress/shortDress` (`npc-designer.js:2981`-`2984`) | body/leg logic. |
| preview pose/tick | `isFleeing/openMouth/isKO/walkPhase/breathing/...` (`npc-designer.js:2985`-`2993`) | expression/animation toggles. |

## 5. Integration Point Candidates

### Option A (Recommended): In-memory live payload bridge in `renderRuntimePreview`
- Insert point A1: `npc-designer.js:2934` (`renderRuntimePreview`) before draw call.
- Insert point A2: payload-building helper near `exportIntegrationPayload()` (`npc-designer.js:3607`) to avoid duplicated schema logic.
- Flow:
  1. Build/normalize live payload from `state.document.poses` + `bounds` + `origin`.
  2. Pass `designerPayload` and `designerPose` (`state.runtimePreview.pose`) into `drawOpts`.
  3. Keep existing runtime-profile opts as fallback if payload build fails.
- Why recommended: gives true WYSIWYG parity because runtime preview uses same branch the game uses when payload is present (`runtime/npc-render-shared.js:316`).

### Option B (Fallback): Cached conversion pipeline + explicit refresh gate
- Insert point B1: call compact payload builder (`npc-designer.js:3607`) and cache last-good payload.
- Insert point B2: runtime preview consumes cached payload; conversion runs on debounced edit or explicit refresh action.
- Tradeoff: safer CPU profile on large layer sets but not strict per-edit real-time unless debounce is very short.

## 6. Refresh Strategy

### What triggers redraw today
- Any control/path that calls `requestRender()` (`npc-designer.js:2334`), including:
  - runtime profile input/toggles (`npc-designer.js:294`-`340`),
  - runtime preview controls (`npc-designer.js:377`-`405`),
  - layer/canvas editing (`npc-designer.js:1559`-`1731`),
  - import/reset/pose ops and many toolbar actions (`npc-designer.js:452` onward),
  - resize (`npc-designer.js:640`).
- `requestRender()` is already RAF-coalesced (`npc-designer.js:2337`).

### What must trigger after integration
- Same `requestRender()` triggers should continue to drive runtime preview.
- If payload caching is added, payload cache invalidation must happen on any doc mutation before/with `requestRender()`.

### Manual "Refresh Runtime Preview" needed?
- Recommended path: **No**. Existing redraw infrastructure is already event-driven + coalesced.
- Fallback path (Option B): optional manual refresh can be added only as a performance safety valve.

## 7. Face Editing Surface Map

### Where face is currently edited
1. Runtime color field only:
   - `Eye Color` control in `npc-designer.html:104` -> state update at `npc-designer.js:426` -> runtime draw option at `npc-designer.js:2978`.
2. Pose-driven expression toggles:
   - `pose` selection in runtime preview (`npc-designer.html:256`) drives `isFleeing/openMouth/isKO` (`npc-designer.js:2988`-`2993`).
3. Procedural runtime face implementation:
   - Eyes/brows/mouth are hard-coded in `runtime/npc-render-shared.js:720`-`773` and `runtime/npc-render-shared.js:756`.
4. Layer authoring has no dedicated face section:
   - Base template creation includes head/hair/torso/limbs, no explicit eye/mouth layers (`npc-designer.js:934`-`1026`, `npc-designer.js:1044`-`1107`).

### If product wants dedicated face controls
- UI hook location: add a dedicated Face block near runtime profile in `npc-designer.html` adjacent to `npc-designer.html:72`.
- State/event hook location: `cacheUI()` (`npc-designer.js:118`) + `bindRuntimeProfileEvents()` (`npc-designer.js:294`) or separate face-event binder.
- Render hook recommendation: controls should influence payload-layer output (recommended) so runtime preview parity remains true; not just legacy procedural opts.

## 8. Failure/Fallback Behavior (mid-edit)
- Validation always runs during `renderAll()` (`npc-designer.js:2346`) via constraints engine.
- Hard blockers:
  - compact export disabled (`npc-designer.js:2446`) and `exportIntegrationPayload()` returns `null` (`npc-designer.js:3611`), but previews still render.
- Constraint engine missing:
  - synthetic hard blocker is injected (`npc-designer.js:2365`-`2388`).
- Runtime preview renderer missing:
  - status text reports unavailable renderer (`npc-designer.js:2952`-`2954`).
- Shared payload draw resilience:
  - malformed layers are skipped per-layer (`runtime/npc-render-shared.js:303`-`305`).
  - if payload draw cannot draw anything, legacy fallback path runs (`runtime/npc-render-shared.js:316`-`317`).
- Game runtime payload load failures:
  - payload/index fetch failures log warnings and fallback to legacy rendering (`teabag-simulator.html:2251`, `teabag-simulator.html:2260`).

## 9. Performance Risks
1. Per-edit conversion overhead:
   - Converting full document/layer trees every redraw can be expensive during drag operations.
2. Duplicate validation risk:
   - `renderAll()` already validates (`npc-designer.js:2346`); re-validating inside a payload builder each redraw would duplicate work.
3. Layer-render cost in payload branch:
   - payload branch computes paths/bounds/gradients per layer (`runtime/npc-render-shared.js:58`, `runtime/npc-render-shared.js:169`, `runtime/npc-render-shared.js:221`, `runtime/npc-render-shared.js:276`).
4. Mitigations:
   - reuse single validation result per frame,
   - cache last payload and rebuild only when document changes,
   - keep RAF coalescing (`npc-designer.js:2337`) as the refresh governor.

## 10. Implementation Slice Proposal (No Code)

### In-scope
- Wire designer in-memory layers to runtime preview payload branch in real time.
- Keep existing gameplay/runtime file loading behavior unchanged.
- Keep tuning/spawn/combat/zone untouched.

### Out-of-scope
- NPC spawn tables/combat behavior/zone systems in `teabag-simulator.html`.
- Service worker/cache/manifest behavior.
- New gameplay mechanics.

### Mechanical slices (ordered)
1. Slice S1: Contract unification helper
   - Define single payload-shape builder in designer code, adjacent to current export helper (`npc-designer.js:3607`).
   - Risk: schema drift between export/runtime paths.
   - Validation gate: verify payload has `poses`, `bounds`, `origin`, and layer type/style fields expected by `runtime/npc-render-shared.js:244`.
2. Slice S2: Runtime preview bridge
   - At `npc-designer.js:2934`, feed `designerPayload` + `designerPose` into runtime draw call.
   - Preserve legacy drawOpts fallback if payload build fails.
   - Risk: blank preview when payload malformed.
   - Validation gate: intentionally break one layer and confirm fallback/partial render behavior remains non-crashing.
3. Slice S3: Refresh/invalidation policy
   - Tie payload cache invalidation to document mutation points that already call `requestRender()`.
   - Risk: stale runtime preview if invalidation misses a mutation path.
   - Validation gate: move/resize/recolor/import/reset pose and confirm runtime preview updates immediately each time.
4. Slice S4: Face controls alignment (optional but likely requested)
   - Add dedicated face controls and bind them to parity path (payload layer edits and/or runtimeProfile only where intentional).
   - Risk: dual-source-of-truth between procedural face and layer face.
   - Validation gate: confirm expected face controls affect runtime preview and exported payload consistently.
5. Slice S5: Regression + parity checklist
   - Validate live preview and runtime preview remain synchronized for `normal/panic/ko`, both facings, multiple scales.
   - Validate export still blocks on hard failures and warnings behavior unchanged.

## Direct Answers (Requested)
- How do we get real-time WYSIWYG parity?
  - Route runtime preview through shared renderer payload branch by passing **live in-memory payload + selected pose** from `renderRuntimePreview()` (`npc-designer.js:2934`) into `drawCharacter` payload opts (`runtime/npc-render-shared.js:316`).
- Where do we force refresh?
  - Keep `requestRender()` (`npc-designer.js:2334`) as the single refresh gate; ensure payload cache invalidation happens at the same mutation points that already call it.
- Where is face editing now, and where should it hook?
  - Now: runtime eye color + pose flags + procedural face logic (`npc-designer.html:104`, `npc-designer.js:2978`, `runtime/npc-render-shared.js:720`).
  - Hook target: dedicated Face controls in designer UI/state that feed payload-layer parity path (recommended) so runtime preview and exported payload stay aligned.

