# FatTail Labs — User Billing Visibility Spec v1.0

**Status:** Implemented (2026-08-05, DL-212)
**Scope:** Admin Users section — make free vs paid membership a first-class,
at-a-glance signal. Read-side only; no schema change.
**Supersedes:** the roster half of `FatTail-Labs-User-Activity-Analytics-Spec-v1.0`
(engagement/analytics semantics there remain in force).

---

## 1. Purpose

Operators need to see **who is a paying member and who is free** without decoding
plan slugs or confusing login method with entitlement. Before this, the Users
roster showed a membership string and a "Via" column sourced from linked SSO
providers, and the word "native" (a Labs password login) sat next to paid plans —
which read as a contradiction ("native but Observer?"). It is not: **how someone
signs in and what they pay for are independent axes.**

## 2. Billing taxonomy

Every identity is classified into exactly one **billing status**:

| Status | Rule | Notes |
|---|---|---|
| **paid** | ≥1 active/grace membership on a paid plan | Paid plans = `observer`, `observer-trial`, `activator`, `navigator` |
| **free** | account, no active paid membership | Self-serve `/register` (observer tier) or provisioned; never purchased |
| **alumni** | active `alumni`-plan membership | Churned-but-retained free grant (>=28-day tenure); not paying |
| **staff** | `role_override = administrator` | Excluded from member counts |

**Precedence** (when more than one could apply): `staff > paid > alumni > free`.

**Observer = Observer Trial.** They are the same **$17/wk** tier. `observer-trial`
grants Navigator-level access for the trial window, but for billing it is Observer.
Both display as **"Observer"** — there is no separate "Trial" bucket.

**Free is the absence of a paid membership, not a tag.** There is no "free plan"
row. A self-serve registrant has an identity + password + no membership → role
falls back to `observer` → billing `free`.

**Waitlist leads are out of scope.** Feature-gate waitlist emails
(`feature_gate_emails`, pushed to ActiveCampaign as "Labs Lead") are *not* Labs
identities and never appear in the Users roster. They are a lead pool, not members.

## 3. API

`GET /api/admin/users` (admin session required):

- Query params: `search`, `limit` (≤200), `offset`, **`billing`** (`paid|free|alumni|staff`; blank = all).
- Each user row adds: **`billing_status`** and **`plan_tier`** (paid → tier name e.g. "Navigator"; else the class label).
- Response adds **`counts`**: `{ paid, free, alumni, staff, total }` — always the
  full unfiltered tally for the current `search`, regardless of the `billing` filter.
- Rows are ordered by **last-active** (max of last login / last page view / last
  lesson), so order matches the "Last active" column.

`GET /api/admin/users/export.csv` accepts the same `search` + `billing`; CSV gains
`billing_status`, `plan_tier` columns.

`GET /api/admin/users/{id}` adds `billing_status`, `plan_tier`.

Classification, sorting, and among-class filtering run in Python over the matched
set (capped at `ROSTER_CAP = 5000`) so the filter and sort stay consistent with the
table. (If the roster ever exceeds the cap, revisit with SQL-side classification.)

## 4. UI (`/admin/users`)

- **Plan column** with a colored badge: `Paid · <tier>` (emerald), `Free` (amber),
  `Alumni` (sky), `Staff` (violet).
- **Header counts**: "N paid · N free · [N alumni ·] N staff (N total)".
- **Filter buttons**: All / Paid / Free / Alumni (hidden when zero) / Staff, each
  with its count; re-queries with `?billing=`.
- **"Signed in via"** column (was "Via") shows login method with friendly labels:
  `native`→**Password**, `wordpress:fattail`→**FatTail SSO**,
  `wordpress:0-dte`→**0-DTE SSO**, `stripe`→**Stripe**. Same mapping in the detail
  panel ("By method", recent logins, linked accounts).
- A footnote states that login method ≠ membership (plan always comes from a purchase).

## 5. Invariants

1. **Server-side authorization** — admin session required; no client trust.
2. **Read-only** — no writes, no migration; purely derived from existing tables.
3. **Counts reconcile** — `paid + free + alumni + staff == total` for any `search`.
4. **Login method ≠ entitlement** — never infer paid/free from `login_events.provider`.
5. **Process outcomes only** — this is ops analytics; no member-facing profit copy.

## 6. Verification

- Classifier truth table (staff>paid>alumni>free; Observer/Trial→"Observer";
  best-tier-wins; alumni≠paid): `server/tests/test_user_activity.py`.
- Endpoint: `counts` present and summing to `total`; every row has a valid
  `billing_status`; `?billing=free` returns only free rows.
- Live (MiniTwo): counts match a direct DB query of active memberships by plan.
