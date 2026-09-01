# Seed W0-3 — Mike auth design

**Project:** OPF Generation Plane  
**Agent:** Mike  
**Depends:** W0-0  
**Law:** spec §7 GP22a · P6 · `access_control/keys.py` `product:`  
**Out:** product code · copying `_require_tool_member` · IKI Store Woo (DRAFT)

## Ask

Design the gate for `GET /api/me/market/generation`:

1. Session required.
2. **Read** capability on a `product:` target key. Grammar exists (`keys.py:9, 37–44`).
3. **Do not** use `_require_tool_member()` (`trade_log/common.py:26` defaults `capability="write"` on `app:trade-log`).
4. Fail closed if no policy row (ST7 spirit; Store spec is DRAFT — do not wait on Woo).
5. Pricing `resolve` / `package-quote` / `lock` stay on their current gate (GP1a).

Write the design beside the spec, labeled Mike. Coach disposes.

## Done when

Review in `agents/p-opf-generation-plane/reviews/W0-3-mike.md`. P6 seed can execute after W0-G.
