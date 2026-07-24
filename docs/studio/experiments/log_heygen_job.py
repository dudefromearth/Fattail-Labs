#!/usr/bin/env python3
"""Append one HeyGen batch-experiment log line (JSONL).

Usage:
  python3 docs/studio/experiments/log_heygen_job.py \\
    --wave A --batch-size 3 --lesson-slug stop-the-bleeding-mindset \\
    --status completed --session-id SESSION --wall-seconds 1200 \\
    --quality-score 4 --prompt-version v1-fixed

Does not call HeyGen. Local measurement only.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

LOG = Path(__file__).resolve().parent / "heygen-batch-log.jsonl"


def main() -> None:
    p = argparse.ArgumentParser(description="Log one HeyGen experiment job")
    p.add_argument("--wave", required=True, choices=list("ABCD"))
    p.add_argument("--batch-size", type=int, required=True)
    p.add_argument("--lesson-slug", required=True)
    p.add_argument(
        "--status",
        required=True,
        choices=[
            "completed",
            "failed",
            "stuck_thinking",
            "cancelled",
            "submitted",
        ],
    )
    p.add_argument("--session-id", default="")
    p.add_argument("--video-id", default="")
    p.add_argument("--wall-seconds", type=int, default=None)
    p.add_argument("--quality-score", type=int, default=None)
    p.add_argument("--quality-notes", default="")
    p.add_argument("--prompt-version", default="v1-fixed")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--stuck-thinking-15m", action="store_true")
    p.add_argument("--error", default="")
    p.add_argument("--item-id", type=int, default=None)
    p.add_argument(
        "--delivery-format",
        default=None,
        choices=["outline_only", "outline_plus_scripts", "inline_scripts"],
        help="Payload shape experiment (α/β/γ)",
    )
    p.add_argument("--verbatim-score", type=int, default=None)
    p.add_argument("--structure-score", type=int, default=None)
    p.add_argument("--doctrine-score", type=int, default=None)
    p.add_argument("--prompt-chars", type=int, default=None)
    args = p.parse_args()

    for label, val in (
        ("quality-score", args.quality_score),
        ("verbatim-score", args.verbatim_score),
        ("structure-score", args.structure_score),
        ("doctrine-score", args.doctrine_score),
    ):
        if val is not None and not (1 <= val <= 5):
            raise SystemExit(f"{label} must be 1–5")

    row = {
        "logged_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "wave": args.wave,
        "batch_size": args.batch_size,
        "lesson_slug": args.lesson_slug,
        "status": args.status,
        "session_id": args.session_id or None,
        "video_id": args.video_id or None,
        "wall_seconds": args.wall_seconds,
        "quality_score": args.quality_score,
        "quality_notes": args.quality_notes or None,
        "prompt_version": args.prompt_version,
        "dry_run": bool(args.dry_run),
        "stuck_thinking_15m": bool(args.stuck_thinking_15m),
        "error": args.error or None,
        "item_id": args.item_id,
        "delivery_format": args.delivery_format,
        "verbatim_score": args.verbatim_score,
        "structure_score": args.structure_score,
        "doctrine_score": args.doctrine_score,
        "prompt_chars": args.prompt_chars,
    }
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"appended → {LOG}")
    print(json.dumps(row, indent=2))


if __name__ == "__main__":
    main()
