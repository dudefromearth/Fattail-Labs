"""Canonical Course Model — pure document ops + MySQL project/materialize.

Spec: Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md

- validate / inspect (no write)
- adapters: placement plan, legacy course_package
- export from live course graph
- import create_draft / replace_draft
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

FORMAT = "fattail.labs.canonical_course"
LEGACY_PACKAGE_FORMAT = "fattail.labs.course_package"
MODEL_VERSION = "1.0"
KNOWN_MAJOR = "1"

VALID_LEVELS = frozenset({"beginner", "intermediate", "advanced"})
VALID_STATUS = frozenset({"draft", "published", "archived"})
VALID_AUDIENCE = frozenset({"public", "members", "coaching"})
VALID_MODULE_KINDS = frozenset({"standard", "worksheets", "resources", "bonus"})
VALID_BLOCK_TYPES = frozenset(
    {"video_clip", "notes", "quiz", "assignment", "resource_link", "external"}
)
# v1.0 product path: YouTube only (CCM-D10). Other providers reserved for later.
DEFAULT_VIDEO_PROVIDER = "youtube"
VALID_PROVIDERS = frozenset({"youtube"})
VALID_LESSON_KINDS = frozenset(
    {"video", "text", "download", "external", "replay", "quiz"}
)

_PROFIT_PATTERNS = re.compile(
    r"\b(guaranteed?\s+profit|make\s+money|get\s+rich|passive\s+income|"
    r"you'?ll\s+make\s+it\s+back|financial\s+freedom\s+guaranteed)\b",
    re.I,
)

SCHEMA_PATH = Path(__file__).resolve().parent / "schemas" / "canonical-course-v1.json"


class CourseModelError(Exception):
    """Import/export failure with optional structured detail."""

    def __init__(self, message: str, *, detail: dict | None = None):
        super().__init__(message)
        self.detail = detail or {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
    return slug or "item"


def _issue(
    level: str, code: str, path: str, message: str
) -> dict[str, str]:
    return {"code": code, "path": path, "message": message}


def _parse_json_maybe(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, (str, bytes)):
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return None
    return None


# --- Adapters -----------------------------------------------------------------


def normalize_document(raw: dict) -> dict:
    """Accept canonical or legacy package / placement-shaped input → canonical."""
    if not isinstance(raw, dict):
        raise CourseModelError("document must be a JSON object")

    fmt = raw.get("format")
    if fmt == FORMAT or (
        raw.get("model_version") and "course" in raw and isinstance(raw.get("course"), dict)
    ):
        doc = dict(raw)
        doc.setdefault("format", FORMAT)
        doc.setdefault("model_version", MODEL_VERSION)
        return doc

    if fmt == LEGACY_PACKAGE_FORMAT or "package" in raw:
        return legacy_package_to_document(raw)

    # Bare placement plan (course_title + modules)
    if raw.get("course_title") or (
        isinstance(raw.get("modules"), list) and "course" not in raw
    ):
        return placement_plan_to_document(raw)

    # Bare course body
    if raw.get("title") and raw.get("slug") and "modules" in raw:
        return {
            "format": FORMAT,
            "model_version": MODEL_VERSION,
            "course": _ensure_course_defaults(raw),
        }

    raise CourseModelError(
        "unrecognized document shape; expected canonical course, "
        "legacy course_package, or placement plan"
    )


def legacy_package_to_document(raw: dict) -> dict:
    pkg = raw.get("package") or {}
    c = pkg.get("course") or {}
    modules_out = []
    for mi, mod in enumerate(pkg.get("modules") or []):
        lessons_out = []
        for li, les in enumerate(mod.get("lessons") or []):
            lkind = (les.get("kind") or "video").lower()
            if lkind not in VALID_LESSON_KINDS:
                lkind = "video"
            blocks = _lesson_fields_to_blocks({**les, "kind": lkind})
            lessons_out.append(
                {
                    "id": les.get("key") or f"les-{mi+1}-{li+1}",
                    "title": les.get("title") or f"Lesson {li+1}",
                    "slug": les.get("slug") or slugify(les.get("title") or f"lesson-{li+1}"),
                    "order": li,
                    "kind": lkind,
                    "free_preview": bool(les.get("free_preview")),
                    "estimated_duration_minutes": (
                        int(les["duration_seconds"]) // 60
                        if les.get("duration_seconds")
                        else None
                    ),
                    "content_blocks": blocks,
                    "resource_ids": list(les.get("resource_ids") or []),
                }
            )
        modules_out.append(
            {
                "id": mod.get("key") or f"mod-{mi+1}",
                "title": mod.get("title") or f"Module {mi+1}",
                "description_md": mod.get("description_md") or "",
                "order": mi,
                "kind": mod.get("kind") or "standard",
                "lessons": lessons_out,
            }
        )

    course = {
        "id": c.get("key") or "course",
        "slug": c.get("slug") or slugify(c.get("title") or "course"),
        "title": c.get("title") or "Untitled",
        "subtitle": c.get("subtitle") or "",
        "description_md": c.get("description_md") or "",
        "status": c.get("status") or "draft",
        "version": "1.0.0",
        "level": c.get("level") or "beginner",
        "audience_category": "members",
        "category_slugs": list(pkg.get("categories") or []),
        "instructor_refs": list(pkg.get("instructors") or []),
        "flagship": False,
        "trailer": _trailer_ref(c.get("trailer_video_id")),
        "banner": _banner_ref(c.get("hero_image_url")),
        "card_color": c.get("card_color"),
        "certification_enabled": bool(c.get("certification_enabled")),
        "modules": modules_out,
        "resource_ids": [a.get("key") or f"att-{i}" for i, a in enumerate(pkg.get("attachments") or [])],
    }
    bundle_resources = []
    for i, a in enumerate(pkg.get("attachments") or []):
        bundle_resources.append(
            {
                "id": a.get("key") or f"att-{i}",
                "title": a.get("title"),
                "kind": a.get("kind") or "link",
                "url": a.get("url"),
                "free_preview": bool(a.get("free_preview")),
                "description_md": a.get("description_md"),
                "emoji": a.get("emoji"),
            }
        )

    return {
        "format": FORMAT,
        "model_version": MODEL_VERSION,
        "exported_at": raw.get("exported_at") or _now_iso(),
        "exported_by": raw.get("exported_by"),
        "source": raw.get("source"),
        "course": course,
        "bundle": {"resources": bundle_resources} if bundle_resources else {},
    }


def placement_plan_to_document(plan: dict) -> dict:
    title = plan.get("course_title") or plan.get("title") or "Untitled"
    modules_out = []
    for mi, mod in enumerate(plan.get("modules") or []):
        lessons_out = []
        for li, les in enumerate(mod.get("lessons") or []):
            lkind = (les.get("kind") or "video").lower()
            if lkind not in VALID_LESSON_KINDS:
                lkind = "video"
            blocks = _lesson_fields_to_blocks({**les, "kind": lkind})
            lessons_out.append(
                {
                    "id": f"les-{mi+1}-{li+1}",
                    "title": les.get("title") or f"Lesson {li+1}",
                    "slug": les.get("slug") or slugify(les.get("title") or f"lesson-{li+1}"),
                    "order": li,
                    "kind": lkind,
                    "free_preview": bool(les.get("free_preview")),
                    "estimated_duration_minutes": (
                        int(les["duration_seconds"]) // 60
                        if les.get("duration_seconds")
                        else None
                    ),
                    "content_blocks": blocks,
                    "resource_ids": list(les.get("resource_ids") or []),
                }
            )
        modules_out.append(
            {
                "id": f"mod-{mi+1}",
                "title": mod.get("title") or f"Module {mi+1}",
                "description_md": mod.get("description_md") or "",
                "order": mi,
                "kind": mod.get("kind") or "standard",
                "lessons": lessons_out,
            }
        )

    resource_ids = []
    bundle_resources = []
    for i, res in enumerate(plan.get("resources") or []):
        rid = f"res-{i+1}"
        resource_ids.append(rid)
        # Metadata pointers only — url is a reference string, not embedded media
        bundle_resources.append(
            {
                "id": rid,
                "title": res.get("title") or rid,
                "kind": res.get("kind") or "link",
                "url": res.get("url") or "",
                "free_preview": bool(res.get("free_preview")),
                "description_md": res.get("description_md"),
                "emoji": res.get("emoji"),
            }
        )

    course = {
        "id": "course",
        "slug": plan.get("slug") or slugify(title),
        "title": title,
        "subtitle": plan.get("subtitle") or "",
        "description_md": plan.get("description_md") or plan.get("description") or "",
        "status": "draft",
        "version": "1.0.0",
        "level": plan.get("level") if plan.get("level") in VALID_LEVELS else "beginner",
        "audience_category": "members",
        "category_slugs": list(plan.get("categories") or plan.get("category_slugs") or []),
        "flagship": bool(plan.get("flagship")),
        "trailer": _trailer_ref(plan.get("trailer_video_id") or plan.get("trailer_video")),
        "banner": _banner_ref(plan.get("hero_image_url")),
        "certification_enabled": bool(plan.get("certification_enabled")),
        "modules": modules_out,
        "resource_ids": resource_ids,
    }
    return {
        "format": FORMAT,
        "model_version": MODEL_VERSION,
        "exported_at": _now_iso(),
        "course": course,
        "bundle": {"resources": bundle_resources} if bundle_resources else {},
    }


def _trailer_ref(video_id: str | None) -> dict | None:
    if not video_id:
        return None
    return {
        "id": "trailer",
        "type": "video",
        "source": DEFAULT_VIDEO_PROVIDER,
        "provider_id": str(video_id),
    }


def _banner_ref(url: str | None) -> dict | None:
    if not url:
        return None
    return {
        "id": "banner",
        "type": "image",
        "source": "media_library",
        "url": str(url),
    }


def _normalize_provider(raw: str | None) -> str:
    """v1.0: coerce to youtube (CCM-D10)."""
    p = (raw or DEFAULT_VIDEO_PROVIDER).strip().lower()
    return p if p in VALID_PROVIDERS else DEFAULT_VIDEO_PROVIDER


def _lesson_fields_to_blocks(les: dict) -> list[dict]:
    blocks: list[dict] = []
    n = 0
    video = les.get("video")
    vid = None
    provider = DEFAULT_VIDEO_PROVIDER
    params: dict = {}
    if isinstance(video, dict):
        vid = video.get("video_id")
        provider = _normalize_provider(video.get("provider"))
        params = video.get("params") or {}
    else:
        vid = les.get("video_id")
        provider = _normalize_provider(les.get("video_provider"))
        params = les.get("video_params") or {}
        if isinstance(params, str):
            params = _parse_json_maybe(params) or {}

    kind = (les.get("kind") or "video").lower()
    if kind not in VALID_LESSON_KINDS:
        kind = "video"
    # Video / replay lessons: export YouTube clip when an id exists (or kind implies video)
    if kind in ("video", "replay") or vid:
        n += 1
        blocks.append(
            {
                "id": f"blk-{n}",
                "type": "video_clip",
                "provider": provider,
                "video_id": vid,
                "params": params if isinstance(params, dict) else {},
                "duration_seconds": les.get("duration_seconds") or 0,
            }
        )
    body = les.get("body_md")
    if body:
        n += 1
        blocks.append({"id": f"blk-{n}", "type": "notes", "body_md": body})
    if kind == "quiz" or les.get("quiz"):
        n += 1
        quiz = les.get("quiz") or {}
        blocks.append(
            {
                "id": f"blk-{n}",
                "type": "quiz",
                "questions": list(quiz.get("questions") or []),
            }
        )
    if kind == "external" or les.get("external_url"):
        n += 1
        blocks.append(
            {
                "id": f"blk-{n}",
                "type": "external",
                "url": les.get("external_url") or "",
            }
        )
    # download kind: resources live in resource_ids pointers, not as embedded media
    extras = les.get("extra_blocks") or les.get("extra_blocks_json")
    extras = _parse_json_maybe(extras) if not isinstance(extras, list) else extras
    if isinstance(extras, list):
        for b in extras:
            if isinstance(b, dict):
                blocks.append(b)
    if not blocks:
        n += 1
        blocks.append({"id": f"blk-{n}", "type": "notes", "body_md": ""})
    return blocks


def _ensure_course_defaults(c: dict) -> dict:
    out = dict(c)
    out.setdefault("id", "course")
    out.setdefault("status", "draft")
    out.setdefault("version", "1.0.0")
    out.setdefault("level", "beginner")
    out.setdefault("audience_category", "members")
    out.setdefault("modules", [])
    out.setdefault("category_slugs", [])
    return out


# --- Validate / inspect -------------------------------------------------------


def validate(
    document: dict,
    *,
    mode: str = "structural",
    resolve_env: dict | None = None,
) -> dict:
    """Validate a document. mode: structural | publish | strict."""
    errors: list[dict] = []
    warnings: list[dict] = []
    info: list[dict] = []

    try:
        doc = normalize_document(document)
    except CourseModelError as exc:
        return {
            "ok": False,
            "mode": mode,
            "model_version": None,
            "errors": [_issue("error", "INVALID_DOCUMENT", "$", str(exc))],
            "warnings": [],
            "info": [],
            "stats": {},
        }

    fmt = doc.get("format")
    if fmt != FORMAT:
        errors.append(_issue("error", "BAD_FORMAT", "format", f"expected {FORMAT}"))

    mv = str(doc.get("model_version") or "")
    if not mv.startswith(KNOWN_MAJOR + "."):
        errors.append(
            _issue(
                "error",
                "UNKNOWN_MODEL_VERSION",
                "model_version",
                f"unsupported model_version {mv!r}",
            )
        )

    course = doc.get("course") or {}
    if not (course.get("title") or "").strip():
        errors.append(_issue("error", "TITLE_REQUIRED", "course.title", "title is required"))
    if not (course.get("slug") or "").strip():
        errors.append(_issue("error", "SLUG_REQUIRED", "course.slug", "slug is required"))
    if not (course.get("version") or "").strip():
        errors.append(
            _issue("error", "VERSION_REQUIRED", "course.version", "version is required")
        )
    level = course.get("level")
    if level not in VALID_LEVELS:
        errors.append(
            _issue("error", "BAD_LEVEL", "course.level", f"level must be one of {sorted(VALID_LEVELS)}")
        )
    status = course.get("status") or "draft"
    if status not in VALID_STATUS:
        errors.append(
            _issue("error", "BAD_STATUS", "course.status", f"status must be one of {sorted(VALID_STATUS)}")
        )
    aud = course.get("audience_category")
    if aud not in VALID_AUDIENCE:
        errors.append(
            _issue(
                "error",
                "BAD_AUDIENCE",
                "course.audience_category",
                f"audience_category must be one of {sorted(VALID_AUDIENCE)}",
            )
        )

    ids: set[str] = set()
    def _unique(key: str, path: str) -> None:
        if not key:
            errors.append(_issue("error", "ID_REQUIRED", path, "id is required"))
            return
        if key in ids:
            errors.append(_issue("error", "DUPLICATE_ID", path, f"duplicate id {key!r}"))
        ids.add(key)

    _unique(str(course.get("id") or ""), "course.id")

    modules = list(course.get("modules") or [])
    root_lessons = list(course.get("lessons") or [])
    if not modules and root_lessons:
        info.append(
            _issue(
                "info",
                "ROOT_LESSONS_WRAP",
                "course.lessons",
                "root lessons will be wrapped into a default module on import",
            )
        )
        modules = [
            {
                "id": "mod-default",
                "title": "Module 1",
                "order": 0,
                "kind": "standard",
                "lessons": root_lessons,
            }
        ]

    lesson_count = 0
    block_count = 0
    free_preview = 0
    quiz_count = 0
    standard_modules = 0

    for mi, mod in enumerate(modules):
        if not isinstance(mod, dict):
            errors.append(
                _issue("error", "BAD_MODULE", f"course.modules[{mi}]", "module must be object")
            )
            continue
        _unique(str(mod.get("id") or ""), f"course.modules[{mi}].id")
        if not (mod.get("title") or "").strip():
            errors.append(
                _issue(
                    "error",
                    "MODULE_TITLE",
                    f"course.modules[{mi}].title",
                    "module title required",
                )
            )
        mkind = mod.get("kind") or "standard"
        if mkind not in VALID_MODULE_KINDS:
            errors.append(
                _issue(
                    "error",
                    "BAD_MODULE_KIND",
                    f"course.modules[{mi}].kind",
                    f"invalid kind {mkind!r}",
                )
            )
        if mkind == "standard":
            standard_modules += 1
        slugs_in_mod: set[str] = set()
        for li, les in enumerate(mod.get("lessons") or []):
            if not isinstance(les, dict):
                errors.append(
                    _issue(
                        "error",
                        "BAD_LESSON",
                        f"course.modules[{mi}].lessons[{li}]",
                        "lesson must be object",
                    )
                )
                continue
            lesson_count += 1
            lpath = f"course.modules[{mi}].lessons[{li}]"
            _unique(str(les.get("id") or ""), f"{lpath}.id")
            if not (les.get("title") or "").strip():
                errors.append(
                    _issue("error", "LESSON_TITLE", f"{lpath}.title", "lesson title required")
                )
            lkind = (les.get("kind") or "").lower()
            if lkind and lkind not in VALID_LESSON_KINDS:
                errors.append(
                    _issue(
                        "error",
                        "BAD_LESSON_KIND",
                        f"{lpath}.kind",
                        f"kind must be one of {sorted(VALID_LESSON_KINDS)}",
                    )
                )
            elif not lkind:
                warnings.append(
                    _issue(
                        "warning",
                        "LESSON_KIND_MISSING",
                        f"{lpath}.kind",
                        "lesson.kind missing; will be inferred from content_blocks",
                    )
                )
            lslug = les.get("slug") or ""
            if lslug:
                if lslug in slugs_in_mod:
                    errors.append(
                        _issue(
                            "error",
                            "LESSON_SLUG_DUP",
                            f"{lpath}.slug",
                            f"duplicate lesson slug {lslug!r} in module",
                        )
                    )
                slugs_in_mod.add(lslug)
            if les.get("free_preview"):
                free_preview += 1
            blocks = les.get("content_blocks")
            if not isinstance(blocks, list):
                errors.append(
                    _issue(
                        "error",
                        "BLOCKS_REQUIRED",
                        f"{lpath}.content_blocks",
                        "content_blocks must be an array",
                    )
                )
                continue
            if not blocks:
                warnings.append(
                    _issue(
                        "warning",
                        "EMPTY_BLOCKS",
                        f"{lpath}.content_blocks",
                        "lesson has no content blocks",
                    )
                )
            has_video = False
            has_quiz_q = False
            for bi, blk in enumerate(blocks):
                if not isinstance(blk, dict):
                    errors.append(
                        _issue(
                            "error",
                            "BAD_BLOCK",
                            f"{lpath}.content_blocks[{bi}]",
                            "block must be object",
                        )
                    )
                    continue
                block_count += 1
                btype = blk.get("type")
                if btype not in VALID_BLOCK_TYPES:
                    warnings.append(
                        _issue(
                            "warning",
                            "UNKNOWN_BLOCK_TYPE",
                            f"{lpath}.content_blocks[{bi}].type",
                            f"unknown block type {btype!r}",
                        )
                    )
                if btype == "video_clip":
                    has_video = True
                    vid = blk.get("video_id") or (blk.get("video") or {}).get("provider_id")
                    if not vid:
                        warnings.append(
                            _issue(
                                "warning",
                                "LESSON_VIDEO_MISSING",
                                f"{lpath}.content_blocks[{bi}]",
                                "video_clip has no video_id",
                            )
                        )
                if btype == "quiz":
                    quiz_count += 1
                    qs = blk.get("questions") or []
                    if qs:
                        has_quiz_q = True
            # publish checks per lesson applied later using has_video
            les["_has_video"] = has_video  # type: ignore[index]
            les["_has_quiz_q"] = has_quiz_q  # type: ignore[index]

    # Env resolve
    env = resolve_env or {}
    cat_slugs = set(env.get("category_slugs") or [])
    if cat_slugs:
        for i, s in enumerate(course.get("category_slugs") or []):
            if s not in cat_slugs:
                errors.append(
                    _issue(
                        "error",
                        "CATEGORY_NOT_FOUND",
                        f"course.category_slugs[{i}]",
                        f"category {s!r} does not exist",
                    )
                )

    # Publish / strict
    if mode in ("publish", "strict"):
        desc = (course.get("description_md") or "").strip()
        if len(desc) < 40:
            errors.append(
                _issue(
                    "error",
                    "DESCRIPTION_SHORT",
                    "course.description_md",
                    "description_md must be at least 40 characters for publish",
                )
            )
        if standard_modules < 1:
            errors.append(
                _issue(
                    "error",
                    "NO_STANDARD_MODULE",
                    "course.modules",
                    "publish requires at least one standard module",
                )
            )
        if lesson_count < 1:
            errors.append(
                _issue(
                    "error",
                    "NO_LESSONS",
                    "course.modules",
                    "publish requires at least one lesson",
                )
            )
        for mi, mod in enumerate(modules):
            for li, les in enumerate(mod.get("lessons") or []):
                if not isinstance(les, dict):
                    continue
                lpath = f"course.modules[{mi}].lessons[{li}]"
                blocks = les.get("content_blocks") or []
                types = [b.get("type") for b in blocks if isinstance(b, dict)]
                if "video_clip" in types:
                    vids = [
                        b.get("video_id") or (b.get("video") or {}).get("provider_id")
                        for b in blocks
                        if isinstance(b, dict) and b.get("type") == "video_clip"
                    ]
                    if not any(vids):
                        errors.append(
                            _issue(
                                "error",
                                "LESSON_VIDEO_MISSING",
                                lpath,
                                "video lesson requires video_id for publish",
                            )
                        )
                if "quiz" in types:
                    qs = []
                    for b in blocks:
                        if isinstance(b, dict) and b.get("type") == "quiz":
                            qs.extend(b.get("questions") or [])
                    if not qs:
                        errors.append(
                            _issue(
                                "error",
                                "QUIZ_EMPTY",
                                lpath,
                                "quiz lesson requires questions for publish",
                            )
                        )
        # Doctrine lint
        texts = [
            ("course.title", course.get("title") or ""),
            ("course.subtitle", course.get("subtitle") or ""),
            ("course.description_md", course.get("description_md") or ""),
        ]
        for mi, mod in enumerate(modules):
            for li, les in enumerate(mod.get("lessons") or []):
                if isinstance(les, dict):
                    texts.append(
                        (
                            f"course.modules[{mi}].lessons[{li}].title",
                            les.get("title") or "",
                        )
                    )
        for path, text in texts:
            if _PROFIT_PATTERNS.search(text):
                errors.append(
                    _issue(
                        "error",
                        "PROFIT_CLAIM",
                        path,
                        "profit-claim language is not allowed (process outcomes only)",
                    )
                )
        if free_preview == 0:
            warnings.append(
                _issue(
                    "warning",
                    "NO_FREE_PREVIEW",
                    "course",
                    "no free_preview lessons (consider at least one public sample)",
                )
            )

    if mode == "strict" and warnings:
        for w in warnings:
            errors.append(
                _issue("error", w["code"], w["path"], f"[strict] {w['message']}")
            )
        warnings = []

    # Clear temp keys
    for mod in modules:
        for les in mod.get("lessons") or []:
            if isinstance(les, dict):
                les.pop("_has_video", None)
                les.pop("_has_quiz_q", None)

    stats = {
        "modules": len(modules),
        "lessons": lesson_count,
        "blocks": block_count,
        "free_preview_lessons": free_preview,
        "quizzes": quiz_count,
        "resources": len(course.get("resource_ids") or []),
    }
    return {
        "ok": len(errors) == 0,
        "mode": mode,
        "model_version": mv or MODEL_VERSION,
        "errors": errors,
        "warnings": warnings,
        "info": info,
        "stats": stats,
    }


def inspect_document(document: dict) -> dict:
    try:
        doc = normalize_document(document)
    except CourseModelError as exc:
        return {"ok": False, "error": str(exc)}

    course = doc.get("course") or {}
    modules = list(course.get("modules") or [])
    if not modules and course.get("lessons"):
        modules = [
            {
                "id": "mod-default",
                "title": "Module 1",
                "kind": "standard",
                "lessons": course.get("lessons") or [],
            }
        ]

    outline_mods = []
    lessons_n = 0
    blocks_n = 0
    for mod in modules:
        less_out = []
        for les in mod.get("lessons") or []:
            lessons_n += 1
            blocks = les.get("content_blocks") or []
            blocks_n += len(blocks)
            types = [b.get("type") for b in blocks if isinstance(b, dict)]
            less_out.append(
                {
                    "id": les.get("id"),
                    "title": les.get("title"),
                    "slug": les.get("slug"),
                    "free_preview": bool(les.get("free_preview")),
                    "block_types": types,
                    "has_video": "video_clip" in types,
                }
            )
        outline_mods.append(
            {
                "id": mod.get("id"),
                "title": mod.get("title"),
                "kind": mod.get("kind") or "standard",
                "lessons": less_out,
            }
        )

    return {
        "ok": True,
        "format": FORMAT,
        "model_version": doc.get("model_version") or MODEL_VERSION,
        "outline": {
            "title": course.get("title"),
            "slug": course.get("slug"),
            "level": course.get("level"),
            "status": course.get("status"),
            "audience_category": course.get("audience_category"),
            "flagship": bool(course.get("flagship")),
            "modules": outline_mods,
        },
        "stats": {
            "modules": len(outline_mods),
            "lessons": lessons_n,
            "blocks": blocks_n,
            "resources": len(course.get("resource_ids") or []),
        },
    }


# --- Materialize helpers (blocks → lesson row fields) -------------------------


def materialize_lesson_fields(les: dict) -> dict:
    """Project content_blocks → kind, video_*, body_md, external_url, quiz, extra.

    Explicit lesson.kind is authoritative (CCM-D11). free_preview is auth-only.
    Video provider is YouTube in v1.0 (CCM-D10).
    """
    blocks = [b for b in (les.get("content_blocks") or []) if isinstance(b, dict)]
    explicit_kind = (les.get("kind") or "").lower()
    if explicit_kind not in VALID_LESSON_KINDS:
        explicit_kind = ""

    video_id = None
    video_provider = DEFAULT_VIDEO_PROVIDER
    video_params: dict = {}
    duration_seconds = int(les.get("estimated_duration_minutes") or 0) * 60
    body_parts: list[str] = []
    external_url = None
    questions: list[dict] = []
    consumed: set[int] = set()
    inferred = "text"

    for i, b in enumerate(blocks):
        t = b.get("type")
        if t == "video_clip" and video_id is None:
            video_id = b.get("video_id") or (b.get("video") or {}).get("provider_id")
            video_provider = _normalize_provider(
                b.get("provider") or (b.get("video") or {}).get("source")
            )
            video_params = b.get("params") or {}
            if b.get("duration_seconds"):
                duration_seconds = int(b["duration_seconds"])
            if not explicit_kind:
                inferred = "video"
            consumed.add(i)
        elif t == "notes":
            if b.get("body_md"):
                body_parts.append(str(b["body_md"]))
            consumed.add(i)
        elif t == "quiz" and not questions:
            questions = list(b.get("questions") or [])
            if not explicit_kind:
                inferred = "quiz"
            consumed.add(i)
        elif t == "external" and not external_url:
            external_url = b.get("url")
            if not explicit_kind:
                inferred = "external"
            consumed.add(i)
        elif t == "assignment":
            body_parts.append(str(b.get("instructions_md") or ""))
            if not explicit_kind:
                inferred = "text"
            consumed.add(i)
        elif t == "resource_link":
            if not explicit_kind:
                inferred = "download"
            consumed.add(i)

    kind = explicit_kind or inferred
    if kind not in VALID_LESSON_KINDS:
        kind = "text"

    extra = [blocks[i] for i in range(len(blocks)) if i not in consumed]
    return {
        "kind": kind,
        "video_id": video_id,
        "video_provider": DEFAULT_VIDEO_PROVIDER,
        "video_params": video_params,
        "body_md": "\n\n".join(body_parts) if body_parts else None,
        "external_url": external_url,
        "duration_seconds": duration_seconds or 0,
        "questions": questions,
        "extra_blocks": extra,
        "free_preview": bool(les.get("free_preview")),
        "title": les.get("title") or "Lesson",
        "slug": les.get("slug") or slugify(les.get("title") or "lesson"),
        "resource_ids": list(les.get("resource_ids") or []),
    }


def trailer_video_id(course: dict) -> str | None:
    t = course.get("trailer")
    if not t:
        return None
    if isinstance(t, dict):
        return t.get("provider_id") or t.get("video_id") or t.get("id")
    return str(t)


def banner_url(course: dict) -> str | None:
    b = course.get("banner")
    if not b:
        return None
    if isinstance(b, dict):
        return b.get("url")
    return str(b)


def iter_modules(course: dict) -> list[dict]:
    modules = list(course.get("modules") or [])
    if not modules and course.get("lessons"):
        modules = [
            {
                "id": "mod-default",
                "title": "Module 1",
                "description_md": "",
                "order": 0,
                "kind": "standard",
                "lessons": course.get("lessons") or [],
            }
        ]
    # sort by order
    return sorted(modules, key=lambda m: int(m.get("order") or 0))


# --- DB export / import -------------------------------------------------------


def export_course_document(cur, slug: str) -> dict:
    """Project live course → canonical document. cur is a dict cursor."""
    cur.execute(
        """SELECT id, slug, title, subtitle, description_md, level, status,
                  trailer_video_id, hero_image_url, card_color, certification_enabled,
                  created_at, published_at,
                  short_description, pathway_position, flagship, audience_category,
                  estimated_duration_minutes, learning_outcomes_json,
                  related_live_series_ids_json, model_instance_version
           FROM courses WHERE slug = %s""",
        (slug,),
    )
    row = cur.fetchone()
    if not row:
        raise CourseModelError(f"course {slug!r} not found")

    course_id = row["id"]
    cur.execute(
        """SELECT id, title, sort_order, kind, description_md
           FROM modules WHERE course_id = %s ORDER BY sort_order""",
        (course_id,),
    )
    mod_rows = cur.fetchall()

    modules_out = []
    resource_meta: dict[str, dict] = {}  # id -> lightweight resource pointer metadata

    def _note_resource(a: dict) -> str:
        aid = f"att-{a['id']}"
        resource_meta[aid] = {
            "id": aid,
            "title": a["title"],
            "kind": a["kind"],
            "url": a["url"],  # reference only — no binary (CCM-D12/D13)
            "free_preview": bool(a.get("free_preview")),
            "description_md": a.get("description_md"),
            "emoji": a.get("emoji"),
        }
        return aid

    for mi, mod in enumerate(mod_rows):
        cur.execute(
            """SELECT id, slug, title, sort_order, kind, video_provider, video_id,
                      video_params, duration_seconds, body_md, external_url,
                      free_preview, extra_blocks_json
               FROM lessons WHERE module_id = %s ORDER BY sort_order""",
            (mod["id"],),
        )
        lessons_out = []
        for li, les in enumerate(cur.fetchall()):
            les_dict = dict(les)
            quiz = None
            if les["kind"] == "quiz":
                cur.execute(
                    """SELECT kind, prompt_md, options_json, correct_json,
                              explanation_md, sort_order
                       FROM quiz_questions WHERE lesson_id = %s
                       ORDER BY sort_order""",
                    (les["id"],),
                )
                qs = []
                for q in cur.fetchall():
                    qs.append(
                        {
                            "kind": q["kind"],
                            "prompt_md": q["prompt_md"],
                            "options": _parse_json_maybe(q["options_json"]),
                            "correct": _parse_json_maybe(q["correct_json"]),
                            "explanation_md": q["explanation_md"],
                            "order": q["sort_order"],
                        }
                    )
                quiz = {"questions": qs}
            les_dict["quiz"] = quiz
            les_dict["video_params"] = _parse_json_maybe(les.get("video_params")) or {}
            les_dict["extra_blocks_json"] = les.get("extra_blocks_json")
            blocks = _lesson_fields_to_blocks(les_dict)
            # Lesson resources = pointers to generic Resource (attachment) type
            cur.execute(
                """SELECT id, title, kind, url, free_preview, description_md, emoji
                   FROM attachments
                   WHERE owner_type = 'lesson' AND owner_id = %s""",
                (les["id"],),
            )
            res_ids = [_note_resource(a) for a in cur.fetchall()]
            lkind = (les["kind"] or "video").lower()
            if lkind not in VALID_LESSON_KINDS:
                lkind = "video"
            lessons_out.append(
                {
                    "id": f"les-{mi+1}-{li+1}",
                    "title": les["title"],
                    "slug": les["slug"],
                    "order": les["sort_order"] if les["sort_order"] is not None else li,
                    "kind": lkind,
                    "free_preview": bool(les["free_preview"]),
                    "estimated_duration_minutes": (
                        int(les["duration_seconds"]) // 60
                        if les.get("duration_seconds")
                        else None
                    ),
                    "content_blocks": blocks,
                    "resource_ids": res_ids,
                }
            )
        modules_out.append(
            {
                "id": f"mod-{mi+1}",
                "title": mod["title"],
                "description_md": mod.get("description_md") or "",
                "order": mod["sort_order"] if mod["sort_order"] is not None else mi,
                "kind": mod["kind"] or "standard",
                "lessons": lessons_out,
            }
        )

    cur.execute(
        """SELECT cat.slug FROM course_categories cc
           JOIN categories cat ON cc.category_id = cat.id
           WHERE cc.course_id = %s""",
        (course_id,),
    )
    cat_slugs = [r["slug"] for r in cur.fetchall()]

    # Full instructor profiles (CCM-D14) — avatar_url is a URL reference, not bytes
    cur.execute(
        """SELECT i.id, i.name, i.bio_md, i.avatar_url, i.links_json
           FROM course_instructors ci
           JOIN instructors i ON ci.instructor_id = i.id
           WHERE ci.course_id = %s ORDER BY ci.sort_order""",
        (course_id,),
    )
    instructor_profiles = []
    instructor_refs = []
    for r in cur.fetchall():
        iid = f"inst-{r['id']}"
        links = _parse_json_maybe(r.get("links_json"))
        profile = {
            "id": iid,
            "instructor_id": r["id"],
            "name": r["name"],
            "bio_md": r.get("bio_md") or "",
            "avatar_url": r.get("avatar_url"),
            "links_json": links,
        }
        instructor_profiles.append(profile)
        instructor_refs.append(
            {"id": iid, "name": r["name"], "instructor_id": r["id"]}
        )

    cur.execute(
        """SELECT id, title, kind, url, free_preview, description_md, emoji
           FROM attachments WHERE owner_type = 'course' AND owner_id = %s""",
        (course_id,),
    )
    course_resource_ids = [_note_resource(a) for a in cur.fetchall()]
    bundle_resources = list(resource_meta.values())

    outcomes = _parse_json_maybe(row.get("learning_outcomes_json")) or []
    related = _parse_json_maybe(row.get("related_live_series_ids_json")) or []

    # Production enrichment from board if linked
    production = None
    cur.execute(
        """SELECT id, status, title FROM content_items
           WHERE placed_course_slug = %s ORDER BY id DESC LIMIT 1""",
        (slug,),
    )
    item = cur.fetchone()
    if item:
        production = {
            "status": item["status"],
            "content_item_id": item["id"],
            "placed_course_slug": slug,
            "guardian_flags": [],
            "approval_history": [],
        }

    created = row.get("created_at")
    created_s = created.isoformat() if hasattr(created, "isoformat") else None

    course = {
        "id": "course",
        "slug": row["slug"],
        "title": row["title"],
        "subtitle": row.get("subtitle") or "",
        "description_md": row.get("description_md") or "",
        "short_description": row.get("short_description") or "",
        "status": row["status"],
        "version": row.get("model_instance_version") or "1.0.0",
        "level": row["level"],
        "created_at": created_s,
        "category_slugs": cat_slugs,
        "instructor_refs": instructor_refs,
        "audience_category": row.get("audience_category") or "members",
        "pathway_position": row.get("pathway_position"),
        "flagship": bool(row.get("flagship")),
        "trailer": _trailer_ref(row.get("trailer_video_id")),
        "banner": _banner_ref(row.get("hero_image_url")),
        "card_color": row.get("card_color"),
        "certification_enabled": bool(row.get("certification_enabled")),
        "estimated_duration_minutes": row.get("estimated_duration_minutes"),
        "learning_outcomes": outcomes if isinstance(outcomes, list) else [],
        "modules": modules_out,
        "resource_ids": course_resource_ids,
        "related_live_series_ids": related if isinstance(related, list) else [],
        "seo": {
            "title": row["title"],
            "canonical_path": f"/courses/{row['slug']}",
        },
        "production": production,
    }

    return {
        "format": FORMAT,
        "model_version": MODEL_VERSION,
        "exported_at": _now_iso(),
        "source": {
            "course_id": course_id,
            "slug": slug,
            "runtime_status": row["status"],
        },
        "course": course,
        "bundle": {
            "resources": bundle_resources,
            "instructors": instructor_profiles,
        },
    }


def import_document(
    cur,
    document: dict,
    *,
    mode: str = "create_draft",
    target_slug: str | None = None,
    validate_mode: str = "structural",
) -> dict:
    """Materialize document into MySQL. Uses existing transaction cursor."""
    doc = normalize_document(document)
    # Load category slugs for env-aware validate
    cur.execute("SELECT slug FROM categories")
    cat_slugs = [r["slug"] for r in cur.fetchall()]
    report = validate(doc, mode=validate_mode, resolve_env={"category_slugs": cat_slugs})
    if not report["ok"]:
        raise CourseModelError("validation failed", detail=report)

    course = doc.get("course") or {}
    modules = iter_modules(course)
    desired_slug = target_slug or course.get("slug") or slugify(course.get("title") or "course")
    desired_slug = slugify(desired_slug)

    key_map: dict[str, int] = {}
    course_id = None
    slug = desired_slug

    if mode == "replace_draft":
        if not target_slug and not course.get("slug"):
            raise CourseModelError("replace_draft requires target_slug")
        slug = slugify(target_slug or course.get("slug"))
        cur.execute("SELECT id, status FROM courses WHERE slug = %s", (slug,))
        crow = cur.fetchone()
        if not crow:
            raise CourseModelError(f"target course {slug!r} not found")
        if crow["status"] != "draft":
            raise CourseModelError(
                f"course {slug!r} is {crow['status']}; refuse to replace non-draft",
                detail={"code": "PUBLISHED_REPLACE_FORBIDDEN"},
            )
        course_id = crow["id"]
        _wipe_course_graph(cur, course_id)
        _update_course_row(cur, course_id, course, status="draft")
    else:
        # create_draft (or publish after create)
        cur.execute("SELECT slug FROM courses")
        taken = {r["slug"] for r in cur.fetchall()}
        base = desired_slug
        slug = base
        n = 2
        while slug in taken:
            slug = f"{base}-{n}"
            n += 1
        course_id = _insert_course_row(cur, slug, course, status="draft")

    key_map[str(course.get("id") or "course")] = course_id

    # Categories
    for s in course.get("category_slugs") or []:
        cur.execute("SELECT id FROM categories WHERE slug = %s", (s,))
        crow = cur.fetchone()
        if not crow:
            raise CourseModelError(f"category {s!r} not found")
        cur.execute(
            """INSERT IGNORE INTO course_categories (course_id, category_id)
               VALUES (%s, %s)""",
            (course_id, crow["id"]),
        )

    bundle = doc.get("bundle") or {}
    res_by_id = {
        r["id"]: r
        for r in (bundle.get("resources") or [])
        if isinstance(r, dict) and r.get("id")
    }
    inst_by_id = {
        str(p.get("id")): p
        for p in (bundle.get("instructors") or [])
        if isinstance(p, dict) and p.get("id")
    }
    # also index by instructor_id and name
    for p in bundle.get("instructors") or []:
        if not isinstance(p, dict):
            continue
        if p.get("instructor_id") is not None:
            inst_by_id[f"pid:{p['instructor_id']}"] = p
        if p.get("name"):
            inst_by_id[f"name:{(p['name'] or '').strip().lower()}"] = p

    def _resolve_or_create_instructor(iref: dict) -> int:
        """Match platform id / name, else create from bundle profile (CCM-D14)."""
        if not isinstance(iref, dict):
            raise CourseModelError(f"instructor ref invalid: {iref!r}")
        if iref.get("instructor_id"):
            cur.execute(
                "SELECT id FROM instructors WHERE id = %s",
                (int(iref["instructor_id"]),),
            )
            r = cur.fetchone()
            if r:
                return int(r["id"])
        name = (iref.get("name") or "").strip()
        if name:
            cur.execute(
                "SELECT id FROM instructors WHERE name = %s LIMIT 1",
                (name,),
            )
            r = cur.fetchone()
            if r:
                # Optionally refresh bio/avatar from bundle
                profile = (
                    inst_by_id.get(str(iref.get("id") or ""))
                    or inst_by_id.get(f"name:{name.lower()}")
                )
                if profile:
                    cur.execute(
                        """UPDATE instructors SET
                             bio_md = COALESCE(%s, bio_md),
                             avatar_url = COALESCE(%s, avatar_url),
                             links_json = COALESCE(%s, links_json)
                           WHERE id = %s""",
                        (
                            profile.get("bio_md") or None,
                            profile.get("avatar_url") or None,
                            json.dumps(profile["links_json"])
                            if profile.get("links_json") is not None
                            else None,
                            r["id"],
                        ),
                    )
                return int(r["id"])

        profile = (
            inst_by_id.get(str(iref.get("id") or ""))
            or (inst_by_id.get(f"name:{name.lower()}") if name else None)
            or iref
        )
        create_name = (profile.get("name") or name or "Instructor").strip()
        links = profile.get("links_json")
        cur.execute(
            """INSERT INTO instructors (name, bio_md, avatar_url, links_json)
               VALUES (%s, %s, %s, %s)""",
            (
                create_name,
                profile.get("bio_md") or None,
                profile.get("avatar_url") or None,
                json.dumps(links) if links is not None else None,
            ),
        )
        return int(cur.lastrowid)

    def _attach_resource(owner_type: str, owner_id: int, rid: str) -> None:
        res = res_by_id.get(rid)
        if not res:
            # Pointer with no metadata: cannot materialize without a url reference
            raise CourseModelError(
                f"resource {rid!r} not found in bundle.resources "
                "(resources are pointers; include metadata with url ref for import)"
            )
        if not res.get("url"):
            raise CourseModelError(f"resource {rid!r} missing url reference")
        cur.execute(
            """INSERT INTO attachments
               (owner_type, owner_id, title, kind, url, free_preview,
                description_md, emoji)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                owner_type,
                owner_id,
                res.get("title") or rid,
                res.get("kind") or "link",
                res["url"],
                1 if res.get("free_preview") else 0,
                res.get("description_md"),
                res.get("emoji"),
            ),
        )
        key_map[rid] = cur.lastrowid

    # Instructors (full profiles from bundle when creating)
    for ii, iref in enumerate(course.get("instructor_refs") or []):
        iid = _resolve_or_create_instructor(iref if isinstance(iref, dict) else {"name": str(iref)})
        cur.execute(
            """INSERT IGNORE INTO course_instructors (course_id, instructor_id, sort_order)
               VALUES (%s, %s, %s)""",
            (course_id, iid, ii),
        )

    for mi, mod in enumerate(modules):
        cur.execute(
            """INSERT INTO modules (course_id, title, sort_order, kind, description_md)
               VALUES (%s, %s, %s, %s, %s)""",
            (
                course_id,
                mod.get("title") or f"Module {mi+1}",
                int(mod.get("order") if mod.get("order") is not None else mi),
                mod.get("kind") if mod.get("kind") in VALID_MODULE_KINDS else "standard",
                mod.get("description_md") or None,
            ),
        )
        module_id = cur.lastrowid
        key_map[str(mod.get("id") or f"mod-{mi+1}")] = module_id
        for li, les in enumerate(mod.get("lessons") or []):
            fields = materialize_lesson_fields(les)
            lslug = fields["slug"][:255]
            cur.execute(
                "SELECT slug FROM lessons WHERE module_id = %s",
                (module_id,),
            )
            taken_l = {r["slug"] for r in cur.fetchall()}
            base_l = lslug
            n = 2
            while lslug in taken_l:
                lslug = f"{base_l}-{n}"[:255]
                n += 1
            params_json = (
                json.dumps(fields["video_params"]) if fields["video_params"] else None
            )
            extra_json = (
                json.dumps(fields["extra_blocks"]) if fields["extra_blocks"] else None
            )
            cur.execute(
                """INSERT INTO lessons
                   (module_id, slug, title, sort_order, kind,
                    video_provider, video_id, video_params, body_md, free_preview,
                    duration_seconds, external_url, extra_blocks_json)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    module_id,
                    lslug,
                    fields["title"][:512],
                    int(les.get("order") if les.get("order") is not None else li),
                    fields["kind"],
                    DEFAULT_VIDEO_PROVIDER,
                    fields["video_id"],
                    params_json,
                    fields["body_md"],
                    1 if fields["free_preview"] else 0,
                    fields["duration_seconds"],
                    fields["external_url"],
                    extra_json,
                ),
            )
            lesson_id = cur.lastrowid
            key_map[str(les.get("id") or f"les-{mi+1}-{li+1}")] = lesson_id
            for qi, q in enumerate(fields["questions"]):
                cur.execute(
                    """INSERT INTO quiz_questions
                       (lesson_id, sort_order, kind, prompt_md, options_json,
                        correct_json, explanation_md)
                       VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        lesson_id,
                        int(q.get("order") if q.get("order") is not None else qi),
                        q.get("kind") or "multiple_choice",
                        q.get("prompt_md") or "",
                        json.dumps(q.get("options")) if q.get("options") is not None else None,
                        json.dumps(q.get("correct")) if q.get("correct") is not None else json.dumps(0),
                        q.get("explanation_md"),
                    ),
                )
            # Lesson-level resource pointers
            for rid in fields.get("resource_ids") or les.get("resource_ids") or []:
                _attach_resource("lesson", lesson_id, rid)

    # Course-level resources (pointers + metadata refs)
    for rid in course.get("resource_ids") or []:
        _attach_resource("course", course_id, rid)

    if mode == "publish":
        pub_report = validate(
            doc, mode="publish", resolve_env={"category_slugs": cat_slugs}
        )
        if not pub_report["ok"]:
            raise CourseModelError("publish validation failed", detail=pub_report)
        cur.execute(
            """UPDATE courses SET status = 'published',
                   published_at = COALESCE(published_at, NOW())
               WHERE id = %s""",
            (course_id,),
        )
        status = "published"
    else:
        status = "draft"

    return {
        "slug": slug,
        "course_id": course_id,
        "status": status,
        "validation": report,
        "key_map": key_map,
        "admin_url": f"/courses/{slug}",
    }


def _wipe_course_graph(cur, course_id: int) -> None:
    cur.execute("SELECT id FROM modules WHERE course_id = %s", (course_id,))
    mod_ids = [r["id"] for r in cur.fetchall()]
    if mod_ids:
        placeholders = ",".join(["%s"] * len(mod_ids))
        cur.execute(
            f"SELECT id FROM lessons WHERE module_id IN ({placeholders})",
            mod_ids,
        )
        lesson_ids = [r["id"] for r in cur.fetchall()]
        if lesson_ids:
            ph2 = ",".join(["%s"] * len(lesson_ids))
            cur.execute(
                f"DELETE FROM quiz_questions WHERE lesson_id IN ({ph2})",
                lesson_ids,
            )
            cur.execute(
                f"DELETE FROM attachments WHERE owner_type = 'lesson' AND owner_id IN ({ph2})",
                lesson_ids,
            )
            cur.execute(
                f"DELETE FROM lessons WHERE id IN ({ph2})",
                lesson_ids,
            )
        cur.execute(
            f"DELETE FROM modules WHERE id IN ({placeholders})",
            mod_ids,
        )
    cur.execute(
        "DELETE FROM attachments WHERE owner_type = 'course' AND owner_id = %s",
        (course_id,),
    )
    cur.execute("DELETE FROM course_categories WHERE course_id = %s", (course_id,))
    cur.execute("DELETE FROM course_instructors WHERE course_id = %s", (course_id,))


def _course_column_values(course: dict, *, status: str) -> dict:
    outcomes = course.get("learning_outcomes") or []
    related = course.get("related_live_series_ids") or []
    return {
        "title": (course.get("title") or "Untitled")[:512],
        "subtitle": (course.get("subtitle") or "")[:1024],
        "description_md": course.get("description_md") or "",
        "short_description": (course.get("short_description") or "")[:1024] or None,
        "level": course.get("level") if course.get("level") in VALID_LEVELS else "beginner",
        "status": status,
        "trailer_video_id": trailer_video_id(course),
        "trailer_provider": DEFAULT_VIDEO_PROVIDER,
        "hero_image_url": banner_url(course),
        "card_color": course.get("card_color"),
        "certification_enabled": 1 if course.get("certification_enabled") else 0,
        "pathway_position": course.get("pathway_position"),
        "flagship": 1 if course.get("flagship") else 0,
        "audience_category": (
            course.get("audience_category")
            if course.get("audience_category") in VALID_AUDIENCE
            else "members"
        ),
        "estimated_duration_minutes": course.get("estimated_duration_minutes"),
        "learning_outcomes_json": json.dumps(outcomes) if outcomes else None,
        "related_live_series_ids_json": json.dumps(related) if related else None,
        "model_instance_version": course.get("version") or "1.0.0",
    }


def _insert_course_row(cur, slug: str, course: dict, *, status: str) -> int:
    v = _course_column_values(course, status=status)
    cur.execute(
        """INSERT INTO courses
           (slug, title, subtitle, description_md, short_description, level, status,
            trailer_video_id, trailer_provider, hero_image_url, card_color, certification_enabled,
            pathway_position, flagship, audience_category, estimated_duration_minutes,
            learning_outcomes_json, related_live_series_ids_json, model_instance_version)
           VALUES
           (%(slug)s, %(title)s, %(subtitle)s, %(description_md)s, %(short_description)s,
            %(level)s, %(status)s, %(trailer_video_id)s, %(trailer_provider)s,
            %(hero_image_url)s, %(card_color)s,
            %(certification_enabled)s, %(pathway_position)s, %(flagship)s,
            %(audience_category)s, %(estimated_duration_minutes)s,
            %(learning_outcomes_json)s, %(related_live_series_ids_json)s,
            %(model_instance_version)s)""",
        {**v, "slug": slug},
    )
    return cur.lastrowid


def _update_course_row(cur, course_id: int, course: dict, *, status: str) -> None:
    v = _course_column_values(course, status=status)
    cur.execute(
        """UPDATE courses SET
             title = %(title)s, subtitle = %(subtitle)s,
             description_md = %(description_md)s,
             short_description = %(short_description)s,
             level = %(level)s, status = %(status)s,
             trailer_video_id = %(trailer_video_id)s,
             trailer_provider = %(trailer_provider)s,
             hero_image_url = %(hero_image_url)s,
             card_color = %(card_color)s,
             certification_enabled = %(certification_enabled)s,
             pathway_position = %(pathway_position)s,
             flagship = %(flagship)s,
             audience_category = %(audience_category)s,
             estimated_duration_minutes = %(estimated_duration_minutes)s,
             learning_outcomes_json = %(learning_outcomes_json)s,
             related_live_series_ids_json = %(related_live_series_ids_json)s,
             model_instance_version = %(model_instance_version)s
           WHERE id = %(course_id)s""",
        {**v, "course_id": course_id},
    )
