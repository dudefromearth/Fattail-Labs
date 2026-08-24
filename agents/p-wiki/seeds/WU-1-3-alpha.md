# WU-1-3 — Alpha context-provider registry

**Plan:** Wiki Spec v0.2.1 III.3 · **GO WU-1**  
**Isolation:** wiki-agent server. No hub restyle.

## In scope

Config `LABS_WIKI_CONTEXT_PROVIDERS` fail-loud (`slug=route`, comma list). First provider: `hub=/app` exact (not a prefix of `/app/wiki`). Enrich session entity when omitted and route matches. Unregistered route → entity None (route-context). GET `/api/wiki-agent/context?route=`. Session open still admin cookie; no auto-draft on accrete.

## Out of scope

Factory emit. Public read. AppChrome.
