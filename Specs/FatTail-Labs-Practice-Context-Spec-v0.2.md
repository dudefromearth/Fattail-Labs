# FatTail Labs — Practice Context Spec v0.2

**Status:** DRAFT — cross-app concern. Touches Trade Log, Reports, Journal, Retrospective, Journey.
**Problem:** shared contexts are trapped in local controls. Account lives in Trade Log; date lives in
Journal. Neither is reachable from the surfaces that depend on them.

---

## 0. Two contexts, one rule

> **Shared contexts live in the topmost chrome. Local controls stay with the app.**

| Context | Currently | Belongs |
|---|---|---|
| **Account** | Trade Log local controls | Topmost chrome |
| **Date** | Journal local controls | Topmost chrome |

Both appear within Practice and nowhere else — Courses and Live have neither dimension.

**Alignment:** the Practice app nav (Trade Log · Reports · Journal · Retrospective · Playbook)
**centers**, matching the topmost menu, rather than sitting right-offset. One vertical axis down the
page.

### 0.1 Date — what each surface does with it

Date means something different per surface, and that is fine as long as it is stated:

| Surface | Reads the date as |
|---|---|
| **Journal** | Which day's conversation. Navigation |
| **Trade Log** | A filter on the list |
| **Reports** | The analysis window |
| **Retrospective — open** | Context only; scope is set at gather, not by the picker |
| **Retrospective — completed** | **Ignored entirely** (§4) |
| **Journey** | Ignored. Meters are rolling or period-scoped by their own rules |

Granularity (Year · Month · Week · Day) travels with the context, so a member on Week in the Journal
who switches to Trade Log gets that week.

---

## 1. Account is a context, not a control

Same class as the date: a scope every Practice surface reads. It is not a Trade Log feature that
other pages happen to need.

Two things are currently conflated and should separate:

| | Where it belongs | Frequency |
|---|---|---|
| **Selecting** the active account | Practice-level chrome, persistent | Constant |
| **Managing** accounts — add, rename, archive | Settings surface (`/me` or account settings) | Rare |

Selection is contextual and belongs in the chrome. Management is settings-shaped and does not belong
in the operating surface at all.

---

## 2. Scope — the rule

> **Account is a lens on outcome data. It is not a lens on practice.**

The practice is the trader's, regardless of how many accounts they run. The book is per-account.

| Surface | Scoped by account | Notes |
|---|---|---|
| **Trade Log** | Yes | The trades themselves |
| **Reports** | Yes | Equity, drawdown, statistics. Already has an account selector — it becomes the global one |
| **Journal — trades on this day** | Yes | Which trades render on the day |
| **Retrospective — the book (step 9)** | Yes | See §4 |
| **Journal — the conversation** | **No** | Trader-level. A member does not journal per account |
| **Tags and adherence** | **No** | Applied by the trader. Adherence is a property of their conduct, not of an account |
| **Retrospective — steps 1–8** | **No** | Commitments, obstacles, cause, what worked are the trader's |
| **Journey meters and integrity** | **No** | One practice, one reading. A trader who follows plan in one account and not another has one adherence rate, and it is the honest one |
| **Cadence, closure, carry-forward** | **No** | Trader-level throughout |

**Why adherence stays trader-level:** splitting it would let a member be diligent in one book and
invisible in another, and the integrity grade would depend on which account was selected. The grade
describes the trader.

---

## 3. Placement and behavior

**Practice-level chrome**, persistent across all five Practice apps. Not app-global — Courses and
Live have no account dimension and should not display one.

- **Always visible.** A member reading Reports for the wrong account is a real and quiet error. The
  active account is stated, not inferred.
- **Persists** across navigation and reload, stored as a member preference.
- **"All accounts" is a valid state**, and the default.
- Switching re-scopes the current surface in place. It does not navigate, and it does not reset the
  date or the calendar view.

---

## 4. Completed retrospectives ignore both contexts

A retrospective is a trader-level artifact whose book section is account-scoped — which creates a
problem the audit posture will not tolerate.

> **A completed retrospective renders identically regardless of the current account or date
> selection.**

If step 9 re-derives from the live account, or the period appears to shift with the date picker, a
completed audit record changes based on a dropdown. The record a review examined would no longer be
the record it examined.

So: the retrospective **stores the account scope in force at gather** and renders it permanently.
Its period was always fixed at gather; the date context must not appear to alter it.

For an open retrospective, account scope follows the current selection until gather fixes it. Its
period does not — the period is the cadence window, never the picker.

**The contexts stay visible on a completed retrospective**, since a member may want to navigate
away, but neither changes what is rendered. If that reads as inert, the surface should say the
period is fixed rather than silently ignoring the control.

*Gate: **India**, **Delta**.*

---

## 5. Verification

1. Account and date appear in the topmost chrome on all five Practice surfaces, and on none outside
   Practice. The Practice app nav is centered.
2. Both persist across navigation and across reload, including granularity.
2b. Switching surfaces preserves the date and granularity — Week in Journal is Week in Trade Log.
3. Switching account re-scopes Trade Log, Reports, Journal trades, and an open retrospective's book
   — and changes nothing in Journal conversations, tags, adherence, Journey meters, or retrospective
   steps 1–8.
4. A completed retrospective renders identically under every account selection including "All", and
   under every date selection.
5. Account management is unreachable from the operating surfaces and reachable from settings.
6. The active account is visible at all times; no surface renders account-scoped data without naming
   the account it belongs to.

---

## 6. Open

| # | Item | Owner |
|---|---|---|
| 1 | Whether Reports' existing per-account pagination survives or is replaced by the context selector | India + Charlie — **resolved v0.2 implement: replaced** |
| 2 | Whether Journey's adherence meter aggregates across accounts or uses the default account — §2 says aggregate | India + Hotel |
| 3 | Archive versus delete for accounts with trade history — deletion would orphan practice records | India |
| 4 | Whether the 10-account cap is config or fixed | India |
| 5 | Whether Trade Log filtering by the date context replaces or coexists with its "All active" filter | India + Charlie — **resolved v0.2 implement: date filters list; account is chrome "All accounts"** |
| 6 | Whether Reports keeps an independent range or adopts the date context outright | India + Charlie — **resolved v0.2 implement: adopts date context as analysis window** |
