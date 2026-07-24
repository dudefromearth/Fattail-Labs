#!/usr/bin/env python3
"""Submit Foundation lesson prompts to HeyGen Video Agent (no Labs board).

Requires HEYGEN_API_KEY and API credits (not just wallet UI balance).

  cd /Users/ernie/Fattail-Labs
  set -a && source .env && set +a   # or export HEYGEN_API_KEY=...
  python3 docs/studio/experiments/live-send/submit_three.py
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

LOOK = "db7174504dca48c4b778a4fee800c025"  # Dude Primary landscape look
VOICE = "ec638e72634642a081b8d8e578a6c7b7"
DIR = Path(__file__).resolve().parent
OUT = DIR / "submissions.jsonl"

JOBS = [
    ("stop-the-bleeding-mindset", DIR / "01-stop-the-bleeding-mindset.prompt.txt"),
    ("define-risk-before-reward", DIR / "02-define-risk-before-reward.prompt.txt"),
    ("weekly-process-review", DIR / "03-weekly-process-review.prompt.txt"),
]


def main() -> int:
    if not __import__("os").environ.get("HEYGEN_API_KEY", "").strip():
        print("HEYGEN_API_KEY not set", file=sys.stderr)
        return 2

    ok = 0
    for slug, path in JOBS:
        prompt = path.read_text()
        print(f"=== SUBMIT {slug} ({len(prompt)} chars) ===", flush=True)
        r = subprocess.run(
            [
                "heygen",
                "video-agent",
                "create",
                "--prompt",
                prompt,
                "--avatar-id",
                LOOK,
                "--voice-id",
                VOICE,
                "--orientation",
                "landscape",
                "--mode",
                "generate",
            ],
            capture_output=True,
            text=True,
        )
        row = {
            "submitted_at": datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat(),
            "lesson_slug": slug,
            "prompt_file": str(path.relative_to(DIR.parent.parent.parent.parent))
            if False
            else str(path),
            "prompt_chars": len(prompt),
            "exit_code": r.returncode,
            "stdout": (r.stdout or "").strip(),
            "stderr": (r.stderr or "").strip(),
            "delivery_format": "outline_plus_scripts",
            "batch_size": 3,
            "cast": "dude-primary",
        }
        try:
            data = json.loads(r.stdout or r.stderr or "{}")
        except json.JSONDecodeError:
            data = {}
        if r.returncode != 0:
            # error often on stderr as JSON
            try:
                err = json.loads(r.stderr or "{}")
                row["error"] = err
            except json.JSONDecodeError:
                row["error"] = r.stderr
            print(r.stderr or r.stdout, flush=True)
        else:
            d = data.get("data") if isinstance(data.get("data"), dict) else data
            if isinstance(d, dict):
                sid = d.get("session_id") or d.get("id")
                row["session_id"] = sid
                row["video_id"] = d.get("video_id")
                if sid:
                    print(f"https://app.heygen.com/video-agent/{sid}", flush=True)
                    ok += 1
            row["parsed"] = data
            print(r.stdout, flush=True)

        with OUT.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row) + "\n")

    print(f"Done. {ok}/{len(JOBS)} accepted. Log: {OUT}")
    return 0 if ok == len(JOBS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
