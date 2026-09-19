# W3 — Demolition

**Depends:** W2-G PASS  
**Gate:** W3-G  
**Law:** `Specs/AZ-VP-9-A23.md` — overlay flag does not survive this packet.

## Do
- Delete overlay canvas (`sa-vp-overlay`), `overlayRef`, `redrawVp`, ResizeObserver redraw hook (`chart.resize` stays), unsubscribed time-range subscription at chart-create, 250 ms poll, post-setData/prefs/stream redraw blits.
- Consolidate remaining time-range subscriptions (refetch + H/L); every subscription unsubscribed in its own effect.
- Hit-test (`hitRects` / context menu) via primitive geometry or LWC 4.2.3 `hitTest` if present. Record which in the gate report.
- Remove stale "L2 custom series" comments.

## Gate W3-G
`git grep` shows no `redrawVp`, no overlay canvas, no poll. Context menu on a histogram bar still resolves.
