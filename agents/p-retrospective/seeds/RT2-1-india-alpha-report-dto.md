# Seed RT2-1 — India + Alpha: Report DTO contract

**Project:** p-retrospective  
**Primary:** India (design) · Alpha (stub types)  
**Reviewers:** Charlie  
**Phase:** R2b  
**Prerequisite:** RT1-G PASS  

## Goal

Document stable JSON shape for `report_json` / workspace matching Spec v0.5 §6:

- process, integrity_review, deviations[], what_worked[], expected_vs_actual[],  
  book_performance (with sample banner fields), meta (window_days, trade_count)  

Charlie must be able to build UI against the contract before gather is perfect.

## Files in scope

- Spec as-built note or `Architecture/` short DTO note  
- Optional Python TypedDict / comments in `retrospective_domain.py`  

## Out of scope

- Full gather implementation (RT2-2)  
- Agent  

## Completion criteria

- [x] Contract written  
- [x] Charlie APPROVED (can implement layout)  
- [x] India APPROVED  

## Feeds

→ RT2-2, RT2-3  

---

## Evidence (2026-07-29 — RT2-1)

### Deliverables

| Item | Path |
|------|------|
| DTO contract (Charlie SoR) | `Architecture/12-retrospective-report-dto.md` |
| TypedDict + constants | `server/retrospective_domain.py` — `ReportV05`, `MIN_INFERENCE_N=20`, `SAMPLE_BANNER`, `JOURNAL_GAP_DAYS=3` |
| Spec document map | v0.5 §23 → Architecture/12 |

### Contract highlights

1. **version 0.5** target: `meta`, `carry_forward`, `process`, `integrity_review`, `deviations[]`, `what_worked[]`, `expected_vs_actual`, `book_performance` (sample_below_min + banner).  
2. **v0.2 fallback map** for as-built gather (`pnl` → book_performance, etc.) so RT2-3 can ship before RT2-2.  
3. Workspace envelope: `report` / `comparison` / `body_md` / optional `profile.retrospective_pnl_expanded`.  
4. Render order locked to Spec §6.

### India: **APPROVED**

Single SoR for report shape; product boundary clean; Option C / Family B / sample gate fields present; non-goals explicit.

### Charlie: **APPROVED**

Can implement RT2-3 layout from §2 + §3 fallback table without waiting on perfect gather. Prefer `book_performance` then `pnl`; empty arrays for missing sections.

### Residual → RT2-2

Alpha fills 0.5 fields (deviations, rates, sample gate on book). Comparison normalization remains RT3b.
