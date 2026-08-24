# SC-3-1 — Poll adapters (Alpha)

`poll_courses_source` / `poll_help_source` in `wiki_agent_poller.py`.
Hash-walk published catalogs. Pointer upsert is signal-only. L10: matching
watermark hash → no compose. Envelope `acquired_by=poll`. L9: no writes into
Courses/Help.
