# FD-W4 — Traffic split

**Project:** Front door. **Gate:** FD-G4.
**Callsign:** Foxtrot, Kilo.

**In scope:** `feature_flag`, `traffic_percent`, `kill_switch` in offers.json, plus the three env overrides. Admission is sha256(visitor) mod 100. 0% admits nobody. 100% admits everybody. Kill switch admits nobody. A partial percent with no visitor key fails closed.

**Out of scope:** pointing live fattail.ai traffic at the new URLs. Prod nginx. A percent above 0 in the committed file.

**Done when:** pytest and the TS unit check agree that `visitor-stable-key` buckets to 80, so 50% does not admit it and 90% does. Committed `traffic_percent` is 0.
