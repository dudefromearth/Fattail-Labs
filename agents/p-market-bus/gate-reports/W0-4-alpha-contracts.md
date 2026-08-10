# W0-4 Alpha — feed/API contracts · single-flight
**Result:** PASS  

- Ladder GET: prefer Redis generation; miss → single-flight fill → write Redis.
- Feed: Massive → normalize → SET + PUBLISH.
- Single-flight key = generation key; concurrent readers await one Future.
- Instrument Massive call counter for AT-MB1.
