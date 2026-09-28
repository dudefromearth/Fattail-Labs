# I0 — India · spec alignment (read only)

**Project:** p-opf-band-2p5sigma  
**Spec:** `docs/OPF-Band-2p5sigma-0-5DTE-v0_1.md`  
**Out of scope:** code, Labs UI, a second Massive client without a Coach finding.

Confirm: band is per-expiry 2.5σ + 0.25 lead, ratchet union, 0DTE included; Q1 is 2.5σ everywhere; feed must cover `active(t)`; `/api/books` is named; `snap_files` glob is named; no Labs control changes. Flag if two taps cannot share one Redis interest set without starving live (CP-1). Do not invent a topic schema beyond the spec’s three options.
