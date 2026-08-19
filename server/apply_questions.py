"""Server-owned apply questions.

Types: continue | free_text | binary | radio | calendar.
Content checks are real. Do not invent AC field ids.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from apply_invite import is_when_valid
from apply_score import option_labels, option_objects
from apply_slots import list_live

log = logging.getLogger("labs.apply_questions")

QUESTION_TYPES = ("continue", "free_text", "binary", "radio", "calendar")
COLE_FIELD_IDS = {
    "HELL": "3",
    "HEAVEN": "4",
    "MONEY_TIMING": "5",
    "COACHING_SKU": "6",
    "ELEVEN_AM_ET": "7",
    "TRIED": "8",
    "PARTNER_SUPPORT": "9",
}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ApplyQuestionsError(Exception):
    pass


def _db():
    import db

    return db


def _parse_options(raw: Any) -> list[dict[str, Any]]:
    if raw is None or raw == "":
        return []
    data = raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return []
    if isinstance(data, list):
        return option_objects({"options": data})
    return []


def _row(raw: dict[str, Any]) -> dict[str, Any]:
    ac_key = (raw.get("ac_key") or "").strip() or None
    ac_field_id = (raw.get("ac_field_id") or "").strip() or None
    return {
        "id": int(raw["id"]),
        "slug": str(raw["slug"]),
        "ask": str(raw.get("ask") or ""),
        "hint": str(raw.get("hint") or ""),
        "qtype": str(raw.get("qtype") or ""),
        "options": _parse_options(raw.get("options_json")),
        "ac_key": ac_key,
        "ac_field_id": ac_field_id,
        "is_email": bool(int(raw.get("is_email") or 0)),
        "on_path": bool(int(raw["on_path"])) if "on_path" in raw else True,
        "sort_order": int(raw.get("sort_order") or 0),
    }


def public_payload(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": q["id"],
            "slug": q["slug"],
            "ask": q["ask"],
            "hint": q["hint"],
            "qtype": q["qtype"],
            "options": option_objects(q),
            "is_email": bool(q["is_email"]),
            "on_path": bool(q.get("on_path", True)),
            "sort_order": q["sort_order"],
        }
        for q in questions
    ]


def list_all() -> list[dict[str, Any]]:
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, slug, ask, hint, qtype, options_json, ac_key, "
                "ac_field_id, is_email, on_path, sort_order FROM apply_questions "
                "ORDER BY sort_order ASC, id ASC"
            )
            rows = cur.fetchall()
    return [_row(r) for r in rows]


def get_question(question_id: int) -> dict[str, Any] | None:
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, slug, ask, hint, qtype, options_json, ac_key, "
                "ac_field_id, is_email, on_path, sort_order FROM apply_questions "
                "WHERE id = %s",
                (int(question_id),),
            )
            row = cur.fetchone()
    return _row(row) if row else None


def content_check(
    question: dict[str, Any],
    value: str,
    *,
    live_slots: list[dict[str, Any]] | None = None,
) -> str | None:
    """Return a miss string, or None if the answer is valid."""
    qtype = str(question.get("qtype") or "")
    if qtype == "continue":
        return None
    raw = (value or "").strip()
    if qtype == "free_text":
        if question.get("is_email"):
            if not raw or len(raw) > 320 or not EMAIL_RE.match(raw):
                return "A valid email is required."
            return None
        if not raw:
            return "This answer is required."
        return None
    if qtype == "binary":
        options = option_labels(question)
        if len(options) != 2:
            return "This question is missing its two choices."
        if raw not in options:
            return "Pick one of the two choices."
        return None
    if qtype == "radio":
        options = option_labels(question)
        if len(options) < 2:
            return "This question needs two or more choices."
        if raw not in options:
            return "Pick one of the listed choices."
        return None
    if qtype == "calendar":
        slots = live_slots
        if slots is None:
            slots = list_live()
        live = [str(s.get("starts_et") or "").strip() for s in slots if s.get("starts_et")]
        if not live:
            return "No live conversation times are configured."
        if raw not in live or not is_when_valid(raw):
            return "Pick one of the listed times."
        return None
    return "This question cannot be answered."


def email_from_answers(
    questions: list[dict[str, Any]], answers: dict[str, str]
) -> str:
    for q in questions:
        if q.get("is_email"):
            return str(answers.get(q["slug"]) or "").strip().lower()
    return str(answers.get("email") or "").strip().lower()


def mapped_ac_answers(
    questions: list[dict[str, Any]], answers: dict[str, str]
) -> dict[str, str]:
    """Cole keys only. Do not invent new AC ids."""
    out: dict[str, str] = {}
    for q in questions:
        key = q.get("ac_key")
        fid = q.get("ac_field_id")
        if not key or not fid:
            continue
        if key not in COLE_FIELD_IDS or COLE_FIELD_IDS[key] != str(fid):
            continue
        if q.get("qtype") == "continue":
            continue
        out[str(key)] = str(answers.get(q["slug"]) or "").strip()
    return out


def _options_for_type(
    qtype: str, current: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    rows = option_objects({"options": current})
    if qtype == "binary":
        if len(rows) == 2:
            return rows
        if len(rows) > 2:
            return rows[:2]
        if len(rows) == 1:
            return rows + [{"label": "No", "outcome": "", "reveal": []}]
        return [
            {"label": "Yes", "outcome": "", "reveal": []},
            {"label": "No", "outcome": "", "reveal": []},
        ]
    if qtype == "radio":
        if len(rows) >= 2:
            return rows
        if len(rows) == 1:
            return rows + [{"label": "No", "outcome": "", "reveal": []}]
        return [
            {"label": "Yes", "outcome": "", "reveal": []},
            {"label": "No", "outcome": "", "reveal": []},
        ]
    return rows


def update_question(question_id: int, patch: dict[str, Any]) -> dict[str, Any]:
    current = get_question(int(question_id))
    if current is None:
        raise ApplyQuestionsError(f"apply question {question_id} not found")

    ask = current["ask"]
    hint = current["hint"]
    qtype = current["qtype"]
    options = option_objects(current)
    is_email = bool(current["is_email"])
    on_path = bool(current.get("on_path", True))

    if "ask" in patch:
        ask = str(patch.get("ask") or "").strip()
        if not ask:
            raise ApplyQuestionsError("ask is required")
    if "hint" in patch:
        hint = str(patch.get("hint") or "")
    if "qtype" in patch:
        nxt = str(patch.get("qtype") or "").strip()
        if nxt not in QUESTION_TYPES:
            raise ApplyQuestionsError(
                "qtype must be continue|free_text|binary|radio|calendar"
            )
        qtype = nxt
        options = _options_for_type(qtype, options)
        if qtype != "free_text":
            is_email = False
    if "options" in patch:
        options = option_objects({"options": patch.get("options") or []})
        if qtype == "binary" and len(options) != 2:
            raise ApplyQuestionsError("Binary choice needs exactly two options")
        if qtype == "radio" and len(options) < 2:
            raise ApplyQuestionsError("Radio needs two or more options")
    if "is_email" in patch:
        is_email = bool(patch.get("is_email"))
        if is_email and qtype != "free_text":
            raise ApplyQuestionsError("Only free text can be the email step")
    if "on_path" in patch:
        on_path = bool(patch.get("on_path"))

    options_json = json.dumps(options) if options else None
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            if is_email:
                cur.execute(
                    "UPDATE apply_questions SET is_email = 0 WHERE id <> %s",
                    (int(question_id),),
                )
            cur.execute(
                "UPDATE apply_questions SET ask = %s, hint = %s, qtype = %s, "
                "options_json = %s, is_email = %s, on_path = %s WHERE id = %s",
                (
                    ask,
                    hint,
                    qtype,
                    options_json,
                    1 if is_email else 0,
                    1 if on_path else 0,
                    int(question_id),
                ),
            )
            if cur.rowcount < 1:
                raise ApplyQuestionsError(f"apply question {question_id} not found")
    saved = get_question(int(question_id))
    if saved is None:
        raise ApplyQuestionsError(f"apply question {question_id} not found after write")
    return saved


def add_question() -> dict[str, Any]:
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COALESCE(MAX(sort_order), 0) AS m FROM apply_questions")
            row = cur.fetchone() or {}
            nxt = int(row.get("m") or 0) + 10
            cur.execute(
                "INSERT INTO apply_questions "
                "(slug, ask, hint, qtype, options_json, ac_key, ac_field_id, "
                "is_email, on_path, sort_order) "
                "VALUES (%s, %s, %s, %s, NULL, NULL, NULL, 0, 1, %s)",
                (f"qtmp-{nxt}", "New question", "", "free_text", nxt),
            )
            new_id = int(cur.lastrowid)
            slug = f"q_{new_id}"
            cur.execute(
                "UPDATE apply_questions SET slug = %s WHERE id = %s",
                (slug, new_id),
            )
    saved = get_question(new_id)
    if saved is None:
        raise ApplyQuestionsError("apply question insert miss after write")
    return saved


def delete_question(question_id: int) -> None:
    current = get_question(int(question_id))
    if current is None:
        raise ApplyQuestionsError(f"apply question {question_id} not found")
    if current.get("is_email"):
        others = [q for q in list_all() if q["id"] != current["id"] and q.get("is_email")]
        if not others:
            raise ApplyQuestionsError("Keep one email question")
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM apply_questions WHERE id = %s", (int(question_id),)
            )
            if cur.rowcount < 1:
                raise ApplyQuestionsError(f"apply question {question_id} not found")


def move_question(question_id: int, direction: str) -> list[dict[str, Any]]:
    rows = list_all()
    idx = next((i for i, q in enumerate(rows) if q["id"] == int(question_id)), -1)
    if idx < 0:
        raise ApplyQuestionsError(f"apply question {question_id} not found")
    swap = idx - 1 if direction == "up" else idx + 1
    if swap < 0 or swap >= len(rows):
        return rows
    rows[idx], rows[swap] = rows[swap], rows[idx]
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            for i, q in enumerate(rows):
                cur.execute(
                    "UPDATE apply_questions SET sort_order = %s WHERE id = %s",
                    ((i + 1) * 10, q["id"]),
                )
    return list_all()


def store_submission(
    email: str,
    questions: list[dict[str, Any]],
    answers: dict[str, str],
    *,
    ac_contact_id: str | None,
    ending: str | None = None,
) -> int:
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO apply_submissions (email, ac_contact_id, ending) "
                "VALUES (%s, %s, %s)",
                (email, ac_contact_id, ending),
            )
            sub_id = int(cur.lastrowid)
            for q in questions:
                if q.get("qtype") == "continue":
                    continue
                cur.execute(
                    "INSERT INTO apply_submission_answers "
                    "(submission_id, question_id, slug, value) "
                    "VALUES (%s, %s, %s, %s)",
                    (
                        sub_id,
                        int(q["id"]),
                        str(q["slug"]),
                        str(answers.get(q["slug"]) or "").strip(),
                    ),
                )
    return sub_id
