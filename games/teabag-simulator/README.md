# TEABAG SIMULATOR

You know that move in online games that makes you want to throw your controller through the TV? The one that's been getting people reported since Halo 2? Yeah, we made a whole game about it.

Jump on strangers. Crouch repeatedly. Watch numbers go up. Question your life choices. Repeat.

**https://heyheywoah.github.io/teabag-simulator/**

Works on desktop and mobile. Add to home screen on your phone for the full degenerate experience.

## How To Play

Land on an NPC's head to mount them. Mash crouch to teabag. Each bob does damage. KO them, launch off, land on the next one. Chain KOs for multipliers. That's it. That's the game.

### Desktop Controls

| Key               | Action               |
| ----------------- | -------------------- |
| A / D (or arrows) | Move left / right    |
| W (or up arrow)   | Jump / double jump   |
| S / Space         | Crouch / teabag      |
| Double-tap A or D | Sprint               |
| Down on platform  | Drop through         |
| ESC / P           | Pause                |
| Tab               | Character gallery    |
| T                 | Toggle touch overlay |

### Mobile Controls

- **Left sidebar** — D-pad (move, navigate menus)
- **Right sidebar** — Jump button, Bag button (crouch/teabag), Pause button
- Double-tap a direction to sprint

## Game Modes

**Campaign** — Travel through all 6 zones left to right. Reach the end and prestige to loop with harder NPCs and increasingly unhinged visual effects (vignette, scanlines, chromatic aberration).

**Endless** — Pick any unlocked zone and go forever.

## Zones

| Zone               | Vibe                                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| Downtown           | Skyscrapers, bus stops, hydrants. The classic.                                 |
| Shopping District  | Storefronts, awnings, brick sidewalks. Shopaholics and influencers roam.       |
| Park               | Trees, fountains, benches. Joggers and dog walkers minding their own business. |
| Red Light District | Neon signs, dark buildings, purple haze. Bouncers will test your patience.     |
| Industrial         | Warehouses, smokestacks, barrels. Forklift Phil doesn't go down easy.          |
| Suburbs            | Picket fences, mailboxes, triangle roofs. Karen lives here.                    |

## NPC Roster

### Common

- **Pedestrian** — Your everyday victim. Randomized appearance.
- **Small** — Shorter, less health. Easy pickings.
- **Tall** — Lankier, more health.

### Special (named, unique KO text)

- **Muscle** (BEAST DOWN) — Wide, tanky, angry brows.
- **Sumo** (SUMO DOWN) — Round boy. Big belly. Mawashi belt. 600 HP.
- **Giant/Titan** (TITAN FELLED) — Tallest in the game.
- **Chad** (CHAD REKT) — Pompadour, blue eyes, green shorts.
- **Karen** (MANAGER'D) — Asymmetric bob. Sunglasses on forehead.
- **Babushka** (BABUSHKA NAP) — Headscarf, floral dress, built like a tank.
- **Gym Girl** (NO REPS LEFT) — High ponytail, exposed midriff.
- **Baller** (BENCHED) — Jersey #69, headband, fade haircut.
- **Goth Mommy** (MOMMY ISSUES) — The final boss of bus stops.

### Zone-Exclusive

Shopaholic, Influencer, Jogger, Dog Walker (gallery preview includes companion dog), Club Dude, Party Girl, Sundress Girl, Bouncer, Hard Hat, Forklift Phil, Soccer Mom, Mailman, Lawn Dad

## Mechanics

- **Mounting** — Land on an NPC's head from above. They panic.
- **Teabagging** — Rapidly crouch/uncrouch while mounted. Each bob within the timing window deals damage and builds combo.
- **Combo** — Consecutive teabags on a single NPC. Increases damage per hit.
- **Chain Combo** — KO an NPC, launch off, mount another within 3 seconds. Chain multiplier applies to score. Timer refreshes on each mount.
- **Aerial Bonus** — Mount a new NPC while your chain is active for bonus points.
- **Double Jump** — Jump again mid-air. Puff ring particle effect.
- **Sprint** — Double-tap a direction. 2.31x speed with momentum carry in air plus a GSAP-smoothed sprint lens (subtle zoom-in + extra forward look-ahead so upcoming hazards stay visible).
- **Handheld Camera Drift** — Always-on, low-amplitude camera micro-motion with speed-reactive intensity for a subtle handheld feel (kept below distraction level).
- **Physics Debris (Spike)** — Experimental Matter.js-backed debris chunks layer onto landings, impacts, and light grounded movement scuffs, with generated ground/platform/bus-stop surfaces mirrored into the VFX physics world for richer bounce/settle behavior. Cosmetic only; gameplay collisions remain unchanged.
- **Coyote Time** — 80ms grace period to jump after leaving a ledge.
- **Jump Buffer** — 100ms input buffer for pre-landing jumps.
- **Drop Through** — Crouch on a platform to fall through it (Smash Bros style).
- **Prestige** — Campaign only. Walk past the final zone to loop. NPCs get +50% HP per prestige. Visual effects stack.

## World Generation

Everything is procedurally generated in both directions as you move:

- **Buildings** — Zone-specific architecture (skyscrapers, storefronts, pavilions, warehouses, houses) with foreground (0.7x parallax) and background (0.3x parallax) layers
- **Silhouettes** — Deep background layer (0.05x parallax) with zone-appropriate shapes
- **Platforms** — Smash Bros-style one-way platforms, randomly distributed
- **Bus Stops** — Downtown only. Custom sprite shelter with 1-5 decorative NPCs who panic when you're nearby. They render 10% smaller, sit slightly higher to align to the sidewalk boundary line, and now stand behind a foreground glass pass so they read as background flavor (not targetable). Rare Goth Mommy spawn.
- **Props** — Zone-specific (lamps, hydrants, benches, trees, fountains, neon signs, barrels, smokestacks, mailboxes, fences)
- **Traffic** — Sedans, SUVs, sports cars, vans, pickups, and buses drive behind the sidewalk layer
- **Zone Blending** — 600-unit crossfade between zones (sky tint, ground pattern, silhouettes, building styles)

## Day/Night Cycle

300-second cycle (5 minutes = 24 hours). 12 sky gradient stops from midnight through dawn, sunrise, noon, golden hour, sunset, dusk, and back. Stars twinkle at night. Building windows light up. Ambient darkness overlay.

## SFX

10 synthesized sound effects built with the Web Audio API — no audio files. Sounds are defined as modular node graphs in `sfx/sounds.js` and played by an inline engine in the game.

| Sound          | Trigger                  |
| -------------- | ------------------------ |
| jump           | First jump               |
| doubleJump     | Second jump              |
| land           | Hard landing (vy > 200)  |
| mount          | Landing on an NPC's head |
| teabagHit      | Each teabag bob          |
| ko             | NPC health reaches 0     |
| menuSelect     | Confirming a menu option |
| menuNav        | Navigating menus         |
| zoneTransition | Entering a new zone      |
| prestige       | Completing the zone loop |

Volume and mute controls in the pause menu. Persisted to localStorage.

## Dev Tools

### Code Style

Local formatter/linter setup for the standalone JS/CSS/HTML tooling files:

- `npm install` - install local Prettier + ESLint
- `npm run lint` - lint browser/runtime/tooling JavaScript
- `npm run lint:fix` - apply safe ESLint autofixes where possible
- `npm run format` - format the supported source/docs set with Prettier
- `npm run format:check` - verify Prettier formatting without writing changes

### Game Lookup CLI (`scripts/lookup-schematics.js`, `scripts/lookup-source.js`, `scripts/lookup-sections.js`)

Quick command-line lookup helpers for finding mechanics entry points before editing.

- `node scripts/lookup-schematics.js sprint` - find sprint-related sections, tasks, helpers, and search commands from `SCHEMATICS.md`
- `node scripts/lookup-schematics.js "pause menu" --type task` - narrow to high-value edit task rows only
- `node scripts/lookup-source.js updateWorldState --symbols-only` - locate symbol declarations in `teabag-simulator.html`
- `node scripts/lookup-source.js registry --all-core` - search symbols/text across major runtime, designer, and tooling files
- `node scripts/lookup-source.js matter --text-only --limit 20` - find raw text hits in `teabag-simulator.html`
- `node scripts/lookup-sections.js camera --file teabag-simulator.html` - list section anchors by topic/file across the full repo map
- Add `--json` to any lookup command for machine-readable output.

### Sound Designer (`sound-designer.html`)

Standalone tool for crafting game sounds using the Web Audio API. Modular synth-style node graph with:

- **4 layers per sound** — Each with its own source, waveshaper, filter, LFO, and gain
- **Source types** — Sine, square, sawtooth, triangle, white/pink/brown noise, FM synthesis
- **Effects chain** — Delay, reverb, chorus, phaser, compressor, distortion, EQ, bitcrusher, tremolo
- **ADSR envelope** — Attack, decay, sustain, release with visual curve
- **Real-time visualization** — Oscilloscope waveform, frequency spectrum, envelope/filter curves
- **12 sound slots** with randomize, copy/paste, export JSON, import JSON, copy as JS
- **Keyboard shortcuts** — Space to preview, R to randomize, 1-0 for quick slot select

### NPC Character Designer (`npc-designer.html`)

Standalone character-authoring tool for building layered NPC pose sheets before game integration.

- **Editable base forms** — Start from `male_base` or `female_base`, then fully edit every base layer
- **Three independent poses** — `normal`, `panic`, `ko` workspaces with copy-pose actions
- **Tool surface** — Select, move, rotate, resize handles, rectangle, ellipse, line, curve, polygon, color, gradient, eyedropper, hand + zoom controls
- **Layer workflow** — Multi-select (Shift/Cmd/Ctrl), rename, reorder, hide/show, lock/unlock, duplicate, delete, group move/resize
- **History controls** — Undo/redo buttons in the top bar plus keyboard shortcuts (`Cmd/Ctrl+Z`, `Shift+Cmd/Ctrl+Z`, `Ctrl+Y`)
- **Accordion sidebars** — Every section container in both left and right sidebars is collapsible to reduce visual noise while editing
- **Face controls** — Dedicated managed face panel for eyes, brows, and mouth that updates layer geometry used by runtime parity preview/export
- **Hair preset bootstrap** — Apply a layered Sundress hair preset (current pose or all poses) with back mass, temple coverage, and front bangs/wisps ready for fine tuning
- **Height references** — Toggle lines and labels derived from current game character dimensions (plus optional silhouette overlays)
- **Live previews** — Side-by-side previews for all three poses with facing-direction toggle; panic preview now derives from normal geometry with panic-face substitution, adjustable panic arm spread, and adjustable shoulder-bar pivot offset (plus `Snap 0` reset for spread)
- **Runtime-parity preview** — Dedicated preview panel that calls the shared game `drawCharacter` renderer using live in-memory designer payload data (`designerPayload` + `designerPose`) with legacy fallback safety, plus pose/facing/scale/tick controls, a Start/Stop animation loop toggle, world-context silhouettes, and panic motion flags aligned to game NPC panic (`isFleeing` + walk phase, no jump-state injection)
- **Constraint UX** — Always-visible Design Readiness panel and Constraint Reference panel with hard blockers vs warnings and jump-to-target issue navigation
- **Visual-rule override workflow** — Hard Safety rules always block compact export; visual issues become warnings when Strict Visual Rules is OFF (optional auto-fix when strict is ON)
- **JSON round-trip** — Export/import full editable JSON, copy/download JSON, plus compact integration payload export for downstream character conversion
- **Session persistence + snapshots** — Auto-recovers current workspace from localStorage and adds simple Save/Save As/Load session snapshots (with unsaved-change confirmation on load)
- **Runtime payload reintegration path** — Game runtime loads `data/npc_payloads/index.json`, resolves optional `designerPayloadId`, maps poses (`normal`/`panic`/`ko`), and falls back to legacy NPC rendering on any index/load/parse/lookup failure
- **Gallery-only runtime sample** — Tab gallery includes a `Designer Sample` entry routed through the runtime payload path without touching spawn pools or gameplay NPC selection

#### NPC Designer Usage

1. Open `npc-designer.html`.
2. Pick a base template (`male_base` or `female_base`).
3. Choose a pose tab (`normal`, `panic`, `ko`) and edit layers.
4. Configure Runtime Preview Profile values (base NPC type, runtime npcType, scale/health/colors/hair/body toggles).
5. Use the `Sundress Hair (Pose)` or `Sundress Hair (All)` preset actions when you want the layered hair starting point.
6. Use Face controls to adjust managed face layers for the active pose (or apply to all poses).
7. Use layer controls for selection/group transforms and ordering; use `Rotate` tool for drag rotation (hold Shift to snap).
8. Toggle height references to compare proportions against existing roster sizes.
9. Watch Design Readiness for hard blockers/warnings and use jump links to navigate directly to fields/poses/layers.
10. Use Live Preview `Panic Arm Spread` and `Shoulder Bar Offset Y` to tune panic arm behavior; use `Snap 0` to instantly return spread to an exact flip baseline.
11. Use Runtime-Parity Preview to validate runtime shape/animation parity before export, use `Start Loop` / `Stop Loop` to play animation continuously, and watch the status line for `payload parity active` vs `fallback to legacy preview (...)`.
12. Use top-bar history/session controls: `Undo` / `Redo` for edit history, `Save As` to create a named snapshot, `Save` to overwrite the selected snapshot, and `Load` to restore it (with unsaved-change confirmation).
13. Export editable JSON for continued iteration or import JSON to restore state.
14. Export compact payload when hard blockers are clear.

## Tech

Single HTML file game. Canvas 2D rendering at 960x540 (2x pixel scale). No frameworks and no build step. Runtime libraries are script-included: GSAP is vendored locally at `vendor/gsap.min.js` (sprint camera lens tween path), and Matter.js (CDN) powers the experimental VFX debris layer with graceful fallback to classic particles if unavailable. The entire game — gameplay physics, rendering, UI, input, generation, particles, day/night, SFX engine — is inline JavaScript.

PWA-enabled with service worker and manifest for offline play and home screen install.

## Credits

by [heyheywoah](https://github.com/heyheywoah) + claude opus
