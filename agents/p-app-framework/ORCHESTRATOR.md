# P-App-Framework — Orchestrator Playbook

**Charter:** [`CHARTER.md`](./CHARTER.md)  
**Your role:** Coach / orchestrator only. Open agent sessions, load seeds, receive
**PASS / FAIL / BLOCKED**. Do not execute specialist packets personally.  
**Repo:** `/Users/ernie/Fattail-Labs`  
**Governance:** `agents/bench/doctrine.md` · `first-principles-doctrine.md` · Delta ternary gates  

**Specs:**  
- Application Framework v1.0 (draft → approve in W0)  
- Member Data & Privacy v0.1 (draft → approve in W0)  

---

## How you work at each junction

1. Read **Current junction** and the board below.  
2. Confirm **dependencies** for the next seed are PASS.  
3. Open a session; load: `Load and execute agents/p-app-framework/seeds/<file>.md`.  
4. Agent reports PASS / FAIL / BLOCKED + evidence.  
5. You: **advance · re-seed · stop** (product decision).  
6. Every wave ends at a **Delta gate** — no waived gates.  
7. Lima logs decisions the same day they are made.

---

## Board (status)

| Wave | Step | Status | Who | Seed |
|------|------|--------|-----|------|
| **W0** | Spec review — India (framework + privacy) | **PASS** (2026-07-25) | India | `gate-reports/w0-india-review.md` |
| W0 | Spec review — Mike (privacy / isolation) | **PASS** (2026-07-25) | Mike | `gate-reports/w0-mike-review.md` |
| W0 | Spec review — Echo + Tango (HIG + trust) | **PASS** (2026-07-25) | Echo, Tango | `gate-reports/w0-echo-tango-review.md` |
| W0 | Spec review — Hotel + Sierra (process + metrics) | **PASS** (2026-07-25) | Hotel, Sierra | `gate-reports/w0-hotel-sierra-review.md` |
| W0 | Coach approval + Lima log F-D1, T-D1..T-D5, Privacy D-* | **PASS** (2026-07-25) | Coach, Lima | decision log + specs status |
| W0 | **Gate 0 — Specs locked** | **PASS** | Delta | `gate-reports/gate-0.md` |
| **W1** | Family A stay-put audit + characterization tests | **PASS** | Kilo, Charlie | `gate-reports/w1-stayput-evidence.md` |
| W1 | Course Presentation gaps (reload, tab, lists) | **PASS** (pre-satisfied) | Charlie, Alpha | EditContext/CourseTabs already in-place |
| W1 | Hub FAQ list + Calendar stay-put | **PASS** (pre-satisfied) | Charlie | no reload in hub/live hosts |
| W1 | **Gate 1 — Family A framework** | **PASS** | Delta | `gate-reports/gate-1.md` |
| **W2** | Privacy data model + consent/audit schema | pending | Mike, India, Alpha | `seeds/w2-mike-alpha-privacy-schema.md` |
| W2 | Isolation middleware + member-scoped API skeleton | pending | Alpha, Mike | `seeds/w2-alpha-mike-isolation-api.md` |
| W2 | **Gate 2 — Privacy spine** | pending | Delta | `seeds/gate2-delta-privacy-spine.md` |
| **W3** | Journey template on existing progress | pending | Charlie, Alpha, India | `seeds/w3-charlie-alpha-journey.md` |
| W3 | Entitlements for Family B tools | pending | Mike, Alpha | `seeds/w3-mike-alpha-entitlements.md` |
| W3 | **Gate 3 — Journey + entitlements** | pending | Delta | `seeds/gate3-delta-journey.md` |
| **W4** | Trade Log domain + UI (process-first) | pending | Alpha, Charlie, Hotel, Tango | `seeds/w4-trade-log.md` |
| W4 | **Gate 4 — Trade Log MVP** | pending | Delta | `seeds/gate4-delta-trade-log.md` |
| **W5** | Journal (Calendar variant) | pending | Alpha, Charlie, Echo | `seeds/w5-journal.md` |
| W5 | **Gate 5 — Journal** | pending | Delta | `seeds/gate5-delta-journal.md` |
| **W6** | Playbook + optional Method Exemplar | pending | Alpha, Charlie, Sierra | `seeds/w6-playbook-exemplar.md` |
| W6 | **Gate 6 — Playbook** | pending | Delta | `seeds/gate6-delta-playbook.md` |
| **W7** | Admin aggregates + consented examination | pending | Alpha, Mike, Charlie | `seeds/w7-admin-access.md` |
| W7 | **Gate 7 — Admin privacy modes** | pending | Delta | `seeds/gate7-delta-admin-access.md` |
| **W8** | Docs, ADMIN-GUIDE, suite green, hard close | pending | Lima, Kilo, Foxtrot | `seeds/w8-lima-kilo-harden.md` |
| W8 | **Gate 8 — Project close** | pending | Delta | `seeds/gate8-delta-close.md` |

---

## Current junction → what you do

### NOW: Cut A complete — await Coach for Cut B (W2+)

| Gate | Status |
|------|--------|
| Gate 0 Specs locked | **PASS** |
| Gate 1 Family A framework | **PASS** |

**Cut A (W0+W1) is done.** Characterization: `tests/test_framework_stayput_contract.py`.

**Next (only if Coach opens Cut B):**  
`seeds/w2-mike-alpha-privacy-schema.md` → privacy spine → Journey → Trade Log…

Do **not** auto-start Family B without Coach.

---

## Dependency graph

```
W0 Specs locked
 └── W1 Family A formalize ── Gate 1
      └── W2 Privacy spine ── Gate 2
           ├── W3 Journey + entitlements ── Gate 3
           │    └── W4 Trade Log ── Gate 4
           │         └── W5 Journal ── Gate 5
           │              └── W6 Playbook ── Gate 6
           └── W7 Admin access (needs W2; better after W4 has content) ── Gate 7
                └── W8 Close ── Gate 8
```

W7 may run after W2 if stubs exist; real AF10/AF11 evidence needs at least one Family B
content surface (prefer after W4).

---

## Agent pairing matrix

| Wave | Lead | Support | Review / gate |
|------|------|---------|----------------|
| W0 | India, Mike | Echo, Tango, Hotel, Sierra | Coach, Lima, Delta |
| W1 | Charlie | Alpha, Kilo | Echo (HIG), Delta |
| W2 | Mike | Alpha, India | Delta |
| W3 | Charlie + Alpha | Mike, India | Delta |
| W4 | Alpha + Charlie | Hotel, Tango, Kilo | Delta |
| W5 | Charlie + Alpha | Echo, Tango | Delta |
| W6 | Charlie + Alpha | Sierra (exemplar SEO if public) | Delta |
| W7 | Mike + Alpha | Charlie | Delta |
| W8 | Lima + Kilo | Foxtrot (if deploy) | Delta |

---

## Invariants (every seed)

1. Standalone repo — no MSC imports.  
2. Config fail-loud; no silent defaults for secrets/ports.  
3. Evidence over assertion — curl/output/browser for claims.  
4. Change control — declare files before touch.  
5. Stay-put (Application Framework A4) — no reload on edit success.  
6. Process-not-profit in all member-tool copy and aggregates.  
7. Privacy: no admin raw content without consent (Member-Data-Privacy).  
8. Documentation parity — specs + decision log with the work.  

---

## Out of scope (entire project unless Coach expands)

- Template builder UI  
- Social feed / member-public sharing of tools  
- Agent-authored templates  
- Replacing LearnDash migration scripts (historical)  
- MSC Node Admin supervision of Labs (Foxtrot deploy remains launchd on MiniTwo)  

---

## Gate reports

File under `gate-reports/gate-N.md` with: verdict, command evidence, gaps, next wave.

---

## Seeds index

| Seed | Agent(s) |
|------|----------|
| `w0-india-spec-review.md` | India |
| `w0-mike-privacy-review.md` | Mike |
| `w0-echo-tango-ux-review.md` | Echo, Tango |
| `w0-hotel-sierra-doctrine-review.md` | Hotel, Sierra |
| `w0-coach-lima-approve.md` | Coach, Lima |
| `gate0-delta-specs-locked.md` | Delta |
| `w1-kilo-charlie-family-a-stayput.md` | Kilo, Charlie |
| `w1-charlie-alpha-course-shell.md` | Charlie, Alpha |
| `w1-charlie-hub-calendar.md` | Charlie |
| `gate1-delta-family-a.md` | Delta |
| `w2-mike-alpha-privacy-schema.md` | Mike, Alpha, India |
| `w2-alpha-mike-isolation-api.md` | Alpha, Mike |
| `gate2-delta-privacy-spine.md` | Delta |
| `w3-charlie-alpha-journey.md` | Charlie, Alpha |
| `w3-mike-alpha-entitlements.md` | Mike, Alpha |
| `gate3-delta-journey.md` | Delta |
| `w4-trade-log.md` | Alpha, Charlie, Hotel, Tango |
| `gate4-delta-trade-log.md` | Delta |
| `w5-journal.md` | Alpha, Charlie |
| `gate5-delta-journal.md` | Delta |
| `w6-playbook-exemplar.md` | Alpha, Charlie |
| `gate6-delta-playbook.md` | Delta |
| `w7-admin-access.md` | Alpha, Mike, Charlie |
| `gate7-delta-admin-access.md` | Delta |
| `w8-lima-kilo-harden.md` | Lima, Kilo |
| `gate8-delta-close.md` | Delta |
