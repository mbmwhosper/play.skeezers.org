# S1/S2 Runtime-Editor Bridge (Read-Only)

## Scope
- Phase: read-only planning artifact for S1/S2 bridge implementation.
- Required reads completed:
  - `AGENTS.md`
  - `SCHEMATICS.md`
  - `docs/history/read-only/R0_RUNTIME_MOTION_SOURCE_MAP.md`
  - `docs/history/read-only/R1_EDITOR_INTEGRATION_SURFACES.md`
  - `docs/history/read-only/R2_PAYLOAD_SCHEMA_AND_MIGRATION_MAP.md`
  - `docs/history/read-only/RX_RUNTIME_EDITOR_UNIFICATION_READONLY.md`

## Exact Anchors

### Runtime shared motion helpers (`runtime/npc-render-shared.js`)
- `runtime/npc-render-shared.js:29` `createCharacterRenderer(runtime)`
- `runtime/npc-render-shared.js:244` `getLegacyAnimationState(opts)`
- `runtime/npc-render-shared.js:314` `inferDesignerLayerPart(layer)`
- `runtime/npc-render-shared.js:343` `getDesignerRigMotion(opts)`
- `runtime/npc-render-shared.js:357` `buildDesignerPartBounds(layers)`
- `runtime/npc-render-shared.js:382` `getDesignerLayerPivot(part, bounds, partBounds)`
- `runtime/npc-render-shared.js:413` `getDesignerLayerMotion(part, rig, bounds)`
- `runtime/npc-render-shared.js:437` `drawDesignerPayloadCharacter(x, y, w, h, opts)`
- `runtime/npc-render-shared.js:534` `drawCharacter(x, y, w, h, opts)`

### Live preview panic path (`npc-designer.js`)
- `npc-designer.js:3208` `requestRender()`
- `npc-designer.js:3219` `renderAll()`
- `npc-designer.js:3769` `buildLivePanicPreviewLayers(normalLayers, panicLayers)`
- `npc-designer.js:3818` `getPosePreviewLayers(poseId)`
- `npc-designer.js:3829` `buildLivePreviewPartBounds(layers)`
- `npc-designer.js:3847` `resolveLivePanicShoulderBarY(partBounds)`
- `npc-designer.js:3867` `getLivePanicArmMotion(layer, shoulderBarY)`
- `npc-designer.js:3889` `drawLayerWithPreviewMotion(ctx, layer, motion)`
- `npc-designer.js:3950` `renderLivePanicPosePreview(ctx, layers)`
- `npc-designer.js:3963` `renderPosePreviews()`
- `npc-designer.js:3970` `renderPosePreview(canvas, poseId)`

### Runtime parity preview path (`npc-designer.js`)
- `npc-designer.js:313` `initConstraintScaffold()`
- `npc-designer.js:331` `SHARED_RENDER.createCharacterRenderer(...)`
- `npc-designer.js:1480` `setRuntimePreviewLoopPlaying(shouldPlay)`
- `npc-designer.js:1501` `stepRuntimePreviewLoop(ts)`
- `npc-designer.js:3208` `requestRender()`
- `npc-designer.js:3219` `renderAll()`
- `npc-designer.js:4014` `renderRuntimePreview(validation)`
- `npc-designer.js:4749` `buildDesignerRuntimePayload(opts = {})`
- `npc-designer.js:4780` `getRuntimePreviewPayloadReadiness(payload, poseId)`

## Caller/Callee Maps

### 1) Runtime shared motion helpers
1. Entry: `drawCharacter(...)` (`runtime/npc-render-shared.js:534`)
2. Payload path first: `drawDesignerPayloadCharacter(...)` (`runtime/npc-render-shared.js:437`)
3. Payload motion source:
   - `getDesignerRigMotion(opts)` (`runtime/npc-render-shared.js:343`)
   - `getLegacyAnimationState(opts)` (`runtime/npc-render-shared.js:244`) inside rig derivation
4. Per-layer payload processing in draw loop:
   - `inferDesignerLayerPart(layer)` (`runtime/npc-render-shared.js:314`)
   - `buildDesignerPartBounds(layers)` (`runtime/npc-render-shared.js:357`)
   - `getDesignerLayerMotion(part, rig, bounds)` (`runtime/npc-render-shared.js:413`)
   - `getDesignerLayerPivot(part, bounds, partBounds)` (`runtime/npc-render-shared.js:382`)
5. Fallback legacy path:
   - `getLegacyAnimationState(opts)` drives legacy legs/arms/body/head.

### 2) Live preview panic path
1. UI changes trigger `requestRender()` (`npc-designer.js:3208`)
2. `renderAll()` (`npc-designer.js:3219`) calls `renderPosePreviews()` (`npc-designer.js:3963`)
3. Per preview canvas: `renderPosePreview(canvas, poseId)` (`npc-designer.js:3970`)
4. Panic-only branch:
   - `getPosePreviewLayers("panic")` (`npc-designer.js:3818`)
   - `buildLivePanicPreviewLayers(...)` (`npc-designer.js:3769`)
   - `renderLivePanicPosePreview(...)` (`npc-designer.js:3950`)
5. Local panic motion stack inside panic render:
   - `buildLivePreviewPartBounds(...)` (`npc-designer.js:3829`)
   - `resolveLivePanicShoulderBarY(...)` (`npc-designer.js:3847`)
   - `getLivePanicArmMotion(...)` (`npc-designer.js:3867`)
   - `drawLayerWithPreviewMotion(...)` (`npc-designer.js:3889`)

### 3) Runtime parity preview path
1. Runtime renderer bootstrap:
   - `initConstraintScaffold()` (`npc-designer.js:313`)
   - `createCharacterRenderer(...)` (`npc-designer.js:331`)
2. Loop/tick driver:
   - `setRuntimePreviewLoopPlaying(...)` (`npc-designer.js:1480`)
   - `stepRuntimePreviewLoop(...)` (`npc-designer.js:1501`)
3. Draw pipeline:
   - `requestRender()` -> `renderAll()` -> `renderRuntimePreview(validation)` (`npc-designer.js:3208`, `3219`, `4014`)
4. Payload-first parity draw:
   - `buildDesignerRuntimePayload(...)` (`npc-designer.js:4749`)
   - `getRuntimePreviewPayloadReadiness(...)` (`npc-designer.js:4780`)
   - `state.runtimeRenderer.drawCharacter(...)` payload mode first, legacy fallback second (`npc-designer.js:4095`, `4107`)

## Explicit In-Scope
- Helper extraction/export in `runtime/npc-render-shared.js` for designer consumption.
- `npc-designer.js` live-preview panic bridge to shared motion/pivot helpers.

## Explicit Out-of-Scope
- Payload schema changes.
- Converter changes.
- Teabag runtime gameplay behavior changes.
- Spawn/tuning changes.

## Invariants To Preserve
1. No gameplay constants/tuning changes.
2. No update/render order changes.
3. No spawn/combat/zone behavior changes.
4. Existing non-designer NPC rendering remains unchanged.
5. Shoulder controls (`panicArmSpread`, `panicShoulderOffsetY`) remain editor-only and not payload-exported.
