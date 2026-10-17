# Front Door Belonging — Full Agent Bench Plan v1.0

**Document type:** FatTail Labs Full Agent Bench Plan
**Date:** 2026-10-12
**Status:** Planning candidate. Not a build GO. Spec v1.1 is DRAFT until Coach stamps it. No product code starts on this plan until that stamp and `agents/go/FDBL-W0.md` exist.
**Plan revision:** v1.0
**Author:** Juliet (orchestration). This plan does not execute its own packets.
**Authority:** Coach (GO / ship)
**Canonical path:** `docs/Front-Door-Belonging-Full-Agent-Bench-Plan-v1.0.md`
**Machine:** StudioTwo (`StudioTwo.local`). Preview front door, when used, is `http://StudioTwo.local:3311` (Next on `127.0.0.1:3314`, mock API `127.0.0.1:3313`). Live Labs UI on this machine stays `:3000` / `:4000`. Do not stop those. Nothing deploys. Never MiniTwo unless Coach names production. Never `git add -A`. Never a 301.

**Parent spec:** [`Specs/Observer-Navigator-Funnel-Spec-v1.1.md`](../Specs/Observer-Navigator-Funnel-Spec-v1.1.md) **v1.1 DRAFT**
**Prior spec, do not edit:** [`Specs/Observer-Navigator-Funnel-Spec-v1.0.1.md`](../Specs/Observer-Navigator-Funnel-Spec-v1.0.1.md) (DL-826)
**Prior plan, do not re-open:** `agents/p-front-door/BUILD-PLAN-v0.1.md` on the front-door checkout. Gates FD-G0–FD-G4 already passed for that checkout. This plan is the belonging delta.
**Cutover, unchanged:** [`Specs/WP-Labs-Cutover-Design-v1.0.1.md`](../Specs/WP-Labs-Cutover-Design-v1.0.1.md)
**Board (created at BL-W0, not before):** `agents/p-front-door-belonging/`
**Token (Coach stamps, not this plan):** `agents/go/FDBL-W0.md`

**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · spec-create-review workflow. Specialists execute only through seeds. Coordination only through Coach or Juliet. Delta gates are PASS / FAIL / BLOCKED. A waived gate is a doctrine violation.

---

## 0. What this plan is for

A person can create an account, or give an email, and stop. That is belonging. They have a login, access to some content, and a place on the mail list. The product on the order page is optional after that.

The front-door checkout already has the product panel, the Account drawer, the Navigator phone and address fields, the password-mail preview, and the Payment drawer. This plan does not rebuild that. It adds the belonging finish line and the real records behind it.

**Spine:**

> Belonging completes before money. Payment stays available and optional. State 5 (paid, then cancelled early) stays no-access. The preview mock is not the production login.

---

## 1. Law this plan executes

| Doc | Role |
|---|---|
| Funnel Spec **v1.1** | Belonging, the order-page sequence, the six states. Planning authority once Coach stamps it. Until then, planning only. |
| Funnel Spec v1.0.1 | Prior law. B1–B5, B7 stand. B6 stays open. Not reopened. |
| Password Reset Spec v1.0 | The production mail that turns an email into a login. ≥10 characters. |
| ActiveCampaign Lead Sync Spec v1.0 | The mail-list write for a person who has not purchased. |
| Enrollment Spec v1.0 | Free account keeps previews only. Content link is `/pathway`. |
| DL-827, DL-828, DL-829 | Venue is MiniTwo when production is named. No new WooCommerce tie. Handoff stays one module. Screens do not change when B6 lands. |

**Do not re-open:**

| ID | Law |
|---|---|
| B1–B5, B7 | Discord, finished Observer, lapsed annual, early cancel, owned stack, WP retirement |
| B6 | Billing off WooCommerce stays open. This plan does not charge. |
| DL-826 | No 301, ever |
| FD-G0–FD-G4 | The checkout that already passed. Do not rerun it as if it were unbuilt. |

**This plan's invariants:**

| ID | Law |
|---|---|
| **BL-1 … BL-7** | Spec §0. Account or email completes. Payment is optional. State 5 is not belonging. The act is the mail-list opt-in. |
| **D-BL-1 … D-BL-4** | Spec §0. In force unless Coach names a replacement on the GO token. |
| **BL-P** | No product code until the spec is stamped and `FDBL-W0` is stamped. |
| **BL-N** | No MiniTwo, no traffic percent change, no merge, no 301. |
| **BL-S** | Card number, expiration, security code, and the new password are never stored in the browser draft. |
| **BL-L** | Production login checks the directory. A wrong password fails. The preview mock must not be copied forward as the login. |

---

## 2. As-built, leave it

On the preview worktree `/Users/ernie/FatTail-Labs-preview-fd` (detached, uncommitted) the order page already does the following. Packets below extend it. They do not restyle it.

- Five products, chips, `?product=`.
- Observer disclosure: "You can cancel anytime. No refunds." Navigator products do not say "No refunds."
- Observer drawer "The six weeks," closed, with the video words on the same URL.
- Account: Login, or Create account (name, email, confirm email). Navigator also shows phone, street, city, state, ZIP code, country. Phone matches the other fields. State and ZIP code share a row.
- A new account shows the preview password link. The link is a green button today. Spec §6.1 makes it a text link. That is an in-scope change.
- Payment opens only after sign-in, and for Navigator only after phone and address. Two checkboxes, then Credit Card and PayPal. Neither charges.
- Regular-price and sale-price slots exist and are empty.

The preview password route and the mock API live under `/Users/ernie/FatTail-Labs-preview-fd-sim/`. That tree does not enter the repo.

---

## 3. Isolation

New tree: front-door belonging. LIM, QFRIC, XS, PPL, Help Watch, VP, and Term Mass are untouched.

**Do not touch unless the GO token names the file:**

| Frozen | Why |
|---|---|
| `server/routes/billing.py` | B6 and the existing Stripe code. Call nothing in it. |
| `server/front_door/handoff.py` | Thin Woo handoff. Belonging must not add a call into it. |
| `web/components/MembershipPlans.tsx` | Chooser wiring is a later packet, and it is existing work. |
| Password-reset tables and routes, except a call from the new belonging mailer | One reset implementation. Do not add a second token table. |
| MiniTwo, nginx prod, traffic percent | BL-N |
| Lifecycle Law v1.0 file | Lima drafts a successor. She does not edit v1.0 in place. |

**In scope after `FDBL-W0`:**

| Phase | Trees |
|---|---|
| BL-W1 | New belonging module and migration under `server/front_door/`. Tests. No handoff import. |
| BL-W2 | Password mail calls the existing reset spec. Login check. Preview mock stays on the simulator until this packet is on a non-production environment Coach named. |
| BL-W3 | `web/components/front-door/FrontDoor.tsx`, `web/app/front-door/front-door.css`, front-door unit tests, the e2e file. |
| BL-W4 | The content link to `/pathway`, and the entitlement check that a belonging session does not receive tools, courses, Discord, or IKI Labs. |

---

## 4. Phases

### BL-W0 — Review and stamp

No product code.

| Packet | Owner | Deliverable | Done when |
|---|---|---|---|
| W0-1 | India | Read Spec v1.1 against v1.0.1, DL-826–829, the lifecycle law, and the enrollment spec. | APPROVED or RETURNED. State 5 and state 6 stay distinct. |
| W0-2 | Echo + Tango | Read §6.1 only: three account ways, "You're in," text password link, Payment optional, "Finish the account first." | Each APPROVED or RETURNED. |
| W0-3 | Mike | Read D-BL-2 and D-BL-4: one password-reset path, login checks the directory, mail-list write is not a purchaser tag. | APPROVED or RETURNED. |
| W0-4 | Hotel | Read the Observer sentence and the "some content" boundary. No profit claim, no "trial." | APPROVED or RETURNED. |
| W0-5 | Lima | REQ-031 is already filed. After Coach stamps, log the stamp. Draft a lifecycle-law successor that adds state 6 in one row. Do not edit Lifecycle Law v1.0. | Draft filed, v1.0 untouched. |
| W0-6 | Coach | Stamp Spec v1.1, accept or replace D-BL-1…D-BL-4, stamp `agents/go/FDBL-W0.md`. | Token on disk. |

**BL-G0 (Delta):** four reviews returned, token stamped, no product diff in this phase.

### BL-W1 — Belonging record

| Packet | Owner | Deliverable | Done when |
|---|---|---|---|
| W1-1 | Alpha | A belonging row keyed by normalized email: which door (account or email), name if any, created time, mail-list status. No subscription id. No order id. | A create and an email-only write both succeed with no handoff call. |
| W1-2 | Alpha | Mail-list sync through the existing lead-sync function, after the row commits. Unconfigured CRM skips visibly. The row remains. | Tests cover synced, skipped, and failed. The HTTP result of joining is still success. |
| W1-3 | Kilo | State fixture: stranger, belonging, Observer, annual, lifetime, early-cancel. Early-cancel is not returned as belonging. | Six fixtures, no PII. |

**BL-G1 (Delta):** the module test file passes. `handoff.py` is not in the diff. A belonging row has no order id.

### BL-W2 — Login and the password mail

| Packet | Owner | Deliverable | Done when |
|---|---|---|---|
| W2-1 | Alpha | Create account and email-only both request the existing forgot-password mail for that address. Enumeration behavior of that route stays as the password-reset spec wrote it. | One token table. No new one. |
| W2-2 | Mike | Review the call. Confirm the preview simulator is not pointed at production SMTP or the production reset route. | Written note in the gate report. |
| W2-3 | Alpha | Production login on the order page checks the directory. Wrong password: the person stays signed out and sees a plain failure. Right password: signed in, and if they belong and have not purchased, they see "You're in." | A test with a wrong password fails closed. |

**BL-G2 (Delta):** wrong password does not set the session. Password hash is scrypt via the existing reset path, never written to `sessionStorage`.

### BL-W3 — Order page

| Packet | Owner | Deliverable | Done when |
|---|---|---|---|
| W3-1 | Charlie | Account offers Login, Create account, and Email only. Email only is one email field and a Join button. | Observer create shows no address fields. Email only shows no name fields. |
| W3-2 | Charlie | Create account succeeds when Navigator address fields are empty. The "You're in" copy is the spec's three sentences, plus "Open that content." The password link is text, not a green button. | Copy matches Spec §6.1 character for character. |
| W3-3 | Charlie | Payment stays closed. Before sign-in the row says "Finish the account first." Navigator without address says "Phone and address" and does not open. After address, it opens onto the two checkboxes. It never opens by itself. | A belonging session can leave with Payment closed. |
| W3-4 | Echo | Pass on the three modes, the text link, and the locked row. | APPROVED or RETURNED. |
| W3-5 | Tango | Pass on the copy: belonging is complete, the purchase is optional, no guilt, no "trial." | APPROVED or RETURNED. |

**BL-G3 (Delta):** a phone-width walk and a desktop walk. Email only reaches "You're in" with Payment still closed. Navigator create with an empty address does the same. Filling the address then opens Payment.

### BL-W4 — Content boundary

| Packet | Owner | Deliverable | Done when |
|---|---|---|---|
| W4-1 | Charlie | "Open that content" goes to `/pathway`. | The link is present only after belonging. |
| W4-2 | Alpha | A belonging session is not granted tools, the course library, Discord, or IKI Labs. | An entitlement check returns the preview surface only. |
| W4-3 | Kilo | A state-5 fixture still has no content link and is not repaired into state 6. | Test named AT-BL-8. |

**BL-G4 (Delta):** AT-BL-1 through AT-BL-8 pass. Coach can walk the preview. This gate does not raise traffic and does not deploy.

---

## 5. Acceptance tests

| ID | Proof |
|---|---|
| **AT-BL-1** | Email only, valid mailbox domain, no name: belonging row exists, Payment closed, "You're in" visible. |
| **AT-BL-2** | Create account with empty Navigator address: same result as AT-BL-1. |
| **AT-BL-3** | Navigator address filled: Payment opens, checkboxes visible, no charge. |
| **AT-BL-4** | Observer panel contains "You can cancel anytime. No refunds." Monthly, Quarterly, Annual, and Lifetime panels do not contain "No refunds." |
| **AT-BL-5** | Wrong login password: no session, no belonging write. |
| **AT-BL-6** | Password mail uses the existing reset path. No second token table. The new password is absent from the draft. |
| **AT-BL-7** | CRM unconfigured: join still succeeds, skip is logged, row stored. |
| **AT-BL-8** | Early-cancel fixture: no "Open that content," no tools, not reclassified as belonging. |
| **AT-BL-9** | Diff does not contain `handoff.py`, `billing.py`, or a 301. |
| **AT-BL-10** | Card number, expiration, and security code are absent from the draft store. |

---

## 6. Rollback

Belonging is behind the front-door feature flag that already defaults to 0 on the branch. Turning that flag off hides the page. The migration that adds the belonging table has a down path written in the same packet. No redirect is introduced, so there is nothing to undo at the edge.

---

## 7. Open decisions

These stay open. The plan does not answer them by building.

| Question | If unanswered |
|---|---|
| Stamp Spec v1.1? | No product code. |
| Replace D-BL-1 (content is `/pathway` previews)? | Plan uses D-BL-1. |
| Replace D-BL-2 (email becomes a login)? | Plan sends the password mail. |
| Replace D-BL-3 (address gates Navigator payment only)? | Plan allows belonging with a blank address. |
| Replace D-BL-4 (existing lead sync)? | Plan calls that sync. |
| Lifetime price, Quarterly price, regular prices, offer codes? | Slots stay empty. |
| B6, who charges? | Woo handoff, unchanged. This plan does not enter it. |
| What happens to the 521 existing free Observers? | They are not moved. |
| Wire the membership-chooser buttons to `?product=`? | Not in this plan. It is existing work. |
| Privacy and legal look at evidence capture? | Stays off. |

---

## 8. Seeds

Juliet writes one seed per packet under `agents/p-front-door-belonging/seeds/` after BL-G0, not before. Each seed names the callsign, the files in scope, the files out of scope, BL-N, the acceptance ids it must turn green, and the gate it feeds. A seed that lists `billing.py` or `handoff.py` as editable is rejected.

---

*Spec: `Specs/Observer-Navigator-Funnel-Spec-v1.1.md`. Prior checkout plan is not reopened.*
