# W0-1 — India: keep/kill model

**Agents:** India  
**Phase:** W0  
**Blocked by:** W0-0  
**Blocks:** W0-G (model note required)

## Intent

Pin data model boundaries for charter + Journey compass.

## Keep (existing columns / surfaces)

| Surface | Keep | Notes |
|---------|------|-------|
| Campaign | `title`, `status`, `account_id`, `starts_at`, `ends_at`, `starting_capital`, `goals_md`, `is_default`, `activated_at` | Charter lives in free-text `goals_md` + capital/dates — **no new tables** |
| Campaign status | planned / active / completed / **abandoned** | abandoned = deliberate early exit (honest language) |
| Trade Log | `adherence` enum + `practice_campaign_id` | Filter only; no new enum values for F2 |
| Journey meters | `journey_scores.adherence_raw_from_counts` (followed+partial good) | F2 filter = complement |
| Profile prefs | identities JSON / scalar prefs pattern (`home_quick_nav_json`) | J3 dismiss = **server prefs**, same family — **no new table** |
| True North | Existing grade / bearing band on Process Flow | Derive pin from process grade, not a new column |

## Kill / do not add this program

- Closed `campaign_type` enum / kind column
- New tables for J3 recovery invites
- localStorage for dismiss (F3)
- Unlock/reward tables
- Hard pre-register gate (D5)

## True North derivation

True North return = process grade/bearing re-enters healthy band (existing `process.grade` / overall %) after scrub/timeline shows drift — **read-model only**, no write path.

## Done when

- [x] This note committed under seeds/
- [ ] Gate report `gate-reports/W0-1-india-model.md` PASS
