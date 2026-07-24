# Live send — Foundation module (no board framework)

Three lesson prompts for Dude Primary cast. Submitted via `heygen video-agent create`.

| # | File | Lesson |
|---|---|---|
| 1 | `01-stop-the-bleeding-mindset.prompt.txt` | Stop the bleeding mindset |
| 2 | `02-define-risk-before-reward.prompt.txt` | Define risk before reward |
| 3 | `03-weekly-process-review.prompt.txt` | Weekly process review |

Cast: `docs/studio/cast/AVATAR-DUDE-PRIMARY.md`  
Sessions / results: `submissions.jsonl`

## Submit (when API credits available)

```bash
cd /Users/ernie/Fattail-Labs
set -a && source .env && set +a   # needs HEYGEN_API_KEY
python3 docs/studio/experiments/live-send/submit_three.py
```

Poll a session:

```bash
heygen video-agent get <session_id>
```

**2026-07-23 attempt:** all three submits returned `insufficient_credit`
(API wallet needs ≥0.5 credits per video). Scripts are ready; re-run after
topping up https://app.heygen.com/settings?nav=API
