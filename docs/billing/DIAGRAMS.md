# Native Billing v2.0 — Diagrams

Companion to [SPEC-Native-Billing-v2.0.md](SPEC-Native-Billing-v2.0.md). Section
references point there.

---

## 1. Who owns what, before and after

```mermaid
flowchart LR
  subgraph TODAY["TODAY — WooCommerce owns the subscription"]
    direction TB
    AS["Action Scheduler<br/>162 pending rows<br/>furthest: 2031-10-03"] -->|fires| WCS[WooCommerce Subscriptions]
    WCS -->|charge saved pm_| S1["Stripe<br/>cus_ + pm_"]
    WCS -->|charge vault token| P1["PayPal<br/>vault token"]
    WCS -->|webhook| LABS1["Labs<br/>passive listener"]
  end

  subgraph AFTER["v2.0 — Labs owns the subscription"]
    direction TB
    COL["billing_subscriptions<br/>.next_charge_at<br/>(indexed column)"] -->|worker reads| W[billing worker]
    W -->|1. ledger row| LED[(billing_charges)]
    W -->|2. charge| S2["Stripe<br/>same account"]
    W -->|2. charge| P2["PayPal<br/>same merchant"]
    W -->|3. membership| MEM[(memberships)]
  end

  TODAY ==>|"the whole swap:<br/>a cron row becomes a column"| AFTER
```

**The providers never owned the subscription.** All nine Woo subscription products
have `_ppcp_enable_subscription_product = no`, and there are zero Stripe Billing
subscription objects. Both sides only ever held a reusable authorization.

---

## 2. The charge sequence — why the ledger is written first

```mermaid
sequenceDiagram
  participant W as Worker
  participant DB as MySQL
  participant P as Stripe / PayPal

  W->>DB: SELECT ... next_charge_at <= now()<br/>FOR UPDATE SKIP LOCKED
  Note over DB: §5.1 NO lower bound —<br/>an outage delays, never loses
  DB-->>W: due rows
  W->>DB: UPDATE lease_owner, lease_expires_at
  W->>W: compute period from anchor (§5.4)
  W->>W: assert amount == stored amount (§7.3)
  W->>DB: INSERT billing_charges (status=intent)
  Note over DB: UNIQUE(subscription_id, period_index, attempt)<br/>a duplicate dies HERE, before money moves
  W->>DB: COMMIT
  Note over W,DB: ◀ the intent is now durable.<br/>A crash past this point is recoverable.
  W->>P: charge(idempotency_key)
  alt succeeded
    P-->>W: ok
    W->>DB: settle(succeeded) + advance schedule + membership active
  else declined
    P-->>W: decline_code
    W->>DB: settle(failed) + retry ladder (§7.4)
  else transport error
    P--xW: timeout / 5xx
    W->>DB: leave row OPEN, release lease
    Note over W,DB: §7.15 NEVER a decline.<br/>Recovery resolves it (§7.2)
  end
```

---

## 3. Subscription state machine

```mermaid
stateDiagram-v2
  [*] --> active : checkout / import
  [*] --> comped : import, price deliberately $0 (§9.3)
  [*] --> manual_billing : import, paid another way, no gateway (§9.3)
  [*] --> quarantined : import, anything uncertain (§9.5)

  active --> past_due : charge failed
  past_due --> active : retry succeeded
  past_due --> past_due : retry ladder +1/+3/+5/+7d
  past_due --> grace : ladder exhausted, or HARD decline
  grace --> active : member updates payment method
  grace --> expired : grace_until passes (7d)

  active --> pending_cancel : member cancels
  pending_cancel --> expired : ends_at reached
  active --> expired : max_periods / ends_at (finite term)
  active --> quarantined : outcome unresolvable (§7.2)
  quarantined --> active : human clears it

  comped --> [*] : admin ends it
  manual_billing --> active : payment method added
  expired --> [*]
```

`comped` and `manual_billing` are **deliberate** non-billing states, not faults. The worker's
due query selects `status IN ('active','past_due','grace')`, so neither can ever be charged —
structurally, not by a flag check inside the loop. Proven by test section 10b.

Access follows `memberships.status`, which billing writes only through
`upsert_membership`. `grace` is already treated as entitled by the existing
`derive_role`, so a member keeps access for the whole 7 days.

---

## 4. Charge ledger — a one-way path

```mermaid
stateDiagram-v2
  [*] --> intent : INSERT, committed before any provider call
  [*] --> shadow : LABS_BILLING_MODE=shadow (never calls a provider)
  intent --> processing : PayPal capture PENDING
  intent --> succeeded
  intent --> failed
  intent --> requires_action : 3DS (NOT a decline)
  processing --> succeeded
  processing --> failed
  requires_action --> succeeded : member confirms within 72h
  requires_action --> failed : window closes
  intent --> abandoned : resolved by hand
  succeeded --> [*]
  failed --> [*]
```

`succeeded`, `failed` and `abandoned` are terminal: a late-arriving webhook cannot
resurrect a settled charge. Enforced in `ledger.settle`, proven by test
*"a settled charge cannot be resurrected by a late event"*.

---

## 5. How a payment cannot slip — four independent layers

```mermaid
flowchart TD
  A["A charge is owed"] --> L1

  L1["LAYER 1 — unbounded due query §5.1<br/>next_charge_at <= now(), no lower bound.<br/>Worker down a week? Still picked up."]
  L1 -->|worker never runs| L2
  L1 -->|worker runs| OK1["charged"]

  L2["LAYER 2 — heartbeat §7.9<br/>no finished cycle in 30 min, checked by a<br/>SEPARATE job, because a worker cannot<br/>report its own death"]
  L2 --> L3

  L3["LAYER 3 — nightly reconciliation §7.7<br/>A: owed + past due + no ledger row -> ALERT in 2h<br/>B: provider charge with no ledger row -> ALERT<br/>B': ledger success with no provider charge -> ALERT"]
  L3 --> L4

  L4["LAYER 4 — recovery §7.2<br/>open intent past the lease: ASK the provider.<br/>Cannot answer -> quarantine + page a human.<br/>An ambiguous charge is NEVER retried."]
  L4 --> OK2["resolved, or a human is holding it"]

  style L1 fill:#1f4e3d,color:#fff
  style L2 fill:#1f4e3d,color:#fff
  style L3 fill:#1f4e3d,color:#fff
  style L4 fill:#1f4e3d,color:#fff
```

And in the other direction — a charge cannot happen **twice**:

```mermaid
flowchart LR
  D["duplicate attempt<br/>(racing worker, replayed webhook,<br/>double-clicked button, resumed crash)"]
  D --> U1["UNIQUE(subscription_id, period_index, attempt)<br/>→ dies in the database, before any provider call"]
  U1 --> U2["UNIQUE(provider, idempotency_key)<br/>→ catches the replay case"]
  U2 --> U3["Stripe idempotency key — 24h ONLY<br/>never the primary guard"]
  U3 --> U4["PayPal invoice_id — permanent,<br/>provider-side"]
  U4 --> Z["zero double charges"]
  style U1 fill:#5b2333,color:#fff
  style Z fill:#1f4e3d,color:#fff
```

The two racing cases are blocked by **different** keys — the concurrent-worker case
by the period key, the replay case by the idempotency key. Both are needed; neither
covers the other. Proven by tests 3 and 5.

---

## 6. Migration and cutover

```mermaid
flowchart TD
  W["Woo: 221 subscriptions<br/>171 active · 42 on-hold · 8 pending-cancel"] --> T{"transform §9.2"}

  T -->|"163"| A["active<br/>anchor_at = _schedule_next_payment<br/>amount = _order_total (NEVER plan price)"]
  T -->|"45"| Q["quarantined — data we do not<br/>understand. Imported, NEVER charged"]
  T -->|"4"| CP["comped — price deliberately $0<br/>membership granted, never charged"]
  T -->|"2"| MB["manual_billing — paid another way<br/>honoured, never charged"]
  T -->|"7"| PC["pending_cancel<br/>access to ends_at, then stop"]

  Q --> Q1["42 on-hold (21 are 90+ days overdue)"]
  Q --> Q2["2 PayPal with no vault token: #9661 $1,997 · #12406 $17"]
  A --> AL["49 with a DELIBERATELY SET price<br/>amount_locked=1 · 39 Activators $67 ·<br/>Navigators $217 / $160.20 · Quarterly $400"]

  A --> P1["PHASE 1 · shadow, 14 days<br/>daily diff vs Woo's real renewals<br/>ZERO provider calls"]
  P1 -->|"14 days of zero diffs"| P2["PHASE 2 · 5 weekly Observers at $17<br/>cheapest, fastest signal"]
  P2 -->|"10/10 correct"| P3["PHASE 3 · Stripe tranches<br/>weekly → monthly → annual"]
  P3 --> P4["PHASE 4 · PayPal<br/>ONE live vault charge first"]
  P4 --> P5["PHASE 5 · Woo billing off<br/>_requires_manual_renewal = true<br/>records KEPT, rollback available"]

  style P1 fill:#2a3f5f,color:#fff
  style Q fill:#5b2333,color:#fff
  style CP fill:#2d3f2a,color:#fff
  style MB fill:#2d3f2a,color:#fff
  style AL fill:#2a3f5f,color:#fff
```

Each subscription goes live by flipping **its own** Woo `_requires_manual_renewal`
to `true` — per-subscription, reversible, and every Woo record intact. Deleting
Action Scheduler rows would be irreversible and is forbidden (§7.18).
