# WU-2-3 — Charlie public wiki UI + contamination sweep

**Plan:** Wiki Spec v0.2.1 III.2 · **GO WU-2**  
**Isolation:** `web/app/app/wiki/**`, `web/app/sitemap.ts`, wiki JSON-LD helper.

Remove sign-in walls on published entry/article/search/graph. Article metadata
+ Article JSON-LD (Sierra). Never render “In your practice” for anonymous.
Do not touch AppChrome / root layout / HelpLauncher.
