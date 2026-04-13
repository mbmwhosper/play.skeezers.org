# Skeezers Arcade v2 deploy checklist

## Recommended current deployment path
Use GitHub Pages for the full site, with Cloudflare only handling DNS/custom-domain routing.

## GitHub Pages settings
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`
- Custom domain: `play.skeezers.org`

## What is already done in repo
- rebuilt catalog and curated collections are generated into `js/catalog-v2.js`
- legacy route compatibility is in place
- custom domain file `CNAME` is present
- site is pushed to `main`

## What to verify after publish
1. GitHub Pages is enabled for `main` root
2. `play.skeezers.org` is set as the custom domain in GitHub Pages
3. Cloudflare DNS points `play.skeezers.org` at GitHub Pages
4. homepage loads correctly
5. `#item/<slug>` and legacy `#game/<slug>` links reopen correctly on refresh
6. a few known games still preserve local save continuity under `play.skeezers.org`

## Manual smoke test
- launch a few iframe-safe local games
- open one app/reference surface
- open one emulator detail page
- test mobile nav/menu
- verify continue/recent/favorites still persist in browser storage
