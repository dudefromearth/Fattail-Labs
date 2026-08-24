# WA-1-3 — Agent git author (Foxtrot)

**Plan:** GO WA-1 · local first. MiniTwo **not** this packet.

## In scope

`wiki_agent_git.commit_fixture_draft`: `git -c user.name -c user.email commit`. Name/email from `LABS_WIKI_AGENT_GIT_NAME` and `LABS_WIKI_AGENT_GIT_EMAIL` — **fail loud when the helper runs**, not at API boot (do not break MiniTwo boot). Credentials never to a model. Server process commits.

## Out of scope

Remote push (D-12 later). MiniTwo launchd.

## Completion

Tmp checkout: `git log -1` shows configured author and contract ID in the message.
