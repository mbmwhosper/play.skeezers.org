# Skeezers Arcade v2 architecture

## Product direction
Build a custom game-and-app platform with a premium arcade launcher feel.

Use inspiration from Interstellar and DogeUB for app-shell structure, search flow, and mixed content navigation, without inheriting their clutter or proxy-first identity.

Use other source repos primarily as content and metadata inputs, not as direct UI templates.

## Core principles
- Same public domain: `play.skeezers.org`
- Preserve same-origin save continuity for games whenever possible
- Preserve legacy routes where practical
- Treat games, apps, and tools as first-class catalog items
- Keep the platform coherent and premium, not stitched together
- Prefer local/self-hosted experiences when feasible

## Top-level information architecture
- Home
- Games
- Apps
- Featured
- Recent
- Favorites
- Search
- Proxy (optional section, not the whole identity)

## Content model
Each catalog item should normalize into one of:
- `game`
- `app`
- `tool`
- `proxy`

Shared fields:
- `id`
- `slug`
- `type`
- `name`
- `description`
- `path`
- `url`
- `sourceType` (`local`, `flash`, `external`, `proxy`)
- `iframeSafe`
- `cover`
- `icon`
- `aliases`
- `categories`
- `genres`
- `tags`
- `players`
- `sessionLength`
- `moods`
- `featured`
- `broken`
- `controls`
- `developer`
- `releaseYear`
- `notes`

Type-specific examples:
- Games: players, session length, genres, controls
- Apps: utility type, online/offline, auth requirements
- Proxy: provider, warnings, launch method

## Homepage composition
1. Hero spotlight
   - featured title or featured collection
   - primary CTA: play/open
   - secondary CTA: resume
2. Continue rail
3. Featured shelves
   - multiplayer
   - quick hits
   - chill
   - strategy
   - newly added
4. Apps and tools rail
5. Spotlight section for flagship titles
6. Search/filter entrypoint

## Navigation model
Sidebar navigation on desktop, drawer on mobile.

Primary nav:
- Home
- Games
- Apps
- Featured
- Recent
- Favorites
- Search
- Proxy

Secondary utility actions:
- random
- continue
- command palette
- settings later

## Game detail page model
A game detail surface should include:
- cover art / hero
- title and launch CTA
- source type / save continuity note
- players / session length / genres / moods
- controls
- related games
- broken/report state
- launch options (embed, open tab, maybe fullscreen)

## App detail page model
- icon / hero
- what it does
- open CTA
- local vs external note
- safety or auth note when relevant
- related apps/tools

## Proxy section guidance
If included:
- isolate it visually and structurally from games
- make it a deliberate utility, not the homepage identity
- warnings should be explicit
- avoid mixing proxy actions into normal game discovery flows

## Design language
- dark premium launcher UI
- artwork-first presentation
- large feature panels
- compact, useful metadata
- fast scanability
- subtle motion, not noisy motion

## Implementation phases
### Phase 1: foundation
- normalized catalog
- save compatibility
- route compatibility
- Cloudflare Pages readiness

### Phase 2: shell redesign
- new nav system
- new homepage composition
- segmented sections for games/apps/proxy

### Phase 3: detail surfaces
- game detail pages
- app detail pages
- related item recommendations

### Phase 4: catalog expansion
- ingest curated sources
- dedupe and tag
- add artwork

### Phase 5: admin/editor UX
- easier metadata editing
- featured shelf management
- broken item management
