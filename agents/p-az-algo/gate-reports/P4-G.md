# P4-G — Delta Trader Feed

**Verdict:** **PASS**  
**Date:** 2026-09-03  
**Spec:** AZ-ALGO v2.2.2 sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc`

Host `algo-reason`. §10.1 allowlist only. No TimeOrthoEggPanel. No `algoEval.ts`.

## Command

```
cd web && npx --yes tsx lib/options-lab/algoReasonFeed.test.ts
```

## Output

```
algoP4 feed
  ok  allowlist drops model-computed keys
  ok  AT-ALGO-32 no hold/fold/target/probability in posts or house base
  ok  AT-ALGO-27 house base and templates have no level language
  ok  AI only while Managing; fold keeps last tape
  ok  fail-open: local posts + named AI quiet, never silent empty
  ok  quietPost is named
6 tests passed
```

**Next:** P5 live eval (AT-ALGO-18 only).
