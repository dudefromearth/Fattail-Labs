# IKI Labs — GEX Toolset Acceptance Suite v1.0

**Status:** **DRAFT** — proposed. The evidence pack Delta gates on.
**Date:** 2026-09-01
**Canonical filename:** `agents/p-iki-gex/ACCEPTANCE-SUITE-v1_0.md`
**Consolidates:** Foundation v0.1/v0.2 · six tool specs · the Known Anomalies Register

**What this document adds.** It does **not** restate the tests — each lives in its owning spec and
that spec is authority. It adds the three things a scattered AT set cannot give you:

1. **The fixture inventory** (§1) — every test needs data, and most of these need *specific*,
   *awkward* data. Building the fixtures is the real work, and several tests share one.
2. **The gate map** (§2) — which tests must pass before which gate, so a phase exit is a checklist
   rather than a judgement.
3. **The law-coverage audit** (§4) — every law traced to the test that proves it, so a law without
   a test is **visible** rather than assumed.

---

## 1. Fixture inventory

**F1 — the fixture pack is a deliverable, not a by-product.** It is built at **GX1**, versioned,
and stored under `server/tests/fixtures/iki-gex/`. Half the suite is unrunnable without it, and
three fixtures are the difference between testing the doctrine and testing the happy path.

### 1.1 Recorded from the archive — real data, real defects

| Fixture | Source | Proves | Used by |
|---|---|---|---|
| **FX-ROLL** | 2026-08-28, 09:31:07 → 09:31:18, 62 contracts | The day roll: 59/62 in one 11 s pair; post-roll values 1–451, **never 0** | AT-GXF8, AT-NT3, AT-SP6, AN-V1 |
| **FX-ROLL-SLOW** | 2026-08-20, roll spread ~7 s in **two groups** | The roll is a **window, not an instant**, and is **per contract**. A detector tuned to FX-ROLL alone will pass and be wrong | AT-GXF8, AN-V1 |
| **FX-DEGRADED** | 2026-08-21 full session: **459 gaps / 7,862 s** | `complete: false`, disabled modes with reasons, statistics with denominators | AT-PF6, AT-SP5, AT-GS4, AN-N2 |
| **FX-BAND-SHIFT** | 2026-08-28 morning, `wings` 15 → 25 | Strikes entering mid-session render **absent, not zero**, and produce no burst at first sighting | AT-PF4, AT-NT13, AT-GS12, AN-V7 |
| **FX-POSTCLOSE** | `O:SPXW260828C07735000`, 15:59:50 → 19:59:59 (**+32**) | Post-close accrual is a **revision, not trading** | AT-SP3, AN-V2, GXF22 |
| **FX-GAP-54** | The 54.7 s RTH gap | A bucket holding one frame or none; no interpolation | AT-PF5, AT-NT2 |

### 1.2 Constructed — the cases the archive does not contain

| Fixture | Construction | Proves | Used by |
|---|---|---|---|
| **FX-CROSS3** | Chain with **three** cumulative sign changes | Every crossing rendered; no primary selected | AT-GP1, AT-SP2, AT-NC2 |
| **FX-CROSS0** | Chain with **no** crossing | `sign_changes: []`, regime from `net_gex` alone, **no interpolated value emitted** | AT-GP2 |
| **FX-NULLΓ** | Null Γ on one side at a strike; null OI at another | Invalid cells, **never zero** | AT-GP4, AT-GS7, AT-PF12 |
| **FX-HYGIENE-SPAN** | Contract dropped for quote reasons **across a bucket boundary**, then returning | Volume accounting bypasses hygiene; bucket marked; events decline to fire | AT-GXF9, AT-NT2 |
| **FX-HYGIENE-SUB** | Same drop **within** one bucket | **Zero distortion** — proves the bound in **GXF14**, not just the mechanism | AT-GXF9 |
| **FX-AMSETTLE** | Settlement-day chain containing AM-settled SPX with OI | Untradable contracts excluded from the 0DTE book | AT-GP10, AT-GS13 |
| **FX-HALFDAY** | Half-day session | Expiring window **13:00**, stated on the surface | AT-SP12, AN-M2 |
| **FX-EXPIRY-SPLIT** | Session spanning 16:00 → 16:15 | Expiring series **terminates settled** while full series continues | AT-SP3, GXF20 |
| **FX-NEXTURL** | Massive page carrying `next_url` | **Two callers, two laws**: batch producer follows and records `pages`; live path hard-errors and publishes **zero** rows | AT-GS3 |
| **FX-MULTIEXP** | Multi-expiry grid, front column saturating under global normalisation | Normalisation is a measurement statement; absolute values unchanged by mode | AT-GS5, AT-GS6 |
| **FX-BUBBLE-4X** | Two strikes, one at exactly 4× the other's `\|value\|` | Mark **area** ratio is 4:1, not radius | AT-NT1 |
| **FX-FLICKER** | Argmax strike changing for one bucket then reverting | Debounce holds; no `peak_change` | AT-NT5 |
| **FX-EARLY-DECAY** | Strike peaking at 09:38, falling 60 % by 09:40 | `observation_buckets` guard; a running max is not a max | AT-NT4 |

**F2 — FX-ROLL-SLOW and FX-HYGIENE-SUB are the two fixtures most likely to be skipped and least
safe to skip.** The first catches a roll detector tuned to a single day; the second is the only test
that proves **GXF14**'s *bound* rather than its mechanism — without it, an implementer can
over-correct a non-problem and nobody notices.

---

## 2. Gate map

A phase exits when its row passes **in full**. No partial exits (`INSTRUCTIONS` §6 — a waived gate
is a doctrine violation).

| Phase | Must pass | Gate owner |
|---|---|---|
| **GX1** | AT-GXF1–13 · **AT-GXF8** (roll, both fixtures) · **AT-GXF9** (both hygiene fixtures) · AT-AN1 · characterization suite green | India · Delta |
| **GX1-P** | AT-GS3 · P-GX3 evidence · rate isolation observed on the production host | Foxtrot · India |
| **GX2** | AT-GP1–2, 4–13 · AT-AN2/3/6 · browser walk | India · Echo · Tango · Delta |
| **GX3** | AT-PF13 · HM21f caching (zero re-reads on switch) · no second archive created | India · Foxtrot |
| **GX4** | AT-SP1–12 · recap reviewed as copy | Echo · Tango · Hotel · Delta |
| **GX5** | AT-PF1–13 · **AT-PF9** · AA contrast absent-vs-near-zero | Echo · Tango · Hotel · Delta |
| **GX6** | AT-NT1–13 · **AT-NT1** · **AT-NT2** | Echo · Tango · Delta |
| **GX7** | AT-GP3 · AT-NT10 · AT-GXF7 · P-GX2 closed | Hotel · India · Delta |
| **GX8** | AT-NC1–14 · **§4 misread metric clean** · Mike on the SSE topic | **Hotel** · Mike · Echo · Delta |
| **GX9** | AT-GS1–14 · plane has run long enough to read | India · Echo · Hotel · Delta |
| **GX-S** | AT-GXF14–17 · AT-AN1–13 · the **GXF52** twelve-row pack | **Coach** → Factory |

---

## 3. Cross-tool invariance — the tests that prove the family agrees

**F3 — these are the suite's highest-value tests**, because they fail exactly when the thing this
whole architecture exists to prevent has happened: two surfaces disagreeing about the same market.

| ID | Test | Owning spec |
|---|---|---|
| **AT-GP12** | Node Card and Session Path report **byte-identical** `net_gex`, `peak_abs` and `sign_changes` to the Profile for the same frame | Profile |
| **AT-NC13** | Card values byte-identical to Profile for the same frame | Node Card |
| **AT-SP1** | Path values byte-identical to Profile at the same bucket | Session Path |
| **AT-GXF3** | Two tools never disagree about the same strike at the same instant | Foundation |
| **AT-GXF4** | Template / lens / side / mode switch → **zero** chain HTTP and **zero** plane re-reads on a healthy stream | Foundation |

Run these on **every** fixture that touches more than one tool, not only the happy-path chain.

---

## 4. Law-coverage audit

**F4 — a law without a test is an intention.** This table is maintained as laws are added; a row
with no test ID is a visible gap, not a silent one.

| Law | Tested by | |
|---|---|---|
| GXF7–GXF9 formula, scale | AT-GP13, AT-GXF1 | ✅ |
| **GXF11** flow unsigned, no signed objects | **AT-GXF7**, AT-GP3, AT-NT10, AT-SP8, AT-NC11, AT-GS10 | ✅ |
| **GXF14** hygiene / volume separation | **AT-GXF9** (FX-HYGIENE-SPAN **and** FX-HYGIENE-SUB) | ✅ |
| **GXF15** roll before clamp | **AT-GXF8** (FX-ROLL **and** FX-ROLL-SLOW) | ✅ |
| GXF17 config fail-loud | AT-GXF2 | ✅ |
| GXF19–GXF21 windows, AM settlement | AT-SP3, AT-SP12, AT-GP10, AT-GS13 | ✅ |
| GXF22 post-close revision | AT-AN11 | ✅ |
| GXF25–GXF29 planes | AT-GS1–4, AT-PF13, AT-NT12 | ✅ |
| **GXF30–GXF34** coverage and declaration | **AT-AN1–3**, AT-GP7, AT-NC1 | ✅ |
| **GXF33** absence ≠ zero | **AT-AN6**, AT-GP4, AT-GS7, AT-PF4, AT-PF12 | ✅ |
| GXF35–GXF39 copy law | AT-GP11, AT-NC3, AT-PF9, AT-NT9, AT-SP7, AT-AN10 | ✅ |
| **GXF39** fixture counts on magnitudes | **AT-AN13** — *doc gate, not automated* | ⚠️ manual |
| GXF40 product names | — | ⚠️ **OD-GXF2, review not test** |
| GXF44–GXF46 Analyzer handoff | — | ⚠️ **no handoff in v1; tests land with the first emitting tool** |
| GXF48–GXF54 scope boundary | AT-GXF14–17 | ✅ |
| GP1–GP12 | AT-GP1–13 | ✅ |
| GS1–GS14 | AT-GS1–14 | ✅ |
| PF1–PF12 | AT-PF1–13 | ✅ |
| NT1–NT11 | AT-NT1–13 | ✅ |
| SP1–SP9 | AT-SP1–12 | ✅ |
| NC1–NC12 | AT-NC1–14 | ✅ |

**Three gaps, declared rather than hidden:** GXF39 and GXF40 are review gates, not automatable —
they are checked at the doc gate and recorded there. GXF44–46 have no tests because no v1 component
emits to the Analyzer; the tests land with the first one that does, and this row exists so that is
not forgotten.

---

## 5. Suite discipline

| | |
|---|---|
| **The set is closed at the counts above** | Further coverage belongs in seeds and gate reports, not in more spec rows. Reopening requires a new law, not more thoroughness (SVP precedent) |
| **Evidence, not assertion** | Every gate submission carries commands, output, curl transcripts and a browser walk. "It should work" is banned (invariant 4) |
| **Characterization first** | Every commit touching `server/` passes the existing suite before this one is consulted (invariant 10) |
| **Fixtures are versioned** | A fixture change that alters an expected value is a decision-log entry, not an edit |

---

## 6. Document control

| Version | Date | Notes |
|---|---|---|
| **v1.0** | 2026-09-01 | Initial consolidation. Fixture inventory (§1) — 6 recorded, 13 constructed, with FX-ROLL-SLOW and FX-HYGIENE-SUB flagged as most-skipped / least-safe. Gate map (§2). Cross-tool invariance set (§3). Law-coverage audit (§4) with three declared gaps |

**One-line law:**
**Every law traced to a test, every test traced to a fixture, every fixture built before the phase
that needs it — and the three laws that cannot be automated named as review gates rather than
quietly assumed.**