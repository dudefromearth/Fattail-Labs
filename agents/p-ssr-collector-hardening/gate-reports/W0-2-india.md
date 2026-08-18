# W0-2 — India spec / architecture review

**Project:** SSR Collector Hardening  
**Agent:** India  
**Date:** 2026-08-18  
**Artifact:** [`Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md`](../../../Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md) **v1.0 DRAFT**  
**Coach stamp:** [`seeds/W0-0-coach-stamp.md`](../seeds/W0-0-coach-stamp.md)  
**Seed:** [`seeds/W0-2-india-spec.md`](../seeds/W0-2-india-spec.md)  
**Parents read:** doctrine §11 · India charter · DL-400 · DL-428 · DL-429 · DL-430 · DL-431 · Arch **28** · Market Bus Spec v1.0 (MB5, AT-MB3) · OT-EF v1.1 / DL-309 (adjacent) · as-built `ssr_live_capture.py` · `chain_feed.py` · `market_bus/store.py` · Lima W0-6 (read, not relitigated)

**Coach Content Law (doctrine §11):** nothing of Coach’s was removed. Objections sit beside, labeled India’s. Block only for invariant / law / system breakage. Opinions are labeled opinions.

**This pass did not:** implement · restart StudioOne · invent an alert channel · change cadence · edit the Spec · write the decision log.

---

## Up front

Juliet **did not drop or rewrite** Coach Phase 0. Spec §0 is the stamp packet. Formal laws **project** the packet; they do not replace it. Open Coach inputs stay **OPEN**.

India **did not** change or drop Coach content. This file is the review; the Spec is untouched.

---

## Verdict

| Gate | Verdict |
|------|---------|
| **Spec / architecture (build readiness of this DRAFT)** | **APPROVED** |
| **W0 path (remaining reviewers → W0-G → Coach BUILD AUTHORITY)** | **GO** |
| **Implementation / tap restart / flag-on cutover / cadence change / inventing an alert channel** | **NO-GO** |

**No invariant, law, or system break.** Nothing to RETURN. P1–P3 stay blocked until **W0-G PASS** and **Coach BUILD AUTHORITY**, as the Spec already says.

Alert channel **UNSPECIFIED** and cadence **REPORT ONLY** do **not** block this spec review. They remain Coach’s.

---

## 1. Coach text intact?

**Yes.**

Byte compare of `W0-0-coach-stamp.md` (after “Nothing below is edited.”) vs Spec **§0** (through the Open Coach inputs):

- Coach prose, required changes **1–7**, constraints, tests, deliverables, and priority order match the stamp.
- Open inputs preserved: alert channel **UNSPECIFIED**; cadence pick **REPORT ONLY**.
- Ideas inventory **SSR-H1–H14** lists every required change and constraint. Disposition **IN-SCOPE**. Nothing parked, discarded, or reshaped.

**Document chrome (not a §11.1 removal):** Juliet placed a trailing `---` after the Open inputs, before `*(End of verbatim Phase 0 packet.)*`. That rule is not in the stamp file. Coach words are unedited.

**Changed or dropped from Coach?** Nothing. Juliet **added** as-built, laws, config path, OPEN table, and labeled opinions.

---

## 2. Seed checklist

| Ask | Verdict | Evidence |
|-----|---------|----------|
| Domain model | **PASS** | Session map file + `LABS_SSR_*` config; no new member schema; no parallel Massive writer |
| Product boundary (StudioOne ops, not member Labs) | **PASS** | §1 · §7.1/§7.2 · §16. Host StudioOne. Not MiniTwo. Not member chrome. Not Arch 31 product |
| Archive is the product | **PASS** | L1 · Friday 2026-08-14 write-once · Monday hole not invented · gold `open()` not on live path |
| Zero downtime · flag default **off** | **PASS** | L8 · §9.5 · §19 `LABS_SSR_HARDENING` default off. Flag off = today’s poll-all. Cut over **between** phases only |
| Session map is config | **PASS** | L2 · §9 · SSR-H9. File + `LABS_SSR_SESSION_MAP`. Reload without redeploy. Fail loud if flag on and map missing |
| Hole semantics (no invented instruments / silent false marks) | **PASS** | L5 · L12 · §10. Empty outside session is **not** a hole. No fabricated chain. Named `no_session` / `NO CHAIN` |
| DL-428 / DL-431 / Arch 28 (tap does not call Massive; `chain_feed` is the writer) | **PASS** | §3 · §7.2 · L3. As-built tap is Redis reader (`store.get_json` / `touch_interest`). `chain_feed` is the Massive writer |
| If tap stops interest, `chain_feed` stops fetching that symbol | **PASS — specified** | L3 + AT-SSR-H-A + §19 `LABS_MB_INTEREST_GRACE_S`. See §4 below |
| Do not invent alert channel | **PASS** | L7 · OD-SSR-H-1 · local fail-loud only |
| Do not change cadence | **PASS** | L13 · SSR-H13 · OD-SSR-H-2. Live **2s** stays until Coach picks after Lima |

---

## 3. Parents / as-built alignment

### 3.1 DL-428 (2–5s, all universe symbols, pre + extended)

Spec reports the live band (**[2, 5]**, default **2**) and does not legislate a new seconds value. Friday **2026-08-14** stays labeled 5-min. Monday **2026-08-17** stays a named hole.

**Universe:** every enabled tradeable name remains in the archive **across its mapped sessions**. That is compatible with DL-428 “collect every enabled Admin universe symbol.” Coach’s new packet **supersedes cycle-by-cycle poll-all in GTH**, not universe membership. When this Spec becomes BUILD AUTHORITY, Lima files a successor DL that says so. Do not edit DL-428.

### 3.2 DL-431 (max published window)

Sleep only Friday **8:00 PM → Sunday 8:15 PM**. Weeknights stay up (`gth`). Spec clock tokens match `phase_at`. Cutover windows (**4:00 AM ET**, **9:25–9:30 AM ET**) sit on that clock.

**DL-431 as-built line** “Named hole if a name has no chain (typical for most equities overnight)” is the **behavior this program replaces** for *unscheduled* names. Coach’s packet is the authority. Successor DL on BUILD AUTHORITY; do not erase DL-431.

### 3.3 Arch 28 + Market Bus

| Law | Spec | As-built check |
|-----|------|----------------|
| Sole Massive writers = feeds (or API single-flight miss) | Tap / dash **out** of Massive (§7.2) | `ssr_live_capture.py` has no Massive client. `capture_chain` reads `BusStore`. `chain_feed.tick` is the writer |
| Interest TTL, not ambient tape (MB5) | L3 stop-touch + grace | `store.touch_interest` sets `mb:interest:{topic}` with `ex=LABS_MB_INTEREST_GRACE_S` (default **45**) |
| Feed idles without interest | Spec parents cite this | `chain_feed.py` `if not topics: print("no interest keys; idle"); return` |

**India opinion (not a block):** Spec §3 “Writers of Massive = `chain_feed` + `sym_feed` only” is true **on the StudioOne gold plane**. Arch 28 still allows API single-flight miss on the member Labs host. This Spec does **not** repeal MiniTwo miss-fill.

### 3.4 OT-EF / DL-309 (adjacent, archive)

L12 + §10: empty GTH is `no_session` or `NOT TRADED`, never a fabricated chain, never a silent debit/credit. Hole-shaped snaps are **not** written for unscheduled names (so the dash cannot count them red). That is the right adjacency. This is **not** a member position surface; Tango/Hotel correctly unseated.

### 3.5 DL-429 (dash bind)

Spec honestly reports as-built: dash may bind LAN `0.0.0.0` or localhost (`ssr_snapshot_dash.py` `DEFAULT_HOST = "0.0.0.0"`). DL-429 said localhost only. **Existing as-built drift**, not this Spec inventing a member route.

**India opinion (not a block):** do not relitigate bind in this program. Lima may note it when the BUILD AUTHORITY DL lands. Still **not** MiniTwo, still **not** member chrome.

---

## 4. Interest stop → `chain_feed` idle (the seed’s explicit question)

**Specified. Not a silent Massive leak in this Spec.**

**Poll** (L3) is **both**:

1. Write a chain snap for that symbol, **and**
2. `touch_interest` on that symbol’s ladder topic(s).

Stopping the disk write but leaving interest warm **fails** Coach’s “not polled.” On phase transition (and on a mid-phase map edit that removes a name): **stop touching**; let `LABS_MB_INTEREST_GRACE_S` expire. Touch **only** scheduled names.

**As-built mechanism this law rides (do not invent a second unsubscribe):**

```text
tap stops touch_interest(unscheduled)
  → mb:interest:{topic} TTL expires (default 45s)
  → chain_feed.list_interest_topics no longer returns that topic
  → chain_feed does not _fetch_ladder_uncached for it
  → if zero interest keys remain, chain_feed idles
```

AT-SSR-H-A requires: no-session GTH symbol is **not polled** (**no interest touch, no snap**) and is **not** a hole.

**India opinion (not a block):** other lawful demand on the same StudioOne Redis (member WS, API miss-fill, a second tap) would keep those topics warm. That is **MB5**, not a hole in this Spec. The tap must not be the warmer. Implementers do not add a `chain_feed` special case or a Massive call from the tap.

**As-built note:** `chain_feed --symbol` help text still says “Default warm product if no interest keys.” The **code** idles when `list_interest_topics` is empty (`args.symbol` unused). This Spec must not be implemented as if `--symbol SPX` re-warms the night.

---

## 5. Session map, holes, flag

| Law | Status |
|-----|--------|
| Config file, not code; editable without redeploy | **Sound.** Default `data/ssr/session-map.json` + `LABS_SSR_SESSION_MAP`. Reload on phase transition and ≥ once/minute |
| Coach phase names mapped to `phase_at` | **Sound.** `premarket`/`pre` → `pre`; `postmarket`/`post`/`extended` → `extended`. `closed`/`weekend` never scheduled |
| Initial GTH set = Coach observation (SPX, XSP, IWM, USO) | **Sound.** Other tradeable names inherit `default_phases` (no GTH). Full 18-name table **OPEN** (OD-SSR-H-4) — do not invent |
| Flag **off** (default) | **Sound.** Map ignored for scheduling. Today’s poll-all, including GTH empties-as-holes |
| Flag **on** + missing map | **Fail loud.** Does not silently poll-all or poll-none |
| Hole = expected missing **or** interval exceeded | **Sound.** Empty outside session is not a hole. Tolerance seconds **OPEN** (do not invent). Synthetic **30s** must still flag |
| Dashboard holes = true holes only | **Sound.** Optional muted no-session on the **existing** `:5055` dash. No second dashboard |

**India opinion (not a block):** one master flag (`LABS_SSR_HARDENING`) is enough for P1–P3. Do not add granular flags “because India might want them” (§9.5). If they appear later, they default **off**.

**India opinion (not a block):** an explicit `"SYM": []` in `symbols` should mean **never scheduled** (listed, empty). Omitted names inherit `default_phases`. Implementers should not treat `[]` as “use default.”

**India opinion (not a block):** Foxtrot’s cutover checklist should require the map file **exists and parses** before the flag flips on. Fail-loud with the flag on and no file would stop the tap — that would break L1 if someone enables hardening mid-window without the file. Process, not a Spec hole: cut over is already between phases only.

---

## 6. Product boundary

**In:** StudioOne collector, SSD cache, gold archive (when healthy), existing Chain Snapshot dash `:5055`, launchd, independent watchdog process, session-map config, characterization tests, Lima cadence report, DLs.

**Out (correct):** member Labs UI · Options Lab / Strategy Lab chrome · MiniTwo · StudioTwo as a second writer · Massive from tap or dash · inventing Slack/email/Discord · changing live cadence in this file · mid-`gth` restart · rewriting Friday · inventing strikes · a second dashboard · Arch 31 Surface Replay **product** (H7 stub is collector-side proof only).

No MSC import path. No member entitlement change. No new public host.

---

## 7. Opinions (not constraints)

1. Prefer the **4:00 AM ET** cutover if W0-G + Coach GO land in time (Juliet’s labeled opinion). India agrees it is an opinion. If they do not land, **hold the flag**.
2. Lima W0-6 (read this pass) measured GTH **generations** tonight on **IWM, QQQ, SPY, UNG, USO, XSP** (SPX mixed full / `NO CHAIN`). That is **evidence for OD-SSR-H-4**, not a rewrite of Coach’s four. Do not add QQQ/SPY/UNG to the Spec’s initial map as if Coach listed them. Do not drop Coach’s four. Present measured extras to Coach when the 18-name table is filled.
3. Heartbeat as one collector document (with `scheduled[]`) is a lawful reading of “collector emits a heartbeat every cycle” plus “any scheduled symbol.” A per-symbol dead-man is a different design. Coach did not ask for it.
4. sha256 for H6 is the obvious checksum. Stay **OPEN** (OD-SSR-H-9) until implementation.
5. Weeknight vs Friday “last phase closes each day” (OD-SSR-H-8) does not block H1–H3.

---

## 8. OPEN items (do not invent a close)

| ID | Item | Blocks |
|----|------|--------|
| **OD-SSR-H-1** | **Alert channel** (Coach) | Off-box alert **delivery**. **Not** this spec review. **Not** local fail-loud watchdog |
| **OD-SSR-H-2** | **Cadence pick** (Coach after Lima W0-6) | Changing `LABS_SSR_CHAIN_EVERY_S`. **Not** H1–H3 design |
| OD-SSR-H-3 | Default hole-tolerance seconds | Numeric default only. 30s synthetic still flags |
| OD-SSR-H-4 | Full 18-name session table | Shipping a guessed GTH set beyond SPX / XSP / IWM / USO |
| OD-SSR-H-5 | Gold volume healthy → `LABS_SSR_GOLD_COPY` / H6 onto FatTail2TB | H6 **delete raw** |
| OD-SSR-H-6 | Stale-quote seconds; “deep ITM” | H5 numeric defaults |
| OD-SSR-H-7 | Exact “same surface code path used live” | Full H7 only. Stub does not need it |
| OD-SSR-H-8 | Weeknight vs Friday audit trigger | H4 schedule |
| OD-SSR-H-9 | Checksum algorithm | H6 implementation |

Juliet did **not** fill H-1 or H-2. India does **not** fill them.

---

## 9. Blocking criteria (none fired)

| May block | Fired? |
|-----------|--------|
| Doctrine / agent invariant | **No.** §11 intact. Specs versioning: this is a **new** v1.0 DRAFT, not an edit of an approved Spec |
| Law | **No** |
| System (as-built integrity, security, data isolation, fail-loud) | **No.** Flag default off. Tap stays a reader. Archive write-once preserved. Fail-loud on missing map when flag on |

No disagreement was promoted into a constraint via risk language.

---

## § Bench delta

The next invocation can:

1. Treat this DRAFT as **India-APPROVED** architecture: session map = config, hole ≠ GTH empty, tap does not call Massive, interest-stop is the Massive-saving mechanism.
2. Review remaining W0 packets (Echo / Foxtrot / Kilo / Lima / Delta) against named OPEN items instead of inventing Slack or a new cadence.
3. Implement (only after W0-G + Coach) against L3’s **two-part poll** (snap **and** `touch_interest`) and AT-SSR-H-A.
4. File a successor DL on BUILD AUTHORITY that session-map scheduling supersedes DL-428/431 “poll all / named hole overnight” **without editing those entries**.
5. Fill OD-SSR-H-4 from Admin universe + measured evidence (including Lima’s extra overnight generations) **beside** Coach’s four, for Coach to accept or throw out.

---

## § Flagged ideas

**Inventory intact.** Nothing of Coach’s was parked or erased.

| Idea | Status | Note |
|------|--------|------|
| Coach H1–H7 + constraints H8–H14 | **IN-SCOPE** (Spec §2) | Not flags |
| Alert channel | **OPEN** (OD-SSR-H-1) | Coach. Local fail-loud is the interim |
| Cadence pick | **OPEN** (OD-SSR-H-2) | Coach after Lima math. Live **2s** stays |
| Measured extra GTH names (QQQ, SPY, UNG) | **FLAGGED for OD-SSR-H-4** | Evidence, not Spec law. Do not silently enlarge Coach’s four |
| DL-429 localhost vs LAN bind | **Existing as-built** | Out of this program unless Coach reopens |
| Granular hardening flags | **Not wanted by India for P1–P3** | Opinion. Master flag only |
| Per-symbol dead-man | **Not requested** | Collector heartbeat + `scheduled[]` is enough |

`Architecture/flagged-ideas.md` not appended: no new product idea was deferred off this packet. OPEN items already live in the Spec.

---

## 10. What this GO is not

- **Not** Coach **BUILD AUTHORITY**.
- **Not** permission to unload or kickstart `ai.fattail.labs.ssr-live-capture` tonight (`gth` already).
- **Not** a cadence change.
- **Not** an alert-channel pick.
- **Not** a session-map invention of the fourteen names.

---

## Final stamps

**APPROVED** — Spec v1.0 DRAFT is architecturally sound and build-ready **as a spec**.

**GO** — remaining W0 reviewers and W0-G may proceed.

**NO-GO** — code, tap/dash restart, mid-phase cutover, cadence env change, inventing Slack/email/PagerDuty/Discord.

India → Juliet / Delta. Flags surface to Coach via Juliet (OD-SSR-H-1, OD-SSR-H-2, measured extras on OD-SSR-H-4).
