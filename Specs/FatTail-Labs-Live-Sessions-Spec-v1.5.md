# FatTail Labs — Live Sessions Spec v1.5

**Status:** Approved as built (2026-07-21)
**Extends:** v1.4. Recurring series can be **bounded at creation**: end on a
date, or a number of days from now.

---

## 1. Series end limit

- Create/update recurrence accepts **`until_date`** (`YYYY-MM-DD`, ET) **or**
  **`until_days`** (int 1–730, converted to `today_ET + N` at save — a fixed
  limit, never a rolling window). Passing both → 422; a date in the past → 422;
  neither → unbounded (until_date NULL), as before.
- No schema change — `until_date` exists since migration 009; the materializer
  already honors it.
- `GET /api/admin/live-recurrences` now returns `start_date` / `until_date`;
  the manager row shows "until {date}".
- Admin create form gains an **Ends** selector: *Never* / *On date* (date picker)
  / *After N days* (number input).
- Ending an *existing* series at a date = the v1.4 path: occurrence delete with
  scope "this and all future events" (sets `until_date = day − 1`).
