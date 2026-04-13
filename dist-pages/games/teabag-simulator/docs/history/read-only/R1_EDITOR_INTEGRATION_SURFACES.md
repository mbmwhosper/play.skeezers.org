# R1 Editor Integration Surfaces (Read-Only)

## Scope
- Branch base: `feat/live-designer-runtime-parity-preview`
- Phase: read-only discovery only (no gameplay/code edits)
- Required files reviewed: `AGENTS.md`, `SCHEMATICS.md`, `npc-designer.js`, `npc-designer.html`, `npc-designer.css`, `runtime/npc-render-shared.js`

## 1) UI-to-Render Caller Map

### A. `Panic Arm Spread`
- UI control: `#livePreviewPanicArmSpreadInput` in `npc-designer.html:289`
- UI cache binding: `cacheUI()` -> `ui.livePreviewPanicArmSpreadInput` in `npc-designer.js:283`
- Event handler: `bindRuntimePreviewEvents()` input listener in `npc-designer.js:498`
- State write: `state.livePreview.panicArmSpread` in `npc-designer.js:500`
- Render trigger: `requestRender()` in `npc-designer.js:506` -> `renderAll()` in `npc-designer.js:3219`
- Preview path:
  - `renderPosePreviews()` in `npc-designer.js:3963`
  - `renderPosePreview(..., "panic")` in `npc-designer.js:3970`
  - `renderLivePanicPosePreview()` in `npc-designer.js:3950`
  - `getLivePanicArmMotion()` in `npc-designer.js:3867` reads `state.livePreview.panicArmSpread` and computes arm angle
  - `drawLayerWithPreviewMotion()` in `npc-designer.js:3889`

### B. `Shoulder Bar Offset Y`
- UI control: `#livePreviewPanicShoulderOffsetInput` in `npc-designer.html:295`
- UI cache binding: `cacheUI()` -> `ui.livePreviewPanicShoulderOffsetInput` in `npc-designer.js:286`
- Event handler: `bindRuntimePreviewEvents()` input listener in `npc-designer.js:518`
- State write: `state.livePreview.panicShoulderOffsetY` in `npc-designer.js:520`
- Render trigger: `requestRender()` in `npc-designer.js:526` -> `renderAll()` in `npc-designer.js:3219`
- Preview path:
  - `renderLivePanicPosePreview()` in `npc-designer.js:3950`
  - `resolveLivePanicShoulderBarY()` in `npc-designer.js:3847` reads `state.livePreview.panicShoulderOffsetY`
  - Returned `shoulderBarY` feeds `getLivePanicArmMotion()` (`npc-designer.js:3867`)

### C. `Runtime-Parity Preview` controls
- UI block: `Runtime-Parity Preview` section in `npc-designer.html:303`
- Runtime renderer setup:
  - Shared script include: `npc-designer.html:340`
  - Renderer factory: `SHARED_RENDER.createCharacterRenderer(...)` in `npc-designer.js:331`
- Control wiring (`bindRuntimePreviewEvents()`):
  - Pose: `#runtimePreviewPoseSelect` (`npc-designer.html:306`) -> `state.runtimePreview.pose` (`npc-designer.js:458`)
  - Facing: `#runtimePreviewFacingSelect` (`npc-designer.html:313`) -> `state.runtimePreview.facing` (`npc-designer.js:466`)
  - Scale: `#runtimePreviewScaleInput` (`npc-designer.html:321`) -> `state.runtimePreview.scale` (`npc-designer.js:472`)
  - Tick: `#runtimePreviewTickInput` (`npc-designer.html:325`) -> `state.runtimePreview.tick` (`npc-designer.js:479`)
  - Loop toggle: `#runtimePreviewLoopToggleBtn` (`npc-designer.html:330`) -> `setRuntimePreviewLoopPlaying()` (`npc-designer.js:486`, `1480`) -> RAF driver `stepRuntimePreviewLoop()` (`npc-designer.js:1501`)
  - World context: `#runtimePreviewWorldToggle` (`npc-designer.html:332`) -> `state.runtimePreview.worldContext` (`npc-designer.js:492`)
- Render path:
  - `requestRender()` -> `renderAll()` -> `renderRuntimePreview(validation)` (`npc-designer.js:3231`, `4014`)
  - Runtime draw call: `state.runtimeRenderer.drawCharacter(...)` (`npc-designer.js:4095`)
  - Shared runtime entry: `drawCharacter(...)` in `runtime/npc-render-shared.js:534`
  - Payload branch gate: `drawDesignerPayloadCharacter(...)` in `runtime/npc-render-shared.js:437`

## 2) Data Contract Map (Editor-Only vs Payload/Runtime-Bound)

| Surface | Backing state | Saved in workspace snapshot | Exported in runtime payload | Runtime/game meaningful |
| --- | --- | --- | --- | --- |
| `Panic Arm Spread` (`#livePreviewPanicArmSpreadInput`) | `state.livePreview.panicArmSpread` (`npc-designer.js:500`) | No (`buildWorkspaceSnapshot()` does not include `livePreview`, `npc-designer.js:887`) | No (`buildDesignerRuntimePayload()`, `npc-designer.js:4749`) | No (designer-only panic mini-preview math) |
| `Shoulder Bar Offset Y` (`#livePreviewPanicShoulderOffsetInput`) | `state.livePreview.panicShoulderOffsetY` (`npc-designer.js:520`) | No | No | No (designer-only panic mini-preview math) |
| Runtime preview Pose/Facing/Scale/Tick/World | `state.runtimePreview.*` (`npc-designer.js:139`) | Yes (`runtimePreview` snapshot block at `npc-designer.js:905`) | No | Preview-only inputs to runtime renderer in editor |
| Runtime preview Loop on/off | `state.runtimePreview.isPlaying` (`npc-designer.js:1482`) | No (`normalizeRuntimePreviewState()` resets to false, `npc-designer.js:949`) | No | Editor preview loop only |
| Runtime Profile controls (baseType, npcType, scales, colors, dress flags) | `state.document.runtimeProfile` (`npc-designer.js:1376`, `573`, `585`, `598`) | Yes (inside `document`) | Yes when compact export includes runtime profile (`exportIntegrationPayload()` -> `includeRuntimeProfile`, `npc-designer.js:4811`) | Yes (used by runtime preview draw opts and payload metadata) |
| Pose layer geometry/style/partRole | `state.document.poses[pose].layers[]` (`npc-designer.js:1276`) | Yes | Yes (`buildRuntimePayloadPoses()` -> `mapLayerToRuntimePayloadLayer()`, `npc-designer.js:4738`) | Yes (shared renderer payload branch uses these layers) |

Notes:
- `partRole` is explicit when valid; otherwise inferred via `inferRuntimePartRole(...)` (`npc-designer.js:2031`, `4731`).
- `SCHEMATICS.md` confirms shared runtime renderer owns payload + legacy branches and the runtime preview loop/tick parity surface (`SCHEMATICS.md:39`, `SCHEMATICS.md:52`).

## 3) Face Exception Map (Normal -> Panic)

Current exception lives in live panic mini-preview only:
- Exception entrypoint: `getPosePreviewLayers("panic")` in `npc-designer.js:3818`
- Merge helper: `buildLivePanicPreviewLayers(normalLayers, panicLayers)` in `npc-designer.js:3769`

### Panic-derived layers (replace/add)
- Layer qualification: `isLivePreviewFaceLayer(layer)` (`npc-designer.js:3765`) where inferred part role is in `LIVE_PREVIEW_FACE_PARTS` (`npc-designer.js:60`)
- Exact panic face part roles:
  - `face`
  - `eye`
  - `brow`
  - `mouth`
- Selection behavior:
  - Prefer same-name replacement from panic (`panicFaceByName`) (`npc-designer.js:3770`, `3792`)
  - Otherwise first unused panic face layer (`npc-designer.js:3798`)
  - Any remaining panic face layers appended (`npc-designer.js:3811`)

### Normal-derived layers
- All normal layers whose part role is **not** in `face|eye|brow|mouth` remain from normal (`npc-designer.js:3785`)
- This includes roles inferred as: `torso`, `head`, `hair`, `left_arm`, `right_arm`, `left_leg`, `right_leg`, `left_shoe`, `right_shoe`, `other` (via `inferRuntimePartRole()`, `npc-designer.js:2031`)

### Fallback behavior inside exception helper
- If panic has no face layers, helper returns pure normal layer set (`npc-designer.js:3780`)
- If normal is empty, panic layers are returned directly (`npc-designer.js:3824`)

## 4) Runtime-Bridge Proposal (for implementation phase)

### Remove/retire local panic motion math surfaces
Target local-only motion block in `npc-designer.js`:
- `buildLivePreviewPartBounds()` (`3829`)
- `resolveLivePanicShoulderBarY()` (`3847`)
- `getLivePanicArmMotion()` (`3867`)
- `drawLayerWithPreviewMotion()` (`3889`)
- `renderLivePanicPosePreview()` (`3950`)
- Panic branch in `renderPosePreview()` (`4006`)

### Keep and reuse face-exception compositor
- Keep `buildLivePanicPreviewLayers()` + `getPosePreviewLayers("panic")` as the source of truth for the normal->panic face exception.
- Convert merged panic layers through `mapLayerToRuntimePayloadLayer()` (`npc-designer.js:4725`) so runtime payload roles remain explicit/normalized.

### Bridge live panic preview to shared runtime helpers
1. Build a synthetic payload for panic mini-preview from current document:
   - Start from `buildDesignerRuntimePayload({ cloneLayerData: false })` (`npc-designer.js:4749`)
   - Override panic pose layers with face-exception merged list (normal body + panic face)
2. Draw panic mini-preview via shared renderer instead of local transform math:
   - Use `createCharacterRenderer(...)` from `runtime/npc-render-shared.js:29`
   - Call `drawCharacter(..., { designerPayload, designerPose: "panic", isFleeing: true, openMouth: true, isKO: false, walkPhase: <tick> })`
3. Keep runtime parity behavior tied to the same motion engine:
   - Shared motion path: `getDesignerRigMotion()` -> `getLegacyAnimationState()` (`runtime/npc-render-shared.js:343`, `244`)

### Renderer context integration point
- `state.runtimeRenderer` is currently bound to `ui.runtimePreviewCtx` only (`npc-designer.js:332`).
- Implementation bridge needs either:
  - a per-canvas renderer cache (`previewNormal/previewPanic/previewKo` contexts), or
  - a small helper to create/use renderer instances per target canvas.

### Control behavior after bridge
- `Panic Arm Spread` + `Shoulder Bar Offset Y` should become fallback-only controls (used only when runtime bridge unavailable), or be explicitly disabled when runtime-driven panic is active.

## 5) Acceptance Gates for Implementation

### A. Panic parity expectations
- With shared renderer available and panic payload usable, panic mini-preview motion must come from runtime shared motion (not local panic math).
- Panic mini-preview should match runtime-parity preview motion characteristics for equivalent tick/facing inputs:
  - arm inversion/rotation
  - leg + shoe pivot coupling
  - body/head breathing offset
  - panic mouth-open scaling
- Normal->panic face exception remains intact: panic face roles (`face|eye|brow|mouth`) come from panic, non-face roles come from normal.

### B. Fallback behavior expectations
- If runtime renderer is unavailable (`state.runtimeRenderer == null`) or payload fails readiness (`getRuntimePreviewPayloadReadiness()`), panic mini-preview must fall back safely (no crash, visible preview).
- Fallback should preserve current emergency editing affordance (panic controls still influence the fallback path if controls remain visible).

### C. “Non-panic previews unchanged” gate
- `normal` and `ko` mini-previews must remain behaviorally unchanged unless explicitly scoped later.
- No regressions to layer ordering, visibility filtering, or selection/readiness rendering side effects from the panic bridge change.
