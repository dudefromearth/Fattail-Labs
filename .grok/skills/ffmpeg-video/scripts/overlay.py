#!/usr/bin/env python3
"""Overlay one video on another (full-frame or PiP)."""

from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path


def ffmpeg() -> str:
    p = shutil.which("ffmpeg")
    if not p:
        raise SystemExit("ffmpeg not found")
    return p


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", type=Path, required=True)
    ap.add_argument("--overlay", type=Path, required=True)
    ap.add_argument("-o", "--output", type=Path, required=True)
    ap.add_argument(
        "--mode",
        choices=("fullframe", "pip"),
        default="fullframe",
        help="fullframe=scale overlay to base; pip=corner PiP",
    )
    ap.add_argument("--pip-scale", type=float, default=0.35)
    ap.add_argument(
        "--shortest",
        action="store_true",
        help="end when shortest stream ends (default on)",
    )
    args = ap.parse_args()
    for p in (args.base, args.overlay):
        if not p.is_file():
            raise SystemExit(f"missing {p}")
    args.output.parent.mkdir(parents=True, exist_ok=True)

    if args.mode == "fullframe":
        # Overlay covers base; keep base audio
        fc = (
            "[1:v][0:v]scale2ref[ov][base];"
            "[base][ov]overlay=0:0:shortest=1[v]"
        )
    else:
        # PiP bottom-right
        s = args.pip_scale
        fc = (
            f"[1:v]scale=iw*{s}:ih*{s}[ov];"
            "[0:v][ov]overlay=W-w-20:H-h-20:shortest=1[v]"
        )

    cmd = [
        ffmpeg(),
        "-y",
        "-i",
        str(args.base),
        "-i",
        str(args.overlay),
        "-filter_complex",
        fc,
        "-map",
        "[v]",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        str(args.output),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(r.stderr[-2500:] if r.stderr else "overlay failed")
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
