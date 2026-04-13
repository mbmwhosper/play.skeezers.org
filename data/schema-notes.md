# Skeezers Arcade v2 data notes

## Goals
- Keep `config.jsonc` as the editable source catalog for now.
- Generate normalized data for the frontend so UI logic is not forced to infer everything from names.
- Allow gradual enrichment, game by game.

## Proposed model per game
- `slug`
- `name`
- `path`
- `url`
- `sourceType` (`local`, `flash`, `external`)
- `iframeSafe`
- `aliases`
- `categories`
- `genres`
- `features`
- `players.min`
- `players.max`
- `session.length` (`short`, `medium`, `long`)
- `difficulty` (`easy`, `medium`, `hard`)
- `mood` (`chill`, `competitive`, `chaotic`, `story`, etc)
- `status` (`playable`, `reported-broken`, `external-only`)

## Phase 1
- Introduce normalized build output from existing config.
- Heuristically map current categories/names into structured fields.
- Keep all existing catalog entries usable.

## Phase 2
- Add explicit metadata overrides in a dedicated file.
- Use normalized output for routes, cards, filters, and related-game recommendations.

## Phase 3
- Add admin/editor tooling for metadata maintenance.
