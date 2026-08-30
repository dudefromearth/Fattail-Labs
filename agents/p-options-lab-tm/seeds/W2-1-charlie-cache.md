# Seed W2-1 — Charlie browser cache + playhead

**Project:** Options Lab Time Machine  
**Agent:** Charlie (India review if the cache seat is ambiguous)  
**Depends:** W1-G PASS  
**Law:** TMI-4 · **TMI-79 v0.7.4** · TMI-42 · TMI-18 · TMI-19 · TMI-73 · TMI-76 · TMI-65 · plan FP2 / FP11 / FP12  
**Files (declare before touch):** browser-side module under `web/lib/options-lab/`. Reuse `replayCursor`. Do **not** add `server/` film. Do **not** write Time Machine days into Heatmap Redis.  
**Out:** host chrome · Record · `server/` film · MiniTwo · second WebSocket · client Massive · pausing capture · discarding today because a past date was selected · `heldDay: Date | null`

## Ask

Two slots, one playhead. Spec v0.7.4 TMI-79 is law.

1. **Today slot:** keyed by OPF trading date. Capture **always on** from the live socket. Discarded only on TMI-73. Named **NO DATE** if OPF date is missing.
2. **Archive slot:** typed and empty this wave. W5 fills it. At most one past day.
3. These are **two variables / two blobs**. A single `heldDay: Date | null` **fails this packet**.
4. One playhead `t_ms` per tab. Hosts bind; they do not fork. The projector points at today or at the archive slot; it does not pause the today writer.
5. Scrubbing today windows the today slot. That does not occupy the archive slot.
6. No member identity. No Record control.

## Done when

Today slot captures continuously. Archive slot exists and is empty. Occupancy is two slots. `git diff` has **no** `server/` film and **no** Redis TM write. Delta W2-G.
