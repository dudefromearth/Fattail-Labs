# W0-2 — India spec / architecture

**Agent:** India  
**HEAD:** `374ed86`  
**Date:** 2026-09-01  
**Substitution used:** `docs/OPF-REFERENCE-v1_1.md` absent — read GXA0 + spec §2 and §10. Did not author the Reference or L4-A v0.4.

**Verdict:** **APPROVED** for W0 (spec is build-ready). Carries for **later** packets: Arch 30 honesty is P0 (not this GO); L4-A v0.4 missing (named); DL-539 1/3 so §8 files stay frozen.

Coach Content Law: nothing of spec GP1–GP24 dropped. GP21 erratum sits beside GP21 as signed.

---

## Tree vs law (path + line)

| Law | Tree | Result |
|-----|------|--------|
| F8 / GP1 | `_store = ContractStore()` `routes/pricing.py:28`; `_hydrate` body-only `:95–115`; `from_ladder_payload` not on a route | **Design closes F8** (hydrator + `owned`). Not closed in code. W0 must not pretend it is. |
| GP2b namespace is a **key** | `put`/`get` use `gen.key.bus_key()` only (`generation.py:59–64`). No namespace. `get_by_expiration` first-match `:66–72` — coin flip once two books exist (GP2c). | **Gap = P2-1.** Spec is the fix. |
| AT-GP2 helper | `store_read.py` **does not exist** | **P2-1.** No analytics URL exists. Correct. |
| Listed key + parser | `bus_ladder_key` hardcodes `w{int(wings)}:dual` (`keys.py:40–42`). Dual parse requires `_WINGS_RE` at −2 (`:65–68`). `…:listed:dual` → `None` today. End-anchored underlier join `:72` keeps `I:SPX`. | **P2-0** (Coach: AT-GP22 plan default). Hydrator must not land first. |
| Three clocks | Redis EX `max(2, int(ttl*3))` (`store.py:41–44`) → **6 s**. Interest `ex=grace` 45 s (`:56–58`). `InterestManager` never expires (`interest.py:31–36`). | **As-built matches GP8.** Refcount is not warmth (GP9). |
| GP11 in-process | No `hydrator.py`. Comment “or bus” at `pricing.py:27` is false. | **P2-2.** |
| GP23 workers=1 | StudioTwo uvicorn `--port 4001` **no `--workers`** (pid 79091). MiniTwo same (GXA0). No boot assert in code. | **P2-2 AT-GP19.** Latent today. |
| GP1a | `opfPricingApi.ts` posts `generations`; `_hydrate` still the path | **Preserve.** Do not break. |
| GP21 erratum | `chain_feed.py:59–62` `f"…:w{wings}:dual"` — listed `wings=None` → `wNone` after P2-0 | **Accept.** Interest is feed input; feed makes wings. P1b wings-only. |
| Arch 30 honesty | §10:299 “hours-scale TTL” vs 6 s. §11:312 “SoR for multi-worker” vs process dict. §17b:425 “19” ATs vs 20 collected. §4 topology not running on MiniTwo or StudioTwo (`mb:*` = 0, no chain_feed). §6.1 pagination: only Heatmap `max_pages=3` `allow_truncate=False` (`chain_ladder.py:308–309`). | **P0 list. Not silent. Not this GO.** |
| L4-A frozen | Tree has v0.1 only. **v0.4 missing.** | Named. Frozen. |
| OPF Reference | **Missing.** Substitution used. | Named. |

## APPROVED means

W0 may close. **Does not** authorize P0, P1a, or §8 edits. Namespace, listed parse, hydrator, and Arch 30 honesty remain sequenced as the plan at `374ed86` says.
