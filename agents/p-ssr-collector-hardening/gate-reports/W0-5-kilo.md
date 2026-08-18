# W0-5 Kilo — Characterization list

**Project:** SSR Collector Hardening  
**Agent:** Kilo  
**Date:** 2026-08-18  
**Spec:** `Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md` (DRAFT) §17  
**Seed:** `agents/p-ssr-collector-hardening/seeds/W0-5-kilo.md`  
**Artifact:** `agents/p-ssr-collector-hardening/characterization-list.md`

**Did not:** implement pytest · restart StudioOne tap/dash · invent an alert channel · change cadence · touch `server/` or `web/`.

---

## Verdict

**GO** — the list is complete enough to implement against.

Companion: **GO** for W0-G on the Kilo slice (list exists, Coach (a)(b)(c) + required edges present).  
**NO-GO** for writing tests or collector code in this packet (seed: *Do not implement*).

---

## Completeness vs seed and spec

| Required | Present | ID |
|----------|---------|-----|
| Symbol with no session in GTH is not polled and not counted as a hole | **yes** | **AT-SSR-H-A** |
| Heartbeat silence triggers alert | **yes** | **AT-SSR-H-B** |
| Audit correctly flags a synthetic 30s gap | **yes** | **AT-SSR-H-C** |
| Phase-transition single `"no session"` log line | **yes** | **AT-SSR-H-D** |
| `LABS_SSR_HARDENING=0` / unset = poll-all (current) | **yes** | **AT-SSR-H-E** (+ **I**) |
| Friday **2026-08-14** not rewritten | **yes** | **AT-SSR-H-F** (+ **AB**) |
| Flag-on missing session map fail-loud | **yes** | **AT-SSR-H-G** (+ **H**, **L**) |

Spec §17.1–17.2 IDs **A–F** are used unchanged. **G** is the §9.1 fail-loud Coach extra named in this packet.

Companion rows **H–AG** lock poll=interest+snap, hole vs `no_session`, dash honesty, map reload, watchdog clock (`at` not mtime), lawful sleep, no invented channel, 30s-at-every-in-band-cadence, Friday-not-re-audited, and H5–H7 stubs. Those are what make the list **implementable**, not a three-line wish.

---

## Evidence (list, not a suite)

| Check | Result |
|-------|--------|
| File on disk | `agents/p-ssr-collector-hardening/characterization-list.md` |
| Coach (a)(b)(c) as first-class headings | AT-SSR-H-A / B / C with Given / When / Then |
| Seed edges | D, E, F |
| Flag-on missing map | G |
| Determinism law | §0.1 — no 60s sleep, no Redis/Massive, no StudioOne |
| Poll defined as snap **and** interest | §0 + **M** (A fails if interest stays warm) |
| OPEN items not closed | alert channel, cadence pick, tolerance default, 18-name table |
| Pytest / collector code this packet | **none** |

---

## Risks named, not blocked

1. **Alert channel OPEN (OD-SSR-H-1).** B and Y require **local** fail-loud only. Inventing Slack would be a NO-GO later, not a hole in this list.
2. **Hole-tolerance default OPEN (OD-SSR-H-3).** C/AA still require a synthetic **30s** flag at every cadence in [2, 5] without freezing a default.
3. **Spec is DRAFT.** This list tracks the DRAFT. If India returns §9–11, Kilo revises IDs in place — do not implement from a returned spec.
4. **B before cutover.** Spec priority is H1–H3 before open. Cutover with A green and B missing would leave the archive without a dead-man. List says B ships with P2 **before** flag-on.

---

## Bench delta

Next invocation can write P1/P2/P4 pytest from named IDs, fixtures, and forbidden cases without inventing hole or poll semantics.

---

**GO / NO-GO:** **GO**
