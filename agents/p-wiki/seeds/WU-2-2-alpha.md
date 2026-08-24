# WU-2-2 — Alpha public read API

**Plan:** Wiki Spec v0.2.1 III.2 · **GO WU-2**  
**Isolation:** `server/routes/wiki.py` (+ sitemap list). No session API change.

Published index/page/search/graph readable without a session. Drafts 404 for
anyone who is not an administrator. `GET /api/wiki/sitemap` published slugs
only. Compile/reindex stay gated.
