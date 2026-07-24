#!/usr/bin/env python3
"""Submit Course Hub Intro clips to HeyGen Video Agent.

Cast: Dude Primary — same look + voice on every job.
Default: 13 separate clips (opens, body x3, closes) per course-hub-intro-v0.5.

  python3 docs/studio/experiments/hub-intro/submit_hub_clips.py --only a1_anonymous
  python3 docs/studio/experiments/hub-intro/submit_hub_clips.py --skip a1_anonymous
  python3 docs/studio/experiments/hub-intro/submit_hub_clips.py
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

LOOK = "db7174504dca48c4b778a4fee800c025"
VOICE = "ec638e72634642a081b8d8e578a6c7b7"
DIR = Path(__file__).resolve().parent
PROMPTS = DIR / "prompts"
OUT = DIR / "submissions.jsonl"

# job_key -> prompt file
JOBS: list[tuple[str, str]] = [
    ("a1_anonymous", "01-a1_anonymous.txt"),
    ("a2_campaign", "02-a2_campaign.txt"),
    ("a3_observer", "03-a3_observer.txt"),
    ("a4_activator", "04-a4_activator.txt"),
    ("a5_navigator", "05-a5_navigator.txt"),
    ("b1_courses_resources", "06-b1_courses_resources.txt"),
    ("b2_live_guide", "07-b2_live_guide.txt"),
    ("b3_lab", "08-b3_lab.txt"),
    ("c1_anonymous", "09-c1_anonymous.txt"),
    ("c2_campaign", "10-c2_campaign.txt"),
    ("c3_observer", "11-c3_observer.txt"),
    ("c4_activator", "12-c4_activator.txt"),
    ("c5_navigator", "13-c5_navigator.txt"),
]


def submit(slug: str, path: Path) -> dict:
    prompt = path.read_text()
    print(f"=== {slug} ({len(prompt)} chars) ===", flush=True)
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
    row: dict = {
        "submitted_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "job_key": slug,
        "prompt_file": str(path.name),
        "prompt_chars": len(prompt),
        "exit_code": r.returncode,
        "stdout": (r.stdout or "").strip(),
        "stderr": (r.stderr or "").strip(),
        "cast": "dude-primary",
        "project": "course-hub-intro-v0.5",
    }
    if r.returncode != 0:
        print(r.stderr or r.stdout, flush=True)
        try:
            row["error"] = json.loads(r.stderr or "{}")
        except json.JSONDecodeError:
            row["error"] = r.stderr
    else:
        print(r.stdout, flush=True)
        try:
            data = json.loads(r.stdout or "{}")
            d = data.get("data") if isinstance(data.get("data"), dict) else data
            if isinstance(d, dict):
                sid = d.get("session_id") or d.get("id")
                row["session_id"] = sid
                row["video_id"] = d.get("video_id")
                row["status"] = d.get("status")
                if sid:
                    print(f"https://app.heygen.com/video-agent/{sid}", flush=True)
            row["parsed"] = data
        except json.JSONDecodeError as e:
            row["parse_error"] = str(e)
    with OUT.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
    return row


def main() -> int:
    if not os.environ.get("HEYGEN_API_KEY", "").strip():
        print("HEYGEN_API_KEY not set", file=sys.stderr)
        return 2

    ap = argparse.ArgumentParser()
    ap.add_argument("--only", action="append", default=[], help="job_key to run")
    ap.add_argument("--skip", action="append", default=[], help="job_key to skip")
    ap.add_argument(
        "--pause",
        type=float,
        default=1.0,
        help="seconds between submits (default 1)",
    )
    args = ap.parse_args()

    jobs = JOBS
    if args.only:
        want = set(args.only)
        jobs = [(k, f) for k, f in JOBS if k in want]
    if args.skip:
        sk = set(args.skip)
        jobs = [(k, f) for k, f in jobs if k not in sk]

    ok = 0
    for slug, fname in jobs:
        path = PROMPTS / fname
        if not path.is_file():
            print(f"missing {path}", file=sys.stderr)
            continue
        row = submit(slug, path)
        if row.get("session_id"):
            ok += 1
        elif row.get("exit_code") == 0:
            ok += 1
        time.sleep(max(0.0, args.pause))

    print(f"Done. {ok}/{len(jobs)} accepted. Log: {OUT}")
    return 0 if ok == len(jobs) else 1


if __name__ == "__main__":
    raise SystemExit(main())
