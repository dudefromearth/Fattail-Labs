# Orchestrator — OPF Generation Plane

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

**Plan:** [`docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md`](../../docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md) **v1.1 + errata E1–E3**  
**Errata:** [`docs/OPF-Generation-Plane-Bench-Plan-v1.1-Errata.md`](../../docs/OPF-Generation-Plane-Bench-Plan-v1.1-Errata.md)  
**Law:** spec **v0.2.2** INDIA-SIGNED **with GP21 erratum** — not BUILD until `GP-W0`  
**W0 token:** [`agents/go/GP-W0.md`](../go/GP-W0.md)  
**Evidence:** GXA0 audit

```text
W0 → P0 docs → P1a infra → P1b wings-only interest → P2-0 keys
  → P2 hydrator → (P3 visibility ∥ P4 listed writer ∥ P6 auth) → W-G
```

| Phase | Name | State |
|-------|------|--------|
| **W0** | Coach · India · Mike · Hotel · Foxtrot · Tango · Lima · Delta | **W0-0 STAMP · W0-G PASS 2026-09-01.** Scope was W0 only. P0 **not** started |
| **P0** | Arch 30 honesty · GP18a + **GP21** errata · `chain_feed` f-string recorded | **P0-G PASS 2026-09-01.** DL-647. Does not start P1a |
| **P1a** | StudioTwo: **env + one plist** (probe 2026-09-01 14:34). Redis already up. **Do not load SSR capture.** | blocked on P0-G + OD-GP3 |
| **P1b** | `plane_interest.py` **wings-only** (Alpha) | blocked on P1a-G. Empty `PLANE_WINGS_TOPICS` → Delta **BLOCKED** not FAIL |
| **P2-0** | `keys.py` listed token, AT-GP22 alone | blocked on three DL-539 OKs |
| **P2** | In-process hydrator + namespace | blocked on P2-0-G |
| **P3** | Visibility GET | blocked on P2-G |
| **P4** | Listed writer — **no interest registration** | blocked on P2-G |
| **P6** | `product:` read auth | blocked on W0-3 |
| **W-G** | AT matrix · DL close · non-claim | blocked |

### Coach GO (do not)

Product code before W0-0 + W0-G · P2-0 before three DL-539 OKs · P1a before OD-GP3 · Foxtrot shipping Python in P1a · **loading `ssr-live-capture` to warm keys** · hydrator as a separate process · hydrator Massive · analytics on `supplied` · `_require_tool_member` on visibility · `archive_put` · `gex_v2` / Surface / Card · `--workers` > 1 · invent OPF Reference / L4-A v0.4 unless B4 ticked · label a wing window chain GEX · decorate interest topics · kill the API because the plane is off · **register listed pairs as interest** · **construct ladder topics outside `keys.py` (new code)** · raise `LABS_MB_CHAIN_TTL_S` to skip GP14

### One-line law

Feed and listed writer publish to their own keys; one in-process hydrator writes `owned`; what-if bodies land in `supplied`; the plane holds **wings** interest only, because interest is what the feed eats and the feed makes wings.
