# FatTail Labs — Admin User-Flow Spec v1.0

**Status:** Implemented (2026-08-09, DL-272) — locally verified, pending live deploy.
**Surface:** Admin only, read-only. New page `/admin/flow` + `GET /api/admin/flow`.

## 1. Purpose

Give operators an aggregate picture of how members move through Labs: the paths they
take, and where they drop off. Complements the per-user Users view (which answers "who
is this member") with the population view ("where does everyone go").

## 2. Data source

Existing `page_views` (DL-039) — one row per authenticated member navigation; admin
routes and anonymous visitors were never recorded, so the data is already member-only.
**No new capture, no migration.**

## 3. Model

- **Sessionise** each member's page views on the same 30-min inactivity gap the Users
  view uses (`activity.SESSION_GAP_SECONDS`, single source of truth). Consecutive
  duplicate areas within a session collapse (a refresh / intra-area sub-nav is not a
  flow between areas).
- **Areas:** granular paths map to ~15 readable areas via `flow.area_for` (longest
  matching prefix). Unknown paths fall back to a titleised first segment, so a
  newly-added route appears as its own area instead of being silently dropped.
- **Steps:** step N = the Nth area in a session (capped at `MAX_STEPS = 6`).

All aggregation is pure (`server/flow.py`, `build_flow(rows)`), unit-testable with no DB.

## 4. Endpoint

`GET /api/admin/flow?days={7|30|90|0}&tier={all|paid|free}` (admin session required).
- `days=0` = all time. `tier` = paid/free by the same active-membership rule as the
  billing view (`memberships.status IN active/grace`, unexpired, paid plan slug).
- Returns: `totals` (sessions/members/views), `steps` (per-column area counts + exits),
  `step_links` (area→area transitions between columns), `dropoff` (per area: reached /
  exits / exit_rate), `entries`, `journeys` (top ordered paths), `max_steps`.

## 5. The visual

Hero is a **step-based Sankey** (GA "behavior flow" shape). Column N holds the areas
members are on at their Nth page; bands are transitions to the next step. Sessions that
end are carried into a growing grey **"Left"** lane along the bottom, so:
- every column is the same total height (all sessions), and
- drop-off is legible as the widening grey band.

Hand-rolled SVG (no chart library). Below it: a **drop-off table** (reached / left-here /
exit-rate, sorted by biggest leak) and **most-common journeys** (ordered area chips).

**Balance invariant** (tested + relied on by the layout): for every step `i` that has a
next column, `node[i][A] == Σ_B link[i][A→B] + exit[i][A]`.

## 6. Invariants

- Read-only; admin session required (`require_admin`).
- Member-only data (inherited from `page_views` capture rules); admin nav never appears.
- No PII beyond what the Users view already exposes; areas are coarse, not raw paths.
- Aggregation is pure and deterministic given the same rows.

## 7. Verification

`server/tests/test_flow.py` — area mapping (incl. unknown→titleised fallback),
gap-based sessionisation + dup collapse, totals/entries/drop-off on a fixture, the
**Sankey balance invariant**, and empty-input safety. Visual confirmed in-browser on
seeded synthetic journeys.

## 8. Deferred (v1.1+)

- Split `/course/*` into Courses-index vs Lesson once we see real path volume.
- New vs returning-member segmentation; single-area "bounce" rate.
- Click a Sankey node/band to list the members on that path.
- Time-to-drop and per-tier side-by-side comparison.
