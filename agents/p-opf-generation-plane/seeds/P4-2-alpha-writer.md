# Seed P4-2 — Alpha listed writer

**Project:** OPF Generation Plane  
**Agent:** Alpha  
**Depends:** P4-1  
**Law:** GP16–GP20 · AT-GP12 · AT-GP13 · OD-GP4  
**Files:** `server/opf/listed_writer.py` (new) · config · tests  
**Out:** `max_pages=3` as the bound · wings clamp · overwriting the wings Redis key · member-request path · `archive_put`

## Ask

1. No wings clamp. `allow_truncate=False`. Page until complete or fail loud. **Write nothing** on truncation (AT-GP12).
2. Page bound derives from listed count, not 3 (AT-GP13).
3. Redis key `mb:ladder:{ul}:{exp}:listed:dual` via `set_json` (same path → `mb:pub` → hydrator).
4. Envelope `book: "listed"`, `source: "listed_writer"` at **write**.
5. Enabled pairs = `LABS_OPF_LISTED_PAIRS`. Missing → writer does not start; hydrator keeps running (AT-GP15c).
6. Own cadence: on-demand + slow scheduled pass (OD-GP4). Never on a member request.
7. Measured budget GXA0: 18 pages / 3.87 s / 3.4 MB for 8 front SPX — do not treat as a cap; size config from pairs.

## Done when

Hotel P4-3. Kilo P4-4.
