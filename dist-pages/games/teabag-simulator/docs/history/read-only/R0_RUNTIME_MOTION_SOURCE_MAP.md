# R0 Runtime Motion Source Map (Read-Only)

## Scope
- Phase: read-only discovery only (no gameplay/code edits in game/designer runtime paths).
- Required reads completed:
  - `AGENTS.md`
  - `SCHEMATICS.md`
  - `runtime/npc-render-shared.js`
  - `npc-designer.js`
  - `npc-designer.html`
- Additional runtime call-site reads (for exact game path mapping):
  - `teabag-simulator.html`

## 1) Panic Rendering Caller/Callee Map

### A. Game runtime panic path (authoritative in gameplay)
1. Panic state + motion source:
   - `updateNPCFSM(dt, p)` mutates NPC panic/flee state and advances `npc.walkPhase`:
     - panic: `teabag-simulator.html:3208`
     - fleeing: `teabag-simulator.html:3235`
2. Panic draw call (world NPCs):
   - `renderEntityLayer()` passes panic flags:
     - `isFleeing: npc.state === 'fleeing' || npc.state === 'panicking'`
     - `walkPhase: npc.walkPhase`
     - `teabag-simulator.html:3522`
3. Draw bridge:
   - `drawCharacter(...)` wrapper delegates to shared renderer:
     - wrapper: `teabag-simulator.html:2282`
     - shared call: `teabag-simulator.html:2289` and `teabag-simulator.html:2296`
4. Payload pose routing:
   - `resolveDesignerPayloadPose(opts)` maps panic via `isFleeing/state` -> `panic`
   - `teabag-simulator.html:2272`
5. Shared renderer branch:
   - entry: `runtime/npc-render-shared.js:534`
   - payload branch first: `drawDesignerPayloadCharacter(...)` at `runtime/npc-render-shared.js:437`
   - fallback legacy branch: `runtime/npc-render-shared.js:537`
6. Shared motion source used by both branches:
   - `getLegacyAnimationState(opts)` at `runtime/npc-render-shared.js:244`
   - payload rig derivation: `getDesignerRigMotion(opts)` at `runtime/npc-render-shared.js:343`

Bus-stop panic variant (same shared renderer, different source inputs):
- `drawBusStopNPCs(...)` sets `drawOpts.isFleeing = true` + `drawOpts.walkPhase = bNpc.panicPhase` when waving:
  - `teabag-simulator.html:1497`, `teabag-simulator.html:1511`

### B. Runtime-parity preview panic path (designer)
1. UI surface:
   - runtime parity panel/canvas controls: `npc-designer.html:303`
2. Shared renderer creation:
   - `initConstraintScaffold()` -> `NPCRenderShared.createCharacterRenderer(...)`
   - `npc-designer.js:313`, `npc-designer.js:331`
3. Render fan-out:
   - `requestRender()` -> `renderAll()` -> `renderRuntimePreview(validation)`
   - `npc-designer.js:3208`, `npc-designer.js:3219`, `npc-designer.js:4014`
4. Panic draw inputs:
   - `drawOpts` sets:
     - `walkPhase: tick`
     - `isFleeing: pose === "panic"`
     - `openMouth: pose === "panic"`
   - `npc-designer.js:4051`
5. Payload parity mode:
   - builds live payload: `buildDesignerRuntimePayload(...)` at `npc-designer.js:4749`
   - readiness gate: `getRuntimePreviewPayloadReadiness(...)` at `npc-designer.js:4780`
   - draw call with payload + pose:
     - `designerPayload: livePayload`
     - `designerPose: pose`
     - `npc-designer.js:4095`
6. Same shared callee chain as game runtime:
   - `runtime/npc-render-shared.js:534` -> payload branch (`:437`) or legacy fallback (`:537`) -> `getLegacyAnimationState` (`:244`)

### C. Live preview panic path (designer-only custom path)
1. UI surface:
   - live preview canvases + panic controls: `npc-designer.html:271`
2. Render fan-out:
   - `renderAll()` -> `renderPosePreviews()` -> `renderPosePreview(canvas, "panic")`
   - `npc-designer.js:3219`, `npc-designer.js:3963`, `npc-designer.js:3970`
3. Panic-only live pipeline:
   - face/body merge: `getPosePreviewLayers("panic")` + `buildLivePanicPreviewLayers(...)`
   - `npc-designer.js:3818`, `npc-designer.js:3769`
   - custom panic arm motion path: `renderLivePanicPosePreview(...)`
   - `npc-designer.js:3950`
4. Custom motion math (not from shared runtime API):
   - `buildLivePreviewPartBounds(...)` at `npc-designer.js:3829`
   - `resolveLivePanicShoulderBarY(...)` at `npc-designer.js:3847`
   - `getLivePanicArmMotion(...)` at `npc-designer.js:3867`
   - `drawLayerWithPreviewMotion(...)` at `npc-designer.js:3889`

## 2) Pivot + Motion Truth Table

| Surface | Left arm pivot | Right arm pivot | `flipY` application | `angle` application | `walkPhase` source/use | `isFleeing` source/use |
| --- | --- | --- | --- | --- | --- | --- |
| Shared payload motion (game + runtime-parity payload mode) | `x = bounds.x + bounds.w * 0.86`, `y = bounds.y + bounds.h * 0.12` (`runtime/npc-render-shared.js:386`) | `x = bounds.x + bounds.w * 0.14`, `y = bounds.y + bounds.h * 0.12` (`runtime/npc-render-shared.js:387`) | `getDesignerLayerMotion(part, rig, ...)` sets `flipY: rig.armsUp` for arms (`runtime/npc-render-shared.js:414`); applied in transform stack before rotate (`runtime/npc-render-shared.js:495`) | `angle = rig.armL/rig.armR` via `getDesignerLayerMotion` (`runtime/npc-render-shared.js:414`); applied with `ctx.rotate(angle)` (`runtime/npc-render-shared.js:496`) | `walkPhase` from opts -> `getLegacyAnimationState` (`runtime/npc-render-shared.js:246`); drives arm sine angles (`runtime/npc-render-shared.js:281`) | `isFleeing` from opts (`runtime/npc-render-shared.js:249`) -> `armsUp = isKO || isFleeing` (`runtime/npc-render-shared.js:279`) and mouth scale (`runtime/npc-render-shared.js:310`) |
| Shared legacy motion (game + runtime-parity fallback mode) | arm anchor translate `x = -1 * (bodyW/2 + armW*0.3)`, `y = bodyDrawY + 2` (`runtime/npc-render-shared.js:740-742`) | arm anchor translate `x = +1 * (bodyW/2 + armW*0.3)`, `y = bodyDrawY + 2` (`runtime/npc-render-shared.js:740-742`) | `if (armsUp) ctx.scale(1, -1)` (`runtime/npc-render-shared.js:742`) | `ctx.rotate(angle)` with `angle = legacyMotion.armLAngle/armRAngle` (`runtime/npc-render-shared.js:736`, `runtime/npc-render-shared.js:743`) | `walkPhase` from opts (`runtime/npc-render-shared.js:547`), produced by gameplay/designer tick; used in sine arm formulas in `getLegacyAnimationState` (`runtime/npc-render-shared.js:281`) | `isFleeing` from caller opts -> `armsUp` via `getLegacyAnimationState` (`runtime/npc-render-shared.js:249`, `runtime/npc-render-shared.js:279`) |
| Designer live preview panic (custom) | `pivotX = bounds.x + bounds.w * 0.86`, `pivotY = shoulderBarY` (`npc-designer.js:3881`, `npc-designer.js:3885`) | `pivotX = bounds.x + bounds.w * 0.14`, `pivotY = shoulderBarY` (`npc-designer.js:3883`, `npc-designer.js:3885`) | always `flipY: true` for panic arms (`npc-designer.js:3879`), applied before rotate (`npc-designer.js:3912`) | `angle = ±spreadRad` from slider (`npc-designer.js:3874`, `npc-designer.js:3880`), applied with `ctx.rotate(angle)` (`npc-designer.js:3913`) | not used in this path (no `walkPhase`-based arm swing in `renderLivePanicPosePreview`) | not used in this path; panic mode selected by `poseId === "panic"` (`npc-designer.js:4006`) |

Transform-order note:
- Shared payload and live preview both do: optional `dx/dy` translate -> pivot translate -> flip/rotate/scale -> untranslate (`runtime/npc-render-shared.js:491`, `npc-designer.js:3909`).

## 3) Duplication Map (npc-designer.js -> should move behind runtime APIs)

1. Part-role inference duplication:
- Designer: `inferRuntimePartRole(...)` (`npc-designer.js:2031`)
- Shared runtime equivalent: `inferDesignerLayerPart(...)` (`runtime/npc-render-shared.js:314`)

2. Part bounds map duplication:
- Designer: `buildLivePreviewPartBounds(...)` (`npc-designer.js:3829`)
- Shared runtime equivalent: `buildDesignerPartBounds(...)` (`runtime/npc-render-shared.js:357`)

3. Arm pivot constants duplicated outside runtime source:
- Designer live: `getLivePanicArmMotion(...)` hard-codes `0.86/0.14` x pivots (`npc-designer.js:3881`, `npc-designer.js:3883`)
- Shared runtime source: `getDesignerLayerPivot(...)` uses same constants (`runtime/npc-render-shared.js:386`, `runtime/npc-render-shared.js:387`)

4. Motion transform-stack duplication:
- Designer: `drawLayerWithPreviewMotion(...)` (`npc-designer.js:3889`)
- Shared runtime equivalent in payload draw loop: `drawDesignerPayloadCharacter(...)` transform section (`runtime/npc-render-shared.js:483`)

5. Motion signal derivation duplicated outside runtime helper:
- Designer parity preview builds `walkPhase/breathing/blinkTimer/isFleeing/openMouth/isKO` manually (`npc-designer.js:4065`)
- Shared runtime truth for behavior impact is `getLegacyAnimationState(...)` (`runtime/npc-render-shared.js:244`)

## 4) Proposed Runtime API Surface (for editor consumption)

Expose these from `createCharacterRenderer(runtime)` return object in `runtime/npc-render-shared.js`:

```js
{
  drawCharacter(x, y, w, h, opts),

  // Motion source-of-truth
  getLegacyAnimationState(opts),
  getDesignerRigMotion(opts),

  // Layer role/pivot source-of-truth
  inferDesignerLayerPart(layer),
  buildDesignerPartBounds(layers),
  getDesignerLayerPivot(part, bounds, partBounds),
  getDesignerLayerMotion(part, rig, bounds),

  // Shared transform application (same order as runtime payload render)
  applyDesignerLayerMotionTransform(ctx, bounds, motion, pivot)
}
```

Expected signatures:

```js
getLegacyAnimationState(opts: {
  walkPhase?: number,
  breathing?: number,
  isKO?: boolean,
  isFleeing?: boolean,
  isCrouching?: boolean,
  isMovingJump?: boolean,
  airState?: "rising" | "falling" | null,
  openMouth?: boolean
}): {
  walkPhase: number,
  breathOffset: number,
  legLAngle: number,
  legRAngle: number,
  armLAngle: number,
  armRAngle: number,
  armsUp: boolean,
  mouthOpenScale: number
}

getDesignerRigMotion(opts): {
  legL: number,
  legR: number,
  armL: number,
  armR: number,
  armsUp: boolean,
  bodyDy: number,
  headDy: number,
  mouthOpenScale: number
}

inferDesignerLayerPart(layer): string
buildDesignerPartBounds(layers): Record<string, {x:number,y:number,w:number,h:number}>
getDesignerLayerPivot(part, bounds, partBounds): {x:number,y:number}
getDesignerLayerMotion(part, rig, bounds): {
  dx?: number, dy?: number, angle?: number, flipY?: boolean,
  scaleX?: number, scaleY?: number, scalePivotY?: number
} | null

applyDesignerLayerMotionTransform(
  ctx: CanvasRenderingContext2D,
  bounds: {x:number,y:number,w:number,h:number},
  motion: object | null,
  pivot: {x:number,y:number}
): void
```

Why this surface:
- Lets live preview consume runtime motion and pivots directly.
- Keeps only intentional live-preview-only behavior local (panic shoulder-bar `pivotY` override slider).

## 5) Invariants (must not change in follow-up implementation)

1. No gameplay tuning changes:
- Do not alter spawn/combat/movement tuning constants in `teabag-simulator.html` (`TUNING` surface from `SCHEMATICS.md`).

2. No gameplay update/render order changes:
- Keep update order and render order exactly as documented in `SCHEMATICS.md` (Update Order + Render Order sections).
- Keep existing `drawCharacter(...)` runtime bridge entrypoint unchanged in call order (`teabag-simulator.html:2282`, `teabag-simulator.html:3481`).

3. No behavior drift in panic/KO gates:
- Preserve `armsUp = isKO || isFleeing` truth source (`runtime/npc-render-shared.js:279`).
- Preserve panic pose routing gate in runtime wrapper (`teabag-simulator.html:2272`).

## 6) Risks + Tight Follow-Up Slice Plan

### Risks
1. Behavior drift risk:
- Rewriting helpers without first exposing existing internals may change arm timing/pivots subtly.

2. Mixed-source risk:
- If live preview uses some shared helpers but keeps duplicated transform code, drift can reappear quickly.

3. Performance risk:
- Extra per-layer recomputation in live preview can regress editor responsiveness during drag operations.

4. Panic control conflict risk:
- Live-preview shoulder-bar override (`panicShoulderOffsetY`) may fight runtime pivot defaults if override precedence is unclear.

### Follow-up slices (implementation)
1. Slice R1: Export pure motion/pivot helpers from shared renderer.
- Add APIs listed in Section 4 with no behavior change.
- Keep `drawCharacter(...)` output byte-for-byte equivalent.

2. Slice R2: Refactor shared payload draw to internally call exported helper(s).
- Ensure one source for part-role inference, part bounds, pivot, and transform application.

3. Slice R3: Migrate live preview panic arm path to shared helpers.
- Replace local part inference/bounds/pivot constants/transform stack with runtime API calls.
- Keep only shoulder-bar `pivotY` override local and explicit.

4. Slice R4: Keep runtime-parity preview path unchanged except API adoption.
- Continue using `state.runtimeRenderer.drawCharacter(...)` payload mode as the parity reference.

5. Slice R5: Parity regression pass.
- Check panic arm orientation/swing across:
  - gameplay runtime NPCs,
  - runtime-parity preview (payload + fallback),
  - live preview panic pane.
- Verify no update/render order changes and no tuning-value edits.
