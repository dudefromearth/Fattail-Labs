# Retrospective report DTO (v0.5 / as-built v0.6)

**Authority:** Journal Retrospective Spec v0.5 §6 · as-built **v0.6** · p-retrospective **RT2-1**  
**Status:** **AS-BUILT** — gather v0.5 + comparison RT3 + habits/agent/cadence through RT7-G  
**Isolation:** Family B — all fields are private to `identity_id` (Mike §10.1)

Charlie builds layout against **this** shape. Alpha implements fields in RT2-2+;
missing sections use honest empty arrays / `null` — never invent scores.

---

## 1. API envelope (workspace GET/POST)

`GET/POST /api/me/retrospectives/{id}` and create response:

```json
{
  "id": 1,
  "status": "ready",
  "is_maiden": true,
  "scope_start": "2026-06-01T00:00:00+00:00",
  "scope_end": "2026-07-29T16:00:00+00:00",
  "title": "Maiden journey",
  "body_md": "",
  "report": { "... report_json …" },
  "comparison": { "... comparison_json …" },
  "agent": null,
  "completed_at": null,
  "created_at": "…",
  "updated_at": "…",
  "profile": {
    "retrospective_pnl_expanded": false
  }
}
```

| Field | Notes |
|-------|--------|
| `report` | Spec §6 content (below). Null until first gather. |
| `comparison` | Spec §7 — normalized + `comparable` (RT3); present after gather. |
| `agent` | Null until analyze; local mode only (R5). |
| `profile.retrospective_pnl_expanded` | From `identities` (R1b). Default **false**. Charlie: book section open state. Optional on API until RT2-2/RT2-3 wires it — if absent, treat as `false`. |
| `body_md` | Member reflection (§6 step 8) — not inside `report`. |

**Render order (UI):** Spec §6 — carry-forward → process → integrity → deviations → what worked → expected vs actual → **book last (collapsed)** → body → agent.

---

## 2. `report` object — target version **0.5**

```json
{
  "version": "0.5",
  "meta": {
    "is_maiden": true,
    "scope_start": "ISO-8601",
    "scope_end": "ISO-8601",
    "window_days": 42,
    "trade_count": 12,
    "min_inference_n": 20
  },
  "carry_forward": null,
  "process": { },
  "integrity_review": { },
  "deviations": [],
  "what_worked": [],
  "expected_vs_actual": null,
  "book_performance": { }
}
```

### 2.1 `meta`

| Field | Type | Meaning |
|-------|------|---------|
| `is_maiden` | bool | First complete-boundary baseline |
| `scope_start` / `scope_end` | ISO string | Window used at gather (Option C: end = gather time) |
| `window_days` | int | Calendar days in window (inclusive rules match domain) |
| `trade_count` | int | Trades in window (same n as book / sample gate) |
| `min_inference_n` | int | Always **20** (`MIN_INFERENCE_N` Hotel RT0-2) |

### 2.2 `carry_forward` (§6.0) — R4 fills; R2b may null/omit content

```json
{
  "plans": [
    {
      "id": 1,
      "title": "…",
      "habit": "…",
      "observable_signal": "routine_days",
      "committed_on": "ISO",
      "signal_this_window": 4.4,
      "signal_prior_window": 3.1,
      "signal_unit": "days_per_week",
      "self_assessment": null
    }
  ],
  "empty_message": "No plans carried in — this is where they'll appear next time."
}
```

| Rule | |
|------|--|
| Maiden | `carry_forward` = **`null`** (section absent) |
| No prior plans | object with `plans: []` + `empty_message` (Tango) |
| Self-assessment | `kept` \| `partial` \| `lapsed` \| null — **member-set only** |

### 2.3 `process` (§6.1)

```json
{
  "framing": "process_performance",
  "headline": "Process performance",
  "window_days": 42,
  "adherence": {
    "followed": 0,
    "partial": 0,
    "broke": 0,
    "unknown_or_other": 0,
    "total": 0,
    "followed_or_partial_rate": null
  },
  "routine": {
    "trade_days": 0,
    "journal_notes": 0,
    "activity_days_per_week": null
  },
  "live": { "checkins": 0, "checkins_per_week": null },
  "learning": { "lessons_completed": 0, "lesson_days_per_week": null },
  "note": "How you practiced in this window — habits, not P&L theater."
}
```

Rates may be `null` when denominator is zero. RT2-2 must emit rates when computable (§7 normal form).

### 2.4 `integrity_review` (§6.2)

```json
{
  "headline": "Process Integrity review",
  "grade": "Good",
  "grade_id": "good",
  "blurb": "…",
  "overall_percent": 62.0,
  "overall_raw_percent": 58.0,
  "establishing": false,
  "direction": null,
  "drivers": [
    {
      "id": "journal",
      "label": "Journal",
      "percent": 70,
      "grade": "Good",
      "detail": "…"
    }
  ],
  "note": "Integrity describes how you practiced — not whether the book made money."
}
```

| Field | Notes |
|-------|--------|
| `direction` | `improved` \| `stable` \| `slipped` \| **null** if maiden / not comparable (RT3b hardens) |
| Grades | Work vocabulary only — never person-shaming (Tango) |

### 2.5 `deviations[]` (§6.3) — max **5**

```json
{
  "kind": "adherence_broke",
  "label": "Trades tagged broke",
  "count": 3,
  "rate": 0.15,
  "most_recent_at": "ISO",
  "deep_link": "/app/trade-log?…",
  "note": null
}
```

| `kind` (initial set) | |
|----------------------|--|
| `adherence_broke` | Tag `broke` in window |
| `journal_activity_gap` | ≥ **3** consecutive calendar days with neither journal nor Trade Log activity |
| `live_miss` | Optional later |

Empty array = no deviations (honest).

### 2.6 `what_worked[]` (§6.4) — max **3**

```json
{
  "observation": "9 consecutive trades tagged followed",
  "evidence": "adherence run",
  "window_n": 9
}
```

Empty array OK until data exists. **No P&L figures** in this section.

### 2.7 `expected_vs_actual` (§6.5)

- **`null`** if no `pre_market` journal entries in window (section **absent**).  
- Else array of:

```json
{
  "day": "2026-07-10",
  "stated_intent": "verbatim pre_market text",
  "what_executed": "summary of trades + adherence that day",
  "gap": null
}
```

`stated_intent` is **verbatim** (never system paraphrase). `gap` member-authored later.

### 2.8 `book_performance` (§6.6) — **last in UI**

```json
{
  "framing": "book_performance_neutral",
  "headline": "Book performance (results)",
  "collapsed_summary": "Book performance (results) — neutral sample from this window. Expand when you want the numbers.",
  "trade_count": 12,
  "trades_with_pnl": 10,
  "min_inference_n": 20,
  "sample_below_min": true,
  "sample_banner": "This is a small sample. It describes what happened; it does not measure process quality.",
  "net_pnl": -120.5,
  "winners": 4,
  "losers": 6,
  "by_account": null,
  "note": "Neutral book context for process review — not a success score and not marketing performance."
}
```

| Field | Rule |
|-------|------|
| `sample_below_min` | `trade_count < min_inference_n` |
| `sample_banner` | Hotel/Tango locked string when below min; **null** when `sample_below_min` is false |
| No trend language | No “crushing it”, arrows on outcomes, directional adjectives |
| Marketing | Never export (§20 Sierra) |

---

## 3. Compatibility with legacy **v0.2** report rows

Current gather emits **version `"0.5"`**. Prefer 0.5 fields; keep UI fallbacks for older rows.

Legacy v0.2 shape (historical):

```json
{
  "version": "0.2",
  "is_maiden": true,
  "scope_start": "…",
  "scope_end": "…",
  "pnl": { "trade_count", "net_pnl", "adherence_counts", … },
  "process": { "adherence", "trade_days", "integrity": { … }, … },
  "integrity_review": { … }
}
```

**Charlie fallback map (old rows only):**

| Target (0.5) | Legacy (0.2) |
|--------------|--------------|
| `report.version` | `"0.2"` or missing → use fallbacks |
| `meta.trade_count` | `pnl.trade_count` |
| `meta.is_maiden` | top-level `is_maiden` |
| `meta.scope_*` | top-level `scope_*` |
| `process` | `process` (ignore nested `process.integrity` for integrity section) |
| `integrity_review` | top-level `integrity_review` **or** `process.integrity` |
| `book_performance` | **`pnl`** (alias) |
| `deviations` | default `[]` |
| `what_worked` | default `[]` |
| `expected_vs_actual` | default `null` |
| `carry_forward` | default `null` |

---

## 4. `comparison` object (envelope) — **v0.5 RT3-1**

### Maiden / no prior

```json
{
  "has_prior": false,
  "version": "0.5",
  "label": "Maiden journey — this becomes your baseline",
  "metrics": [],
  "deltas": null
}
```

### With prior (normalized)

```json
{
  "has_prior": true,
  "version": "0.5",
  "label": "This window (3 weeks) vs previous (9 weeks)",
  "current_window_days": 21,
  "previous_window_days": 63,
  "prior_id": 12,
  "metrics": [
    {
      "metric": "routine_days_per_week",
      "current":  { "value": 4.4, "window_days": 21, "n": 13 },
      "previous": { "value": 3.1, "window_days": 63, "n": 27 },
      "comparable": false,
      "comparable_reason": "window_length_ratio_ge_3x"
    }
  ],
  "integrity_direction": null,
  "integrity_percent_delta": null,
  "note": "Rates with denominators only. When not comparable, values are shown side by side without delta or trend language."
}
```

| Rule | Spec |
|------|------|
| Activity rates | `comparable=false` if either `window_days < 14` |
| Adherence / book | `comparable=false` if either trade `n < MIN_INFERENCE_N` (20) |
| Window ratio | `comparable=false` if longer/shorter **≥ 3** (21d vs 63d) |
| UI | Side-by-side values always; **no** delta/arrow when `comparable` is false |
| Heading | `This window (Nw) vs previous (Mw)` — never bare “vs last time” |

Charlie RT3-2: render `metrics[]`; suppress trend when not comparable.

---

## 5. Constants (domain — fail loud)

| Name | Value | Spec |
|------|-------|------|
| `MIN_INFERENCE_N` | **20** | Hotel RT0-2 |
| `JOURNAL_GAP_DAYS` | **3** | §6.3 |
| Max deviations | **5** | §6.3 |
| Max what_worked | **3** | §6.4 |
| Max active habit plans | **2** | §18 (R4) |

---

## 6. Non-goals for this contract

- Agent `agent_json` shape (R5)  
- Marketing export of any field (§20)  
- Coverage indicator for Option C gap  

---

## 7. Approvals

| Role | Verdict | Date |
|------|---------|------|
| **India** (SoR) | APPROVED — single SoR for report_json; v0.2 fallback explicit | 2026-07-29 |
| **Charlie** (consumer) | APPROVED — can implement RT2-3 layout + fallbacks | 2026-07-29 |
