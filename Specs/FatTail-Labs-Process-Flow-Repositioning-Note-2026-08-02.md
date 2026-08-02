# Process Flow — Product Repositioning (Coach)

**Date:** 2026-08-02  
**Status:** Coach direction — supersedes “keep the name Process Integrity” for *member framing* (DL-171 Option 2 was a different rename: trial “engagement” overall).  
**Decision log:** DL-190  
**Parents:** Journey Experience Spec · PI Scoring Guidance Spec v0.4 · `server/journey_scores.py`  
**Not yet shipped:** UI rename + full EWMA model (Track A evolution). As-built still exposes Process Integrity language until cutover.

---

## 1. Problem

“Process Integrity **score**” reads like a test result — a number you got after assessment. That mismatches what the meter is for.

Coach framing (2026-08-02):

> It is not so much a score as what I got after the test. It is a **state of being**; it is the **flow state of your trading**. We should reposition it that way, and score it that way. That is why there should be an **exponential average** and **weight** applied to key parts so that **more recent data is weighted more heavily**.

---

## 2. Name and language

| Layer | Direction |
|-------|-----------|
| **Member-facing name** | **Process Flow** (working name — Coach may tweak) |
| **One-line** | The flow state of your trading process — a **state of being**, not a quiz grade |
| **Avoid in UI chrome** | Leading with “score,” “test,” “exam,” “rank” |
| **Prefer** | Flow, state, standing, rhythm, “where your process is” |
| **Still allowed internally** | Numeric raw 0–100, grade bands (Poor→Excellent), API field keys during migration |
| **API / code (migration)** | Keep `process` payload key until a versioned rename; add `display_name` / framing string first if needed |
| **Privacy** | Unchanged — private; never peer rank or P&L |

**Rejected framing:** Process Flow as a public leaderboard, P&L-linked “flow,” or engagement-only show-up meter.

**Relation to DL-171:** Option 1 **weight rebalance** (adherence + retrospective real weight) **stays**. This note is **not** the rejected “rename trial overall to Practice engagement.” This is a **product concept rename + time-decay scoring** for the same integrity thesis.

---

## 3. Conceptual model

```
Life + trading routines (Toughness, Practice, courses, live)
        ↓  repeated honest use
   Process Flow  =  current state of being in process
        ↑
   Recent behavior dominates (EWMA / exponential decay)
```

- **High Process Flow** ≈ process is coherent and current — habits holding under load.  
- **Low / drifting Process Flow** ≈ process is fragmented or stale — reinstall routine (no identity attack).  
- **Establishing** still applies for new members (empty ≠ failure; no day-one Poor as identity).

Toughness, Practice, learning, and live are **inputs to the state**, not separate score games.

---

## 4. Scoring direction (Track A evolution)

### 4.1 Intent

1. **Dimension weights** (quality vs engagement) remain profile-based — Option 1 tables as starting point.  
2. **Time weights:** key dimensions (and the overall state) use **exponential moving average / decay** so **recent weeks dominate**.  
3. Language: “weight recent behavior more heavily” — never “punish” (v0.4 §3.9).

### 4.2 As-built gap

| Surface | Today | Target |
|---------|--------|--------|
| Live presence | **EWMA** of weekly check-ins (half-life 4w) | Keep; tune half-life with Coach if needed |
| Other meters | Window counts / ratios (flat window) | **EWMA or exponential weight** over sub-periods (e.g. weekly bins) |
| Overall | Weighted mean of current raws | Weighted mean of **time-decayed** dimension states; optional outer EWMA of overall for display stability |

### 4.3 Design requirements (for next scoring model version)

| ID | Requirement |
|----|-------------|
| PF-S1 | Publish `scoring_model_version` bump (e.g. `process-flow-ewma-v1`) on cutover. |
| PF-S2 | Configurable half-lives per dimension class (engagement vs quality) — fail loud if missing. |
| PF-S3 | Quality dimensions (adherence, retrospective, later MT when enrolled) keep **real composite weight** *and* recent-emphasis in their time series. |
| PF-S4 | Dual-empty adherence and empty≠zero invariants unchanged. |
| PF-S5 | Shadow field during migration (`overall_raw_next` or internal) before member-visible cutover. |
| PF-S6 | Tenure / Establishing still softens day-one extremes — do not replace EWMA with engagement-majority weights. |
| PF-S7 | No P&L, win rate, or conversion-tuned weights (I1, I11). |

### 4.4 Suggested default half-lives (proposal — Coach may edit)

| Class | Example meters | Proposed half-life |
|-------|----------------|--------------------|
| Community presence | `live` | 4 weeks (as-built) |
| Tool engagement | `persistence`, `routine`, `learning` | 3–4 weeks |
| Practice quality | `adherence`, `retrospective` | 2–3 weeks (quality drift surfaces faster) |
| Mental toughness | when enrolled | align with Hard active window |

Exact numbers are Alpha/Coach calibration, not locked in this note.

---

## 5. UI / copy implications (when shipping rename)

- Journey card title: **Process Flow** (not “Process Integrity score”).  
- Framing string: state-of-being language; grade blurbs describe **flow condition**, not exam outcome.  
- Guide, Toughness hub, Retrospective copy: “feeds Process Flow” not “raises your PI score.”  
- Course spine (`fattail-labs-os`): Module 2 uses Process Flow framing.  
- Grades (Poor→Excellent) may remain as **state labels** if Tango-safe; re-copy blurbs away from “integrity score.”

---

## 6. Implementation sequence (suggested)

1. **This note + DL-190** (done with landing).  
2. Course spine + Guide language (member education first).  
3. Spec v0.5 / Journey Experience amend: rename + EWMA formulas (India).  
4. Alpha: `journey_scores.py` model version + tests + shadow.  
5. Charlie/Echo: UI strings + ProcessMeter blurbs.  
6. Lima: decision log closeout; strike dual SSOT.

---

## 7. Open Coach choices

| # | Choice | Default if no edit |
|---|--------|-------------------|
| 1 | Final public string: **Process Flow** vs “Trading Flow” vs other | **Process Flow** |
| 2 | Keep grade words Poor→Excellent under new name? | Yes, re-blurb only |
| 3 | Half-life table | Proposal §4.4 |
| 4 | API rename `process` → `process_flow` | Defer; framing first |

---

**Cross-ref:** DL-171 (Option 1 weights) · DL-172 (P0 ship) · DL-166 (live EWMA) · Toughness / aMCC life-routines thesis (course spine Module 6).
