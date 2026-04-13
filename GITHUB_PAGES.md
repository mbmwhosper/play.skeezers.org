# GitHub Pages deploy notes for play.skeezers.org

## Recommended free deployment path
Use GitHub Pages for the full site and keep Cloudflare only for DNS/domain management.

## Repo settings
- Branch: `main`
- Folder: `/ (root)`
- Custom domain: `play.skeezers.org`

## Steps
1. Open the GitHub repo settings for `mbmwhosper/play.skeezers.org`.
2. Go to **Pages**.
3. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Save.
5. In the custom domain box, set `play.skeezers.org`.
6. Wait for GitHub Pages to issue the site URL and certificate.
7. In Cloudflare DNS, point `play.skeezers.org` to GitHub Pages if it is not already pointed there.

## Notes
- `CNAME` is included in the repo for custom-domain continuity.
- Keep the same public domain so browser save continuity has the best chance to survive.
- `_redirects` and `_headers` are mostly Cloudflare-oriented and can remain in repo harmlessly.

## Smoke test
- homepage loads
- a few games launch
- `#item/<slug>` routes still work after refresh
- browser saves still appear for known games
