# Campaign + Boss Mode Roadmap (Draft)

Purpose: define a concrete path to split the current mode structure into:

1. `Freeplay` (current endless-style sandbox loop)
2. `Campaign` (structured run with boss gates and victory/defeat flow)

This is a delivery roadmap, not a lore doc. It is scoped for mechanical implementation and acceptance gates.

## Design Goals

1. Keep the core "mount -> teabag -> launch -> chain" fantasy as the combat backbone.
2. Add boss encounters that create short, pattern-readable "problem windows" before direct teabag damage windows.
3. Keep fairness high with visible telegraphs, short invulnerability after player hit, and explicit phase indicators.
4. Preserve current Freeplay feel and tuning while Campaign introduces structured progression.

## Mode Split (Target UX)

1. `Campaign`
   Single run across curated segments with distance gates into boss arenas.
   Bosses can damage player.
   Run ends on boss defeat (win) or HP depletion (lose).
2. `Freeplay`
   Current open loop experience (no mandatory boss lock-in).
   Existing prestige and score-chasing behavior can remain here.

## Core Campaign Loop (V1)

1. Start in Campaign segment.
2. Travel to gate distance.
3. Enter boss transition:
   Forced walk -> camera lock/fixed zoom -> crossfade into boss arena.
4. Boss phase loop:
   Dodge pattern -> solve stun condition -> boss vulnerable -> mount/teabag damage window.
5. Boss defeated:
   Short outro -> checkpoint save -> return to field segment or next chapter.
6. Final boss defeated -> campaign completion screen.

## Systems to Add

1. `Run Profile`
   `runMode: 'campaign' | 'freeplay'`
2. `Player HP Layer` (Campaign-enabled)
   `player.hp`, `player.maxHp`, `player.invulnTimer`, `player.knockbackTimer`
3. `Boss Encounter Runtime`
   `bossEncounter = { active, id, phase, hp, timer, stunState, vulnTimer, arena, patternIndex }`
4. `Campaign Progress Runtime`
   `campaign = { chapterIndex, gateDistance, checkpointId, status }`
5. `Camera/Boss Transition Runtime`
   transition state for forced walk, zoom, crossfade, and lock.
6. `Boss Hazard System`
   projectiles/hitboxes with owner tagging and simple collision checks vs player.

## Current Architecture Hooks

1. State scaffold:
   `teabag-simulator.html:2806` to `teabag-simulator.html:2892`
2. Main update dispatcher:
   `teabag-simulator.html:3532`
3. World progression and distance checks:
   `teabag-simulator.html:3474`
4. Player movement/combat integration points:
   `teabag-simulator.html:3091`, `teabag-simulator.html:3219`, `teabag-simulator.html:3317`
5. Render pipeline + overlays:
   `teabag-simulator.html:3934`, `teabag-simulator.html:3741`, `teabag-simulator.html:3787`, `teabag-simulator.html:3929`

## Boss Encounter Framework (V1 Contract)

Each boss uses a shared contract:

1. `intro`
   Entrance animation/telegraph. No damage taken.
2. `active_pattern`
   Boss executes one attack pattern.
3. `stun_ready`
   Player can trigger specific stun condition (object teabag, bait, survive wave, etc.).
4. `vulnerable`
   Boss can be mounted/teabagged for direct HP damage.
5. `recover`
   Boss exits vulnerability and enters next pattern.
6. `enrage` (optional)
   Pattern speed/complexity increase under HP threshold.
7. `defeated`
   Outro/cutback to campaign flow.

## Initial Boss Set (from current concept)

1. `Arena Puzzle Boss`
   Teabag scattered arena objects to stun boss, then direct damage window.
2. `Bullet Hell Boss`
   Survive projectile waves, then short strike window.
3. `Industrial Excavator Boss`
   Survive excavator attack sequence, wait for stall, jump/mount for direct damage.

## Additional Boss Concepts

1. `Downtown Riot Van Captain`
   Stun by teabagging traffic-control nodes to EMP shield.
2. `Shopping Mall Security Swarm`
   Stun by overloading checkout kiosks in order.
3. `Park Groundskeeper Mech-Mower`
   Bait mower line attacks, then stun via fertilizer tank teabag trigger.
4. `Red Light DJ Overlord`
   Rhythm telegraph waves and light-grid hazards; stun via speaker-node sequence.
5. `Suburbs HOA Enforcer`
   Bait armored rush into props, then exploit brief exposed hatch window.

## First Playable Slice (C1 Vertical Slice)

Target: one complete Campaign boss path with full win/lose loop.

Scope:

1. Mode split in menu:
   `Campaign` and `Freeplay` labels/behavior wired.
2. Campaign HP:
   3 HP, 1.0s invuln after hit, basic hit feedback.
3. One gate transition:
   fixed camera + forced walk + zoom/crossfade into arena.
4. One boss:
   `Industrial Excavator` with 2 patterns + stall vulnerability window.
5. Damage model:
   boss damages player on hazard hit; player damages boss only in vulnerable window.
6. End states:
   win and lose screens with retry/quit.

Out of scope (C1):

1. Multi-boss chapter chain.
2. Narrative/cutscene tooling.
3. Bullet-hell multi-pattern editor.
4. Save migration beyond minimal campaign checkpoint persistence.

## Mechanical Slice Plan

### B0: Mode Contract + UI Labels

1. Introduce `runMode` (`campaign` or `freeplay`) and menu labels.
2. Keep existing gameplay behavior under `freeplay` default path.
3. Acceptance:
   both modes launch reliably; pause/quit paths still valid.

### B1: Player HP + Damage Pipeline

1. Add campaign-only HP state and hazard damage intake helper.
2. Add hit i-frames, knockback, and HUD hearts/bar.
3. Acceptance:
   repeated hits respect i-frame gate; lose condition triggers cleanly.

### B2: Boss Gate Trigger + Transition

1. Add distance gate checks in world update.
2. Add transition state:
   forced walk, camera lock, zoom/crossfade.
3. Acceptance:
   transition is deterministic; input lock release is correct when boss starts.

### B3: Boss Runtime Shell

1. Add generic boss state machine and lifecycle hooks.
2. Add pattern timer and vulnerability timer support.
3. Acceptance:
   debug boss can move through `intro -> active -> vulnerable -> recover -> defeated`.

### B4: Hazard Layer

1. Add hazard/projectile entities with update/render/collision.
2. Collide hazards against player HP layer.
3. Acceptance:
   hazards despawn correctly and damage player once per i-frame window.

### B5: Industrial Excavator Boss (C1 Content)

1. Pattern A: sweep/charge lane pressure.
2. Pattern B: slam/shock telegraph.
3. Stall event opens short mount window.
4. Acceptance:
   player can read telegraphs, survive, and deal direct boss damage.

### B6: Boss HUD + Feedback Pass

1. Boss HP bar, phase callouts, stun/vulnerability indicators.
2. Camera shake/sfx feedback on key events.
3. Acceptance:
   player always knows current encounter state.

### B7: Win/Lose Flow + Retry Loop

1. Defeat screen -> retry at boss checkpoint.
2. Victory screen -> campaign advance placeholder.
3. Acceptance:
   no soft-locks; restart path resets encounter state cleanly.

### B8: Balance + Guardrail Pass

1. Tune windows and damage around fairness targets.
2. Add debug toggles for gate distance and boss phase.
3. Acceptance:
   3-5 test runs show stable pacing and no unavoidable damage loops.

## Acceptance Gates (Global)

1. Branch ordering, pause/menu gates, and frame reset timing unchanged outside scoped campaign paths.
2. Desktop + touch controls stay in sync for any new actions/prompts.
3. Campaign mode cannot regress Freeplay performance or spawn loop behavior.
4. Boss transition must never leave camera/input locked after failure or pause/resume.
5. Runtime validation must be reported for gameplay-affecting slices.

## Risk Register

1. State explosion risk:
   Mitigation: keep boss logic in one contained runtime object and explicit phase enum.
2. Readability risk in high-action arenas:
   Mitigation: strong telegraphs, phase HUD, and bounded VFX intensity.
3. Difficulty spikes:
   Mitigation: conservative V1 damage numbers, i-frames, and short recovery windows.
4. Freeplay regression risk:
   Mitigation: hard mode-gating of campaign-only systems.

## Open Questions (Need Product Calls)

1. Campaign chapter count for V1: single boss chapter or 2-3 chapters?
2. Campaign persistence:
   checkpoint-only or full chapter progression save?
3. Win condition framing:
   chapter complete banner vs full campaign credits flow?
4. Player HP display style:
   hearts, segmented bar, or numeric?

## Suggested Immediate Next Task

Create `docs/planning/CAMPAIGN_BOSS_SLICES.md` from this roadmap with strict file-by-file scope and command-level acceptance checks for slices `B0` to `B2` first (vertical slice foundation).
