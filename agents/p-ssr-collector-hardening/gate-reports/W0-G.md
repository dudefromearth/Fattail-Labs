# W0-G — Delta spec-lock gate

**Project:** SSR Collector Hardening  
**Agent:** Delta  
**Date:** 2026-08-18 00:29 ET  
**Seed:** [`seeds/W0-G-delta.md`](../seeds/W0-G-delta.md)  
**Spec:** [`Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md`](../../../Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md) **v1.0 DRAFT**  
**Coach stamp:** [`seeds/W0-0-coach-stamp.md`](../seeds/W0-0-coach-stamp.md)

**Did not:** implement · edit the Spec · restart any StudioOne job · invent an alert channel · change cadence · rewrite Friday.

---

## Criteria (restated)

1. Spec exists; §0 is Coach’s Phase 0 packet verbatim (14 holes / session map is config / Alert channel: [Coach to specify]). Line count or checksum vs the stamp.
2. India APPROVED or RETURNED with GO/NO-GO. **RETURNED on invariant break = this gate FAIL.** Echo, Foxtrot, Kilo each GO/NO-GO. Opinions labeled. No invented alert channel. Lima cadence report exists; **cadence env was not changed.**
3. Live collector still serving a phase: `curl -sS -m 4 http://studioone.local:5055/api/status`. No mid-gth restart required by this gate.
4. Friday `2026-08-14` archive not rewritten (count / mtimes). Gold path stall → BLOCKED only if unconfirmable; prefer `ssh studioone`.

Delta ternary **PASS / FAIL / BLOCKED** plus **GO / NO-GO**.

---

## Verdict

| Stamp | Value |
|-------|--------|
| **Ternary** | **PASS** |
| **W0 path** | **GO** (spec lock) |
| **Coach BUILD AUTHORITY** | **not this gate** — Coach still stamps |
| **P1–P3 implementation** | **NO-GO** until Coach GO; remains behind `LABS_SSR_HARDENING=0` (default off) and a **between-phase** cutover |
| **Alert channel (OD-SSR-H-1)** | **OPEN** — does **not** fail W0-G; **does** block shipping the watchdog’s **remote** notify |
| **Cadence pick (OD-SSR-H-2)** | **OPEN / REPORT ONLY** — live **2s** unchanged |
| **`launchctl` / tap restart tonight** | **NO-GO** — plane is **`gth`** |

No reviewer **RETURNED** on an invariant break. No invented Slack/email/Discord/PagerDuty. Cadence env not touched. Friday chain snaps still **129**, mtimes **2026-08-14**.

---

## 1. Spec exists · §0 is the stamp

**PASS.**

| Artifact | Evidence |
|----------|----------|
| Path | `Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md` |
| Size | **689** lines · **38,932** bytes |
| Stamp file | `seeds/W0-0-coach-stamp.md` · **67** lines · **4,132** bytes |

Byte compare of stamp body after “Nothing below is edited.” (leading `---` of the stamp chrome stripped) vs Spec **§0** (from `# Chain Snapshot Collector…` through Open Coach inputs, before `*(End of verbatim Phase 0 packet.)*`):

| Extract | Lines | Chars | sha256 |
|---------|------:|------:|--------|
| Stamp packet minus leading `---` | **57** | **3973** | `02a622a683b490c648167657661c3133320d9a4663d4bc430e3ffb776e4aba61` |
| Spec §0 extract | **57** | **3973** | `02a622a683b490c648167657661c3133320d9a4663d4bc430e3ffb776e4aba61` |

**MATCH.** Juliet added a trailing `---` and the end-of-packet marker after the Open inputs (document chrome). Coach words are unedited.

Coach phrases present in §0 (not paraphrased):

| Phrase | Spec line |
|--------|-----------|
| `dashboard shows 3492 snaps and 14 "holes."` | **L30** |
| `Session map is config, not code.` | **L40** |
| `Alert channel: [Coach to specify].` | **L48** |
| `Alert channel: **UNSPECIFIED**` | **L80** |
| `Cadence pick: **REPORT ONLY**` | **L81** |

Ideas inventory **SSR-H1–H14** is **IN-SCOPE**. Alert channel stays **OPEN**. Cadence stays **REPORT ONLY**.

---

## 2. Reviewer verdicts

**PASS.** None **RETURNED**. None invented a channel. None changed cadence.

| Packet | Agent | Spec/slice | Path | Invented alert? | Cadence changed? |
|--------|-------|------------|------|-----------------|------------------|
| [`W0-2-india.md`](./W0-2-india.md) | India | **APPROVED** | **GO** (review). Implementation / tap restart / flag-on / cadence change / inventing a channel: **NO-GO** | No. OD-SSR-H-1 left OPEN | No. L13 / OD-SSR-H-2. Live 2s |
| [`W0-3-echo.md`](./W0-3-echo.md) | Echo | **APPROVED** | **GO** | No. Channel OPEN; no Slack chrome | No. Cadence number out of scope |
| [`W0-4-foxtrot.md`](./W0-4-foxtrot.md) | Foxtrot | **APPROVED** | **GO**. Live `launchctl` on the tap tonight: **NO-GO** | No. Local fail-loud only; `LABS_SSR_ALERT_CHANNEL` unset | No. Cadence stays 2s |
| [`W0-5-kilo.md`](./W0-5-kilo.md) | Kilo | list complete | **GO**. Writing pytest/code this packet: **NO-GO** | No. AT-SSR-H-B / Y = local fail-loud | No. List forbids changing `LABS_SSR_CHAIN_EVERY_S` |
| [`W0-6-lima-cadence-math.md`](./W0-6-lima-cadence-math.md) | Lima | report complete | **GO** | n/a (math only) | **No.** Env not touched. Recommendation labeled **OPINION**: keep 2s |

India: **no invariant / law / system break.** Nothing to RETURN. Coach Content Law intact.

Echo resolved Coach’s “if useful” to **required when the flag is on** (muted No session). Labeled; Spec not edited. Not an invariant break.

Foxtrot locked heartbeat path, launchd label, KeepAlive, and local-only yell. Explicitly forbade Slack / email / SMS / Discord / PagerDuty / Notification Center.

Kilo filed [`characterization-list.md`](../characterization-list.md) with Coach (a)(b)(c) as **AT-SSR-H-A / B / C**. OPEN items not closed.

Lima measured live `LABS_SSR_CHAIN_EVERY_S=2` on StudioOne pid **21268** and left it there. DL-432 draft is **not filed** (correct until Coach / this gate).

---

## 3. Live collector still serving a phase

**PASS.** Read-only. Nothing restarted.

```text
$ curl -sS -m 4 http://studioone.local:5055/api/status
{
  "now": "2026-08-18T00:29:23.755708-04:00",
  "phase": "gth",
  "day": "2026-08-18",
  "wake": "2026-08-18T00:29:23.755708-04:00",
  "chain_every_s": 2.0,
  "data_root": "/Volumes/FatTail2TB/fattail-market-data",
  "days": [],
  "processes": {},
  "today": {}
}
```

`phase` = **`gth`**. `chain_every_s` = **2.0**. Same tap pid Lima measured:

```text
$ ssh studioone 'ps -ax -o pid,command | grep ssr_'
21268 ... Python -m market_data.ssr_live_capture
21492 ... Python -m market_data.ssr_snapshot_dash
```

Pid **21268** is still the tap. W0 did not kickstart or bootout it.

---

## 4. Friday `2026-08-14` archive not rewritten

**PASS.** Gold path is **not mounted** on this host (`/Volumes/FatTail2TB/...` missing). Confirmed on **StudioOne** via SSH (not blocked).

```text
$ ssh studioone 'ls -ld .../day=2026-08-14/chain; ls -l .../chain | wc; find .../chain -name "snap-*.json" | wc -l'
drwxr-xr-x  131 ernie  staff  4192 Aug 14 19:57 .../day=2026-08-14/chain
     130    1163    8397
     129
```

| Check | Result |
|-------|--------|
| Known snap count | **129** (matches Lima W0-6 / known gold Friday) |
| `ls -l …/chain \| wc` | **130** lines (129 snaps + `total`) |
| Chain dir mtime | **Aug 14 19:57** |
| Snap mtime head | **Aug 14 09:20:09** `snap-132009Z.json` |
| Snap mtime tail | **Aug 14 19:57:28** `snap-235728Z.json` |
| Files in `day=2026-08-14` newer than 2026-08-17 | **0** |
| Files newer than 2026-08-15 | **1** — `CADENCE.json` only, **Aug 16 19:29:40**, 229 bytes (pre-W0 metadata; **not** a chain snap) |
| First/last snap sha256 | `9f21703f966f3f80…1bf576` · `6793e6c2c12a4434…e5616d` (spot-check; not rewritten tonight) |

`chain/` contents are the 129 `snap-*.json` files (5-min era, write-once). W0 did not add, delete, or retouch them.

---

## 5. Collateral

| Adjacent | Result |
|----------|--------|
| Spec still **DRAFT**, not BUILD AUTHORITY | Honest. §1 + header. This gate is spec lock only |
| Flag default **off** | Spec §9.5 / L8. Flag-off = today’s poll-all |
| Tap is still a Redis reader | Unchanged. Arch 28 intact |
| Monday `2026-08-17` | Named hole (DL-428). Not invented |
| Characterization list on disk | Yes. Not a pytest suite (correct) |
| Decision log | Lima correctly **did not** append DL-432 yet |
| Dash `:5055` | Still serving. `days`/`today` empty in `/api/status` is as-built dash JSON shape tonight; **phase is present** (criterion met) |

---

## 6. What this GO is not

- **Not** Coach **BUILD AUTHORITY**.
- **Not** permission to unload, kickstart, or bootout `ai.fattail.labs.ssr-live-capture` while phase is **`gth`**.
- **Not** `LABS_SSR_HARDENING=1`.
- **Not** a cadence env change.
- **Not** an alert-channel pick. Remote notify stays blocked until Coach names the channel.
- **Not** a session-map invention of the fourteen non-GTH names.

Named cutover windows (after Coach GO): **04:00 ET** (`gth` → `pre`) or **09:25–09:30 ET** (GTH → RTH).

---

## Defects

**None.** No FAIL items. No BLOCKED dependency.

OPEN items that **do not** fail this gate (already in the Spec):

| ID | Item | Blocks |
|----|------|--------|
| OD-SSR-H-1 | Alert channel | Watchdog **remote** notify only |
| OD-SSR-H-2 | Cadence pick | Changing `LABS_SSR_CHAIN_EVERY_S` |
| OD-SSR-H-3…H-9 | Tolerance, 18-name table, gold health, etc. | Later packets as already scoped |

---

## Next action (Coach / Juliet)

1. Coach: accept or throw out reviewer opinions (Echo “No session required when flag on”; Lima “keep 2s”; Foxtrot locks). Name **BUILD AUTHORITY** if the DRAFT is law.
2. Coach: still owns **alert channel** and **cadence pick**.
3. Juliet: hold P1–P3 until that stamp. Then flag-off land + **between-phase** cutover only.
4. Lima: file DL-432 (or successor) **after** Coach GO — not before.

---

**PASS** + **GO** — spec lock.

Delta → Coach / Juliet / Lima.
