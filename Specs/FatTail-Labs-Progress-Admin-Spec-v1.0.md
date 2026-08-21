# FatTail Labs — Progress Admin Spec v1.0

**Status:** implemented · **Decision log:** DL-530 · **Route:** `/admin/progress`
**Architecture:** `Architecture/33-progress-admin.md`

## 1. Purpose

One administrator surface answering: *are we growing, and will we hit the revenue
target?* It draws live from the three systems that actually decide the answer —
WooCommerce (money and members), YouTube (reach) and ActiveCampaign (campaigns) —
and states plainly whether the current funnel can reach the target.

Non-goals: it sells nothing, changes nothing in commerce, and is never shown to a
member. Read-only apart from the model parameters in §5.

## 2. Access

Administrator session on every endpoint via `guards.require_admin`. Nav entry sits
inside the **Users & Support** group. No agent-key access.

## 3. Sources

| Source | Transport | Credentials | Notes |
|---|---|---|---|
| WooCommerce | REST `wc/v3` | `LABS_WOO_*`, read scope only | orders, subscriptions, products |
| YouTube | Data API v3 + Analytics v2 | `LABS_YT_*` refresh token | Analytics lags ~2 days |
| ActiveCampaign | REST v3 | `LABS_AC_API_URL/TOKEN` | reuses existing config |

Every source is optional and fails independently. Missing config is reported as
"never pulled"; a failed fetch keeps the last good snapshot and records the error.
No source ever renders as a zero when it could not be reached.

**Field names verified against the live APIs 2026-08-21.** WooCommerce Subscriptions
exposes schedule dates only as `start_date_gmt` / `cancelled_date_gmt` /
`end_date_gmt`; the unsuffixed keys exist but are always null. YouTube Analytics with
the `month` dimension requires **first-of-month** for *both* `startDate` and
`endDate` — a last-of-month end date is rejected.

## 4. Refresh and storage

`progress_snapshot` holds one row per source per attempt: `status` (`ok`/`failed`),
`error`, `duration_ms`, and a normalised `payload`. Reads take the latest `ok` row.
A launchd job (`ai.fattail.labs.progress-refresh`) runs hourly; admins can force a
pull with `POST /api/admin/progress/refresh`. Rows older than 30 days are pruned —
this is telemetry, not a ledger.

Staleness threshold is the `snapshot_stale_hours` parameter (default 6). Anything
older is listed in the freshness footer and fires the `stale_sources` finding.

## 5. Model parameters

`progress_model_param` holds the constants the projection needs — churn per tier,
Observer conversion and annual rates, revenue per Observer, views per Observer, the
revenue target, and the finding thresholds. Each row carries a label, a hint, and a
valid range enforced on write. Admins edit them in-page; changing the model never
needs a deploy. Seed values were measured from live data on 2026-08-21 and are
starting points, not doctrine.

## 6. Derived metrics — the five traps

Every rule below existed because the naive version produced a materially wrong
number against live data. Each is pinned by a test in `test_progress_metrics.py`.

1. **Free Observers are excluded.** The Nov 2025–Feb 2026 era issued zero-price
   Observer subscriptions, later bulk-cancelled. Any Observer whose recurring total
   is ≤ 0 is dropped everywhere. This is a rule about the record, not a hardcoded date.
2. **Members are subscriptions, never membership records.** Navigator membership rows
   are also minted by 0-DTE SSO login, so a membership count overstates payers
   substantially. Counting subscriptions makes grants structurally invisible.
3. **Revenue is every charge.** Observer bills weekly and Activator monthly; counting
   only first orders understates a tier several-fold. All order lines, grouped by
   product name.
4. **Term length is read per record.** Observer ran 28 days through Jul 2026 and 42
   days from Aug 2026. `observer_term_days` reports the modal term of recent records.
5. **Partial periods are labelled.** The current month is flagged `partial` with days
   elapsed and never annualised. Observer cohorts younger than the conversion window
   are flagged `mature: false`, and findings ignore them — a young cohort at 0% is an
   artefact, not a collapse.

## 7. Projection

Every tier settles where additions equal losses, so its ceiling is `adds / churn`.
`settles_at()` returns the monthly cash the current funnel reaches once both bases
fill; `observers_needed_for()` bisects for the intake a target requires. Cash basis:
Observer fees and up-front annuals count in the month paid, only Activator and
Navigator compound. No amortisation — the page reports what hits the account.

## 8. Findings

Deterministic threshold rules in `rules.py`. Each returns a `Finding` carrying
`trigger` (the measured number) and `threshold` (what it was compared against), so
any claim is auditable without reading code. Severities sort critical → warning →
good → info. **No language model writes advice here.** Adding a rule is one function
plus one entry in `RULES`.

## 9. API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/progress` | full report: metrics, projection, findings, freshness |
| GET | `/api/admin/progress/params` | model parameters with ranges |
| PUT | `/api/admin/progress/params/{key}` | set one parameter (range-validated) |
| POST | `/api/admin/progress/refresh` | pull now; `?source=` for one source |

## 10. Verification

59 unit tests across `test_progress_metrics.py`, `test_progress_projection.py` and
`test_progress_rules.py`. The projection reproduces figures derived independently
from the database; the live clients reproduce known totals — 1,056 subscriptions,
521 free Observers excluded, a 42-day current Observer term, June Observer revenue
$6,375, July email CTR 0.27%.
