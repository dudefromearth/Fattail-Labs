#!/usr/bin/env python3
"""CLI: import a knowledge-check markdown package into a quiz lesson.

Examples:

  # Create/replace quiz lesson in Pure Options · See It module
  .venv/bin/python import_knowledge_check.py \\
    --course pure-options --module see-it \\
    --title "Knowledge Check — See It" \\
    --slug knowledge-check \\
    --file "../docs/Courses/Pure Options/M1 knowledge/M1-knowledge-check.md"

  # Existing quiz lesson by id
  .venv/bin/python import_knowledge_check.py --lesson-id 123 --file path.md
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import db
import course_quiz_import as cqi


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Import knowledge-check markdown → quiz")
    p.add_argument("--file", "-f", required=True, help="Path to knowledge-check .md")
    p.add_argument("--lesson-id", type=int, default=None)
    p.add_argument("--course", default=None, help="Course slug (with --module)")
    p.add_argument("--module", default=None, help="Module slug")
    p.add_argument("--title", default="Knowledge check")
    p.add_argument("--slug", default="knowledge-check")
    p.add_argument(
        "--body",
        default=None,
        help="Optional intro body_md for the quiz lesson",
    )
    p.add_argument(
        "--no-create",
        action="store_true",
        help="Do not create lesson; require --lesson-id or existing slug",
    )
    args = p.parse_args(argv)

    path = Path(args.file).expanduser()
    if not path.is_file():
        print(f"File not found: {path}", file=sys.stderr)
        return 2
    md = path.read_text(encoding="utf-8")
    try:
        questions = cqi.parse_knowledge_check_md(md)
    except cqi.QuizImportError as exc:
        print(f"Parse failed: {exc}", file=sys.stderr)
        return 1

    intro = args.body
    if intro is None:
        # Use text before ## Questions as lesson intro when present
        head = md.split("## Questions", 1)[0].strip()
        intro = head if head and not head.startswith("##") else None

    with db.transaction() as conn:
        with conn.cursor() as cur:
            lesson_id = args.lesson_id
            if lesson_id is None:
                if not args.course or not args.module:
                    print(
                        "Need --lesson-id or both --course and --module",
                        file=sys.stderr,
                    )
                    return 2
                cur.execute(
                    """SELECT m.id FROM modules m
                       JOIN courses c ON c.id = m.course_id
                       WHERE c.slug = %s AND m.slug = %s""",
                    (args.course, args.module),
                )
                mrow = cur.fetchone()
                if not mrow:
                    print(
                        f"Module not found: course={args.course!r} module={args.module!r}",
                        file=sys.stderr,
                    )
                    return 1
                if args.no_create:
                    cur.execute(
                        "SELECT id FROM lessons WHERE module_id = %s AND slug = %s",
                        (mrow["id"], args.slug),
                    )
                    lrow = cur.fetchone()
                    if not lrow:
                        print("Lesson slug not found and --no-create set", file=sys.stderr)
                        return 1
                    lesson_id = int(lrow["id"])
                else:
                    lesson_id = cqi.ensure_quiz_lesson(
                        cur,
                        module_id=int(mrow["id"]),
                        title=args.title,
                        slug=args.slug,
                        body_md=intro,
                    )
            try:
                n = cqi.replace_lesson_questions(cur, lesson_id, questions)
            except cqi.QuizImportError as exc:
                print(f"Import failed: {exc}", file=sys.stderr)
                return 1

    print(f"Imported {n} questions into lesson_id={lesson_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
