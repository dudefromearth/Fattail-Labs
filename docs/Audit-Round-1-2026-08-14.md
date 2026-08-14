# Round 1 audit

**Date:** 2026-08-14  
**Mode:** Read-only. No fixes. Plain English.  
**Baseline:** StudioTwo main, GitHub main, and MiniTwo disk at the same commit.

---

## 1. Sync

Three IDs match:

| Place | Version |
|-------|---------|
| This machine, main | `89f2216ca68ff8db6e22649358d3ad1ef66f53b0` |
| GitHub main | same |
| MiniTwo disk | same |

The live health check still only says `ok` / `production`. It does **not** print that version, so we cannot prove the *running process* from the URL alone. Disk after the rebuild/restart is that same version.

## 2. Suite

913 passed, 3 skipped, 0 failed, 0 errors. 1360 warnings. About four and a half minutes.

## 3. Warnings

Three unique causes:

- **~1,357 of them:** the test client is using an old way to send cookies. Library (Starlette). A future Starlette release can drop that API and the whole suite stops collecting. Small fix (set cookies on the client, not per request).
- **Two of them:** a retrospective *test* uses a retired clock call (`utcnow`). Library deprecation in *our* test. Python will remove that call. Small fix. Production money code already uses timezone-aware UTC.
- **One of them:** the test client is passed a timeout the library says not to use. Library. Same future-break class. Tiny.

## 4. Config that stays quiet instead of dying at boot

Boot itself is loud for environment, port, database, session secret, SSO secrets. These are the quiet ones:

- Invalid rate-limit numbers fall back to 10 / 5 / 5 / 30
- Invalid webhook age/skew falls back to 300 / 60 seconds
- Database pool size defaults to 10
- Journal agent defaults to talking to the live model
- Member AI ethos invalid values become “on”
- Help AI defaults on
- Options position live marks default on
- Signed video links default to one hour
- SSO “force re-login” defaults on
- Mail port defaults to 465
- Password-reset life defaults to one hour
- Help model defaults to a fast Grok
- Discord connect URL has a hard-coded FatTail account page if unset

## 5. Database vs code

MiniTwo applied head is `125` and matches the files on disk. This machine’s database also has `126` and `127` applied (retrospective one-thing, journal charter) and two older names (`039`, `040`) whose files are **not** in this tree.

Duplicate file numbers that both apply: 038, 093, 094, 116, 119.

Tables that look unused: certificates; a one-shot journal merge-collisions table; community bot shares (read API, no writer).

## 6. Junk

MiniTwo has a pile of old `.bak` files next to real code. This machine’s main is clean. GitHub still has the parking-lot branch from this morning. No dead coach-lab routes on this tree.

## 7. Access

One person. The GitHub account that owns the repo can push `main`. There is no owners file and no branch lock. The same person has the MiniTwo SSH key (`id_minitwo` as `ernie`) and can pull, migrate, and restart. That key is a **deploy** key, not read-only. There is no separate “look but don’t restart” key.

## 8. Decision log

Several numbers were used for two different decisions (help vs ethos; users vs habit catalog; trade-log books vs “compete with Option Alpha”; trade-log imports vs options analyzer; one Observer plan vs volume-profile spec; **reports starting capital vs volume-profile spec**). The last one is the money-adjacent collision.

The log does not record this morning’s test-suite retarget. Paper on this branch still describes a Conversation Lab as if it were a live build, while the running app has no such pages.

---

## List 1 — value first, then effort

Highest value, smallest effort first. Coach rules.

| # | Finding | What fixing buys | Effort |
|---|---------|------------------|--------|
| 1 | Live health check does not print the running version | Stop guessing whether MiniTwo is actually running the commit on disk | S |
| 2 | Invalid rate-limit and webhook numbers are swallowed | A typo cannot silently open login or membership webhook windows | S |
| 3 | This machine’s database has extra applied scripts whose files are gone (`126`, `127`, and two old trade-log names) | Dev money/journal tests stop running against a schema this code cannot recreate | S |
| 4 | Options position live marks default on if the flag is missing or mistyped | A bad flag cannot silently change how package prices are shown | S |
| 5 | Journal agent defaults to the live model when unset | Tests and a forgotten env cannot spend API money or talk as the coach | S |
| 6 | Member AI ethos “off” only if spelled perfectly; anything else is on | Distress/ethos behavior cannot flip by typo | S |
| 7 | Help AI defaults on | Concierge cannot start calling a model without an explicit yes | S |
| 8 | Decision log reused one number for reports starting capital and for volume-profile | Operators stop citing the wrong law for account starting money | S |
| 9 | Other reused decision numbers (help/ethos, imports/analyzer, Observer/volume-profile, etc.) | History stays searchable | S |
| 10 | Duplicate migration numbers (five pairs) | The next migrate cannot apply two different scripts as if they were one | M |
| 11 | Test cookie style is deprecated (~1,357 warnings) | The suite will not die on the next Starlette upgrade | S |
| 12 | Retrospective test still uses the dying clock call | That test keeps running after Python removes the old clock | S |
| 13 | Unused tables (certificates, merge collisions, bot shares with no writer) | Less schema to fear when changing money-adjacent deletes | M |
| 14 | MiniTwo leftover backup files beside live code | Less chance of editing the wrong file on the host | S |
| 15 | One human can push main and restart MiniTwo; no review lock | A bad push cannot go live without a second key | L |
| 16 | This morning’s suite retarget is not in the decision log | Future you knows why tests no longer name the old flagship slug | S |
| 17 | Conversation Lab paper on this branch still reads like a live build | Specs stop lying about what members can open | S |

---

## List 2 — money / records / timestamps first

Same findings. Highest risk to a financial application first. Items 4, 3, 8, and 2 sit on **trade records, capital display, or membership money** and are marked **fix now**.

| Rank | List 1 # | Why it is money-risk |
|------|----------|----------------------|
| 1 | **4 — fix now** | Wrong live vs at-cost marks on option positions change what a member believes a book is worth. |
| 2 | **3 — fix now** | This machine’s database is not the same schema as MiniTwo or this code. Trade-log history files `039`/`040` are applied here with no file on disk. Journal/retro extras too. Characterization of money tools can pass or fail for the wrong reason. |
| 3 | **8 — fix now** | Starting capital on Reports is a member-money number. The same decision number also means a volume-profile spec. Easy to “follow the log” and edit the wrong thing. |
| 4 | **2 — fix now** | Membership and login webhooks: a bad number silently becomes 300 seconds / 10 hits. Entitlements and paid access can drift. |
| 5 | 15 | One key deploys real member data. |
| 6 | 1 | Cannot prove production is the commit you think before judging a money bug. |
| 7 | 10 | A confused migrate on MiniTwo could apply the wrong script next to trade-log tables. |
| 8 | 13 | Unused tables sit next to purge/delete paths. |
| 9 | 5, 6, 7 | Not money, but they change what the product says to a member in distress or in the journal. |
| 10 | 9, 16, 17 | Memory risk, not capital. |
| 11 | 11, 12 | Test-only. They do not move money today. |
| 12 | 14 | Host hygiene only. |

Coach rules. Nothing was changed in the audit pass that produced this file.
