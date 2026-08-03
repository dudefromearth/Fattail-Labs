# Admin Guide — Access Control

**Audience:** FatTail Labs administrators  
**Product:** `labs.fattail.ai`  
**UI:** [Admin → Access](/admin/access)  
**Spec:** `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`

This guide is for day-to-day campaign and membership gating. You do **not** need a deploy to change who can open a lesson or write in Trade Log.

---

## 1. What Access Control does

One policy engine answers: **may this person use this surface, app, or course item right now?**

| You can gate | Examples |
|--------------|----------|
| **Lessons** | Open a free sample; lock the rest to Observer+; time-box a campaign module |
| **Apps** | Soft-limit Trade Log writes while always allowing members to **read/export** their own data |
| **Surfaces** | Most public pages (not login/membership — those stay always available) |
| **Campaigns** | Landers that fail closed until you attach a policy |

Access **never invents** membership from a URL. It uses Labs sign-in, live memberships / plans, and role (same truth as SSO and WooCommerce sync).

---

## 2. Where to work

1. Sign in as **administrator**.  
2. Open **Admin → Access** (`/admin/access`).  
3. Use the **Policies** tab to create/edit; **Audit** to see who changed what.

Optional API (for bulk campaigns or scripts):

| Method | Path |
|--------|------|
| List | `GET /api/admin/access/policies` |
| Get one | `GET /api/admin/access/policies/{target_key}` |
| Create/update | `PUT /api/admin/access/policies/{target_key}` |
| Delete | `DELETE /api/admin/access/policies/{target_key}` |
| Bulk | `POST /api/admin/access/policies/bulk` body `{ "policies": [ … ] }` |
| Preview decision | `GET /api/admin/access/decision?target=…&role=…&plans=…` |
| Batch preview | `POST /api/admin/access/decision/batch` |
| Audit log | `GET /api/admin/access/audit` |

There is **no** public “probe” API for members. Members only see an `access` object on the resource they already requested (e.g. a lesson).

---

## 3. Target keys (what you are gating)

Type the **target key** exactly. Patterns:

| Kind | Pattern | Example |
|------|---------|---------|
| Lesson | `lesson:{id}` | `lesson:42` |
| Module | `module:{id}` | `module:7` |
| Course | `course:{id}` | `course:3` |
| Resource | `resource:{id}` | `resource:15` |
| App | `app:{slug}` | `app:trade-log` |
| Surface | `surface:{name}` | `surface:catalog` |
| Campaign | `campaign:{slug}:{part}` | `campaign:obs-launch:lander` |

**How to find a lesson id:** open the lesson in admin/course tools, or use the lesson API payload field `id`. Numeric ids are required (not the URL slug alone).

### Ungateable (cannot lock)

These always stay open so people can fix membership and sign in:

- `surface:login`, `surface:signup`, `surface:logout`  
- `surface:membership`, `surface:forgot-password`, `surface:reset-password`  
- `surface:me`  

Saving a policy on any of these returns **422**.

---

## 4. Fields that matter

### Mode

| Mode | Member experience |
|------|-------------------|
| **hard** | Locked; no content leak (media APIs deny). Default for most course gates. |
| **soft** | Teaser / banner; still no full media. Use for “almost open” marketing. |
| **hide** | Looks like **not found** (404). Strongest removal from catalog sense. |
| **redirect** | Send elsewhere (host must be on allowlist). |

**Data-bearing apps** (`app:trade-log`, `app:journal`, `app:playbook`):  
You **cannot** set mode **hard** or **hide**. That would strand members’ own records. Use **soft** + role/plan limits so **writes** can stop while **read/export** stay available. Illegal saves return **422** with a clear message.

### Min role

Ladder (lowest → highest):

`observer` → `alumni` → `activator` → `navigator` → `administrator`

If set, the member’s **access role** (live membership elevation included) must be at least this level.

### Selected plans (intent)

Check the commercial plans that should count:

| Plan chip | Meaning |
|-----------|---------|
| `observer-trial` | Paid Observer (6-week) |
| `activator` / `labs-membership` | Activator tier |
| `navigator` | Navigator |
| `coaching` | Coaching |
| `courses-alumni` | Course Alumni plan only (see below) |

**Important — expansion at access time (not when you save):**

If you select **Observer** and leave **Exact plans only** off, the system **also admits** Activator, Navigator, and Coaching at evaluation time. The form shows this as a **display-only** “Also admits at evaluate…” preview. What is stored is still only what you selected.

That means: when you later add a new higher commercial slug to Labs, old Observer-selected policies keep admitting higher tiers without rewriting every policy.

### Exact plans only

- **Off (default):** commercial expansion as above.  
- **On:** only the exact selected plan slugs count (Navigator will **not** get in via Observer expansion).

### Course Alumni (non-commercial)

Expansion **never** auto-adds Alumni.

To admit alumni:

- set **Min role** ≥ `alumni`, **or**  
- include plan `courses-alumni` explicitly (often with **Exact plans only** if you want that plan alone).

### Plan + role together

Default combine is **OR**: either plan match **or** min role is enough.  
(AND is available via API `plan_role_combine: "and"` for rare cases.)

### Require signed in

Usually **on** for lessons/apps. Anonymous visitors get sign-in required.

### Time window

- **Opens at / closes at** — UTC campaign windows.  
- **Close behavior:**  
  - `deny` — after close, deny with a time message.  
  - `default` — after close, fall back to normal type defaults (e.g. open course shell).

Copy rule: a closed window is **not** “you’re not a member” — it is a schedule message.

### Grandfather enrollments (courses)

Default **on** for course-family targets: if someone is already enrolled in that course, they can keep access when a new gate would otherwise deny them.  

**Exception:** `deny_plans` blocklist does **not** grandfather.

---

## 5. Common recipes

### A. “Free preview lesson, rest for members”

1. In the lesson editor, leave **free preview** on for the sample lesson (dual-writes a simple signed-in policy).  
2. For gated lessons, either:  
   - rely on defaults (any active membership / alumni+), **or**  
   - set policy `lesson:{id}` with `selected_plans: [observer-trial]` (expands to higher paid tiers) or `min_role: alumni`.

### B. Campaign: Observer-selected content for 2 weeks

1. Target keys for the campaign lessons/lander.  
2. Selected plans: `observer-trial` (exact **off** so Navigators still get in).  
3. Set **opens_at** / **closes_at**.  
4. Close behavior: `deny` if the promo should hard-stop; else `default`.  
5. Optional: bulk API to apply the same payload to many `lesson:…` keys.

### C. Soft-limit Trade Log writes (keep history)

1. Target: `app:trade-log`.  
2. Mode: **soft** only.  
3. Min role: e.g. `navigator` (or selected plans as needed).  
4. Members who fail the gate still **list and export** their book; create/update should deny.

### D. Hide a course from the public catalog sense

1. Mode **hide** on `course:{id}` (and related surfaces as needed).  
2. Prefer not oscillating hide/unhide for short promos — use **time** + hard/soft instead for crawl stability.

### E. Block a plan from a target without locking everyone’s data

Use **deny_plans** (API). On data-bearing apps, deny_plans still leaves **read/export**. For abuse, use account suspension — not hide.

---

## 6. Free preview dual-write

When you toggle **free preview** on a lesson in the course admin editor:

- **On** → Labs also upserts policy `lesson:{id}` labeled dual free-preview (signed-in, open).  
- **Off** → removes that dual-write policy if it was auto-created so normal member gating returns.

If you later save a **custom** campaign policy on that lesson, prefer editing it in Access Control (custom rows are not auto-deleted by free-preview off unless they were dual-write labeled).

**Policy wins when present.** After a custom policy exists, free_preview alone is not the only truth — check Access Control.

---

## 7. How to test a change (safe)

1. Save policy in `/admin/access`.  
2. Use **Admin decision** API to simulate a role/plan without logging out:  
   `GET /api/admin/access/decision?target=lesson:42&role=observer&plans=observer-trial`  
3. Or open a private window as a real test account (Observer vs free signup).  
4. Confirm: free no-plan still 403 on gated lesson; Observer membership 200; admin still full access.

**Preview-as (advanced):** server supports an `ft_access_preview` cookie for admins (empty enrollments, no progress pollution). Full UI toggle may land later; do not rely on browser-only role fakes.

---

## 8. What you should never do

| Don’t | Why |
|-------|-----|
| Gate login / membership / password reset | Strands members who need to re-SSO or buy |
| Hard-lock Trade Log / Journal / Playbook | Violates member data rights; API rejects |
| Trust a URL or query param for role | Server is source of truth only |
| Expect write-time “frozen” expanded plan lists | Expansion is always live at evaluate |
| Use profit-claim CTAs in deny copy | Product doctrine: process outcomes only |
| Tell someone a **time** lock means “not a member” | Wrong message; use schedule language |

---

## 9. Audit and rollback

- Every create/update/delete writes **access_policy_audit**.  
- Open **Audit** tab or `GET /api/admin/access/audit?target=lesson:42`.  
- Rollback: edit the policy again, or **DELETE** the target key to return to type defaults (as-built behavior).

---

## 10. Defaults when there is no policy

| Target | Default behavior |
|--------|------------------|
| Course / module | Public shell open (SEO) |
| Lesson / resource | Sign-in required; free_preview **or** member content (membership / alumni+) |
| App | Sign-in; practice tools need Observer trial / Activator+ / admin; data floor for own data |
| Campaign | **Fail closed** until you add a policy |
| Surface | Open (feature gates may still apply on some hubs until fully merged) |

---

## 11. Deploy note (ops)

On each environment, migration **`075_access_policies.sql`** must be applied once:

```bash
cd server && .venv/bin/python migrate.py
```

See `infra/deploy.md` → **Access Control**. No special env vars for the engine constants.

---

## 12. Quick checklist before a campaign launch

- [ ] Target keys use numeric lesson/course ids  
- [ ] Observer selection: exact **off** unless you truly want Observer-only  
- [ ] Alumni path decided (min role vs plan chip)  
- [ ] Time window + close behavior set  
- [ ] No ungateable surfaces in the bulk list  
- [ ] No hard/hide on trade-log / journal / playbook  
- [ ] Decision API or test account walkthrough for free / Observer / Navigator  
- [ ] Audit shows the writes you expect  

---

## 13. Switching accounts (Alpha MSC ↔ Ernie, etc.)

Labs logout does **not** sign you out of WordPress. See  
**[`docs/Auth-Account-Switch-Runbook.md`](./Auth-Account-Switch-Runbook.md)**.

## 14. Related docs

| Doc | Role |
|-----|------|
| `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md` | Full product/engine law |
| `docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md` | Implementation phases |
| `docs/Auth-Hardening-Audit-2026-08-02.md` | Auth security audit |
| `docs/Auth-Account-Switch-Runbook.md` | Dual-session account switch |
| `Specs/FatTail-Labs-Identity-Access-Spec-v1.0.md` | Roles, SSO, plans |
| `Specs/FatTail-Labs-Enrollment-Access-Spec-v1.0.md` | Lesson free_preview matrix |
| `Architecture/00-decision-log.md` | DL-198 … DL-204 |

---

*Questions or new campaign patterns: log the decision the same day; prefer policy + bulk over one-off code.*
