# WA-3-G Delta Gate — Wiki Agent linkage (2026-08-23)

**Gate:** plan v0.1.2 WA-3-G + reverse-pass volume rider.  
**Spec:** v0.1.2 APPROVED · **DL-548/549/550** · **GO WA-3**  
**Verdict: PASS**

Delta did not modify the work under review.

## Part A

**A1 SSR flake routed:** `agents/p-ssr-collector-hardening/ORCHESTRATOR.md` — `test_at_ssr_h_g_flag_off_missing_map_polls` failed at `5efba75` (9 failed, WA-1-G A2) and passed on later house boxes (8 failed) with **zero SSR-tree edits**. Nondeterministic. Not chargeable to wiki. **Not fixed.**

**A2 WA-2 record:**
- (a) Retired-path: `test_updated_and_retired_annotate_not_delete` in WA-2-G table — file remains, body annotates “retired”.
- (b) Oscar prompt references Hotel guidelines at `server/wiki_agent_discharge.py`:

```
GUIDELINES = (
    Path(__file__).resolve().parent.parent
    / "agents"
    / "p-wiki"
    / "hotel-agent-draft-guidelines.md"
)
```

## Allowlist

| Path | Role |
|------|------|
| `migrations/136_wiki_refs.sql` | `wiki_refs` + `wiki_linkage_queue` |
| `server/wiki_agent_linkage.py` | FULLTEXT + boosts, insert/suggest, reverse rollup |
| `server/wiki_agent_discharge.py` | hook after ingest (env-gated) |
| `server/tests/test_wiki_agent_wa3.py` | Kilo |
| `agents/p-wiki/seeds/WA-3-*.md` | seeds |
| `Architecture/11-wiki-design.md` | WA-3 paragraph |
| `Architecture/00-decision-log.md` | DL-550 |

**A1 only:** `agents/p-ssr-collector-hardening/ORCHESTRATOR.md` one observed-flaky line.

**Not touched:** `web/app/app/wiki/**`, compile-inbox, course/help/IKI, runner, session API/chrome, embeddings.

## Evidence

```
applied: 136_wiki_refs.sql
pytest tests/test_wiki_agent_*.py tests/test_wiki_store.py tests/test_wiki_api.py tests/test_wiki_pins.py -q
41 passed in 2.52s
```

| Criterion | Result |
|-----------|--------|
| wiki_refs + explainable score | **PASS** `test_insert_vs_suggest_and_explain` — `total = fulltext + title_boost` |
| Above-threshold `[[wikilinks]]` in draft file | **PASS** same test |
| Below-threshold on board card markdown, not in draft | **PASS** `suggestions_md` + slug not in body |
| Reverse-pass revision drafts `status: draft`, member 404 | **PASS** `test_reverse_pass_draft_member_404` |
| Idempotent second pass | **PASS** `test_idempotent_second_pass` — HEAD unchanged, queue length stable |
| Thresholds fail-loud | **PASS** `test_thresholds_fail_loud` |
| idx via reindex | **PASS** volume test restores real checkout count |

### Rider — reverse-pass volume (full corpus, not 3-page fixture)

Score-only against live idx after reindex of `LABS_WIKI_ROOT` (`/tmp/wa3-reverse-volume.txt`):

```
published=53 scored=50 reverse_hits=21 inline_cap=2 rollup_cards=1 overflow=19
```

**Mechanism (not silent):** **one rollup board card** per ingest (`Reverse-pass {contract_id} ({n})`). First `LABS_WIKI_REVERSE_PASS_INLINE_CAP` hits listed on the card; remainder in `wiki_linkage_queue` (query `list_queue(contract_id)`). **Nothing dropped.** Observed 21 hits → 1 card + 19 queued.

### House box

```
8 failed, 1118 passed, 4 skipped in 320.63s
```

Tolerated 8 (OPF + curate) only. SSR not in the fail list this run (flake, A1). **No other new failures.**

## Isolation

No member related rail. No WA-4/WA-5. No MiniTwo. Env thresholds only.

## Next

**STOP.** WA-4 requires a separate stamp **and** chrome ruling (three OKs or narrowed routes) before any WA-4 prompt.
