# IF-6-G — Delta Gate Report

**Gate:** IF-6-G
**Delta.** Evidence-based. Nothing modified during this gate pass — all commands below are read/query/test-run only.

## Verdict: **PASS**, with three findings attached (one ADVISORY that should be dispositioned before IF-7, two notes on measurement gaps). None are blocking.

---

## Evidence, item by item

### 1. Originator captured and required at intake; no silent default

Confirmed for **all new writes** by test (`test_originator_defaults_to_coach`, `test_originator_outside_requires_label`, `test_originator_outside_recorded`) and by direct DB query just now, on a row created by an unrelated IF-5 test in this same run:
```
{'id': 804, 'title': 'zz-if5-noproduct', 'originator_kind': 'coach', 'originator_label': 'identity:0'}
```
`originator_label` is never null on a freshly created card — populated automatically from the acting admin's identity when `kind='coach'`, and rejected with 422 when `kind='outside'` and no label is given (`test_originator_outside_requires_label`, confirmed 422).

**Finding (ADVISORY, not blocking this gate):** the same query surfaced a pre-existing, non-test card:
```
{'id': 31, 'title': 'Ways to use GEX with 0DTE', 'originator_kind': 'coach', 'originator_label': None}
```
This card predates IF-6. The migration backfilled `originator_kind='coach'` by column default, but there was no data to backfill `originator_label` from — it's genuinely unknown who created it. So "no silent default" holds for everything created **after** this migration; it does not and cannot hold retroactively. If the panel is going to display originator for every card (it is — `ORIGINATOR_LABEL[card.originator_kind]` renders unconditionally), this specific card will show a bare "Coach" with no name attached, which is a fabricated-looking precision for data that's actually unknown. Recommend either a UI fallback ("Coach — pre-IF-6, unattributed") or leaving it as-is with Coach's awareness — this is a disposition, not a code fix, and I haven't made one.

### 2. Attachments round-trip, link and upload both

`test_link_attachment_round_trips` and `test_upload_attachment_round_trips` both pass (see full run below), each asserting create → list → fetch-back-identical → delete → confirmed-gone. Upload test writes real PNG bytes through the HTTP layer and reads them back byte-identical from the served URL.

### 3. Side panel replaces inline card controls; card face is title + originator

Grepped, not inferred:
- `iki-factory-detract-`, `iki-factory-advance-`, `iki-factory-hold-`, `iki-factory-rework-` testids: **absent** from `IkiFactoryBoard.tsx`, **present** in `IkiFactoryItemPanel.tsx` (lines 476/488/498/508).
- Card `<li>` body, verbatim: title (`{c.title}`) and one originator badge (`{ORIGINATOR_BADGE[c.originator_kind]}`) — nothing else.

### 4. Dead conveyor subhead gone, ruled copy in place

Grepped: `"Deposit an idea"` / `"the belt will not choose"` — **absent**. `"Admin floor only. Nothing advances itself — work moves when someone takes it."` — **present**, line 178.

### 5. Lane displays the backlog label; LANES tuple untouched

`server/iki_factory.py:16` — `LANES = ("ideas", "research", "spec", "build", "live")`, unchanged. Display label is `"Backlog"` in both `IkiFactoryBoard.tsx` and `IkiFactoryItemPanel.tsx`, each commented with the deferred-key note.

### 6. `git diff --stat` against the IF-6 allowlist

**This cannot be produced as asked, and I want to be direct about why rather than approximate it.** `git status --porcelain` on every touched file — including the pre-existing IF-1…IF-5 files — returns `??` (untracked):
```
?? Specs/FatTail-Labs-IKI-Factory-Pipeline-Spec-v1_0.md
?? migrations/143_iki_factory_if6_fields.sql
?? server/iki_factory.py
?? server/iki_factory_media.py
?? server/routes/iki_factory_admin.py
?? server/tests/test_iki_factory_if6.py
?? web/components/admin/IkiFactoryBoard.tsx
?? web/components/admin/IkiFactoryItemPanel.tsx
?? web/e2e/iki-factory-if1.spec.ts
```
**None of the IKI Factory code — including everything IF-1 through IF-5 shipped and PASS-gated before this session — has ever been committed to git.** There is no baseline to diff against. `git diff --stat` returns nothing not because there are no changes, but because git has no prior version of these files to compare to. This is a real gap in this program's evidence chain that predates IF-6 and isn't mine to fix unilaterally — flagging it plainly rather than producing a diffstat that looks authoritative but isn't.

In its place, the manual, line-level account (I made every edit, so this is exact, not reconstructed):

| File | Change |
|---|---|
| `migrations/143_iki_factory_if6_fields.sql` | New file, 34 lines. 3 additive columns on `iki_factory_cards`; 1 new table `iki_factory_card_attachments`. |
| `server/iki_factory.py` | +2 constants (`ORIGINATOR_KINDS`, `ATTACHMENT_KINDS`); `_row()` +3 keys; `create_idea()` +3 params, +validation block, `INSERT` column list extended; `patch_card()` +1 allowed field, +1 read, +1 branch, `UPDATE` column list extended; +6 new functions appended (`_attachment_row`, `list_attachments`, `add_link_attachment`, `add_upload_attachment`, `get_attachment`, `delete_attachment`). Zero lines changed inside `validate_move`, `run_conveyor_spec_to_build`, `run_conveyor_build_to_live`, `execute_deploy`. |
| `server/iki_factory_media.py` | New file, 66 lines. |
| `server/routes/iki_factory_admin.py` | +2 imports; `get_card` response +1 key; `post_card` +3 body fields; +5 new route handlers (attachments: list, add-link, add-upload, serve-file, delete). |
| `server/tests/test_iki_factory_if6.py` | New file, 13 tests. |
| `web/components/admin/IkiFactoryBoard.tsx` | Rewritten. Card `<li>` body reduced from ~140 lines (all inline detail + 4 controls) to 2 elements; create form +2 fields; subhead text replaced; panel import + conditional render added. |
| `web/components/admin/IkiFactoryItemPanel.tsx` | New file, 397 lines — receives everything removed from the card body above. |
| `web/e2e/iki-factory-if1.spec.ts` | 2 assertion blocks changed (below). |
| `Specs/FatTail-Labs-IKI-Factory-Pipeline-Spec-v1_0.md` | §11 +2 rows (items 7, 8 — priority cut and lane-key rename, both marked deferred to IF-7). |

### 7. The xAI test failure — demonstrated, not read

Ran it alone, isolated, verbose:
```
tests/test_ai_admin_api.py::test_ai_run_bravo_live_via_api FAILED
AssertionError: {"detail":"xAI HTTP 403: {\"code\":\"permission-denied\",\"error\":\"Your team ...
has either used all available credits or reached its monthly spending limit...\"}"}
assert 502 == 200
```
This is a **live network round-trip to xAI's API returning a real account billing-limit rejection**, surfaced through the app's own fail-loud 502 wrapper. I also checked the import graph directly: `tests/test_ai_admin_api.py` imports only `ai.config`; grepping the entire `server/` tree for `import iki_factory` shows the only hit is `iki_factory.py` importing `iki_factory_woo` — a Factory-internal, one-directional reference. Nothing in the AI/Bravo path imports, calls, or depends on anything in `iki_factory*`. Combined with the failure text itself (a billing-account response from xAI's servers), this is about as categorical as evidence gets that IF-6 is not the cause: it would require my code changes to somehow reach across an unrelated Python module with no import path *and* alter a third party's account balance.

Correction to something I said earlier in this session: I'd claimed no `XAI_API_KEY` was set, based on `env | grep` in my shell. That was wrong — the key is loaded from `.env` at repo root via `tests/conftest.py::_load_env()`, invisible to a bare shell `env` check. The test wasn't skipped; it ran, reached xAI, and xAI said no. Flagging my own earlier error rather than letting it stand uncorrected.

### 8. The two re-authored e2e assertions, before and after

**Assertion 1 — pickup-stub content:**
```diff
- await expect(card).toContainText("Auto: Idea deposited — picked up for research.");
- await expect(card).toContainText("No skills registered. Gemba will not invent findings.");
+ await card.click();
+ const panel = page.getByTestId(/iki-factory-panel-\d+/);
+ await expect(panel).toContainText("Auto: Idea deposited — picked up for research.");
+ await expect(panel).toContainText("No skills registered. Gemba will not invent findings.");
+ // ... await page.getByTestId("iki-factory-panel-close").click();
```

**Assertion 2 — invalid-move reason:**
```diff
- await expect(inSpec.getByText(/one lane|Skip-forward|not allowed/i)).toBeVisible({ timeout: 10_000 });
+ await expect(page.getByTestId("iki-factory-error")).toContainText(
+   /one lane|Skip-forward|not allowed/i,
+   { timeout: 10_000 },
+ );
```
Note on the second one: I could not have "kept it passing as-is" regardless of IF-6 — the original assertion scoped `getByText` to the card `<li>`, but the rejection reason was already rendered only in the page-level error banner *before* my changes too (I traced the pre-IF-6 `move()` handler: it calls `setError(...)`, a page-level state, never anything inside the card). This looks like a latent bug in the original spec, not something IF-6 broke. I fixed it to match actual app behavior rather than leave it silently wrong. **I have not run this Playwright spec live** (would need Playwright browsers installed and both servers up) — this is a source-level correction, not a verified pass. Flagging the distinction rather than blurring it.

### Full IF-1…IF-6 suite, fresh, this gate

```
52 passed in 1.72s
```
Every IF-1/IF-3/IF-4 test whose exact name and assertion India quoted at Phase 2 (`test_create_idea_pickup_stub`, `test_plan_attach_conveyors_to_build`, `test_hold_blocks_conveyor_clear_resumes`, `test_product_spec_writes_published_then_stub`) is in this run, unmodified, passing.

---

## What the acceptance tests did NOT measure

Asked, so answered plainly rather than left implicit:

1. **The panel's actual "no scrim" behavior is untested.** §2.5's deliberate divergence — lanes stay live and interactive while the panel is open — is a CSS/interaction claim (no blocking overlay element) that I built but never asserted in any test, browser or otherwise. Nothing would fail today if a future edit silently added a blocking scrim back.
2. **Non-admin/agent-scoped access to attachments is untested.** I gated attachment writes to `require_human_admin_actor` and reads to `_factory_actor` (admin or `factory:operate` agent), but I never wrote a test proving an agent-bearer principal can list but cannot add or delete an attachment, or that a plain member session gets 401/403 from the file-serving route.
3. **Upload size-limit enforcement is untested.** `iki_factory_media.py` rejects files over `LABS_IKI_FACTORY_MEDIA_MAX_BYTES` (default 20MB), but no test ever sends an oversized file to prove the 413 path actually fires.
4. **A real behavioral coupling I found but didn't add a test for:** `patch_card`'s existing tail — `if row["lane"] == "spec" and row.get("spec_ready"): return run_conveyor_spec_to_build(card_id)` — fires after **any** successful patch, not just plan-related ones. This is pre-existing IF-3 behavior, not something I introduced, but `description` now rides through that same code path untested against it: patching only the description of a spec-ready, plan-attached card would silently also fire the Spec→Build conveyor as a side effect. My test creates the card in `ideas` lane specifically to avoid exercising this path — meaning it's confirmed silent, not confirmed safe.
5. **Card-face reduction is proven by source grep, not by a rendered-DOM assertion.** No test — Playwright or otherwise — asserts that a priority chip or attachment count is *absent* from a live-rendered card. A future regression that re-adds one would not be caught by anything I wrote today.
6. **The originator-backfill gap (finding #1 above) has no test at all**, in either direction — nothing asserts what a pre-IF-6 card should display, because that wasn't a question anyone had posed until this DB query surfaced it just now.

---

**Signed:** Delta. Verdict **PASS**. One ADVISORY finding (originator backfill on pre-IF-6 cards) for Coach to disposition — not blocking, not a regression, a genuine unknown made visible. Two honesty notes (e2e spec not run live; git evidence chain gap predates this gate) recorded rather than smoothed over.
