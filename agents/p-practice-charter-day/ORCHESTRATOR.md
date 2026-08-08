# p-practice-charter-day — Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute only via seeds.

| Doc | Path |
|-----|------|
| **Full Agent Bench Plan** | [`docs/Practice-Charter-Day-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Practice-Charter-Day-Full-Agent-Bench-Plan-v1.0.md) |
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Short plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| Seeds | [`seeds/`](./seeds/) |
| Gates | [`gate-reports/`](./gate-reports/) |

---

## Sequencing law

> **No product packets before W0-G (Coach GO).**  
> **F2 filter definition before J1 filter param.**  
> **Guide copy ships in the same PR as the feature (F1).**  
> **W0-4 strips live Guide before W0-G.**  
> **W0-G requires cold-start seeds on disk (S4) — not stub index rows.**  
> **Kilo evidence required on B-G / C-G / J-G.**  
> Practice B and Journey J may parallel after W0-G.

---

## Status board

**Program status:** **W0-G PASS — B ∥ J open**  
**Seating (S1–S4):** Kilo co-seats + K-gates · W0-4 Guide strip · J-G-Hotel · Mike on J1-1/J3-1 · cold-start seed rule — **LOCKED** in Full Bench Plan §1.1

| Phase | Intent | Status |
|-------|--------|--------|
| **W0** | GO + F1–F6 + S1–S4 + Guide strip + seed materialize | **PASS (W0-G)** |
| **B** | Frames, charter UI, Journal beats (F5); Kilo on B2-2/B4-2 | **LANDED** (see gate-reports/B-progress.md) |
| **C** | Retire+silent book (F4); Kilo on C1-1 | **C1 LANDED**; C2–C4 deferred |
| **J** | Compass J1–J3; Mike+Hotel+Kilo seated | **LANDED** (see gate-reports/J-progress.md) |
| **Z** | Program close | After B-G + J-G |

### Critical path

`W0-0 → W0-4 + W0-3 → W0-G → (B-G ∥ J1-0) → J-G → Z-G`

### Parallel

`B* ∥ J2* ∥ J1*` after F2 design · `C*` after B-G if capacity

---

## Gate checklist

| Gate | Agent | Status |
|------|-------|--------|
| W0-G | Delta | **PASS** 2026-08-08 |
| B-G-Tango / Echo / Hotel / **Kilo** | Tango · Echo · Hotel · Kilo | PENDING |
| B-G | Delta | PENDING |
| C-G-Tango / Hotel / **Kilo** | Tango · Hotel · Kilo | PENDING |
| C-G | Delta | PENDING |
| J-G-Tango / Echo / India / **Hotel** / **Mike** / **Kilo** | Tango · Echo · India · Hotel · Mike · Kilo | PENDING |
| J-G | Delta | PENDING |
| Z-G | Delta | PENDING |

**No waived gates.** Delta does not PASS product gates without named Kilo (and J Hotel/Mike) evidence.

---

## Full bench seated

Coach · Juliet · India · Alpha · Charlie · Echo · Mike · Foxtrot · Delta · **Kilo** · Lima · Tango · **Hotel**  

See Full Agent Bench Plan §2 + §1.1 seating amendments.
