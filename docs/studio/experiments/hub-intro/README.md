# Course Hub Intro — HeyGen clip jobs

**Source:** course-hub-intro-v0.5  
**Cast:** Dude Primary (same avatar/voice/landscape on every clip)  
**Path:** 13 separate clips (opens 1–5, body 6–8 separate, closes 9–13) so Lab (job 8) can be re-recorded alone.

## Assembly (5 finished hub videos)

| Variant | Open | Body | Close |
|---|---|---|---|
| Anonymous | 1 | 6+7+8 | 9 |
| Campaign | 2 | 6+7+8 | 10 |
| Observer | 3 | 6+7+8 | 11 |
| Activator | 4 | 6+7+8 | 12 |
| Navigator | 5 | 6+7+8 | 13 |

## Submit

```bash
# Job 1 test only
python3 docs/studio/experiments/hub-intro/submit_hub_clips.py --only a1_anonymous

# All remaining after test OK
python3 docs/studio/experiments/hub-intro/submit_hub_clips.py --skip a1_anonymous
```

Log: `submissions.jsonl`
