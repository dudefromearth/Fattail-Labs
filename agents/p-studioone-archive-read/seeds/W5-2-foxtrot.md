# Seed W5-2 — Foxtrot bounce

**Agent:** Foxtrot  
**Depends:** W5-1  
**Law:** SO-AR v0.8 + Amendment A1 · plan v2.1 · AT-SOAR-35, 45

**Same bounce as the secret.** Put `LABS_SSR_ARCHIVE_TOKEN` (≥32) in StudioOne `.env` (the dash run script sources it) **then** bounce `ai.fattail.labs.ssr-snapshot-dash` only. Do not bounce with the token absent — archive routes will 501 `ARCHIVE NOT CONFIGURED`, which is honest, but Labs replay will not work until the next bounce.

Do not commit the token. Collector HTML stays up either way.

Verify tap still running. Evidence for AT-SOAR-35 **and** AT-SOAR-45 (load vs cadence) with Alpha. Load book: `day=2026-08-25` SPX. A lost live snap fails the gate.
