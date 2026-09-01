# W0-3 — Mike auth design (P6)

**Agent:** Mike  
**HEAD:** `374ed86`  
**Date:** 2026-09-01  
**Out honored:** no product code · did not copy `_require_tool_member` · did not wait on Woo

**Verdict:** **APPROVED** as design for P6 / visibility. Coach disposes the slug. Labeled Mike.

---

## Gate for `GET /api/me/market/generation`

1. **`require_session`** (`guards.py:84–91`) — 401 if no cookie / bad session. Same as pricing.
2. **Read capability on a `product:` target.** Grammar exists (`access_control/keys.py:9`, `TargetKind.PRODUCT` `:40`, `build` `:182–185`). Example in-tree: `product:heatmap-gex`.
3. **Do not call `_require_tool_member()`.** Default `capability="write"` on `app:trade-log` (`trade_log/common.py:26–27`). A read-only grid would require Trade Log write. That is a defect if copied.
4. **Fail closed.** `TargetKind.PRODUCT` default is `PRODUCT_FAIL_CLOSED` (`defaults.py:116–125`): no policy → DENY. ST7 spirit; IKI Store is DRAFT — do not wait on Woo.
5. **Pricing `resolve` / `package-quote` / `lock` stay on their current gate** (GP1a). This design is visibility/P6 only.

## Recommended wiring (Mike — Coach may discard)

| Item | Recommendation |
|------|----------------|
| Target key | `product:opf-generation` *(new slug; not `app:trade-log`, not `product:heatmap-gex`)* |
| Evaluate | `evaluate(target_key, viewer, policy=load_policy(...), meta=…)` then `decision.has_capability("read")` |
| No policy | 403, fail closed, named |
| Session missing | 401 from `require_session` |
| Admin | existing admin short-circuit in evaluate, if any — do not invent a second admin path |

P6 lands the policy row. P3 may ship 401/403 fail-closed “waits on P6” rather than Trade Log write.

## Not this packet

Woo product, IKI Store ST1 seam, role elevation.
