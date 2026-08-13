# P2-7 Rate isolation under concurrent kinds (OPEN)

**Observation 2026-08-13:** three `raw_campaign` processes on one host against Massive:

- SPY trades resume
- SPY quotes
- QQQ…MSFT trades

No campaign abort. 429s are retried (60s sleep) in `raw_campaign.process_day`. Live Market Bus was not measured in this window — VP15 still requires not starving chain/sym feeds; record a bus-health note when those feeds are up during a quotes-dense stretch.
