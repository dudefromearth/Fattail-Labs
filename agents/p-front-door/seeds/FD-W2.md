# FD-W2 — Pages, routing, speed, nudge, evidence

**Project:** Front door. **Gate:** FD-G2.
**Callsigns:** Charlie, Foxtrot (app admission, not nginx), Alpha, Mike, Sierra, Echo, Tango, Kilo.

**In scope:** `/front-door`, `/front-door/start`, `/front-door/watch`, evidence moments, analytics drop-off, failed-payment nudge, speed bucket, referrer entry. SEO: canonical, noindex, FAQ JSON-LD from the offer file.

**Out of scope:** prod nginx, ranking pages, 301s, Discord, billing.py.

**Invariants:** referrer routing renders the entry. It does not redirect. Probe failure or 2g → slow, and slow hides the video. Page load must not store a device fingerprint. Terms acceptance does, after the notice. Usage source down → stale package, never "did nothing".

**Done when:** routing matrix, slow bucket, nudge, and a three-moment evidence package are covered by tests.
