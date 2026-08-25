# Orchestrator — IKI Factory

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

**Spec:** Factory Spec v0.1.5 **BUILD AUTHORITY** (**DL-556**)  
**Plan:** [`docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md`](../../docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md)  
**Token:** [`agents/go/IKI-FACTORY-IF5.md`](../go/IKI-FACTORY-IF5.md)  
**Charter:** `agents/bench/gemba.md` — seated, **do not edit**.

### Critical path

```text
BUILD DL-556
  → W0 DONE (read-only)
  → GO IF-1 (B2 suite /app/iki/factory)
    → IF-1 seeds → IF-1-G PASS
  → GO IF-2 (empty registry fail-loud)
    → IF-2 seeds → IF-2-G PASS
  → GO IF-3 (Spec draft + conveyor Spec→Build)
    → IF-3 seeds → IF-3-G PASS
  → GO IF-4 (B5 Factory Live + Woo stub + publication signal)
    → IF-4 seeds → IF-4-G PASS
  → GO IF-5 (hardening)
    → IF-5 seeds → IF-5-G PASS
  → stop — store / WC API is a later program
```

| Phase | State |
|-------|--------|
| W0 | **DONE** (Coach noted inventory) |
| **GO IF-1** | **granted** 2026-08-23 · B2 admin `/admin/iki-factory` |
| IF-1 | **landed** |
| IF-1-G | **PASS** `gate-reports/IF-1-G.md` (pytest + browser walk `evidence/if1-g/`) |
| **SC-0** | **PASS** `gate-reports/SC-0-G.md` · **DL-565** (four diffs) |
| **GO IF-2** | **granted** 2026-08-24 · **DL-567** |
| IF-2 | **landed** (empty registry fail-loud) |
| IF-2-G | **PASS** `gate-reports/IF-2-G.md` |
| **GO IF-3** | **granted** 2026-08-24 · **DL-569** |
| IF-3 | **landed** (Spec draft + conveyor Spec→Build) |
| IF-3-G | **PASS** `gate-reports/IF-3-G.md` |
| **GO IF-4** | **granted** 2026-08-24 · **DL-577** · B5 Factory Live (no Runner) |
| IF-4 | **landed** (Deploy + Live + Woo mock-tested + publication signal) |
| IF-4-G | **PASS** `gate-reports/IF-4-G.md` |
| **GO IF-5** | **granted** 2026-08-24 · **DL-578** |
| IF-5 | **landed** (hardening; Woo remains stub) |
| IF-5-G | **PASS** `gate-reports/IF-5-G.md` |
| Store / WC API | **not granted** — seam `iki_factory_woo.woo_step` |

### Do not

- Build the WC API / store.  
- Touch `gemba.md`.  
- Write Runner (`web/lib/runner/**`).  
- Share `content_items` / edit `BoardKanban.tsx`.  
- Write Wiki envelopes, `contracts:deliver`, or wiki page bytes.  
