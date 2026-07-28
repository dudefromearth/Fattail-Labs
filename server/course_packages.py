#!/usr/bin/env python3
"""Export / import Canonical Course packages for env-to-env transfer.

Uses the Canonical Course Model (Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md).
Does NOT copy member progress, enrollments, or discussions.

Usage (from server/, with .env loaded):
  .venv/bin/python course_packages.py export --out ../exports/courses-YYYY-MM-DD
  .venv/bin/python course_packages.py import --dir ../exports/courses-YYYY-MM-DD --mode publish

Import:
  - Ensures categories from MANIFEST (or package category_slugs) exist.
  - Materializes each *.course.json via import_document.
  - Applies catalog sort_order / catalog_section from MANIFEST (migration 038+).
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import db
from course_model import CourseModelError, export_course_document, import_document, validate

MANIFEST_NAME = "MANIFEST.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def cmd_export(out: Path, slugs: list[str] | None) -> int:
    out.mkdir(parents=True, exist_ok=True)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, slug, title, status, sort_order, catalog_section
                   FROM courses ORDER BY sort_order ASC, id ASC"""
            )
            all_rows = cur.fetchall()
            if slugs:
                want = set(slugs)
                rows = [r for r in all_rows if r["slug"] in want]
                missing = want - {r["slug"] for r in rows}
                if missing:
                    raise SystemExit(f"Unknown course slugs: {sorted(missing)}")
            else:
                rows = all_rows

            cur.execute("SELECT slug, name FROM categories ORDER BY slug")
            categories = [
                {"slug": r["slug"], "name": r["name"]} for r in cur.fetchall()
            ]

            packages = []
            for r in rows:
                doc = export_course_document(cur, r["slug"])
                report = validate(doc, mode="structural")
                if not report.get("ok"):
                    print(
                        f"WARN {r['slug']}: structural validation issues: {report}",
                        file=sys.stderr,
                    )
                path = out / f"{r['slug']}.course.json"
                path.write_text(
                    json.dumps(doc, indent=2, default=str) + "\n", encoding="utf-8"
                )
                n_mod = len((doc.get("course") or {}).get("modules") or [])
                n_les = sum(
                    len(m.get("lessons") or [])
                    for m in ((doc.get("course") or {}).get("modules") or [])
                )
                packages.append(
                    {
                        "file": path.name,
                        "slug": r["slug"],
                        "title": r["title"],
                        "status": r["status"],
                        "sort_order": r["sort_order"],
                        "catalog_section": r["catalog_section"] or "",
                        "modules": n_mod,
                        "lessons": n_les,
                        "bytes": path.stat().st_size,
                    }
                )
                print(
                    f"exported {r['slug']}: {n_mod} modules, {n_les} lessons → {path}"
                )

    manifest = {
        "format": "fattail.labs.course_export_bundle",
        "version": "1.0",
        "exported_at": _now_iso(),
        "categories": categories,
        "packages": packages,
        "catalog_order": [
            {
                "slug": p["slug"],
                "sort_order": p["sort_order"],
                "catalog_section": p["catalog_section"],
            }
            for p in packages
        ],
    }
    (out / MANIFEST_NAME).write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {out / MANIFEST_NAME} ({len(packages)} packages)")
    return 0


def _ensure_categories(cur, categories: list[dict]) -> None:
    for cat in categories:
        slug = (cat.get("slug") or "").strip()
        name = (cat.get("name") or slug).strip()
        if not slug:
            continue
        cur.execute(
            """INSERT INTO categories (slug, name) VALUES (%s, %s)
               ON DUPLICATE KEY UPDATE name = VALUES(name)""",
            (slug, name),
        )


def _has_catalog_columns(cur) -> bool:
    cur.execute("SHOW COLUMNS FROM courses LIKE 'sort_order'")
    if not cur.fetchone():
        return False
    cur.execute("SHOW COLUMNS FROM courses LIKE 'catalog_section'")
    return bool(cur.fetchone())


def _apply_catalog_order(cur, order: list[dict]) -> None:
    if not order:
        return
    if not _has_catalog_columns(cur):
        print(
            "WARN: courses.sort_order / catalog_section missing — "
            "run migration 038 before catalog order can stick",
            file=sys.stderr,
        )
        return
    for item in order:
        slug = item.get("slug")
        if not slug:
            continue
        cur.execute(
            """UPDATE courses
               SET sort_order = %s, catalog_section = %s
               WHERE slug = %s""",
            (
                int(item.get("sort_order") or 0),
                item.get("catalog_section") or "",
                slug,
            ),
        )


def cmd_import(directory: Path, mode: str, dry_run: bool) -> int:
    if not directory.is_dir():
        raise SystemExit(f"not a directory: {directory}")

    manifest_path = directory / MANIFEST_NAME
    manifest: dict = {}
    if manifest_path.is_file():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    files = sorted(directory.glob("*.course.json"))
    if not files:
        raise SystemExit(f"no *.course.json in {directory}")

    # Prefer MANIFEST package list order (catalog order); else alphabetical.
    if manifest.get("packages"):
        by_name = {p.name: p for p in files}
        ordered: list[Path] = []
        for p in manifest["packages"]:
            name = p.get("file")
            if name and name in by_name:
                ordered.append(by_name.pop(name))
        ordered.extend(sorted(by_name.values(), key=lambda x: x.name))
        files = ordered

    categories = list(manifest.get("categories") or [])
    if not categories:
        # Fall back to union of package category_slugs
        seen: set[str] = set()
        for path in files:
            doc = json.loads(path.read_text(encoding="utf-8"))
            for s in (doc.get("course") or {}).get("category_slugs") or []:
                if s not in seen:
                    seen.add(s)
                    categories.append({"slug": s, "name": s.replace("-", " ").title()})

    if dry_run:
        print(f"would import {len(files)} packages from {directory} mode={mode}")
        print(f"would ensure {len(categories)} categories")
        for path in files:
            print(f"  {path.name}")
        return 0

    results = []
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _ensure_categories(cur, categories)
            for path in files:
                doc = json.loads(path.read_text(encoding="utf-8"))
                slug = (doc.get("course") or {}).get("slug") or path.stem.replace(
                    ".course", ""
                )
                try:
                    # If a draft with same slug exists, replace; if published, skip
                    # with error unless mode is create (which will suffix).
                    cur.execute(
                        "SELECT id, status FROM courses WHERE slug = %s", (slug,)
                    )
                    existing = cur.fetchone()
                    if existing and existing["status"] == "draft" and mode in (
                        "create_draft",
                        "publish",
                        "replace_draft",
                    ):
                        result = import_document(
                            cur,
                            doc,
                            mode="replace_draft",
                            target_slug=slug,
                            validate_mode=(
                                "publish" if mode == "publish" else "structural"
                            ),
                        )
                        if mode == "publish":
                            # replace_draft leaves draft; publish when requested
                            cur.execute(
                                """UPDATE courses
                                   SET status = 'published',
                                       published_at = COALESCE(published_at, NOW())
                                   WHERE slug = %s""",
                                (slug,),
                            )
                            result["status"] = "published"
                    elif existing and existing["status"] == "published":
                        raise CourseModelError(
                            f"course {slug!r} already published on target — "
                            "unpublish/archive first or import under a new slug"
                        )
                    else:
                        result = import_document(
                            cur,
                            doc,
                            mode="publish" if mode == "publish" else "create_draft",
                            validate_mode=(
                                "publish" if mode == "publish" else "structural"
                            ),
                        )
                    results.append({"file": path.name, "ok": True, **result})
                    print(
                        f"imported {path.name} → slug={result.get('slug')} "
                        f"status={result.get('status')}"
                    )
                except CourseModelError as exc:
                    print(f"FAIL {path.name}: {exc}", file=sys.stderr)
                    if exc.detail:
                        print(json.dumps(exc.detail, indent=2), file=sys.stderr)
                    raise SystemExit(1) from exc

            order = manifest.get("catalog_order") or [
                {
                    "slug": p.get("slug"),
                    "sort_order": p.get("sort_order"),
                    "catalog_section": p.get("catalog_section") or "",
                }
                for p in (manifest.get("packages") or [])
            ]
            _apply_catalog_order(cur, order)

    print(f"done: {len(results)} courses imported")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser(description="Canonical course package export/import")
    sub = ap.add_subparsers(dest="cmd", required=True)

    ex = sub.add_parser("export", help="Export courses from this DB to a directory")
    ex.add_argument(
        "--out",
        type=Path,
        required=True,
        help="Output directory (created if missing)",
    )
    ex.add_argument(
        "--slug",
        action="append",
        dest="slugs",
        help="Limit to course slug(s); default = all courses",
    )

    im = sub.add_parser("import", help="Import a package directory into this DB")
    im.add_argument(
        "--dir",
        type=Path,
        required=True,
        help="Directory with MANIFEST.json + *.course.json",
    )
    im.add_argument(
        "--mode",
        choices=("create_draft", "publish"),
        default="publish",
        help="create_draft = leave as drafts; publish = published (default)",
    )
    im.add_argument(
        "--dry-run",
        action="store_true",
        help="List packages without writing",
    )

    args = ap.parse_args()
    if args.cmd == "export":
        raise SystemExit(cmd_export(args.out, args.slugs))
    if args.cmd == "import":
        raise SystemExit(cmd_import(args.dir, args.mode, args.dry_run))
    raise SystemExit(2)


if __name__ == "__main__":
    main()
