# Seed W1-1 — Alpha today retrieve

**Project:** Time Machine One Source  
**Agent:** Alpha  
**Depends:** W0-G PASS · **A2 W2-G PASS** (same module; A2 reader settled first)  
**Law:** TMI-85 · SO-AR v0.8 retrieve shape · collection outranks reads  
**Files (declare before touch):** `server/market_data/ssr_archive_read.py` · `server/tests/test_ssr_archive_ladder.py` · `server/tests/test_ssr_archive_read.py` · `server/tests/test_ssr_archive_tm_contract.py` · `server/tests/tm_archive_contract.py` · `server/routes/ssr_archive.py` only if hole status mapping lives there  
**Out:** MiniTwo · StudioOne dash bounce · collector rewrite · cadence change · Labs film module · hashing a **completed** hold · starting before A2 W2-G · editing this file in the same packet as A2 W2

## Ask

Lift **`TODAY_LIVE` as a fetch refusal**. Index/fetch of today return snaps when files exist (200). Empty today → NONE / empty snaps, not 409 TODAY_LIVE. Coverage may still set `live: true`.

**`day_changed` is in-flight only:** while a download is running, `day_hash` mismatch → 409 resume, do not restart. Once the snapshot is complete, nothing checks a hash against the hold again.

Reverse AT-SOAR-8 in the characterization suite. Past dates unchanged.

## Done when

Tests prove today-with-files is retrievable. Kilo W1-2. Delta W1-G.
