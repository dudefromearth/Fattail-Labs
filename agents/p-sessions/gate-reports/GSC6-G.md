# GSC6-G — staging · docs · production · close

**Delta** · 2026-09-09 · Ernies-MacBook-Pro.local  
**Verdict:** **BLOCKED** (not FAIL, not a waive)

GSC2.5-G · GSC4-G · GSC5-G **PASS**. Spec v0.2 sha1 `6616b1753f21e334c21dc65336c405acafa5d958` matches DL-686.

## GSC6-1 Lima — done on this machine

- DL-686 filed (BUILD AUTHORITY supersession + GSC6-2 hash rule + OD-S4 c + OD-S8 a).
- `server/help_reference/sessions.md`
- Guide: `web/lib/guide.ts` + `web/app/guide/page.tsx` § Sessions
- `AGENTS.md` program row
- Arch 10 one-line Sessions child
- Known divergence `/resources` vs `/resource` remains; not repaired

## GSC6-2 India — static PASS

- Spec hash = DL-686, not the GO sha1
- AT-GSC-17b: no `20xx-xx-xx` literals in `marketCalendar/index.ts`
- AT-GSC-41b: no react/next in lib trees
- AT-GSC-41c: no dynamic loading in the sessions route tree
- AT-GSC-56: no prime / opportunity / ranking copy

## GSC6-0 Foxtrot — host map (2026-09-09) · no deploy · no key

Read: DL-683, DL-684, HOST v0.2 (DRAFT, unstamped), `infra/deploy.md`, `CLAUDE.md` hosts pillar.
`INSTRUCTIONS.md` is **not in this repo** (DL-2804) and was **not on this Mac**
(`find ~ -iname INSTRUCTIONS.md`, ~180s, Library skipped — empty). The same as-built
sentences live in `CLAUDE.md` and `infra/deploy.md`: staging = DudeTwo /
`labs-stage.fattail.ai`; production = MiniTwo / `labs.fattail.ai`.

Live probes (read-only, Ernies-MacBook-Pro.local):

```text
dig labs.fattail.ai          → Cloudflare 104.21.11.41, 172.67.131.200
GET https://labs.fattail.ai/api/health
  200  {"status":"ok","env":"production","git_sha":"b996916265070d8013013d81c58b8693ea67c71a"}
dig labs-stage.fattail.ai    → NXDOMAIN (cannot resolve)
```

The production `git_sha` is **not in this checkout** (`git cat-file` fatal). That is a
deployed tree, not proof of a host swap.

### 1. Which host serves `labs.fattail.ai` RIGHT NOW

**Mini Two.**

As-built playbook (`infra/deploy.md`, `CLAUDE.md`) still names Mini Two as the sole Labs
production host. Cloudflare fronts it; MiniThree is the nginx origin. No DL after DL-684
records H4 (the member switch) as closed. HOST v0.2 is **DRAFT, not stamped**. DL-684
named Dude Two as **hot spare and next** production, cutover “later this week **with Conor
present**” — intent, not a completed switch. Lima’s H6 rewrite of `deploy.md` / `CLAUDE.md`
has not happened; those files still say Mini Two is production. Therefore production has
not left Mini Two.

### 2. Which host is staging RIGHT NOW

**There is no live Labs staging vhost.** `labs-stage.fattail.ai` does not resolve.

As-built docs still **name** Dude Two as the Labs staging box (alongside MSC
`stage.flyonthewall.io`). That name is documentation, not a serving hostname today.
DL-673 retired Labs staging; HOST v0.2 H6 would reinstate it on Mini Two **only after**
production has already left Mini Two and seven clean days have passed. H6 has not closed.

### 3. Plan “staging = Mini Two” vs playbook “staging = DudeTwo, production = MiniTwo”

**The playbook is current. The plan is future.**

| Source | Production | Staging | Status |
|--------|------------|---------|--------|
| `infra/deploy.md` · `CLAUDE.md` (INSTRUCTIONS §3 equivalent) | **Mini Two** | Dude Two / `labs-stage.fattail.ai` | **As-built, in force** |
| Sessions plan GSC6-0 | (Foxtrot names) | Mini Two | Assumes HOST H6 already happened |
| DL-683 | Dude One (then) | Mini Two | Intent; Dude One later FileVault-locked |
| DL-684 | Dude Two *next*, Mini Two *until Conor switch* | Mini Two *after the hold* | Intent; switch **not logged** |
| HOST v0.2 H4→H6 | Dude One (spec) / Dude Two (DL-684 overlay) | Mini Two **after** H4+7 days | **DRAFT**, H4 not closed |

**If Mini Two is still production, staging does not go there.** Putting a Sessions
release on Mini Two would be a production deploy. Forbidden.

**Real staging host for GSC6-0:** not Mini Two. Not a live `labs-stage` name either.
The as-built named staging machine is **Dude Two**, but Labs staging DNS is dark.
GSC6-0 cannot stage until Coach/Foxtrot either (a) lights `labs-stage.fattail.ai` on
**Dude Two**, or (b) finishes the recorded production leave of Mini Two and only then
uses Mini Two as staging (H6).

No SSH key installed. No `git pull`. No launchctl. No promote.

## BLOCKERS

- Mini Two is still production. Staging must not go there.
- Labs staging hostname does not exist in DNS. GSC6-0 has no legal box to deploy to
  until (a) Dude Two / `labs-stage.fattail.ai` is lit, or (b) production has left Mini
  Two and H6 has closed.

## NOTES

Product on the development stack is complete through GSC5. The previous GSC6-G note that
named Mini Two as staging was **wrong** — it followed the plan, not the live playbook.
Corrected above. Key install waits on the host answer; the answer is now in this file.
