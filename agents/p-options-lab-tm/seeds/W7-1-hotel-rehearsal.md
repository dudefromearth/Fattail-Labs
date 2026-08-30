# Seed W7-1 — Charlie + Hotel rehearsal

**Project:** Options Lab Time Machine  
**Agent:** Charlie implements; Hotel blocks any live-order reading  
**Depends:** W6-G PASS  
**Law:** TMI-67 · TMI-80 · TMI-81 · ATM-A1 · AT-TM-C7 · AT-TM-C10 · Trade Log §4.4 · OT-EF  
**Files (declare before touch):** Analyzer alert/position create path · rehearsal badge mount · Reset disposal copy. **Not** Trade Log write path. **Not** the durable alert store.  
**Out:** persistence · Trade Log `entry_source` fourth value · live notifications · silent vanish · watermark-as-P&L

## Ask

1. Alerts and positions may be **built** under a playhead. They are rehearsal objects: badge (CCW half-recycle), tick on the **replay** clock, never the live clock as if working.
2. They **never** reach the alert store. They **never** reach Trade Log. There is nothing for the log to record.
3. **Reset** disposes every rehearsal object **with an announcement**. Silent vanish is a fail.
4. A rehearsal alert must never read as a live working order. Hotel **RETURNED** if it does.
5. Demo may tick on replay spot and replay `t_ms` (§7). Demo does not flatten. No LLM fire from the transport.
6. **Together on one screen:** watermark up **and** a rehearsal card visible. Confirm they read as one language at two scales (REPLAY word + CCW badge), not two unrelated marks. Live walk required.

## Done when

AT-TM-C10 and C7 hold. Hotel APPROVED. Delta W7-G.
