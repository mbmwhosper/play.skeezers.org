# Cloudflare Pages notes

Cloudflare Pages is currently not the recommended deployment target for `play.skeezers.org` because the site includes oversized game assets that exceed the platform's 25 MiB per-file limit.

## Recommended use of Cloudflare now
- Keep Cloudflare for DNS and proxying only
- Use GitHub Pages as the free full-site host

## If revisiting Cloudflare Pages later
The repo includes a `build:pages` path and `dist-pages/` preparation flow for a split-hosting strategy, but that requires external hosting for oversized assets.

## Current recommendation
- Deploy the full site via GitHub Pages
- Keep `play.skeezers.org` unchanged
- Use Cloudflare only for the custom domain and DNS layer
