# Teabag Simulator Schematics Map

Line-anchored reference for `teabag-simulator.html` so edits can target the right mechanic quickly.

## Section Map (By Line Range)

| Area | Lines |
| --- | --- |
| SFX Engine | 26-306 |
| Resolution / canvas setup | 307-353 |
| Core constants + tuning surface | 354-534 |
| Zones + biome data | 535-630 |
| Zone runtime state + persistence | 631-697 |
| Zone blending | 698-709 |
| Character definitions (all NPC archetypes) | 710-1003 |
| Day/night system | 1004-1061 |
| Keyboard input | 1062-1102 |
| Mobile touch input | 1103-1227 |
| Mobile sidebars render | 1228-1291 |
| Particles / popups / shake / camera | 1292-1596 |
| Platform + bus stop generation | 1597-1791 |
| City/building/prop generation + draw | 1792-2257 |
| Cars | 2258-2368 |
| Character renderer + payload registry bridge | 2369-2575 |
| Character gallery mode | 2576-2798 |
| Player model | 2799-2812 |
| NPC model + spawning | 2813-2888 |
| Score + KO tracking | 2889-2908 |
| Global game state + GameContext scaffold | 2909-2995 |
| Update pipeline (menu/pause/gameplay/world) | 2996-3683 |
| Render pipeline (front screens + world layers + HUD) | 3684-4128 |
| Parallax silhouettes | 4129-4225 |
| Clouds / birds | 4226-4274 |
| Title / mode / zone picker / pause menus | 4275-4576 |
| Main loop + frame reset + boot | 4577-4606 |

## Recent Integration Notes (2026-03-10)

- Payload registry fix: `loadDesignerPayloadRegistry()` now resolves runtime payload filenames relative to `DESIGNER_PAYLOAD_INDEX_PATH`, preventing sample payload 404s when `data/npc_payloads/index.json` stores bare filenames.
  - Runtime payload anchors: `teabag-simulator.html:2420` (`DESIGNER_PAYLOAD_INDEX_PATH`), `teabag-simulator.html:2541` (`loadDesignerPayloadRegistry()`), `teabag-simulator.html:4646` (boot-time `loadDesignerPayloadRegistry()` call).
- Gallery-mode simulation guard: `galleryMode` remains a render-only preview toggle, but `update(gameCtx, dt)` now short-circuits while the gallery is open so hidden menu/gameplay state does not advance under the overlay.
  - Anchors: `teabag-simulator.html:2625` (`galleryMode`), `teabag-simulator.html:3727` (`update(gameCtx, dt)`), `teabag-simulator.html:3735` (`renderFrontScreen(gameCtx)`).
- Mobile crouch fix: crouch now derives from held gameplay touch buttons inside `crouchDown()` rather than a latched `touch.crouch` flag, so pause/resume transitions cannot leave mobile crouch stuck on release.
  - Anchors: `teabag-simulator.html:1103` (`crouchDown()`), `teabag-simulator.html:1193` (`applyTouch(btn, down)`).
- Spawn-pressure fix: `updateNPCSpawning(p)` now uses active walking/panicking NPC counts for both nearby-fill and sprint-ahead spawn gates, so KO/fleeing leftovers do not block replenishment.
  - Anchor: `teabag-simulator.html:3591` (`updateNPCSpawning(p)`).
- Offline startup cache broadened: `sw.js` bumped `CACHE_NAME` to `teabag-sim-v6` and now precaches `sfx/sounds.js` plus first-load sprite assets (`sprites/mchat.png`, `sprites/busstop.png`) alongside the runtime payload registry files.
  - Anchor: `sw.js:1-16`.
- Sound-designer export fix: `Copy JS` now serializes a fully materialized `SOUND_DEFS` object through `buildExportableSoundDefs()` so untouched slots are not dropped from generated runtime JS.
  - Anchors: `sound-designer.html:256` (`getSound(id)`), `sound-designer.html:1289` (`buildExportableSoundDefs()`), `sound-designer.html:1298` (`copyJS()`).
- NPC designer parity fix: `npc-designer-constraints.js` now restores the shipped runtime archetypes `shopaholic`, `influencer`, `jogger`, `dog_walker`, and `club_dude` to `RUNTIME_BASE_DEFS` so parity preview matches the live zone pools again.
  - Anchors: `npc-designer-constraints.js:241-312`.

## Recent Integration Notes (2026-02-22)

- GSAP is now vendored locally and loaded from `teabag-simulator.html:23` (`<script src="vendor/gsap.min.js"></script>`).
- Sprint camera tightening now uses GSAP tweening across lead/follow plus a sprint lens pass (subtle zoom-in + forward look-ahead).
  - World camera tuning anchors: `teabag-simulator.html:448-475` (`cameraLeadFactor`, `cameraZoom`, `cameraForwardLookAhead`, sprint lens knobs, airborne sprint-jump tween-in, handheld drift controls, bus-stop decorative readability knobs).
  - Runtime camera anchors: `teabag-simulator.html:1531` (`cam`), `teabag-simulator.html:1545` (`setSprintCameraTightening(...)`), `teabag-simulator.html:3553` (sprint gate hook in `updateWorldState`), `teabag-simulator.html:4044` (screen shake translate), `teabag-simulator.html:4051` (world-only handheld translate), `teabag-simulator.html:4052` (zoom transform in `render(...)`).
- Sprint lens tuning pass: reduced zoom intensity (`cameraSprintZoom` `1.06 -> 1.03`) and slowed lens transition speed (`cameraSprintTweenIn` `0.16 -> 0.32`, `cameraSprintTweenOut` `0.24 -> 0.48`) for a calmer sprint feel.
- Sprint-jump carry tweak: lens now stays engaged during sprint jumps while sprint input is still held; airborne re-engage uses `cameraSprintAirTweenIn` and releasing D-pad/direction drops lens back to base.
- Handheld camera drift: subtle low-frequency micro-motion now layers over base screen shake, with motion amplitude reacting to player speed/sprint to keep the frame alive without high distraction.
- Pixel-visibility tuning: handheld drift amplitudes were raised and quantized via `cameraHandheldPixelSnap` so motion remains visible under pixelated canvas rendering.
- Matter.js VFX spike now layers cosmetic rigid-body debris over the existing particle system.
- Runtime include anchor: `teabag-simulator.html:24` (`<script src="https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js"></script>`).
- VFX tuning anchor: `teabag-simulator.html:512` (`TUNING.vfx`).
- Matter runtime anchors:
  - `teabag-simulator.html:1306` (`getMatterFloorCenterY(fx)`)
  - `teabag-simulator.html:1310` (`syncMatterSurfaceColliders(leftBound, rightBound)`)
  - `teabag-simulator.html:1347` (`initMatterFX()`)
  - `teabag-simulator.html:1373` (`clearMatterFX()`)
  - `teabag-simulator.html:1382` (`spawnMatterDebris(...)`)
  - `teabag-simulator.html:1440` (`updateMatterFX(dt)`)
  - `teabag-simulator.html:1463` (`drawMatterFX()`)
  - `teabag-simulator.html:3063` (run reset call to `clearMatterFX()`)
  - `teabag-simulator.html:3709` (update hook `updateMatterFX(dt)`)
  - `teabag-simulator.html:3935` (render hook `drawMatterFX()`)
  - `teabag-simulator.html:4644` (boot-time `initMatterFX()` call)
- VFX fallback behavior: if Matter.js fails to load, runtime continues with legacy particles only.
- Offline cache path: `sw.js` now precaches `vendor/gsap.min.js`; current cache manifest version is `teabag-sim-v6`.
- Bus-stop decorative readability pass:
  - Decorative bus-stop NPCs now render 10% smaller and lifted to the sidewalk boundary via `TUNING.world.busStopDecorScale` + `busStopDecorLiftY` (`teabag-simulator.html:472-473`).
  - Passive color grading is applied through `blendHexColor(...)` (`teabag-simulator.html:1019`) inside `drawBusStopNPCs(...)` (`teabag-simulator.html:1750`), with palette knobs in `TUNING.world` (`teabag-simulator.html:474-476`).
  - Layering pass: shelter base renders in `drawBusStopStructure(...)` (`teabag-simulator.html:1713`), NPCs draw next, and foreground glass overlays in `drawBusStopFrontGlass(...)` (`teabag-simulator.html:1733`) from `renderEntityLayer` (`teabag-simulator.html:3803`).
- Matter debris readability retune:
  - Debris initial launch velocity is now globally throttled to 5% via `matterVelocityScale` in `TUNING.vfx` (`teabag-simulator.html:528`).
  - Velocity scaling is applied only at spawn in `spawnMatterDebris(...)` (`teabag-simulator.html:1382-1419`); dust/impact lifetime and size ranges remain at their base values (`teabag-simulator.html:1487-1492`, `1505-1510`).
  - Physics floor collision uses `getMatterFloorCenterY(...)` so floor top tracks `GROUND_Y + matterFloorOffset` (`teabag-simulator.html:1306-1307`, `1361`, `1444`).
  - Generated platform and bus-stop tops now register as static Matter colliders through `syncMatterSurfaceColliders(...)` called at the end of `generatePlatforms(...)` (`teabag-simulator.html:1310`, `1712-1747`).

## Recent Integration Notes (2026-02-21)

- Shared NPC renderer module: `runtime/npc-render-shared.js` owns the runtime `drawCharacter` body with an additive designer-payload branch and legacy fallback.
- Runtime include anchor: `teabag-simulator.html:22` (`<script src="runtime/npc-render-shared.js"></script>`).
- Runtime payload registry anchors:
  - `teabag-simulator.html:2420` (`DESIGNER_PAYLOAD_INDEX_PATH`)
  - `teabag-simulator.html:2541` (`loadDesignerPayloadRegistry()`)
  - `teabag-simulator.html:2498` (`resolveDesignerPayloadById(...)`)
  - `teabag-simulator.html:2503` (`resolveDesignerPayloadPose(...)`)
  - `teabag-simulator.html:2513` (`drawCharacter(...)` wrapper bridge)
  - `teabag-simulator.html:4646` (boot-time `loadDesignerPayloadRegistry()` call)
- Gallery-only sample routing anchor: `teabag-simulator.html:2559` (`GALLERY_TYPES` includes `designerPayloadId: "npc_strict_valid"`).
- Offline payload cache path: `sw.js` precaches `runtime/npc-render-shared.js` plus payload registry files (`data/npc_payloads/index.json`, `strict-valid.json`, `visual-override.json`) and first-load sprite/SFX assets; bump `CACHE_NAME` when the cache manifest changes.
- Runtime call sites still target `drawCharacter(...)`; unresolved/missing payload ids fall back to legacy rendering.
- Shared renderer now uses one legacy-equivalent motion state for both legacy and payload branches; payload shoe layers pivot from their matching leg pivots (left/right) when `partRole`/layer naming maps them to shoes.
- Designer runtime preview now has a single `Start Loop` / `Stop Loop` toggle (`npc-designer.html`, `npc-designer.js`) that advances the same `tick -> walkPhase` surface used by game-exact motion parity rendering.
- Designer now persists current workspace state to `localStorage` and exposes a simple session snapshot menu (`Save`, `Save As`, `Load`) with unsaved-change confirmation before load.

## Runtime State Machine

`gameState` source of truth: `teabag-simulator.html:2857`

| State | Entered from | Exit conditions | Screen renderer |
| --- | --- | --- | --- |
| `title` | startup | any key / touch jump -> `modeselect` (`3037`) | `drawTitleScreen` (`4182`) |
| `modeselect` | title, quit from pause | campaign select -> `startGame` -> `playing`; endless select -> `zonepicker` (`3054`) | `drawModeSelect` (`4269`) |
| `zonepicker` | mode select | select unlocked zone -> `startGame`; back -> `modeselect` (`3077`) | `drawZonePicker` (`4305`) |
| `playing` | `startGame` (`2944`) or pause resume | ESC/P/pause touch -> `paused` (`3581`) | gameplay renderer via `render(gameCtx, dt)` (`3992`) |
| `paused` | `playing` | resume -> `playing`; quit -> `modeselect` (`3116`, `3121`) | `drawPauseMenu` (`4376`) overlay |

Note: `galleryMode` (`2625`) is orthogonal to `gameState`; `Tab` toggles preview rendering through `renderFrontScreen` (`3735`) and now short-circuits `update(gameCtx, dt)` (`3727`) while active.

## Update/Render Dispatch Helpers

- `createGameContext()` at `teabag-simulator.html:2864`
- `const GAME_CTX` init at `teabag-simulator.html:2941`
- `startGame(gameCtx)` at `teabag-simulator.html:2944`
- `triggerPrestige(gameCtx)` at `teabag-simulator.html:3001`
- `updateTitleMenuState(gameCtx, dt)` at `teabag-simulator.html:3035`
- `updateModeSelectState(gameCtx)` at `teabag-simulator.html:3040`
- `updateZonePickerState(gameCtx)` at `teabag-simulator.html:3059`
- `updateMenuState(gameCtx, dt)` at `teabag-simulator.html:3081`
- `updatePauseNavigation(gameCtx)` at `teabag-simulator.html:3100`
- `updatePauseSelectionAction(gameCtx)` at `teabag-simulator.html:3111`
- `updatePauseAdjustments(gameCtx)` at `teabag-simulator.html:3125`
- `updatePauseState(gameCtx)` at `teabag-simulator.html:3139`
- `updatePlayerMovementAndJump(dt, p, onNPC)` at `teabag-simulator.html:3148`
- `updateMountedCombatState(p)` at `teabag-simulator.html:3276`
- `updatePlayerTimersAndFX(dt, p, onNPC)` at `teabag-simulator.html:3374`
- `updatePlayerState(dt)` at `teabag-simulator.html:3412`
- `updateNPCFSM(dt, p)` at `teabag-simulator.html:3426`
- `updateNPCSpawning(p)` at `teabag-simulator.html:3591`
- `updateBusStopAmbient(dt, p)` at `teabag-simulator.html:3509`
- `updateNPCState(dt, p)` at `teabag-simulator.html:3525`
- `updateWorldState(gameCtx, dt, p)` at `teabag-simulator.html:3531`
- `updatePlayingState(gameCtx, dt)` at `teabag-simulator.html:3578`
- `update(gameCtx, dt)` dispatcher at `teabag-simulator.html:3727`
- `renderFrontScreen(gameCtx)` at `teabag-simulator.html:3735`
- `renderWorldLayer(sky)` at `teabag-simulator.html:3629`
- `renderEntityLayer()` at `teabag-simulator.html:3717`
- `renderPostFX(sky)` at `teabag-simulator.html:3799`
- `renderHUDLayer(gameCtx)` at `teabag-simulator.html:3845`
- `renderOverlayLayer(gameCtx, sky)` at `teabag-simulator.html:3987`
- `render(gameCtx, dt)` dispatcher at `teabag-simulator.html:3992`
- `endFrameInputReset(gameCtx)` at `teabag-simulator.html:4628`
- `loop(gameCtx, timestamp)` at `teabag-simulator.html:4635`

## Tuning Surface (Gameplay + HUD)

Central tuning object: `TUNING` at `teabag-simulator.html:372`

| Group | Canonical fields | Main consumers |
| --- | --- | --- |
| `movement` | air control/jump multipliers, drop-through, landing, walk/breath/blink, sprint trail | `updatePlayerMovementAndJump` (`3148`), `updatePlayerTimersAndFX` (`3374`) |
| `combat` | combo damage curve, chain window, dismount velocity, KO shake, aerial bonus | `updateMountedCombatState` (`3276`), `renderHUDLayer` (`3845`) |
| `spawn` | NPC pacing, panic/flee cadence, spawn margins, sprint-ahead pressure | `updateNPCFSM` (`3426`), `updateNPCSpawning` (`3591`), `updateBusStopAmbient` (`3509`) |
| `world` | camera lead/follow + sprint lens controls (zoom + forward look-ahead + airborne sprint-jump tween-in) + handheld drift controls + bus-stop decorative NPC readability controls, campaign soft wall, bootstrap world warmup/spawn burst, generation margin | `setSprintCameraTightening` (`1556`), `startGame` (`2972`), `triggerPrestige` (`3018`), `updateWorldState` (`3562`) |
| `uiTiming` | postFX intensity, chain HUD timing, combo label, KO/zone transition animation curves | `renderPostFX` (`3799`), `renderHUDLayer` (`3845`), zone transition setup (`3531`) |
| `vfx` | Matter.js cosmetic debris controls (gravity/lifetime/limits/floor/surface colliders/spawn rates) | `syncMatterSurfaceColliders` (`1310`), `initMatterFX` (`1347`), `spawnMatterDebris` (`1382`), `updateMatterFX` (`1440`), `drawMatterFX` (`1463`) |

## Truth Surface Table (What To Edit For X)

| Concern | Canonical truth | Main mutation path | Main UI/render path |
| --- | --- | --- | --- |
| Context boundary wiring | `GAME_CTX` scaffold (`2648-2726`) | `update(gameCtx, dt)` + `render(gameCtx, dt)` (`3354`, `3755`) | frame-end reset + RAF loop (`4238-4253`) |
| Movement tuning | Physics constants + `TUNING.movement` (`352-489`) | `updatePlayerMovementAndJump` (`2924`) + `updatePlayerTimersAndFX` (`3150`) | `drawCharacter` wrapper (`2282`) via `renderEntityLayer` (`3481`) |
| Sprint behavior | Double-tap input (`1048-1213`) + speed constants (`355`, `373+`) + sprint lens tuning in `TUNING.world` (`448-460`) | Sprint lock/carry logic in `updatePlayerMovementAndJump` (`3163`) + sprint-jump carry camera gate in `updateWorldState` (`3553-3556`) | Sprint trail particles in `updatePlayerTimersAndFX` (`3389`) + GSAP tweened camera lens/follow (`setSprintCameraTightening`, `1545`) + render zoom transform (`4051`) |
| Handheld camera drift | `TUNING.world` handheld knobs (`461-471`) + camera runtime state (`1538-1540`) | Runtime wave/intensity synthesis + optional pixel snapping in `updateWorldState` (`3559-3587`) | Applied on the world draw container (`4051`) while HUD stays stable |
| Jump / double jump | `JUMP_FORCE`, `COYOTE_TIME`, `JUMP_BUFFER` (`357-359`) + movement tuning (`372-395`) | Jump gate/execution in `updatePlayerMovementAndJump` (`2924`) | Airborne pose flags through `drawCharacter` (`2282`) |
| Drop-through platforms | Player flags (`2531+`) + movement tuning (`379-385`) | Drop-through trigger/clear in `updatePlayerMovementAndJump` (`2924`) | Platform collision resolution in same function |
| Mount + teabag DPS | `TEABAG_WINDOW`, `TEABAG_DAMAGE` (`363-364`) + `TUNING.combat` (`396-415`) | Teabag/KO loop in `updateMountedCombatState` (`3052`) | Hit popups + KO announcements in `updateMountedCombatState` + HUD (`3608`) |
| KO + chain scoring | KO metadata in `CHARACTER_DEFS` (`668-956`) | KO/chain scoring in `updateMountedCombatState` (`3052`) + decay in `updatePlayerTimersAndFX` (`3150`) | Chain HUD + center KO in `renderHUDLayer` (`3608`) |
| NPC archetypes | `CHARACTER_DEFS` + `CHAR_BY_NAME` (`668-958`) including `legColor`/`shoeColor` | `spawnNPC` (`2823`) + `spawnBusStopNPCs` (`1605`) + `npcVisualOpts` (`2801`) | `drawCharacter` wrapper (`2528`) + bus-stop decorative grade path in `drawBusStopNPCs` (`1739`) -> `runtime/npc-render-shared.js` |
| NPC density / pacing | Global caps (`365-368`) + `TUNING.spawn` (`416-443`) | `updateNPCFSM` (`3192`) + `updateNPCSpawning` (`3591`) + `updateBusStopAmbient` (`3275`) | Pressure manifests through same-frame world/entity render |
| Zone progression / prestige | `ZONES` (`492-583`) + `zoneLayout` (`588+`) | Zone transitions in `updateWorldState` (`3297`) + prestige in `triggerPrestige` (`2777`) | Zone transition banner in `renderOverlayLayer` (`3750`) |
| Procedural world gen | `generatePlatforms` (`1414`) + `generateCity` (`1664`) + `TUNING.world` (`444-465`) | Startup/prestige/stream generation in `startGame` (`2756`), `triggerPrestige` (`2802`), `updateWorldState` (`3332`) | World layer composition in `renderWorldLayer` (`3393`) |
| City spacing profile | `CITY_GAP_PROFILE` + helpers (`1534-1572`) | FG/BG stride in `generateCity` (`1664`) via `advanceCityCursor(...)` | Building density rendered in `renderWorldLayer` (`3393`) |
| Dog-walker gallery companion | `GALLERY_DOG_PREVIEW` (`2361`) + `drawGalleryCompanionDog` (`2368`) | Pose-specific calls in `drawGallery` (`2487`, `2497`, `2507`) | Gallery-only companion preview (no gameplay coupling) |
| Runtime payload registry | `DESIGNER_PAYLOAD_INDEX_PATH` (`2420`) + registry helpers (`2520-2579`) | Boot loader `loadDesignerPayloadRegistry()` (`2541`, call at `4646`) + lookup in `drawCharacter` (`2513`) | Optional `designerPayloadId` path with legacy fallback in renderer wrapper |
| Persistence | Save keys `teabag_save` / `teabag_sfx` (`293`, `601`) | `saveProgress` (`609`) + `saveSFXSettings` (`297`) | Loaded at boot (`293`, `601`) |

## Render Order (Authoritative)

Within `render(gameCtx, dt)` (`3992`), draw order is:

1. Front-screen short-circuit check via `renderFrontScreen(gameCtx)` (`3735`).
2. Sprint zoom transform wrapper (`4005-4018`) around sky/world/entity draw.
3. World layer via `renderWorldLayer(sky)` (`3629`) including stars/silhouettes/clouds/birds, buildings, cars, platforms, and ground.
4. Entity layer via `renderEntityLayer()` (`3717`) for bus-stop NPCs, props, NPCs, player, legacy particles, Matter debris, and popups.
5. Overlay/HUD via `renderOverlayLayer(gameCtx, sky)` (`3987`) which routes through `renderPostFX` (`3799`) and `renderHUDLayer` (`3845`).
6. Pause overlay (`4024-4029`) using `drawPauseMenu()` (`4376`) when paused.
7. Mobile sidebars via `drawSideBars()` (`1203`) after gameplay/pause layers.

## Update Order (Authoritative)

Within `update(gameCtx, dt)` (`3727`), dispatch flow is:

1. Menu dispatcher via `updateMenuState(gameCtx, dt)` (`3081`).
2. Pause dispatcher via `updatePauseState(gameCtx)` (`3139`).
3. Playing dispatcher via `updatePlayingState(gameCtx, dt)` (`3578`).
4. Inside `updatePlayingState`:
   - pause-entry gate (`3580-3582`)
   - player systems via `updatePlayerState(dt)` (`3412`)
   - NPC systems via `updateNPCState(dt, p)` (`3525`)
   - world/progression/generation via `updateWorldState(gameCtx, dt, p)` (`3531`) including `updateMatterFX(dt)` (`3574`)

## High-Value Edit Entry Points

| Task | Primary lines to edit |
| --- | --- |
| Retune jump/sprint feel | `354-371`, `373-446`, `3148-3374` |
| Retune sprint camera tightening | `448-460`, `1531-1574`, `2959-2994`, `3549-3558`, `4037-4063` |
| Retune handheld camera drift | `461-471`, `1538-1540`, `3559-3587`, `4044` |
| Change teabag damage curve | `363-364`, `396-405`, `3074-3079` |
| Change chain window length | `406`, `3095`, `3133`, `3646` |
| Add new NPC type | `668-956` (definition), zone `npcPool` in `492-583` |
| Retune NPC shoe color | `CHARACTER_DEFS` visual fields (`668-956`), spawn pass-through (`1363-1394`, `2546-2568`), shared render path (`2282` + `runtime/npc-render-shared.js`) |
| Add new zone | `492-583`, blend assumptions `654-664`, world layer branch `3393+`, silhouettes `3789+` |
| Add/retune dog-walker gallery companion | `GALLERY_DOG_PREVIEW` / helper (`2361-2453`) + pose call sites (`2487`, `2497`, `2507`) |
| Retune city spacing profile | `1534-1572` (gap profile + helpers), FG/BG stride in `generateCity` (`1664+`) |
| Retune decorative bus-stop NPC readability | `TUNING.world` bus-stop decor knobs (`472-476`), `blendHexColor(...)` (`1017-1020`), `drawBusStopStructure(...)`/`drawBusStopFrontGlass(...)` (`1706-1741`), `drawBusStopNPCs(...)` (`1743-1780`) |
| Tune Matter debris VFX spike | Matter include `24`, `TUNING.vfx` (`501-512`), helpers (`1277-1434`), update hook (`3574`), render hook (`3795`) |
| Change spawn pressure | `365-368`, `416-443`, `3591-3609` |
| Change prestige behavior | `2777-2809`, `3297-3335`, overlay timing in `renderPostFX` (`3562-3607`) |
| Change pause menu controls | pause helpers (`2876-2915`), menu renderer (`4130-4236`) |
| Change touch controls | touch model (`1103+`), mapping (`1159-1218`), sidebar UI (`1228-1291`) |
| Change scoring formula | KO scoring block (`3101-3104`) + chain HUD (`3632-3649`) |

## Search Cheatsheet

Use these from repo root:

- `rg -n "function createGameContext|const GAME_CTX|function endFrameInputReset|function loop\(" teabag-simulator.html`
- `rg -n "const TUNING|movement: Object.freeze|combat: Object.freeze|spawn: Object.freeze|world: Object.freeze|uiTiming: Object.freeze|vfx: Object.freeze" teabag-simulator.html`
- `rg -n "getMatterFloorCenterY|syncMatterSurfaceColliders|initMatterFX|clearMatterFX|spawnMatterDebris|updateMatterFX|drawMatterFX|matterEnabled|matterSurface" teabag-simulator.html`
- `rg -n "function startGame|function triggerPrestige|bootstrapGenerationMargin|generationMargin" teabag-simulator.html`
- `rg -n "CITY_GAP_PROFILE|function sampleCityGap|function advanceCityCursor|function generateCity" teabag-simulator.html`
- `rg -n "dog_walker|function drawGalleryCompanionDog|GALLERY_DOG_PREVIEW|function drawGallery" teabag-simulator.html`
- `rg -n "function updateTitleMenuState|function updateModeSelectState|function updateZonePickerState|function updateMenuState|function updatePauseNavigation|function updatePauseSelectionAction|function updatePauseAdjustments|function updatePauseState|function updatePlayerMovementAndJump|function updateMountedCombatState|function updatePlayerTimersAndFX|function updatePlayerState|function updateNPCFSM|function updateNPCSpawning|function updateBusStopAmbient|function updateNPCState|function updateWorldState|function updatePlayingState|function update\(" teabag-simulator.html`
- `rg -n "function renderFrontScreen|function renderWorldLayer|function renderEntityLayer|function renderPostFX|function renderHUDLayer|function renderOverlayLayer|function render\(" teabag-simulator.html`
- `rg -n "TEABAG_DAMAGE|TEABAG_WINDOW|chainWindowSeconds|comboDamageStep" teabag-simulator.html`
- `rg -n "gameState ===|gameState =" teabag-simulator.html`
- `rg -n "const ZONES =|npcPool|triggerPrestige" teabag-simulator.html`
- `rg -n "shoeColor|legColor|function spawnBusStopNPCs|function drawBusStopStructure|function drawBusStopFrontGlass|function drawBusStopNPCs|function blendHexColor|busStopDecorLiftY|function npcVisualOpts|function spawnNPC|function drawCharacter" teabag-simulator.html`
- `rg -n "MIN_NPCS_ON_SCREEN|MAX_NPCS|NPC_DESPAWN_DIST|visibleNPCs|sprintAheadDistance" teabag-simulator.html`
- `rg -n "localStorage|teabag_save|teabag_sfx" teabag-simulator.html`

## Coupling Notes (Avoid Regressions)

- Combo decay intentionally pauses while airborne; it ticks only when `onRealGround` is true (`3153`).
- Chain combo decays only when not mounted (`3155`) and refreshes on remount (`3133`).
- Teabag uses crouch release timing (`3071-3074`), not crouch press.
- Zone unlocks happen both on crossing into a zone (`3320-3321`) and on prestige (`2782-2783`).
- `drawCharacter` remains the single runtime character draw entrypoint for player/NPC/gallery flows; wrapper bridge lives at `teabag-simulator.html:2282` and delegates to `SHARED_CHARACTER_RENDERER` (`teabag-simulator.html:2278`) with optional designer-payload lookup/fallback.
- Frame-end input reset ordering is critical and centralized in `endFrameInputReset(gameCtx)` (`teabag-simulator.html:4484`); keep it after `render(gameCtx, dt)` in `loop` (`teabag-simulator.html:4491`).
- Bootstrap world warmup and spawn burst values are centralized in `TUNING.world` (`447-478`); keep bootstrap/reset (`2944`, `3001`) and streaming (`3531`) generation margins intentionally aligned for pacing.
- Sprint camera tightening intentionally follows sprint carry logic: it stays engaged through sprint-jumps while direction/sprint input remains active, and drops back when direction is released (`wantsSprintLens` / `airSprintLens` at `teabag-simulator.html:3553-3556`).
- Handheld drift is intentionally low amplitude and layered on top of screen shake at render-time translate (`teabag-simulator.html:4044`); keep amplitudes sub-pixel-scale in gameplay units to avoid nausea/fatigue.
- Matter surface colliders intentionally mirror generated `platforms` entries (including bus stops) in a camera-windowed static-body set; keep sync attached to generation flow (`generatePlatforms`) to avoid stale collider drift.
- FG and BG both use `advanceCityCursor(...)` (`1572`) for width-aware symmetric stride; keep left-anchor placement (`1678`, `1697`) as `b.x = cursor - b.w` so right/left parity is preserved.
- `drawGalleryCompanionDog(...)` is gallery-only; it should not be called from `renderEntityLayer` or NPC update paths.
- `party_girl` keeps `hasDress`/`shortDress` and the special bare-leg look through renderer options; keep flag plumbing aligned (`spawnNPC` -> `npcVisualOpts` -> renderer opts).
- `shoeColor` flows from `CHARACTER_DEFS` into bus-stop/world NPC objects (`1368-1391`, `2571-2603`), then through `npcVisualOpts` (`2546`) into `drawCharacter`; preserve that pipeline and fallback order.
- Decorative bus-stop NPC readability is render-only (`drawBusStopNPCs` + `drawBusStopFrontGlass`); preserve panic state/timing behavior in `updateBusStopAmbient`, keep NPCs non-targetable, and keep layering order as shelter base -> NPCs -> foreground glass.
- Payload branch coupling: keep `partRole` semantics (`left_leg`/`right_leg`/`left_shoe`/`right_shoe`) stable so shoe layers inherit leg pivot swing, matching legacy leg+shoe attachment behavior.
