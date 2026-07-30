# FatTail Labs — Journal Session Spec v0.2

**Status:** **BUILD AUTHORITY** — Coach **GO** 2026-07-30 · Delta JS0-G **PASS** · program `agents/p-journal-session/`  
**Supersedes:** Journal Session Spec **v0.1** (advisor draft)  
**Family:** B (member-private)  
**Entitlement (Coach-locked 2026-07-29):**  

| | **Observer** (plan `observer-trial`) | **Navigator** | Free no-plan |
|--|--------------------------------------|---------------|--------------|
| Practice features | **Identical** | Full | No create |
| Membership **term** | **6 weeks only** (this is the **sole** product difference) | Ongoing (billing period) | n/a |

**Observer is not free.** Same Journal / Trade Log / Retrospective / habits / agent (when mode on) as Navigator for the duration of the 6-week membership.  

**Parents (verified in repo 2026-07-29):**

| Doc | Role | Notes |
|-----|------|--------|
| Journal Retrospective Spec **v0.6** | As-built product truth (RT8-G) | Exists: `Specs/…-v0.6.md`. Build GO was **v0.5**; v0.6 is honesty/as-built, not a second product shape |
| Journal Retrospective Spec **v0.5** | Build-era decisions (Option C, §6, §10.1, §19–20) | Still citable for product locks |
| Journey Experience Spec **v1.0** | Grades, meters, **§4.1a cadence** (folded into this file 2026-07-29) | §4.1a lives **in the v1.0 file** as patched — there is no separate Journey v1.1 file |
| Trade Log Spec **v1.1** | Day-book context; process fields | In repo |
| Member Practice Export Spec **v1.1** | Portability parent (extend §12) | In repo |
| Member Data Privacy Spec **v0.1** | Family B, export/delete | In repo |

**Board:** [`agents/p-journal-session/`](../agents/p-journal-session/ORCHESTRATOR.md) — full bench plan  
(CHARTER · IMPLEMENTATION-PLAN · seeds JS0–JS9). **J1·J2 PASS** · **JS3-0 agent GO** 2026-07-30  
(`LABS_JOURNAL_AGENT_MODE=local|off`, default **local** — agent chat primary;
form always available as alternative; explicit `off` fails loud on agent routes).

---

## 0. Purpose of v0.2 (why rewrite)

v0.1 was a strong product design that could not ship as written: open taxonomy, unratified P2 agent identity, citations to superseded Retrospective drafts, no as-built path, and no portability model. **v0.2 locks decisions, phases delivery, and aligns with shipped Practice.**

Product intent is unchanged: a journal entry must be **falsifiable** — levels, size, and invalidation — not unverifiable diary prose.

---

## 1. Intent

Replace free-text-only Journal capture with a **bounded interview session**:

1. Member picks **one primary tag** (script selector).  
2. Agent (or structured form in early phase) runs a short interview.  
3. Record has **two layers**: append-only transcript + member-confirmed structured fields.  
4. Downstream Retrospective **§6.5 expected-vs-actual** may quote only **`pre_open` member** content for that `journal_date`.

Secondary: capture screenshots at decision time; feed carry-forward / open-thread into Retrospective §6.0.

---

## 2. As-built honesty (do not re-found)

| Today (main) | v0.2 target |
|--------------|-------------|
| Calendar + Trade Log day-book | Unchanged shell; sessions attach to calendar date |
| Free-text `member_tool_notes` (`journal` / `pre_market`) | **Migrate** into session model; dual-read until cutover |
| No interview agent | Phased: structured form first optional, agent interview when enabled |
| No date closure | Closure after retrospective complete (§10) |
| Export: notes only (Practice Export v1.1) | Export sessions + messages + structured (§12) |

**Migration principle:** build on `member_tool_notes` → new tables; backfill `surface=pre_market` / body prefix into structured/tag where possible; never invent invalidation the member did not write.

### 2.1 Dual-read plan (India APPROVED JS0-1 — SoR for JS1-3)

Until cutover (`LABS_JOURNAL_SESSIONS` cutover flag or Lima DL “sessions sole SoR”):

| Consumer | Read path |
|----------|-----------|
| Retrospective gather §6.5 expected-vs-actual | **Union:** (1) sealed/partial sessions with `tag=pre_market` and `pre_open` member content / structured fields for `journal_date` in window; (2) legacy `member_tool_notes` where `_is_pre_market_note` (surface or body prefix) and note day in window |
| Retrospective journal-gap / routine stretch | Union session days (`session_started_at` NY day for any session) **and** legacy note days |
| Journey routine meter (D2) | Prefer session `session_started_at` NY day when sessions exist; **also** count legacy note days until cutover so meters do not cliff |
| Practice export | Emit both `documents.journal` (legacy notes) and `documents.journal_session` when sessions exist |
| Practice purge | Delete both notes and sessions (+ media when J5) |

**Cutover:** stop writing new `member_tool_notes` for journal surfaces when sessions are default UI; keep read-union one release; then notes become historical-only.

**Never invent** structured invalidation from free-text alone without member confirm (J2 gate).

---

## 3. Decisions

Locking a recommendation is **not** clearing a gate. India / Mike / Tango / Hotel / Delta still review where named. A waived gate remains a doctrine violation.

### 3.1 Locked decisions (Coach GO 2026-07-30 — D1–D9)

| ID | Decision | Status | Owner |
|----|----------|--------|-------|
| **D1** | Tag vocabulary **replaces** dual surface/type taxonomy — single `tag` | **LOCKED — India APPROVED (JS0-1)** | India |
| **D2** | Journey **routine** keys on **`session_started_at` NY day**, not `journal_date` alone; `journal_date` still scopes retros | **LOCKED — India APPROVED (JS0-1)** · **Tango soft-review PASS (JS0-2)** — member copy describes “days you started a sitting,” never backdate/lateness shame | India · Tango |
| **D3** | Image / book P&L chrome in journal session UI **inherits** Retrospective process-first **section collapse** (default collapsed; member expands) | **LOCKED — Tango APPROVED (JS0-2)** · Hotel co-sign (resulting prevention) | Tango · Hotel |
| **D4** | Private media: **separate Family B member store** (not course admin private tier); owner auth via session cookie; **no public URL**; export + purge binaries; never journey-public / never admin Family A path | **LOCKED — Mike APPROVED (JS0-3)** · India co-sign | Mike · India · Alpha (impl) |
| **D5** | Demo: `identities.is_demo` at create only, **immutable**; wholesale reset/reseed; never convert flag off; exclude aggregates/community/marketing | **LOCKED — India · Mike APPROVED (JS0-4)** | India · Mike |
| **D6** | **Observer = Navigator for all Practice features.** **Only** product difference: Observer membership **term = 6 weeks**. Not free. Free no-plan still no Practice create. | **LOCKED (Coach 2026-07-29)** | Coach |
| **D7** | Agent attribution stopgap: `author=agent`, `agent_service="labs-journal-session"`; member session owns ACL; audit every turn; full P2 principals later without re-key | **LOCKED — Mike APPROVED (JS0-3)** · Coach product enablement separate | Mike · Coach |
| **D8** | Interview depth: **≤ 8 agent absence questions** per interview phase; code-enforced; trade-log / prior-plan **pre-fill** so **invalidation is not starved**; 8 is ceiling not quota | **LOCKED — Hotel · Tango APPROVED (JS0-5)** | Hotel · Tango |
| **D9** | Session import **additive only**; never overwrite sealed transcript | **LOCKED — Coach GO (JS0-0)** · Mike · India content already normative §12 | Mike · India · Coach |

---

## 4. Two-layer record (load-bearing)

| Layer | Content | Mutability |
|-------|---------|------------|
| **Transcript** | Every message: `author` ∈ {`member`,`agent`}, UTC time, derived phase | **Append-only** until data-subject delete |
| **Structured record** | Confirmed fields for the tag (intent, instrument, invalidation, …) | Written at **confirmation gate**; member-editable only before seal |

- Downstream readers (Retrospective gather) use **structured + member transcript turns** only.  
- Agent turns are evidence of process, **never** quoted as member intent.  
- Unreached required fields = **absent** (null / omitted) — never agent-filled.

---

## 5. Tags (v1 vocabulary)

Single primary tag before open. Small set:

| Tag | Script | Required (code checklist) |
|-----|--------|---------------------------|
| `pre_market` | Interview | instrument, thesis/direction, trigger/level, size/risk, **invalidation**, watching |
| `post_session` | Interview | plan-diff, member-named deviations, what worked, open thread |
| `clean_day` | One turn | “Anything differ from plan?” → done or offer `post_session` |
| `reflection` | Light | ≤ 2 absence questions; no confirmation restatement required |
| `retrospective` | **Navigate** | Does not capture; see §8 |

**D1:** `tag` is the only taxonomy. Legacy notes: map `surface=pre_market` → tag `pre_market`; other notes → `reflection` until member reclassifies.

### 5.1 `pre_market` required fields (Hotel APPROVED JS0-5 — SoR for JS2-1)

Falsifiable plan for Retrospective §6.5. Same checklist for **agent** and **J2 form**.

| Field | Meaning (trading-accurate) | Absent allowed? |
|-------|----------------------------|-----------------|
| `instrument` | What is in play (symbol / product). Prefill from trade log / prior plan when known | Prefer prefill; ask only if unknown |
| `thesis_direction` | Member’s directional or structural idea **in their words** — not agent strategy | Yes if member says unknown (record uncertainty) |
| `trigger_level` | Condition / level that makes the plan **actionable** (checkable later) | Prefer specific; vague OK if honest |
| `size_risk` | Size and/or risk frame **member stated** — risk named before opportunity | Prefer prefill size; never agent-invent risk |
| `invalidation` | **Load-bearing.** Condition that proves the plan **wrong** or forces stand-down / flat — member-owned, not agent stop-loss advice | Required for a complete pre_market seal when using full checklist; if member cannot state one, record **explicit uncertainty** (not invented level) and allow partial |
| `watching` | What they monitor next (levels, events) — process, not prediction theater | Yes |

**Invalidation rules (Hotel hard):**

1. Agent/form **never invent** an invalidation the member did not confirm.  
2. Invalidation is **process definition**, not “where you should put a stop.” No advice framing.  
3. “I don’t know” / “no hard invalidation” is a complete answer → structured field absent or `uncertainty` — **better than false precision**.  
4. Under D8, **reserve ≥2 absence-question slots** for invalidation when it is still missing after prefill (Spec §8.4). Prefill of instrument/size exists **so** those slots are not burned on facts the trade log already has.

---


## 6. Dates and sessions

### 6.1 `journal_date`

- Member-set; default **today** (NY calendar); backdating allowed.  
- Scope key for Retrospective gather (same as entry day in window).  
- **Not** derived from `created_at` (writing Tuesday on Wednesday is legitimate).

### 6.2 Multiple entries per date

Allowed; ordered by `session_started_at`. Morning plan and evening writeup are separate entries.

### 6.3 One session per entry

- No second session inside an entry; **no reopen after seal**.  
- Session may **span the trading day** (pre-open interview → silent intraday notes → optional post-close).  
- Interruption → **`status=partial`**: confirmed structured kept; unreached required fields **absent** (never inferred).

### 6.4 Timestamps

- Every message: UTC immutable.  
- Entry: `session_started_at` (ordering anchor).  
- Derived **phase** per message (§7).

### 6.5 Routine meter (D2)

- Journey `routine` counts a day if **any** sealed or partial session has `session_started_at` on that NY day.  
- Backdating `journal_date` does **not** invent routine history.

---

## 7. Market phase (enforcement)

Derived from message UTC vs market calendar config for `journal_date` (fail loud if calendar missing):

| Phase | Meaning |
|-------|---------|
| `pre_open` | Before RTH open on `journal_date` |
| `intraday` | Between open and close |
| `post_close` | After close same calendar day |
| `off_session` | Weekend/holiday (no RTH); treated like post_close for interview rules except no “market open silence” |
| `later_day` | Written on a **later calendar date** than `journal_date` (recollection) |

**Retrospective §6.5 (expected vs actual):** only **`pre_open` + `author=member`** turns (and structured `pre_market` fields) for that date.  
`later_day` / post-outcome content → reflection / what-worked sections only.

**Calendar:** config table (hours, holidays, half-days) — not hard-coded 09:30–16:00. Venue default **US equities RTH** unless entry declares otherwise later.

---

## 8. Agent role by phase

| Phase | Role |
|-------|------|
| `pre_open` | Interviewer (tag script) |
| `intraday` | **Silent recorder** — no questions |
| `post_close` / `off_session` | Optional second interview if tag needs it |
| `later_day` | Recorder + light absence questions; **never** invent pre_market intent |

### 8.1 Code vs prompt

| Code-owned | Prompt-owned |
|------------|--------------|
| Tag → script, required checklist, depth cap D8 | Phrasing |
| Confirmation gate, clean_day branch | Restatement wording |
| Attribution, phase, intraday silence | — |
| Turn validator (block before render) | — |
| Date closure, transition confirms | — |
| UI warning copy for seal / gather / complete | — |

### 8.2 Turn validator (fail loud)

Before any agent turn renders: block causal/motive claims about the member; advice; praise/blame; P&L figures; grade/meter/streak/score; multi-question turns; chart/price claims after image upload; requests for brevity. Log violation; **one** retry.

**Failure path (critical):** if the second attempt still fails, **do not seal a dead partial**. Fall back to the **J2 structured form** for any unreached required fields (same checklist as the tag). Member can complete/confirm there; only then seal.  

Rationale: no-reopen + partials that contribute nothing to §6.5 would otherwise destroy pre_market intent on a bad model day with no recovery.

### 8.3 System instruction

Normative full text lives in **Appendix A**. Ship as versioned constant `JOURNAL_SESSION_SYSTEM_PROMPT_V1`. Amend only via Spec bump (Tango · Hotel).

### 8.4 Tag scripts (normative) — **Hotel APPROVED JS0-5** · Tango co-sign (tone/capacity)

| Tag | Behavior |
|-----|----------|
| `pre_market` | Required set §5 / §5.1; **pre-fill** instrument/size from trade log / prior plan when known; **invalidation** still pursued with **≥2** absence-question slots reserved under D8; then code-owned **confirmation restatement** (plan + invalidation + watching in member terms); seal; intraday notes allowed without reopening interview |
| `post_session` | Open from same-day `pre_market` structured if any; member **names** plan-diff and deviations (process, not P&L story); what worked is **member assertion only** (distinct from retro-derived what-worked); open thread optional for carry-forward |
| `clean_day` | **Exactly one** agent question: whether anything differed from plan. **No** → seal complete (plan held is a process fact — not a win celebration). **Yes** → offer new `post_session` entry (do not expand clean_day into a full debrief). No invalidation interview on this tag |
| `reflection` | ≤ 2 absence questions; no restatement gate; **not** a substitute for `pre_market` intent (does not feed §6.5 as plan) |

#### 8.4.1 D8 depth + prefill (Hotel · Tango LOCKED)

| Rule | Detail |
|------|--------|
| Cap | **≤ 8 agent absence questions** per interview phase (`pre_open` interview for `pre_market` / `post_session` as applicable). Code-enforced |
| Ceiling not quota | Do **not** pad to 8. Stop when required set is satisfied or member ends. Tango: capacity |
| Prefill | Trade log + prior sealed `pre_market` / plan fields pre-populate known instrument/size (and similar facts). **Never ask what the log already states** (Appendix A) |
| Invalidation budget | If invalidation still missing after prefill, **≥2** of the remaining absence slots are reserved for it before burning budget on lower-priority probes |
| Confirmation | **One** code-owned restatement turn after absence interview (or form complete) — confirm/correct; not a multi-question quiz. Counts separate from the 8 absence questions so restatement never steals invalidation slots |
| clean_day | Cap = **1** total agent question (not 8) |
| reflection | Cap = **2** |
| Form path | J2 uses the **same** required checklist; no question budget (member fills fields). Validator fail → form (§8.2) |

**Priority order when budget is tight (pre_market absence questions):**  
missing **invalidation** → trigger/level → thesis/direction → size/risk (if not prefilled) → watching → instrument (if not prefilled).

#### 8.4.2 Trading-accuracy locks (Hotel)

| Claim checked | Verdict |
|---------------|---------|
| Plan without invalidation is incomplete for falsifiable journaling | **Hold** — pursue invalidation; allow honest uncertainty over invented levels |
| Agent must not invent stops, targets, or “better” plans | **Hold** — Appendix A + validator |
| clean_day is not a grade of the day | **Hold** — process check only; Tango: no shame on “yes, differed” |
| post_session what-worked ≠ retro what-worked | **Hold** — member assertion vs derived section |
| reflection ≠ pre_market for §6.5 | **Hold** |
| Risk (size_risk) before opportunity framing | **Hold** — field present; agent never glamorizes payoff |
| Losses and wins get equal interview attention | **Hold** — Appendix A symmetry |

### 8.5 Script telemetry

Log which agent turn index a session ends on (and whether end was seal / partial / form-fallback / abandon). Consistent abandonment at the same turn = script defect, not member failure. Operator-facing only.

---

## 9. Retrospective tag (navigate, don’t capture)

| Case | Behavior |
|------|----------|
| Clean (no content yet) | Route only; **no** journal entry |
| In-flight | Confirm → seal partial → **link** entry ↔ retro both ways → navigate |

**Routing target:**

1. Open retro exists → resume (max 1 open; no second create).  
2. Else create via **existing** `POST /api/me/retrospectives` only.  
3. Empty scope → explain; create nothing; offer journal instead.

**Never auto-gather** (gather sets `scope_end` and drives date closure).  
**Never** paste transcript into retro `body_md` automatically; optional member-accepted summary draft only.  
**Cadence:** create/resume/gather/abandon move **no** meter; only retro `completed_at` does.

Warnings **before** leave / gather / complete — UI-owned, no grades/meters/lateness (Appendix B). Name unreached fields on leave; name closed dates on complete; “today stays open.”

---

## 10. Date closure

After a retrospective **completes**:

- **Close** whole calendar dates **strictly before** the gather date (NY) for that member.  
- Gather date stays open (mid-day gather must not kill afternoon legit activity).  
- Closed dates: refuse new sessions **and** attachments → **409** + reason + link to closing retro.  
- No admin reopen for non-demo members.  
- Gather→complete gap dates remain open forever (Option C artifact — accepted).

### 10.1 Backdating into a closed range

If a member seals a **backdated** entry (or routes in-flight to retro and seals) whose `journal_date` falls in a range that is **already closed** or **becomes closed** by an immediate complete in the same sitting:

- Server enforces closure on write (**409** if already closed).  
- On complete, the warning **names every date** being closed, including any backdated entry sealed in this sitting that will become immutable immediately.  
- That is correct (it was taken into account) — but must never feel like silent data loss.
---

## 11. Uploads (v1)

- **No agent vision interpretation** — member caption is machine-readable layer.  
- Paste primary; attach to entry or trade; cap per entry (default **5**).  
- Closed dates refuse new attachments (**409**).  
- Render chrome: §11.1 (D3). Storage/auth: §11.2 (D4).

### 11.1 Image / book P&L chrome (D3 — Tango LOCKED JS0-2)

Journal session UI **inherits** Retrospective process-first / book-collapsed doctrine (Retro §6.6, D1).

| Surface | Default | Rule |
|---------|---------|------|
| Transcript, structured form, member captions, process screenshots (decision evidence) | **Visible** | Process is the product |
| Trade-log **book / P&L** join beside a session or day | **Collapsed** | Member expands; never hero of the sitting |
| Upload chrome that is **result-adjacent** (equity, realized P&L, “scorecard” tickets) | **Collapsed** strip | Expand = member choice; no auto-expand on upload |
| Agent turns | — | Never state a P&L figure (Appendix A + §8.2 validator) |

**Expand preference:** default collapsed (non-negotiable). Charlie may reuse `identities.retrospective_pnl_expanded` or a journal-scoped mirror in J5 — Tango reviews chrome titles on JS5-3.  

**Banned chrome (same spirit as Retro Tango RT0-3):** “See your results”, “Check if you made money”, “Your scorecard”, success/fail outcome titles. Approved tone: neutral sample / process record.  

**Hotel co-sign (JS0-2):** collapsing outcome chrome prevents **resulting** — process over P&L. Does not change tag scripts (Hotel owns those on JS0-5).

### 11.2 Private media contract (D4 — Mike LOCKED JS0-3 · India co-sign)

**Normative for JS5-1 / JS5-2.** Family B member screenshots — not course materials.

#### Separation (hard)

| Store | Path / URL pattern | Who | Reuse for journal? |
|-------|-------------------|-----|--------------------|
| Course **public** media | `uploads/` · `/api/media/{hash}` | Admin | **No** |
| Course **private** tier | `uploads/private/` · `private:{name}` · admin download | Admin + entitlement download | **No** |
| **Journal member private (this)** | Config root + per-identity layout · **no** static mount · **no** public path | Session owner only | **Yes — only this** |

Do **not** write journal binaries into `uploads/private` or return `private:{name}` / `/api/media/…`. Different ACL family (PD-8: admin boards never read Family B raw content).

#### Storage

- **Root:** config-driven directory (e.g. `LABS_JOURNAL_MEDIA_DIR`). **Fail loud** if missing/invalid at boot when journal media routes are enabled (staging/production). No silent default path in non-dev.  
- **Layout (server-side only):** `{root}/{identity_id}/{attachment_uuid_or_hash}{ext}`.  
- **DB `storage_key`:** opaque string mapping to that object (never a browser-reachable public URL; never a relative web path).  
- **Content-address optional** for dedup within identity — never cross-identity sharing of objects.  
- **Types (v1):** `image/png`, `image/jpeg`, `image/webp` (screenshots). Other types → **422**.  
- **Size:** config max bytes (recommend 5 MiB); exceed → **422**.  
- **Cap:** ≤ **5** attachments per session entry; exceed → **422**.

#### AuthZ / isolation

- Upload / list / get-bytes / patch caption / delete: **`ft_session` required**.  
- **`identity_id` only from session claims** — never from body, query, or path as authority (path may include attachment id; server loads row and checks owner).  
- Owner rule: `attachment.identity_id == session.identity_id` **and** session row same identity. Mismatch → **404** (not 403) to limit enumeration.  
- Entitlement: same Practice create gate as journal sessions (D6 Observer-trial + activator+; free no-plan **403**).  
- Sealed session: no new attachments (**409**). Closed `journal_date`: no new attachments (**409** + link to closing retro when known).  
- **No admin back door** (Privacy PD-8): `/admin/*` and Family A tools cannot stream journal binaries.  
- **Never journey-public:** no public card/hero, no journey aggregate payload of raw images, no marketing CDN.

#### No public URL (hard)

- **No** permanent, unauthenticated URL for journal media.  
- **v1 read path:** authenticated `GET` that checks owner then streams bytes (`Content-Type` from row; `Cache-Control: private, no-store`). Browser uses same-origin cookie.  
- **Optional later:** short-lived HMAC download token (bind `attachment_id` + `identity_id` + `exp`); if added, still no permanent public URL. Not required for J5 if cookie stream works.  
- Response bodies must not embed filesystem absolute paths.

#### Export + purge (day one with J5/J6)

- **Export:** ZIP (or pack sidecar) includes binary files under stable `export_ref` paths; JSON lists `{ id | export_key, caption_md, content_type, byte_size, export_ref }`. No `storage_key` filesystem leakage.  
- **Import (D9):** additive only — new attachment rows + new stored objects; never overwrite sealed session media in place.  
- **Purge Practice data:** delete `member_journal_attachments` (+ sessions/messages) **and** unlink binaries for that `identity_id` under the journal media root. Membership / identity row preserved.

#### Caption

- Member-authored `caption_md` is the machine-readable layer for process. Agent must not interpret pixels (Appendix A).

#### India co-sign (JS0-3)

- Separate store preserves Family B boundary vs course private tier (no parallel “wrong ACL” reuse).  
- Schema §14 attachments expanded as JS5-1 SoR; sessions/messages remain JS1-1 without requiring attachments migration if J5 deferred.  
- Product boundary: no MSC media stack.

---

### 11.3 Agent attribution (D7 — Mike LOCKED JS0-3)

Stopgap until full P2 agent principals. **Normative for JS3-1.**

| Field | Rule |
|-------|------|
| `author` | `member` \| `agent` only |
| `agent_service` | **Required** `labs-journal-session` when `author=agent`; **NULL** when `author=member` |
| ACL owner | Always the **member** `session.identity_id` — agent never owns the row for authZ |
| Write path | Agent messages inserted only by **server** after authenticated member session + agent mode on; never from a client-supplied “I am agent” flag alone |
| Audit | Every agent turn: append-only audit (`actor_events` or equivalent) with `subject_identity_id`, `session_id`, `agent_service`, timestamp. Member transcript remains Family B content. |
| Client | Must not accept `author` / `agent_service` from untrusted body to escalate; server sets both |

**P2 later:** add principal / service identity columns without re-keying historical `agent_service='labs-journal-session'` rows.

**Coach:** product enablement of agent mode (config fail-loud) remains Coach/ops; D7 only locks attribution + ACL shape.

---

## 12. Portability (extends Practice Export v1.1)

Canonical format id: **`fattail.labs.journal_session`** · `model_version` **`1.0`**:

```json
{
  "format": "fattail.labs.journal_session",
  "model_version": "1.0",
  "exported_at": "ISO-8601",
  "entries": [
    {
      "id": "js-…",
      "tag": "pre_market",
      "journal_date": "YYYY-MM-DD",
      "session_started_at": "…",
      "status": "open|partial|sealed",
      "structured": { },
      "messages": [
        { "author": "member|agent", "phase": "pre_open", "body_md": "…", "at": "…" }
      ],
      "attachments": [ { "id": "…", "caption_md": "…", "export_ref": "…" } ]
    }
  ]
}
```

- Member pack key: `documents.journal_session` (legacy free-text notes remain `documents.journal` during dual-read).  
- Import: **additive** by `export_key` / portable id; never rewrite sealed transcript.  
- Purge Practice data includes session rows + private media binaries.

---

## 13. Demo accounts (D5 — India · Mike LOCKED JS0-4)

**Purpose:** ops/product demos and fixture identities that look like full Practice members without polluting real-member aggregates, community, or marketing proof.

### 13.1 Placement (schema SoR for JS8-1)

| Item | Decision |
|------|----------|
| Column | `identities.is_demo TINYINT(1) NOT NULL DEFAULT 0` |
| Scope | **Identity-level** — all Practice rows for that member inherit demo status; no per-session `is_demo` |
| Migration | **JS8-1** (filename-ordered after current head; e.g. next free `0NN_identities_is_demo.sql`). May ship earlier if a prior phase needs the column for tests — same DDL, India still owns shape |
| Index | Optional `KEY (is_demo)` only if leaderboard/aggregate queries filter it; not required at land |
| Default | `0` for all existing and normal SSO/password creates |

**Not placed on:** session, message, attachment, or export document root (avoids dual source of truth). Export **may** emit `identity.is_demo` for honesty when packing a demo identity; import of `is_demo: true` into a non-demo identity is **rejected** (Mike).

### 13.2 Create and immutability (Mike)

| Rule | Enforcement |
|------|-------------|
| Set **only at identity create** | Ops/CLI seed path (`create_user` / demo provisioner) with explicit `--demo` (or equivalent). Normal SSO, password signup, and membership webhooks set **`is_demo=0`** always |
| **Immutable after create** | No member API, admin UI, or webhook may `UPDATE identities SET is_demo=…`. Domain rejects any attempt to flip `0↔1` |
| **Never convert to paid identity** | `is_demo=1` never becomes `0`. A demo identity may hold Observer/Navigator **plans for feature testing**, but remains demo forever. Do not merge/relabel a demo row into a real customer identity |
| Same email | Prefer reserved demo emails (`*@…demo…` / ops-owned). If a real customer email collides, **do not** flip flags — create/link is a separate Coach/ops incident |

### 13.3 Lifecycle

| Operation | Allowed |
|-----------|---------|
| Normal Practice use (sessions, retro, export) | Yes — same product paths as real members (D6 entitlement still applies) |
| Wholesale **reset** | Yes — purge Practice data for that `identity_id` (sessions, notes, media, retros as pack defines) + reseed from `seed_practice_demo_pack` / JS8-2 session pack |
| Surgical edit of sealed sessions / reopen closed dates | **Demo only** — admin/ops reopen allowed when `is_demo=1` (Spec §10: no admin reopen for **non-demo**). Prefer wholesale reset over surgical when possible |
| Delete identity | Ops only; cascades Family B rows |

### 13.4 Exclusions (hard)

Demo identities (`is_demo=1`) are **excluded** from:

| Surface | Rule |
|---------|------|
| Journey **leaderboard** / presence community boards | Hard filter — ignore share_* flags |
| Journey **visibility** as “real member” presence | Not listed as peer proof |
| Product **aggregates** / analytics that describe the live membership | Exclude from numerators and denominators |
| **Marketing** / public proof / testimonials / screenshots sold as member outcomes | Forbidden (Sierra JS0-6 reinforces) |
| Cross-member “how others did” samples | Forbidden |

Demo may appear in **internal** ops dashboards labeled Demo.

### 13.5 Audit

- Mutations on demo subjects still write audit / `actor_events` with a **demo label** (e.g. payload or flag derived from subject `is_demo`).  
- No silent skip of audit because “it’s only demo.”

### 13.6 Security (Mike)

- `is_demo` is **not** an auth bypass: session, isolation, and PD-8 still apply.  
- Demo A cannot read demo B or real member data.  
- Client cannot self-assert `is_demo` on create via public signup.

### 13.7 India domain notes

- Single SoR on `identities` keeps journal/session schema free of demo forks.  
- J1–J7 code paths need **no** demo branch except: (1) admin reopen gate §10, (2) aggregate/leaderboard filters when those queries are touched, (3) JS8 seed pack.  
- Aligns with as-built `seed_practice_demo_pack.py` (extend sessions in JS8-2) without inventing a second identity table.

---


## 14. Schema sketch (implementation SoR) — **India APPROVED JS0-1**

Authoritative for **JS1-1** (sessions/messages/closures). Attachments migrate **J5** per D4 (§11.2) — India/Mike: FK-ready shape below is SoR when J5 ships; J1 may omit attachments table.

```
member_journal_sessions
  id BIGINT PK AI
  identity_id BIGINT NOT NULL FK → identities ON DELETE CASCADE
  tag VARCHAR(32) NOT NULL   -- pre_market|post_session|clean_day|reflection
                               -- (retrospective tag does not persist a session row)
  journal_date DATE NOT NULL   -- member-set scope key (NY calendar date)
  session_started_at DATETIME(6) NOT NULL  -- routine meter key (D2); UTC store, NY for day
  status VARCHAR(16) NOT NULL  -- open|partial|sealed
  structured_json JSON NULL
  export_key VARCHAR(64) NULL
  spawned_retrospective_id BIGINT NULL  -- FK member_retrospectives ON DELETE SET NULL
  created_at, updated_at
  UNIQUE (identity_id, export_key)   -- allow multiple NULL export_key per MySQL rules
  KEY (identity_id, journal_date)
  KEY (identity_id, session_started_at)
  KEY (identity_id, status)

member_journal_messages
  id BIGINT PK AI
  session_id BIGINT NOT NULL FK → sessions ON DELETE CASCADE
  identity_id BIGINT NOT NULL FK → identities ON DELETE CASCADE
  author VARCHAR(16) NOT NULL  -- member|agent
  agent_service VARCHAR(64) NULL  -- MUST be labs-journal-session when author=agent; NULL when member (D7)
  body_md MEDIUMTEXT NOT NULL
  phase VARCHAR(16) NOT NULL  -- pre_open|intraday|post_close|off_session|later_day
  created_at DATETIME(6) NOT NULL  -- append-only; no UPDATE of body/phase
  KEY (session_id, created_at)
  KEY (identity_id, created_at)

member_journal_attachments   -- J5 · D4 SoR (Mike/India JS0-3)
  id BIGINT PK AI
  session_id BIGINT NOT NULL FK → member_journal_sessions ON DELETE CASCADE
  identity_id BIGINT NOT NULL FK → identities ON DELETE CASCADE
  trade_id BIGINT NULL           -- optional day-book link; same identity enforced in domain
  storage_key VARCHAR(512) NOT NULL  -- opaque; never public URL
  content_type VARCHAR(64) NOT NULL
  byte_size INT NOT NULL
  caption_md MEDIUMTEXT NULL
  export_key VARCHAR(64) NULL
  created_at DATETIME(6) NOT NULL
  UNIQUE (identity_id, export_key)
  KEY (session_id)
  KEY (identity_id)
  -- domain: identity_id must match parent session.identity_id

member_journal_date_closures
  identity_id, journal_date, closed_by_retrospective_id, closed_at
  PK (identity_id, journal_date)
  FK identity CASCADE; FK retrospective SET NULL or RESTRICT (Alpha pick; prefer RESTRICT delete of closing retro while closure exists — or SET NULL + keep date closed)
```

**Invariants for Alpha:** never UPDATE message rows; seal forbids new messages; closed `journal_date` refuses new sessions (409).

---

## 15. Implementation slices

| Slice | Deliverable | Depends |
|-------|-------------|---------|
| **J0** | Coach GO + D3–D5 gates (D6 locked); Journey routine keying patch; Export Spec bump | Coach + owners |
| **J1** | Schema + CRUD sessions/messages (member text only); calendar attach; dual-read notes | J0 |
| **J2** | Structured confirmation UI (form) without LLM — still falsifiable fields | J1 |
| **J3** | Agent interview + validator + depth cap; form fallback on validator fail; service attribution D7 | J2 + agent config fail-loud |
| **J4** | Date closure on retro complete; 409 paths | J1 + Retrospective complete hook |
| **J5** | Private media + captions | Mike store design |
| **J6** | Portability journal 1.1 + purge/export/import | J1 |
| **J7** | `retrospective` tag routing + seals + links | J1 + retro API |
| **J8** | Demo `is_demo` + seed pack sessions | J1 |

**Ship order constraint:** J1–J2 deliver value without LLM. Agent (J3) does not block structured journaling.

---

## 16. Capacity over dependency

**Tango APPROVED (JS0-2)** — capacity is structural, not copy theater.

- **Form is always a path.** J2 structured form ships value without LLM. J3 agent is optional; validator double-fail **withdraws to form** (§8.2) — never a dead partial that traps the member.  
- Dense prompting early tenure (including Observer); taper agent questions with tenure (config table).  
  Observer and Navigator use the **same** agent enablement rules (D6) — no Observer-only agent lockout.  
- Operator metric only: **member-initiated / agent-elicited content ratio** over tenure — **never** show to member in v1 (also §18 non-goal).  
- No grade, meter, streak, or lateness language on journal session surfaces (Appendix B).

---

## 17. Verification (Delta — phased)

**J1+:** multi entry per date; no second session in entry; `journal_date` member-set; dual-read notes.  
**J2+:** required fields absent when skipped; confirmation writes structured only.  
**J3+:** validator blocks motive/advice/P&L/meter/multi-Q; intraday silence; clean_day one turn; attribution; validator double-fail → J2 form not dead partial.  
**J4+:** closure 409; gather date open; warning before complete names dates; backdate-into-closure named.  
**Telemetry:** turn-of-end logged (script health).
**J5+:** no public media URL; delete removes binaries.  
**J6+:** export/import additive; purge includes sessions.  
**J7+:** no auto-gather; dual link; empty scope no create; leave warning.  
**Copy:** no late/overdue/marked-down language.  
**Marketing (JS0-6):** no public/SEO/AEO pipeline from sessions or demo proof (§20).

---

## 18. Explicit non-goals (v0.2)

- Agent as coach / strategy advice  
- Vision model chart reading  
- Reopening sealed sessions  
- Admin surgical edit of closed dates (non-demo)  
- Member-facing capacity ratio  
- Free no-plan (`free_observer`) Practice create (Observer is paid/trial tier with Navigator parity — D6)  
- **Public marketing / SEO / AEO fed by journal sessions, transcripts, structured fields, or private media** (§20)  
- **Demo accounts as public proof** of member outcomes (§13 · §20)

---

## 19. Decision-log entry (Coach GO — landed DL-137)

> **Journal Session v0.2 — BUILD AUTHORITY (Coach GO 2026-07-30).** Falsifiable journal via tag-selected interview or structured form; two-layer transcript + confirmed structured record; one session per entry; market phase gates pre_open-only intent; routine meter keys session start; date closure after retro complete; validator fails open to form not dead partial; additive portability; phased J1–J8. **Observer = Navigator Practice access (not free; term = 6 weeks only).** Family B only — no SEO/AEO/marketing pipeline from sessions or demo proof (Sierra §20). **D1–D9 locked.** Supersedes Session Spec v0.1. Delta JS0-G PASS. Residuals: Journey routine wording patch (JS1/J9); Export Spec `journal_session` section (JS6-1).

---

## 20. Marketing & public acquisition boundary (**Sierra JS0-6 LOCKED** · Tango co-sign)

Journal **sessions** are a **member-private practice tool** (Family B). They are **not** an acquisition content source. Sierra owns public catalog / SEO / AEO surfaces; those surfaces must **never** ingest session transcripts, structured journal fields, private media, or demo fixture data as social proof.

**Aligns with** Retrospective Spec v0.5 **§20** (Sierra RT0-5) — same doctrine, session surfaces.

### 20.1 Hard bans

| Ban | Rationale |
|-----|-----------|
| No public “member journal results” pages, widgets, SSR routes, or SEO URLs fed by `member_journal_sessions`, messages, `structured_json`, or journal media | Private practice is not a billboard |
| No testimonials, case studies, landing pages, emails, ads, or social posts that quote or paraphrase a member’s session transcript, pre_market plan, invalidation, or captions | Even with ad-hoc consent framing: product default is **no pipeline** from journal session → marketing |
| No Course JSON-LD, FAQPage, meta description, OG/Twitter cards, or catalog blurb derived from session aggregates or “what members wrote before the open” | Public AEO must not launder Family B process text as proof |
| No community / Journey **public** board rows from session bodies, structured fields, agent turns, or attachments | Mike isolation + D4 no journey-public media |
| No “average adherence from Labs journals” or similar **outcome/process stats** built by scraping session tables for ads | Internal ops aggregates (de-identified, Privacy Spec) ≠ marketing stats |
| No **demo** (`is_demo=1`) content presented as real member outcomes, screenshots, or testimonials | D5 · §13.4 — demo is ops fixture only |

### 20.2 What *may* appear in marketing (unchanged FatTail doctrine)

| Allowed | Notes |
|---------|-------|
| Process-outcome language | Drawdown stopped, adherence streaks, routine installed — **never** profit figures or named P&L |
| Feature description of Journal Session as a practice loop | “Falsifiable pre-market plan,” “invalidation in your words” — **no** sample member quotes from production DB |
| Catalog / course SEO owned by Sierra | Independent copy formula; **zero** join to session tables |
| Anonymized opt-in product research **outside** this pipeline | Separate consent + legal — **not** a session export feature; out of scope for p-journal-session |

### 20.3 Product / engineering non-goals (explicit)

1. **No** public index, prerender, or static generation of journal session content.  
2. **No** marketing CMS connector, webhook, or admin “export for ads/SEO” from session tables.  
3. **No** automatic share-to-public from the journal calendar or session UI.  
4. **No** JSON-LD `Review` / `AggregateRating` fed by journal practice data.  
5. Optional future “share process milestone” (if ever) is a **new Spec** — process-only, never session transcript dump, never demo-as-proof — not implied by v0.2.

### 20.4 Interaction with other locks

| Lock | Relationship |
|------|----------------|
| Family B · Mike D4 | Technical floor: no public media URL; this section is the **positioning** floor |
| D5 demo | Demo excluded from marketing proof (Sierra enforces externally; product must not ship a demo→marketing path) |
| Tango D3 / Appendix B | Member UI bans resulting and shame; Sierra bans the **external** equivalent |
| Hotel scripts | Invalidation/process accuracy is for the **member’s** record — not marketing claims that “the method works” via scraped plans |
| Retrospective §20 | Same ban class; sessions feed retros privately — still never exit to public acquisition |
| G1/G2 | Marketed path is Observer term → Navigator on **capacity / stop-the-bleeding**, not journal P&L or diary excerpts |

### 20.5 Implementer checklist (Charlie · Alpha · Sierra review)

| Check | Expected |
|-------|----------|
| Public routes / `generateStaticParams` for sessions | **None** |
| OG image from journal screenshot | **Forbidden** |
| Admin “copy quote to catalog” | **No feature** |
| Seed demo pack used in public landing | **Forbidden** — ops only |
| SEO title/meta for `/app/journal` | Signed-in app chrome only; no indexable member content |

**Tango co-sign (JS0-6):** Boundary protects the bleeding member from becoming content. Trust > acquisition cleverness.

---

## 21. Document map

| Doc | Role |
|-----|------|
| **This file (v0.2)** | **BUILD AUTHORITY** (Coach GO 2026-07-30) · §20 Sierra marketing lock |
| v0.1 | SUPERSEDED pointer |
| Retrospective **v0.6** | As-built dual report (exists in repo) |
| Retrospective **v0.5** | Build-era product locks · §20 marketing parent |
| Practice Export v1.1 | Portability parent |
| Journey Experience v1.0 (patched) | §4.1a cadence + routine |

---

## Appendix B — Transition / closure copy (UI-owned, normative)

**Tango APPROVED (JS0-2)** · Hotel co-sign (no trading falsehoods; scripts not altered here).

No grade, meter, streak, or lateness language. Warnings fire **before** each irreversible step. Copy is factual about irreversibility — never punitive about “missed” days or incomplete sittings.

### Banned phrases (implementers)

| Banned | Why |
|--------|-----|
| late / overdue / missed day / behind | Shame; routine is not a lateness product |
| grade / score / streak / meter (member-facing) | Capacity violation; operator-only metrics stay dark |
| you should have / you failed to journal | Advice + blame |
| See your P&L / check if you made money | Outcome-first; violates D3 |
| marked down / penalty for incomplete | No grading of journals |

### Approved patterns

**1. Leaving a journal session**

> **Save and close this entry?**  
> A journal entry is one sitting. You won't be able to add to it after this.  
> What you've confirmed so far is kept.  
> *Not yet captured: {unreached required field names}.*  
> `Save and continue` · `Stay here`

**1a. Unfinished `pre_market` before the open** (extra line)

> Today's plan isn't finished. Anything added after the open won't count as pre-market intent.

*(Factual phase rule — not a reprimand. Hotel: accurate for §6.5 / expected-vs-actual.)*

**2. Gathering**

> **Review period: {scope_start date} through now.**  
> Anything after this point belongs to your next retrospective.  
> `Gather` · `Cancel`

**3. Completing**

> **Complete this review?**  
> This closes **{named dates}** to new journal entries and attachments. Those dates were reviewed here, so the record stays as it is.  
> Today stays open.  
> `Complete review` · `Not yet`

Empty scope: explanation only — nothing created, offer to journal instead. No “you have nothing to review” shame framing.

**4. Agent unavailable → form** (capacity; J3+)

> Interview isn't available right now. You can finish the same checklist on the form.  
> `Open form` · `Stay`

*(Never: “AI failed”, score language, or force-quit without a path.)*

---

## Appendix A — System prompt (normative, ship as constant)

```
You are conducting a trading journal interview for a FatTail Labs member. Your job is to
help the member produce a record that can be checked against what actually happened. You
are an interviewer and a recorder. You are not a coach, an analyst, or a critic.

What you do

Ask about things the member has not yet said. Your questions target absences — a missing
price level, a missing size, a missing condition that would prove the plan wrong. Press for
specificity and for claims that can later be checked. If the member says "watching for a
bounce," ask where. If they describe a plan with no invalidation, ask what would make them
wrong.

Aim for one true sentence in the member's own voice — one honest line that will be worth
reading back to them weeks from now. Not a summary. Not a completed form.

What you never do

- Never name a motive or an emotion. Do not say the member hesitated, was anxious, was
  fearful, was greedy, was revenge trading, lost discipline, or lost confidence. Motive
  comes from the member or it does not enter the record.
- Never assert a fact about the market, a chart, or a price that the member has not stated.
- Never give advice, propose a better plan, or say what the member should have done. Not
  even when asked. If asked, redirect: ask what they would do differently.
- Never evaluate. No praise, no "good trade," no "nice work," no approval of wins and no
  sympathy framing for losses.
- Give losses no more attention and no more turns than wins. Symmetry is required.
- Never state a profit or loss figure, even when it is visible to you.
- Never mention the member's process integrity grade, any meter, any streak, or any score.
- Never ask the member to be brief, to condense, or to summarize. Never comment on the
  length or the effort of what they wrote, in either direction.
- Never ask for something the trade log already tells you.
- Never interpret an uploaded image. Do not describe what a chart shows, name a pattern, or
  read a price from it. Ask the member what the image shows.
- Never fill a field the member left empty. Absent is a valid state.

How you ask

One question per turn. The question must target something absent, not something already
said. Plain language, short. No preamble, no restating what the member just told you back
at them before asking the next thing.

Start in the middle. You have the member's trade log. Do not ask what they traded — name it
and ask about the part you cannot know: "Three ES trades, two after 2pm. Talk to me about
the second one."

"I don't know" is a complete answer. Log it as uncertainty and move on. Never ask the same
thing twice. Forcing false precision is worse than accepting vagueness — a member who
states a level they do not believe has corrupted the record and has learned to perform for
you.

During market hours

If the market is open on this entry's date, you do not ask questions. You receive what the
member writes and acknowledge briefly or not at all.

Closing

Restate the member's plan in their terms — plan, invalidation, what they are watching — in
one compressed turn, and ask them to confirm or correct it. Then ask what they are watching
next. End on their words.
```
