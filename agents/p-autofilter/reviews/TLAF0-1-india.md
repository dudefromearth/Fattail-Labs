# TLAF0-1 — India — Trade Log Autofilter Spec v0.1

**Agent:** India  
**Date:** 2026-08-25  
**Spec:** `Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1.md` (still **DRAFT** until Coach GO SPEC)  
**Plan:** `docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md`  
**Isolation:** read-only. No `web/` edits. O1–O4 **not invented**.

---

## Verdict

**APPROVED for build readiness of this slice** — after Coach **GO SPEC** and the packet OPENs.  

**RETURNED for product code** until that stamp. TLAF0 may close. TLAF1 is illegal from chat.

The slice is coherent: extract shared Autofilter, four columns, one cut on Trade Log, Campaign as extract source only. Parent v0.2 (journal/records) is parked. No schema. Alpha idle (below).

---

## O1 report — Practice nav date/campaign chrome **is shared**

**Fact, not a Coach ruling.** Spec §2 OPEN: report before removing.

### Where the controls live

`PracticeContextBar` mounts **unconditionally** from `PracticeSuiteChromeInner`:

```90:93:web/components/practice/PracticeSuiteChrome.tsx
      <PracticeContextBar
        inertHint={contextInert}
        inertMessage={contextInertMessage}
      />
```

Date pills + campaign select are **one group** on that bar:

```119:170:web/components/practice/PracticeContextBar.tsx
        <div
          className="inline-flex flex-wrap items-center gap-0.5 rounded-full bg-[var(--color-fill)] p-0.5"
          role="group"
          aria-label="Date and campaign filters"
          data-testid="practice-granularity"
        >
          {PRACTICE_GRANULARITIES.map((v) => {
            ...
          })}
          ...
              data-testid="practice-campaign-select"
```

Granularity set: All / Year / Month / Week / Day — `web/lib/practiceContext.tsx` lines 741–750.

Journal already treats this as **the** date chrome:

```1048:1048:web/components/journal/JournalCalendar.tsx
      {/* Date chrome lives in PracticeSuiteChrome (Context Spec v0.2). */}
```

### Every page that mounts `PracticeSuiteChrome` (therefore the bar)

| Surface | File | `active` |
|---------|------|----------|
| Trade Log | `web/app/app/trade-log/page.tsx:862` | `trade-log` |
| Journal | `web/app/app/journal/page.tsx:11` | `journal` |
| Reports | `web/app/app/reports/page.tsx:12` | `reports` |
| Retrospective | `web/app/app/retrospective/page.tsx:171` | `retrospective` |
| Retro detail | `web/app/app/retrospective/[id]/page.tsx` | (chrome) |
| Playbook | `web/app/app/playbook/page.tsx:79` | `playbook` |
| Playbook book | `web/app/app/playbook/[bookId]/page.tsx` | `playbook` |
| Campaign / Find and Badge | `web/app/app/practice/campaign/page.tsx:179` | campaign |
| Campaign detail | `web/app/app/practice/campaign/[campaignId]/page.tsx` | campaign |
| Symbols | `web/app/app/practice/symbols/page.tsx` | symbols |

**Deleting `practice-granularity` from the bar is out of this slice.** It would strip Journal, Reports, Retro, and Playbook.

### Seam (proposal — Coach stamps O1 / L14)

**Omit-on-Trade-Log only.** India-named host: `PracticeSuiteChrome` / `PracticeContextBar` — a prop (e.g. hide date+campaign group when `active === "trade-log"`), **not** delete the group from the component. Account picker stays (`practice-account-select`). Journal / Reports / Retro / Playbook / Campaign / Symbols unchanged.

This is engineering, not a second authorization. Coach fills L14 mechanic at O1.

---

## One filtered stream after TLAF2 (L14)

Today Trade Log **also** filters via Practice context — second mechanism inward:

- `campaignFilter` **is** `practiceContext.campaignId` (`trade-log/page.tsx` 114, comment “Campaign filter is chrome Practice context only”).
- `setCampaignFilter` writes `setCampaignId` (117–121).
- Load sends `from_day: blotterFromDay` where `blotterFromDay = filterFromDay || (dateFilterActive ? rangeFromYmd : null)` (216–239).
- Open trades additionally `.filter(t => t.practice_campaign_id === campaignFilter)` (284–288).
- `?campaign=N` writes chrome `setCampaignId` (166–171).

After TLAF2 those standing bindings must **stop** on Trade Log or Autofilter is not the only stream. Same list endpoints; **no new API**. **Alpha idle.** Charlie unhooks in TLAF2.

Adhere locate (`adherence_mode` / `from_day` / `to_day` query, banner `journey-adhere-locate-banner`) is **not** standing chrome (`trade-log/page.tsx` 65–66, 173–184). **Keep.** Compose with Autofilter (spec §6 / A6).

---

## Campaign §9.2

Quoted (Campaign Spec v1.3):

> tap filters the blotter to that campaign — **one filter system** (badge as entry point to the existing campaign filter; composes with the Adhere locate view; no second mechanism).

As-built: badge `onClick={() => onCampaignFilter?.(cid)}` — `TradeLogTable.tsx:542` (`blotter-campaign-badge`). That today hits Practice campaign chrome. TLAF2: **same handler identity must set Autofilter campaign column**, not a private filter. `?campaign=` same column.

---

## Component API

Column defs in: field, label, type `value` | `date`, reader. One filtered stream out. Nothing Trade-Log-specific inside.

**Grain:** Find and Badge rows are found-set positions. Trade Log blotter is **trade blocks**. Surface supplies the list-of-records (one record = one trade). Component does not know legs. That is A12, not a second filter.

`(none)` on nullable columns: implement in the component in TLAF1 (journal later); Status in this slice may not need it.

---

## Playbook select

`playbookFilter` / blotter playbook `<select>` — **out of this slice** unless Coach names it. Do not remove in TLAF2.

---

## Alpha

**Idle.** Filter of already-loaded rows; existing list query params may be dropped on Trade Log. No schema, no new route.

---

## Flagged (beside OPEN items — not answers)

| OPEN | India note (opinion) |
|------|----------------------|
| O1 | Evidence: **shared**. Seam above. Coach stamps L14. |
| O2 | Private `filterOpenOnly` (`trade-log/page.tsx:107`, chip `TradeLogTable.tsx:249–259`) is a second mechanism if it stays without identity. |
| O3 | Not answered. |
| O4 | Not answered. Never `ft.tradeLog.lastUsed.v1`. |

Coach Content Law: spec text not deleted.
