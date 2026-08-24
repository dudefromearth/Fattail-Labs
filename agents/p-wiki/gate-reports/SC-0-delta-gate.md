# SC-0-G Delta Gate — Source Contract diffs (2026-08-24)

**Gate:** plan v1.0 SC-0-G  
**Spec:** Source Contract v0.1.4 **APPROVED** · **DL-560** · **B-3** **DL-561**  
**Stamp:** **GO SC-0** · **DL-562** · OD-3 correction **DL-564**  
**Verdict: PASS**

Delta did not modify the work under review.

Docs-only. No product code. No emitters. No Factory POST of a Wiki envelope.
No AppChrome. No `web/lib/runner/**`. Remaining ODs **4, 6, 7, 8, 9, 10, 12,
13, 14** stay holds — not resolved by default.

## Allowlist (this packet)

| Path | Role |
|------|------|
| `Specs/FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md` | S7 RULED · OD-3 skill-delivered (no stub) · `acquired_by` + `skill` · L12 · hash footer |
| `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` | II.1 / IV.2 / IV.5.3 Help Package → Source Contract poll |
| `docs/Wiki-Spec-v0_2_1-Full-Agent-Bench-Plan-v1.0.md` | WU-3 / B4 closed |
| `docs/Wiki-Source-Contract-v0_1_4-Full-Agent-Bench-Plan-v1.0.md` | holds table + GO SC-0 ticked |
| `agents/p-wiki/ORCHESTRATOR.md` | board |
| `Architecture/11-wiki-design.md` | WU-3 / Source Contract as-built |
| `Architecture/README.md` | Arch 11 blurb |
| `Architecture/00-decision-log.md` | **DL-562** · **DL-564** |
| `Specs/FatTail Labs — IKI Factory Spec v0.1.5` | OD-F10 / §6 / §9 signal-only |
| `docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md` | IF-4 smaller; B4 closed |
| `agents/bench/gemba.md` | invariants 4, 8, 9 + workflow 5 |

**Not touched:** `web/lib/runner/**` · `web/components/AppChrome.tsx` ·
`web/app/layout.tsx` · server product code · emitters. Skill **wiring** is a
later GO — the contract names the mode; SC-0 does not implement the skill.

## Evidence

### S7 RULED — delivery point, not a submission surface

Contract §5.2 (no “flags for Coach confirmation”; no review/hold store):

```
The admin push bot accepts **finished, publishable material only.** There is
no draft state, no queue, and no unfinished-work store on either side. Coach
prepares content to completion outside the system and hands it off. The bot
is a delivery point, not a submission surface. The agent does not review or
hold human-submitted work. Development progress notes are **not eligible**.
```

L12 push vs poll (§2.4):

```
On the **push** path the L12 decline case largely disappears: material is
finished before it arrives (§5.2). The same is true of **skill-delivered**
envelopes, which arrive fully formed (§3.6). L12 still governs the
**automated poll** channels in full — a thin Factory template still produces
no page.
```

### OD-3 RULED — skill-delivered; earlier stub framing was wrong

**Corrects the first SC-0 write.** No stub. Coach has a working skill. It
emits a complete envelope. `acquired_by` fourth value: `skill`. **DL-564.**

Contract §3.6:

```
Coach has a working transcript-decomposition skill. It is modified to emit a
**complete Source Contract envelope** directly: summary or extraction in
`body`, plus `title`, `origin_ref`, `content_hash`, and the rest of the
required set. Coach supplies the instruction ("summarize this and fill the
fields"); the skill does the rest. The envelope arrives fully formed.
`acquired_by` = `skill`.
```

OD-8 note (OD-8 stays HOLD): several pages from one transcript under
different instructions are honest; do not collapse.

### Diff 1 — Wiki-side (Lima)

Wiki Spec IV.5.3 replacement:

```
3. **Registration / S3 live** (WU-3 / SC-3b): Source Contract poll + Wiki-side
   envelope. Factory IF-4 is the **publication signal at Deploy** (smaller — no
   envelope, no hook). Not blocked on a Help Package spec (**SUPERSEDED · DL-560**).
   L12: a thin template produces no page.
```

Wiki plan B4 **Closed**. WU-3 no longer waits on a named Help Package spec.

### Diff 2 — Factory Spec OD-F10 / §6 / §9

§6 step 4:

```
4. **Exposes a publication signal** (the Deploy / Live transition). No envelope,
   no delivery hook, no wiki page bytes. The Factory does not know the Wiki
   agent exists.
```

OD-F10:

```
**SUPERSEDED (Source Contract v0.1.4 · DL-560 · SC-0 · DL-562).** Original
Accept: complete Help Package + push `kind=registration`. **Replacement:**
Deploy exposes a **publication signal only**.
```

Factory plan IF-4 packet: **No hook. Signal only.** B4 closed. `POST
kind=registration` / `contracts:deliver` from Factory **gone**.

### Diff 3 — Gemba invariant 9

```
9. **Publication signal at Deploy, not a Wiki envelope** — Deploy exposes the
Factory’s publication signal (Live). Gemba never builds a Wiki envelope, never
POSTs a registration contract, and never writes wiki pages. Wiki polls the
signal, hashes, and composes or L12-declines. A thin template is Wiki’s
decline, not a missing Help Package on this floor.
```

Invariant 4/8: Help Package completeness is not a Factory belt-stop. Product
spec remains.

### Hash footer

`Wiki-Source-Contract-Spec-v0.1.4` sha1 of body through §10:
`3f83b4c751a14003d211780bf2a4f6ac77d1a202` (verified match · **DL-564**).

### Holds still open (not defaulted)

OD-4, 6, 7, 8, 9, 10, 12, 13, 14.

### git status (SC-0 files)

Tracked (diff vs HEAD includes prior wiki seating in the same working tree):

```
 M Architecture/00-decision-log.md
 M Architecture/11-wiki-design.md
 M Architecture/README.md
 M agents/p-wiki/ORCHESTRATOR.md
```

Untracked (program files not yet on `main`; this packet is their SC-0 body):

```
?? Specs/FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md
?? Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md
?? Specs/FatTail Labs — IKI Factory Spec v0.1.5
?? docs/Wiki-Source-Contract-v0_1_4-Full-Agent-Bench-Plan-v1.0.md
?? docs/Wiki-Spec-v0_2_1-Full-Agent-Bench-Plan-v1.0.md
?? docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md
?? agents/bench/gemba.md
?? agents/p-wiki/gate-reports/SC-0-delta-gate.md
```

No runner / AppChrome / server product files in this packet.

## Coach Content Law

Factory Spec v0.1.5 and Gemba sentences that named Help Package completeness
as a Deploy belt-stop were Coach’s original OD-F10 Accept. This packet
**replaces those claims** (disclosed in **DL-562**). Original Accept kept as
labeled history in the Factory changelog and OD-F10 row. Product-spec Deploy
inputs, conveyor, Hold, WooCommerce, and “Gemba never writes wiki pages”
unchanged.

## Residual

- **GO SC-1** not granted — no envelope/watermark code.
- Factory publication signal **does not exist yet** — SC-3b waits.
- Skill **wiring** (modify Coach's working skill to emit the envelope) is a later GO. SC-0 names the mode only.
