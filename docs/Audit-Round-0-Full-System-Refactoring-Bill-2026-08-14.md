# FatTail Labs — Round 0: Full System Audit + Refactoring Bill

**Date:** 2026-08-14  
**Rev:** 2 — Coach review folded (same day). Paper only.  
**Authority:** Coach  
**Program:** Read-only audit. **No execution GO.** Nothing in this document authorizes changing, fixing, deleting, or deploying anything.  
**Orchestration:** Juliet (synthesis only)

**Coach review 2026-08-14 (what this rev added — stated up front):**
1. Uncovered-law row + **RB-07** for doctrine **§10b** (ethos compose + distress stop-interview on the **journal agent path**).
2. Process-containment pair: Coach **R-1** → **RB-08** (mechanize GO token), Coach **R-8** → **RB-19** (artifact-checking deploy gate). The 2026-08-13 incident was process-shaped; RB-11 (identities) does not cover these.
3. **RB-15** absorbs **RB-34** — one Lima pass: Conversation Lab hold **and** the six-number collision index.
4. **Round 0 scorecard** locked as the trend baseline (33F/10E, six DL collisions, 21 chad lines, 2/5 gates irreproducible).

**Seats that produced artifacts:**

| Seat | Packet | Status |
|------|--------|--------|
| **Kilo** | Test suite health + uncovered-law list | Complete |
| **India** | Schema vs code + spec hygiene + DL-327 vs revert | Complete |
| **Mike** | Config inventory + access matrix | Complete |
| **Foxtrot** | Production probe + migration-head query | Complete |
| **Delta** | Five newest gate-reports vs `https://labs.fattail.ai` | Complete |
| **Census** | Chad list + git/DL map + route inventory | Complete |

Parent gathered StudioTwo SHA, local `schema_migrations`, and origin/main comparison. Claims without artifacts below are marked **NOT ATTESTED**.

**Doctrine:** Distinct seats. Evidence over assertion. Findings against this author’s prior work are required and present.

---

# Part 1 — Audit

## 1. Stability attestation

### 1.1 Production commit SHA

**NOT ATTESTED.**

```
GET https://labs.fattail.ai/api/health
HTTP/2 200
{"status":"ok","env":"production"}
```

Body has **no git SHA**. Handler (`server/main.py`) returns only `status` + `env`.

Foxtrot: `infra/deploy.md` — *Never claim "deployed" from commit hash — verify the running process (`lsof`, health curl).* Intended MiniTwo loop is `lsof` + localhost health after pull. The only script that prints a SHA (`infra/scripts/deploy-minitwo-auth-hardening.sh`) prints **checkout HEAD after `git pull`**, not the running process. **SSH to MiniTwo was not run** (that key is a deploy path).

### 1.2 StudioTwo / origin

| Item | Artifact |
|------|----------|
| StudioTwo `HEAD` | `f84b5a78079df56f1828d626e47dcb86db5d4e05` — `docs(coach-lab): plan v1.2 — unit tests at every slice and gate` |
| `origin/main` tip | `9400c65` — `feat(retrospective): recommend start at 7 days or 5 trades` |
| Local vs origin | **15 commits ahead**, including Journal Session v0.7 (`d96612e`) and the entire coach-lab ship + revert |

Those 15 commits are **not on `origin/main`**. If MiniTwo tracks origin, production is **not** running journal v0.7 or any coach-lab code. **Cannot confirm without MiniTwo SHA (RB-10).**

### 1.3 Local migration head

Query (read-only, local `labs` via `.env`):

```sql
SELECT filename, applied_at FROM schema_migrations ORDER BY filename;
```

| Fact | Value |
|------|--------|
| Applied count | **135** |
| Tracking table | `schema_migrations` (`filename` PK, `applied_at`) |
| **HEAD row** | **`128_coach_lab.sql` applied 2026-08-13 23:21:48** |
| Disk glob `migrations/NNN_*.sql` | **132** files; disk head file = `127_journal_v07_charter.sql` |
| `128_coach_lab.sql` on disk | **ABSENT** (applied, then file reverted) |
| `128` on `origin/main` | `git cat-file origin/main:migrations/128_coach_lab.sql` → **does not exist** |

Tail of applied filenames:

| filename | applied_at |
|----------|------------|
| `121_trade_log_import_recycle.sql` | 2026-08-12 17:22:17 |
| `122_campaigns_unique_lesson_slugs.sql` | 2026-08-12 17:22:17 |
| `123_consolidate_observer_plan.sql` | 2026-08-13 10:45:04 |
| `124_apps_catalog_order.sql` | 2026-08-13 10:45:04 |
| `125_apps_highlighted.sql` | 2026-08-13 11:03:29 |
| `126_retrospective_one_thing.sql` | 2026-08-13 16:32:18 |
| `127_journal_v07_charter.sql` | 2026-08-13 21:16:24 |
| **`128_coach_lab.sql`** | **2026-08-13 23:21:48** |

### 1.4 Coach-lab backout (2026-08-13 incident)

| Check | Result |
|-------|--------|
| Prod page `GET https://labs.fattail.ai/admin/coach-lab` | **404** |
| Prod API `GET https://labs.fattail.ai/api/admin/coach-lab/config` | **404** |
| Local API same path | **404** `{"detail":"Not Found"}` |
| `server/main.py` `include_router` | **No** `coach_lab` |
| `web/app/admin/coach-lab/` | **ABSENT** |
| Runtime files (`ConversationSurface.tsx`, `coach_lab.py`, `test_coach_lab.py`, `migrations/128_coach_lab.sql`) | **ABSENT** |
| `LABS_COACH_LAB` in `config.py` / `.env` / `.env.example` | **ABSENT** |
| Local tables `SHOW TABLES` | **`coach_lab_config` (1 row), `coach_lab_conversations` (0), `coach_lab_messages` (0)** |
| Leftover frontend | `web/components/conversation/conversationTokens.ts` only (Echo lock). No `.next` `*coach*` chunks found. |
| Living pytest that fails if routes/tables return | **NONE** (Kilo) |

**Backout completeness: FAIL on local schema.** Routes and product surface are clean. Dev DB still holds incident tables + a `schema_migrations` row for a file that no longer exists. File revert ≠ schema revert.

**Pre-incident schema dump:** not checked in. Closest evidence: origin has no 128; local applied 128 then deleted the file. Diff = three tables + one tracking row.

### 1.5 Uncommitted / dirty tree (not part of coach-lab GO)

```
Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.7.1.md
docs/evidence/volume-profile/campaign-status.md
server/market_data/massive_client.py
server/retrospective_domain.py
server/routes/retrospectives.py
server/tests/test_retrospectives.py
web/components/journal/JournalCalendar.tsx
web/components/retrospective/RetroPeriodWindow.tsx
web/components/retrospective/RetrospectiveWorkspace.tsx   (~404-line delta)
web/lib/journalBeats.ts
web/lib/retrospectiveApi.ts
?? migrations/126_retrospective_one_thing.sql   (already APPLIED)
?? server/market_data/options_campaign.py
?? server/tests/test_options_campaign.py
?? tmp/  scrots/  web/test-results/
```

`git diff --stat` on those tracked files: **511 insertions, 188 deletions**.

---

## 2. Test suite health (Kilo)

### 2.1 Full run

```bash
cd /Users/ernie/Fattail-Labs/server && .venv/bin/python -m pytest tests -q --tb=no
```

```
33 failed, 884 passed, 2 skipped, 1164 warnings, 10 errors in 192.06s (0:03:12)
929 tests collected
884 + 33 + 2 + 10 = 929
```

**This is not a green characterization suite on this database.**

### 2.2 Failed / error nodes (short summary)

**FAILED (33):**  
`test_live_bravo_research_pack_smoke` · catalog (published/draft/admin) · board snapshot · course quiz import · HARD process meters · help missing-fields · lesson same-name modules · media upload/admin-only · privacy consent grant · member enroll/journey · resources download/emoji · resources_api 403 · retro agent local/UI · retro RT24 clustering/interruption UI source · curate comparison perf guards (5) · trade-log import roundtrip · video bunny provider · wiki reindex admin-only.

**ERROR (10):** lesson gating (6) and member progress (4) — `KeyError` (payload shape vs fixture).

### 2.3 Skipped / xfail

| Node | Path | Reason | Age |
|------|------|--------|-----|
| `test_public_questions_hide_answers` | `tests/test_quizzes.py:33` | `"no seeded quiz lesson found"` | Fixture-dependent; skip site present since quiz suite existed (not dated in this audit) |
| `test_perfect_submission_scores_100` | `tests/test_quizzes.py:43` | same | same |

**xfail:** **0** hits for `@pytest.mark.xfail` in `server/`.

**skipif that RAN this environment** (`XAI_API_KEY` set):

- `tests/test_agent_tasks.py:271` — `"live Grok smoke requires XAI_API_KEY"` → **FAILED**
- `tests/test_ai_admin_api.py:68` — `"live admin AI run requires XAI_API_KEY"`

Conditional skips in `test_framework_stayput_contract.py` (catalog/course missing) **not hit** this run.

### 2.4 Uncovered-law list

Criterion: **YES** = a pytest would fail if the law were violated.

| Law | Covered? | Evidence |
|-----|----------|----------|
| Heat: unmatched open → no unprompted + no asked analysis | **PARTIAL** | YES consequences: `test_heat_unprompted_quiet`, `test_heat_asked_analysis_rejected` (`test_journal_v07.py`). **NO** any-account predicate — helper is mocked. |
| Extract-and-confirm same-txn; unknown key; no member message | **YES** | `test_extract_confirm_same_txn_and_unknown_key`. Caveat: no crash/rollback mid-apply. |
| Family B journal sessions | **YES** | `test_isolation_404`, `test_isolation_list_does_not_leak`, `test_agent_isolation_cross_member` |
| Family B **drafts** | **NO** | Only single-identity draft roundtrip; no B-reads-A-draft 404 |
| Fail-loud missing `LABS_COACH_*` (journal, not lab) | **YES** | `test_coach_config_fail_loud` |
| Tags never `required_for_complete` seal (v0.7) | **NO** | Only assert `invalidation` **is** required (`test_journal_sessions.py:810`) |
| One session per `journal_date` | **YES** | `test_one_conversation_per_date`, `test_unique_owner_date_constraint` |
| Fail-loud `LABS_ENV` / `LABS_PORT` / `LABS_SESSION_SECRET` | **NO** | Zero test hits for those names |
| coach_lab routes must stay gone | **NO** | Zero pytest; backout is a gate-report grep only. Stale `test_coach_lab*.pyc` in `__pycache__`. |
| OPF / do-not-invent-strikes | **PARTIAL** | `test_at_l2_incomplete_loud`; listed-wing tests. No Builder invent-strike pytest in the 929. Web: `otEfDoctrine.proof.test.ts` (outside this run). |
| **§10b north star** — member-facing AI composes `LABS_MEMBER_AI_ETHOS_V1_2`; distress **stop-interview** wins over ethos and over `ETHOS_MODE=off` | **NO (path)** | Helpers exist: `test_labs_member_ai_ethos.py` (constant, compose, heuristic corpora). **No pytest enters `journal_session_agent` turn path.** Zero hits for `distress_hold` under `server/tests/`. Omitting `compose_member_system_prompt` at line 663, or deleting the gate at lines 365–403, would not fail the suite. Doctrine: `agents/bench/doctrine.md` §10b · Spec v1.2 §5.2 #9 · DL-209–211. **RB-07.** |

---

## 3. Schema vs code (India)

**Runner:** `server/migrate.py` applies `migrations/NNN_*.sql` by **filename**, tracked in `schema_migrations`. Duplicate **numbers** both apply.

### 3.1 Duplicate numbers on disk

| # | Files |
|---|--------|
| 038 | `038_catalog_order.sql` · `038_feature_gate_ac_sync.sql` |
| 093 | `093_help_concierge_v2.sql` · `093_practice_playbook_campaign.sql` |
| 094 | `094_playbook_scrapbook.sql` · `094_playbook_scrapbook_cover_columns.sql` |
| 116 | `116_campaign_definition_fields.sql` · `116_journal_day_net_map_pref.sql` |
| 119 | `119_symbol_app_profile.sql` · `119_trade_log_import_batches.sql` |

**126** has one file only: `126_retrospective_one_thing.sql` (present; applied).

### 3.2 Orphans / hollow tables

| Table | Migration | Usage |
|-------|-----------|--------|
| `certificates` | 001 | **ORPHAN** — no app SQL read/write |
| `member_journal_session_merge_collisions` | 054 | **ORPHAN** after one-shot INSERT in the migration |
| `member_practice_campaign_funding` | 113 | Purge `DELETE` only; no product INSERT/SELECT |
| `community_bot_shares` | 090 | **READ** list API; **no writer** |
| `member_trade_log_entries` | 027 | Dead v1; delete-on-purge only |
| `market_calendar_config` | 052 | READ + seed; no admin writer |
| **`coach_lab_config` / `_conversations` / `_messages`** | **128 (file gone)** | **Local DB only.** Zero Python readers after revert |

India’s file census found **no** `coach_lab_*` in `migrations/`. Parent DB query found the tables anyway. Both are true.

Full 127-table READ/WRITE map is in the India packet (this file summarizes orphans only; remaining tables are WRITE unless noted).

---

## 4. Chad census

One line per chad. **Round 0 count: 21 lines** (9 + 3 + 4 + 5). Scorecard uses this number.

### Specs / paper

- `Specs/FatTail Labs — Trader Process Integrity Scoring & Guidance System v0.1.md` — spaces + em-dash; body SUPERSEDED.
- `Specs/FatTail-Labs-Journal-Session-Spec-v0_7-DRAFT.md` — DRAFT sibling of BUILD v0.7.
- `Specs/FatTail-Labs-Journal-Session-Spec-v0_7-DRAFT_1.md` — `_1` + DRAFT sibling of BUILD.
- `Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md` (also v0.5, v0.4a, v0.2) — headers still **BUILD AUTHORITY**.
- `Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1_1.md` — filename looks **newer** than BUILD `v0_1`; body SUPERSEDED.
- `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.7_1.md` — DRAFT titled v0.7; sibling BUILD is `v0.7.1`.
- `Specs/FatTail-Labs-Retrospective-Spec-v0.7.md` — DRAFT; live BUILD is Journal-Retrospective v0.7.1.
- `Specs/FatTail-Labs-Tag-Manager-Spec-v0.2.md` vs `v0.2_1.md` vs `v0.3.md` — contradictory “current” claims.
- DL-327 still BUILD with no hold/reversal after code revert.

### Runtime leftovers

- `web/components/conversation/conversationTokens.ts` — Echo lock after surface delete.
- `server/tests/__pycache__/test_coach_lab.cpython-314-pytest-9.1.1.pyc` — stale.
- Local MySQL `coach_lab_*` + `schema_migrations.128_coach_lab.sql`.

### Untracked / unignored trees

- `tmp/demo-practice.zip`, `tmp/ernie-practice-export.zip` — export zips; `.gitignore` does not ignore `tmp/`.
- `scrots/` — not ignored.
- `web/test-results/` — present.
- `server/market_data/options_campaign.py` + `server/tests/test_options_campaign.py` — untracked code.

### Copy / flags

- `web/components/hub/HubHeader.tsx` — “Intro video coming soon”
- `web/components/LiveSessions.tsx` — “Replay coming soon”
- `web/components/hard/HowItWorks.tsx` — “Intro video — coming soon”
- `server/routes/feature_gates.py` — default headline `"Coming soon"`
- `.env.example` Discord client IDs unread by `server/`: `LABS_DISCORD_APPLICATION_ID`, `LABS_DISCORD_CLIENT_ID`, `LABS_DISCORD_CLIENT_SECRET`, `LABS_DISCORD_PAID_ROLE_IDS`, `LABS_DISCORD_0DTE_CLIENT_ID`, `LABS_DISCORD_0DTE_CLIENT_SECRET`, `LABS_DISCORD_0DTE_ROLE_ID`

### Routes (confirm coach-lab absent)

Admin pages: access, agents, ai, appearance, board, cast, community, flow, gates, help, journal-prompts, market-universe, media, tags, users. **No coach-lab.**  
FastAPI: no `coach_lab` import (full `include_router` list in census packet).

---

## 5. Change-control reconciliation

- ~**352** commits since 2026-07-01 (repo born ~2026-07-21).
- Decision log numbered through **DL-327**.
- **Collisions (same number, two meanings):** DL-211, DL-212, DL-216, DL-307, DL-312, DL-313.
- **Gap:** DL-274, DL-275 unused between 273 and 276.
- Many July `feat:` commits map to **unnumbered** `## 2026-07-*` headings (pre-numbering habit).

**Feat/fix with no obvious DL heading after keyword search** (flag, not “no DL exists anywhere”):

- MarketSocket revive (`4bb0bb0`)
- Options Lab quick-nav / suite capsule (`87e7e5f`)
- Analyzer ToS-style position book (`97b1258`)
- Surface as in-viewport mode (`71ec38e`)
- Position cards blotter colors (`680aee7`)
- Durable OHLC store as its own decision (`ece7ae7`)
- Per-symbol app profile as its own DL (`7979e42`)
- Pre-AF broken-wing heatmap template (`0c67c81`)
- GEX/spot live transitions (`cf963b1`)
- Trade Log BWF classifier (`0f8a9d5`)

**This author’s work (required unfavorable finding):** CL-0…CL-G + reverts + plan v1.2 live **only on StudioTwo**. DL-327 still reads as if the lab shipped. No hold DL. Incomplete schema backout.

### 5.1 Process-containment (incident class — Coach R-1 / R-8)

The 2026-08-13 ship was not a missing unit test first. It was a **verbal GO** treated as execution authority: one actor implemented, skipped Echo lock / slice tests / Delta, then file-reverted without a schema tripwire.

| Control | As-built | Finding |
|---------|----------|---------|
| **GO token (R-1)** | Chat text (`GO` / “implement uninterrupted”). Board files (`W0-0-coach-go.md`) exist on some projects; **nothing refuses work** if they are absent. This Round 0 directive’s GO token is **absent** and was honored only by convention. | Process has no tripwire. Cheapest high-benefit item on the bill (**RB-08**). |
| **Identities (RB-11)** | One human: GitHub write + migrate + MiniTwo SSH. | Necessary later; **does not** stop a solo implementer who already holds all three. |
| **Artifact-checking deploy (R-8)** | `infra/deploy.md` + pull/build/kickstart. The SHA-printing script reports **checkout HEAD after `git pull`**, not the running process. No check that health SHA, migration head, GO artifact, or a green core pack exist before kickstart. | Deploy can land a SHA nobody can attest (**RB-19**; needs **RB-02**). |

RB-11 remains the identity split. It is not a substitute for R-1 or R-8.

---

## 6. Gate-evidence sample (Delta)

Five most recently modified Delta reports (Coach-GO files excluded):

| mtime (local) | Path | Verdict |
|---------------|------|---------|
| 2026-08-13 10:29:27 | `agents/p-volume-profile-histogram/gate-reports/W0-G.md` | PASS |
| 2026-08-12 10:56:36 | `agents/p-options-lab-heatmap/gate-reports/AF0-G.md` | PASS |
| 2026-08-12 10:56:36 | `agents/p-options-lab-heatmap/gate-reports/AF-Z1-G.md` | PASS |
| 2026-08-12 10:55:59 | `agents/p-options-lab-heatmap/gate-reports/AF-U1-G.md` | PASS |
| 2026-08-12 10:55:59 | `agents/p-options-lab-heatmap/gate-reports/AF-M1-G.md` | PASS |

### Replay vs `https://labs.fattail.ai`

| Gate | Cited check | Command | Replay |
|------|-------------|---------|--------|
| W0-G | Bins gated / VP21 403 | `GET /api/me/market/volume-profile?symbol=SPY` | **cannot run** — `401 Sign in required` before 403. VP **page** `/app/options-lab/volume-profile` **200**. |
| AF0-G | Local sha1s + Heatmap surface | `GET /app/options-lab/heatmap` | **reproduces** surface (200). Hashes N/A on prod. |
| AF-Z1-G | Suite default Heatmap, `sym-fly` | `GET /app/options-lab` → **307** to heatmap; HTML `option value="sym-fly" selected` | **reproduces** |
| AF-U1-G | Advanced flies / Debit / CR | prerender + `/_next/static/chunks/0lobkvgf_hfqx.js` `id:"sym-fly"` | **reproduces** |
| AF-M1-G | Local `tsx` unit pack | cannot run tsx on prod; same bundle | **cannot run** tests; bundle **reproduces** template/CR |

Host sanity (not cited by those five): `GET /api/health` 200 production; `GET /api/auth/providers` FatTail URL contains `reauth=1`.

---

## 7. Access matrix (Mike)

| Power | Who |
|-------|-----|
| `git push` `main` | **Ernie / `dudefromearth/Fattail-Labs`**. Remote `git@github.com:dudefromearth/Fattail-Labs.git`. **No CODEOWNERS. No in-repo branch protection.** MiniTwo documented to **pull**, not push. |
| Run migrations | Anyone with host `.env` (full Config + DB password) + shell. `server/migrate.py`. No app role. MySQL user `labs` `GRANT ALL` on `labs` (deploy.md). |
| Deploy MiniTwo | **`ssh minitwo` as `ernie`**, `IdentityFile ~/.ssh/id_minitwo`. Same human. `git pull` → migrate → `npm` build → `launchctl kickstart` `ai.fattail.labs.api` / `.web`. No separate deploy user. |
| App admin writes | Live `derive_role` (H1 — JWT `role` not trusted). SSO admin = WP `is_admin` **and** `LABS_ADMIN_EMAILS` (H3). |
| Member writes | Own Family B rows only. |
| Agent bearer `ftl_ag_…` | Scoped. No billing, no key mint. |
| Dev login | `GET /api/auth/dev-login` only if `LABS_ENV=dev`. |

**Stated plainly:** one-operator host — Coach’s GitHub + Coach’s MiniTwo SSH.

---

## 8. Config inventory (Mike)

### 8.1 Required at API boot (`get_config()` + `wiki_root()`)

`LABS_ENV` · `LABS_PORT` · `LABS_DB_HOST` · `LABS_DB_PORT` · `LABS_DB_USER` · `LABS_DB_PASSWORD` · `LABS_DB_NAME` · `LABS_SSO_SECRET_FATTAIL` · `LABS_SSO_SECRET_0DTE` (≥32) · `LABS_SESSION_SECRET` (≥32) · `LABS_SESSION_TTL_SECONDS` · playbook archive MIME + four ints + retention ≥1 · **`LABS_WIKI_ROOT`** (must contain `wiki/index.md`; **not in `config.py` listing; not in `.env.example`**).

`LABS_COOKIE_DOMAIN` and `LABS_ADMIN_EMAILS` **required outside `dev`**.

Cookie name `ft_session` is hardcoded.

`migrate.py` uses the same Config **except** it does not call `wiki_root()`.

### 8.2 Fail-loud when used (not at boot)

Journal: `LABS_COACH_POSTURE_DEFAULT` · `LABS_COACH_MODEL_PROVIDER` · `LABS_COACH_MODEL` · `LABS_COACH_EFFORT_MAP` (closed keys).  
AI: `XAI_API_KEY` / `ANTHROPIC_API_KEY` when that provider is used.  
Market bus: `REDIS_URL` when `LABS_MARKET_BUS=1`.  
Others: Bunny, Massive, SMTP-when-host-set, AC pair, HeyGen live, Quebec poller flag — see Mike packet.

**`LABS_COACH_LAB`:** not implemented; not required at boot.

### 8.3 Silent defaults (each is a finding)

**Highest severity**

| Name | Default | Finding |
|------|---------|---------|
| `rate_limit._env_int` / `webhook_security._env_int` / journal media max | numeric defaults | **Invalid int swallowed** — not fail-loud |
| `LABS_JOURNAL_AGENT_MODE` | **`llm`** | `.env.example` comment says `local (default)` — **docs lie** |
| `LABS_HELP_AI_ENABLED` | `"1"` | Concierge tries AI if `XAI_API_KEY` exists |
| `LABS_MEMBER_AI_ETHOS_MODE` | `"on"` | Invalid values fail-soft to on |
| `LABS_AI_XAI_BASE_URL` | `"https://api.x.ai/v1"` | Silent host |
| `LABS_AI_PRIMARY_MODEL` | `"grok-4.5"` | Silent model |
| `LABS_AI_TIMEOUT_SECONDS` | `120` | Silent |
| `LABS_DISCORD_CONNECT_URL` | hardcoded `https://fattail.ai/my-account/` | Not fail-loud |
| `LABS_WIKI_ROOT` | — | Boot-required, **undocumented in `.env.example`** |

Also silent: Anthropic base/version/model; SSO force reauth `"1"`; webhook age 300 / skew 60; RL limits 10/5/5/30/10; SMTP port 465 / TLS; password-reset TTL 3600; AC lead tag / timeout 15; help model `grok-4-fast`; HeyGen batch/daily/monthly; Quebec fixtures/60s; market bus TTLs; OPF knobs; `LABS_POSITIONS_OPF` `"1"`; `LABS_DB_POOL_SIZE` `"10"`; feed CLIs `setdefault("LABS_MARKET_BUS","1")`.

---

## 9. Round 0 scorecard — baseline (locked 2026-08-14)

Trend lines start here. Later rounds **do not rewrite these cells**; they add a column.

| Metric | Round 0 (this audit) | Source in this document |
|--------|----------------------|-------------------------|
| Characterization suite | **33 failed / 10 error / 884 passed / 2 skipped** · 929 collected · 192.06s | §2.1 |
| DL number collisions | **6** — DL-211, DL-212, DL-216, DL-307, DL-312, DL-313 | §5 |
| Chad census | **21 lines** (9 specs/paper · 3 runtime leftovers · 4 untracked trees · 5 copy/flags) | §4 |
| Gate replay vs `https://labs.fattail.ai` | **2 of 5 irreproducible** (W0-G 401 before cited 403; AF-M1-G cannot run local `tsx`) · 3 reproduce (AF0-G, AF-Z1-G, AF-U1-G) | §6 |
| Production SHA | **NOT ATTESTED** | §1.1 |
| Local migration HEAD | **`128_coach_lab.sql`** (file absent on disk and on origin) | §1.3 |
| Coach-lab routes (prod + local) | **404** | §1.4 |
| Local `coach_lab_*` tables | **present** (config 1 row; conversations 0; messages 0) | §1.4 |
| §10b journal-path tripwire | **absent** | §2.4 |
| Mechanized GO token | **absent** | §5.1 |
| Artifact-checking deploy gate | **absent** | §5.1 |
| Local vs `origin/main` | **15 commits ahead** | §1.2 |

---

# Part 2 — The bill

Every item: measurable exit. **No execution until `GO: <ID>`.**

Goals: **G1** stability · **G2** verifiability · **G3** velocity (conversation lab → journal remount → retro).

### Q1 — Quick wins (H benefit, L/M difficulty)

Coach re-rank 2026-08-14: **RB-08 (R-1) first** — cheapest high-benefit item on either list. Then schema/law tests. IDs stay stable.

| ID | Title | What / where | Goal | Benefit | Difficulty | Depends | Exit criterion | Evidence required |
|----|-------|--------------|------|---------|------------|---------|----------------|-------------------|
| **RB-08** (Coach **R-1**) | Mechanize the GO token | Bench process: dated GO artifact per item (e.g. `agents/<project>/gate-reports/<ID>-0-coach-go.md` or `GO: RB-xx` file); Juliet / implementer / deploy **refuse** without it. Not a GitHub identity split. | G1+G3 — verbal GO cannot become a solo ship again | **H** | **L** — paper + one checkable file convention. No boot/auth blast. | — | A packet marked in-progress or a deploy kickstart **aborts** when no GO artifact names that ID; `rg` for the convention finds the template; Conversation Lab remains STOPPED until a new GO file exists | abort log + GO file path (or proof of abort) |
| **RB-01** | Complete local schema backout + living tripwire | Local `labs` DB; `server/tests/` | G1+G2 — incident tables cannot hide; backout becomes a test | H | L on **dev** only. **Do not** run on MiniTwo until RB-10 says 128 is absent. | RB-10 before any prod SQL | `SHOW TABLES LIKE 'coach_lab%'` empty; `schema_migrations` has no `128_coach_lab.sql`; pytest **fails** if `/api/admin/coach-lab/*` is registered | SQL output + pytest |
| **RB-02** | Publish git SHA on `/api/health` (or `/api/version`) | `server/main.py` | G2 — stop guessing production commit | H | M — health contract | — | `curl …/api/health` contains SHA matching MiniTwo `git rev-parse` | curl + MiniTwo HEAD |
| **RB-03** | Journal draft Family B isolation test | `tests/test_journal_v07.py` | G2 — draft leak fails CI | H | L | — | B GET/PUT A’s draft → 404 | pytest name + output |
| **RB-04** | Heat **any-account** fixture | `journal_heat` tests | G2 — un-mock the predicate | H | L | — | Second account unmatched open restrains; narrowing helper to one account fails the test | pytest |
| **RB-05** | Fail-loud unit tests for `LABS_ENV` / `LABS_PORT` / `LABS_SESSION_SECRET` | `server/tests/` | G1+G2 | H | L | — | Missing var raises `ConfigError` | pytest |
| **RB-06** | Tags-never-seal characterization | journal/tag tests | G2 — v0.7 law has a tripwire | M | L | — | Assigning a process tag does not flip `required_for_complete` | pytest |
| **RB-07** | §10b journal-path ethos + stop-interview tripwire | `server/tests/` against `journal_session_agent` (not only `labs_member_ai_ethos.py`) | G1+G2 — doctrine north star is load-bearing; helpers are not a path test | H | L | — | (1) Agent turn with self-distress corpus returns `kind=distress_hold` and does **not** raise an absence probe, including `ETHOS_MODE=off`. (2) LLM/local compose path includes `LABS_MEMBER_AI_ETHOS_V1_2` when MODE=on. (3) Deleting the gate or the compose call **fails** the test. Trading vernacular corpus still does **not** hold. | pytest names + output |

### Q2 — Strategic (H benefit, H difficulty)

| ID | Title | What / where | Goal | Benefit | Difficulty | Depends | Exit criterion | Evidence required |
|----|-------|--------------|------|---------|------------|---------|----------------|-------------------|
| **RB-10** | Attest MiniTwo SHA + `schema_migrations` head | MiniTwo (read-only SSH) | G2 | H | H — prod access | Coach GO to use deploy-capable key even to read | Written SHA = `git rev-parse`; 128 filename present/absent documented | ssh command + output |
| **RB-11** | Separate GitHub write / migrate / deploy identities; record branch protection | GitHub + MiniTwo + `infra/deploy.md` | G1 | H | H | Coach policy. **Does not** mechanize GO (RB-08) or check deploy artifacts (RB-19). | Matrix names distinct keys; `main` requires review | `gh api` / screenshots |
| **RB-12** | Fail-loud invalid ints; align journal agent default with `.env.example` | `rate_limit.py`, `webhook_security.py`, journal media, example | G1 | H | H — auth/boot-adjacent | RB-05 | Invalid `LABS_RL_*` fails loud; example matches code (`llm` vs `local`) | pytest + example grep |
| **RB-13** | Characterization suite green **or** isolated so 33 fail / 10 error cannot hide regressions | `server/tests/` + seed | G2+G3 | H | H | — | Documented contract: `pytest tests -q` exit 0 **or** marked quarantine with a green core pack | full run log |
| **RB-14** | Reconcile 15 unpushed commits (incl. journal v0.7) vs MiniTwo | git + deploy | G2+G3 | H | H | RB-10 | `git log origin/main..HEAD` empty **or** prod SHA in that range | log + health SHA |
| **RB-15** | Lima pass: Conversation Lab **hold** + DL collision index (absorbs **RB-34**) | `Architecture/00-decision-log.md` only — append, **no rewrite** of colliding numbers | G2 — paper matches runtime; six collisions stay findable | H | M — append-only | Coach wording on the hold | (1) New DL: GO stands, **implementation held**; spec Status matches. (2) Index lists both meanings of DL-211, 212, 216, 307, 312, 313. Neighbors of DL-327 land in the **same** Lima commit. | DL excerpts (hold + index) |
| **RB-16** | One xAI call path with explicit `effort`; do not silently change Help/Journal | `server/ai/` | G3 | M | H — shared AI | Lab still STOPPED | All callers pass or omit effort; Help/Journal fixtures green | grep + pytest |
| **RB-17** | Unique next-free migration numbers (do not rewrite applied files) | `migrations/` + lint | G1 | M | H — history | — | Lint fails on duplicate `NNN_` prefix | lint output |
| **RB-18** | Land or revert uncommitted retro / journal / `massive_client` / `options_campaign` | dirty tree | G1+G3 | H | M | Coach | Those paths clean **or** named branch | `git status` |
| **RB-19** (Coach **R-8**) | Artifact-checking deploy gate | `infra/deploy.md` + MiniTwo kickstart path | G1+G2 — deploy refuses unless checkable artifacts exist | H | H — prod kickstart | **RB-02** (running SHA to compare); **RB-08** (GO token to require); **RB-10** to know current prod | Script/playbook **aborts** kickstart unless: GO artifact names the ship; running health SHA will be comparable (RB-02); migration-head query recorded; named test pack exit 0 (or documented quarantine). Printing `git rev-parse` **after pull** is not sufficient (today’s script). | abort-on-missing-artifact log + successful path log |

### Q3 — Housekeeping (M benefit, L/M difficulty)

| ID | Title | Goal | Exit criterion |
|----|-------|------|----------------|
| **RB-30** | Spec hygiene: old Journal Session BUILD → SUPERSEDED; Coach Lab `v0_1_1` vs `v0_1`; Retro `v0.7_1` vs v0.7.1; Tag Manager v0.2 vs v0.3 | G2 | `rg "BUILD AUTHORITY" Specs/FatTail-Labs-Journal-Session*` only v0.7 |
| **RB-31** | `.env.example`: add `LABS_WIKI_ROOT`; mark unread Discord client IDs WP-only | G2 | Example matches boot |
| **RB-32** | gitignore `tmp/`, `scrots/`, `web/test-results/` | G1 | those paths ignored |
| **RB-33** | Fate of `certificates`, merge_collisions, `community_bot_shares`, funding table | G2 | each table READ in product **or** dropped via **new** migration |
| **RB-34** | DL collision index (211, 212, 216, 307, 312, 313) — no rewrite | G2 | **Do not execute separately.** Lands inside **RB-15** (one Lima pass with the Conversation Lab hold). Exit = RB-15 exit (2). |

### Q4 — Cosmetic appendix (unranked; not G1–G3)

- Hub / Live / HARD “coming soon” copy
- `datetime.utcnow` deprecation in retro tests
- Starlette TestClient cookie warnings
- Em-dash PI v0.1 filename (already SUPERSEDED)

---

# Part 3 — Parked

Coach ruling required. Never dropped, never done in this round.

| Park | Why parked |
|------|------------|
| **Conversation Lab implementation** | Coach: STOPPED. Plan v1.2 is paper. Not an execute item on this bill. After RB-08, a new GO **file** is required — chat GO is not enough. |
| **SSH MiniTwo for RB-10** | Foxtrot skipped (key is deploy-capable). Needs GO even to *read* prod SHA. |
| Dual-subdomain Practice vs Labs (DL-248–250) | Future cutover; not this audit. |
| Knowledge-vault Zulu journal of this incident | Business memory; different bench. |
| Quarantine vs fix of the 33 failing characterization tests | Policy choice inside RB-13. |

---

# How to execute later

Coach re-ranks if desired, then issues **`GO: RB-xx`** (or a quadrant) **per item**. Until then: read, verify, report. No plan-of-work beyond this bill.

After **RB-08** lands, “GO” means a dated artifact that names the ID — not chat text alone. This document still does not authorize execution.

**RB-08 GO issued 2026-08-14.** Token: `agents/go/RB-08.md`.

**RB-01 GO issued 2026-08-14.** Token: `agents/go/RB-01.md`. StudioTwo only.
Coach attested MiniTwo head is 125 (never 128). Conversation Lab still has
no `agents/go/CL-*.md`.

**Suggested next GO if the ranking stands:** `RB-02` or `RB-07`. Each needs
its own `agents/go/<ID>.md` — chat alone is not enough.

Process-containment pair: **RB-08 (R-1)** + **RB-19 (R-8)**. Identity split remains **RB-11**. Do not treat RB-11 as done process work.
