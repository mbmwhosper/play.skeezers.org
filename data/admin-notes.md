# Admin and metadata maintenance notes

## Immediate goal
Keep the rebuilt catalog maintainable while intake expands.

## Current editable data files
- `config.jsonc` for core inherited game catalog
- `data/game-overrides.json` for normalized metadata overrides
- `data/library-showcase.json` for visual showcase presentation
- `data/library-items.json` for curated apps/emulators/proxy/reference entries
- `data/featured-collections.json` for homepage/featured grouping

## Recommended next admin features
1. collection editor
2. item status flags (featured, hidden, broken, draft)
3. cover/thumb management
4. source provenance fields
5. dedupe review queue

## Editorial rules
- Prefer fewer better entries over giant filler catalogs.
- Mark non-playable references clearly.
- Keep proxy utilities isolated from normal play flows.
- Keep emulator save/input notes explicit.
