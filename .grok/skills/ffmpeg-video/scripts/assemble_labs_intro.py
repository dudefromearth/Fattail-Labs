#!/usr/bin/env python3
"""Assemble FatTail Labs hub intro role videos from Labs-Intro/.

open + shared body (3) + close → Labs-Intro/assembled/{role}.mp4
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]  # repo root from .grok/skills/ffmpeg-video/scripts
# parents: scripts, ffmpeg-video, skills, .grok, repo — that's 4
# Wait: script at repo/.grok/skills/ffmpeg-video/scripts/assemble...
# parents[0]=scripts, [1]=ffmpeg-video, [2]=skills, [3]=.grok, [4]=repo ✓

ROLES = ("anonymous", "campaign", "observer", "activator", "navigator")
SHARED = [
    "01-body-b1_courses_resources.mp4",
    "02-body-b2_live_guide.mp4",
    "03-body-b3_lab.mp4",
]


def find_open_close(role_dir: Path) -> tuple[Path, Path]:
    opens = sorted(role_dir.glob("01-open-*.mp4"))
    closes = sorted(role_dir.glob("02-close-*.mp4"))
    if not opens or not closes:
        raise SystemExit(f"missing open/close in {role_dir}")
    return opens[0], closes[0]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--labs-intro",
        type=Path,
        default=None,
        help="path to Labs-Intro (default: <repo>/Labs-Intro)",
    )
    ap.add_argument("--out-dir", type=Path, default=None)
    ap.add_argument("--role", action="append", dest="roles", default=None)
    ap.add_argument("--reencode", action="store_true")
    args = ap.parse_args()

    # Resolve repo root robustly
    here = Path(__file__).resolve()
    repo = here.parents[4]
    if not (repo / "Labs-Intro").is_dir() and (Path.cwd() / "Labs-Intro").is_dir():
        repo = Path.cwd()

    labs = args.labs_intro or (repo / "Labs-Intro")
    out_dir = args.out_dir or (labs / "assembled")
    concat_py = here.parent / "concat.py"
    roles = args.roles or list(ROLES)

    shared_dir = labs / "shared"
    shared_clips = [shared_dir / n for n in SHARED]
    for p in shared_clips:
        if not p.is_file():
            raise SystemExit(f"missing shared clip: {p}")

    out_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for role in roles:
        role_dir = labs / role
        if not role_dir.is_dir():
            raise SystemExit(f"missing role dir: {role_dir}")
        open_p, close_p = find_open_close(role_dir)
        inputs = [open_p, *shared_clips, close_p]
        out = out_dir / f"{role}.mp4"
        cmd = [
            sys.executable,
            str(concat_py),
            "-o",
            str(out),
            *(["--reencode"] if args.reencode else ["--copy"]),
            *[str(p) for p in inputs],
        ]
        print(f"assemble {role}:", " + ".join(p.name for p in inputs))
        r = subprocess.run(cmd)
        if r.returncode != 0:
            if not args.reencode:
                print(f"copy failed for {role}; retrying re-encode…")
                cmd = [
                    sys.executable,
                    str(concat_py),
                    "-o",
                    str(out),
                    "--reencode",
                    *[str(p) for p in inputs],
                ]
                r = subprocess.run(cmd)
            if r.returncode != 0:
                raise SystemExit(f"failed {role}")
        results.append(out)
        print(f"  → {out}")

    print("Done:")
    for p in results:
        print(f"  {p} ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
