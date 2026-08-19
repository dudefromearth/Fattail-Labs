"""Apply endings and follow-ons.

No Typeform score sheet lives in this repo. The admin map is the SoR.
Until an option is tagged Coach / Lakesia / trial, Review + Accept stays.
Plurality of tagged answers wins. A tie is Trial (no meeting).
"""

from __future__ import annotations

from typing import Any

ENDINGS = ("coach", "lakesia", "trial")
TRIAL_URL = "https://fattail.ai/try"
TRIAL_PRICE = "$17/wk"
TRIAL_TERM = "six weeks"


class ApplyScoreError(Exception):
    pass


def _db():
    import db

    return db


def option_objects(question: dict[str, Any]) -> list[dict[str, Any]]:
    raw = question.get("options") or []
    out: list[dict[str, Any]] = []
    for item in raw:
        if isinstance(item, str):
            label = item.strip()
            if label:
                out.append({"label": label, "outcome": "", "reveal": []})
            continue
        if not isinstance(item, dict):
            continue
        label = str(item.get("label") or "").strip()
        if not label:
            continue
        outcome = str(item.get("outcome") or "").strip()
        if outcome not in ENDINGS:
            outcome = ""
        reveal: list[str] = []
        for slug in item.get("reveal") or []:
            s = str(slug).strip()
            if s and s not in reveal:
                reveal.append(s)
        out.append({"label": label, "outcome": outcome, "reveal": reveal})
    return out


def option_labels(question: dict[str, Any]) -> list[str]:
    return [o["label"] for o in option_objects(question)]


def match_option(
    question: dict[str, Any], value: str
) -> dict[str, Any] | None:
    raw = (value or "").strip()
    for opt in option_objects(question):
        if opt["label"] == raw:
            return opt
    return None


def endings_live(questions: list[dict[str, Any]]) -> bool:
    for q in questions:
        for opt in option_objects(q):
            if opt.get("outcome") in ENDINGS:
                return True
    return False


def walk_path(
    questions: list[dict[str, Any]],
    answers: dict[str, str] | None = None,
    *,
    skip_calendar: bool = False,
) -> list[dict[str, Any]]:
    """Default path = on_path questions in admin order. Answers may insert follow-ons."""
    answers = answers or {}
    by_slug = {q["slug"]: q for q in questions}

    def allow(q: dict[str, Any]) -> bool:
        if skip_calendar and q.get("qtype") == "calendar":
            return False
        return True

    queue = [
        q
        for q in questions
        if (q.get("on_path", True) and allow(q))
    ]
    seen: list[dict[str, Any]] = []
    queued = {q["slug"] for q in queue}
    i = 0
    while i < len(queue):
        q = queue[i]
        if any(s["slug"] == q["slug"] for s in seen):
            i += 1
            continue
        seen.append(q)
        opt = match_option(q, answers.get(q["slug"], ""))
        insert_at = i + 1
        if opt:
            for slug in opt.get("reveal") or []:
                nxt = by_slug.get(slug)
                if nxt is None or not allow(nxt):
                    continue
                if any(s["slug"] == nxt["slug"] for s in seen):
                    continue
                if nxt["slug"] in queued:
                    continue
                queue.insert(insert_at, nxt)
                queued.add(nxt["slug"])
                insert_at += 1
        i += 1
    return seen


def resolve_ending(
    questions: list[dict[str, Any]],
    answers: dict[str, str],
    *,
    tie_ending: str = "trial",
) -> str | None:
    """None = endings are not live. Otherwise coach | lakesia | trial."""
    if not endings_live(questions):
        return None
    tie = tie_ending if tie_ending in ENDINGS else "trial"
    votes = {key: 0 for key in ENDINGS}
    for q in walk_path(questions, answers, skip_calendar=True):
        opt = match_option(q, answers.get(q["slug"], ""))
        if not opt:
            continue
        outcome = opt.get("outcome") or ""
        if outcome in votes:
            votes[outcome] += 1
    if sum(votes.values()) == 0:
        return tie
    best = max(votes.values())
    winners = [key for key, n in votes.items() if n == best]
    if len(winners) != 1:
        return tie
    return winners[0]


def settings() -> dict[str, str]:
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT tie_ending, trial_url, trial_price, trial_term "
                "FROM apply_score_settings WHERE id = 1"
            )
            row = cur.fetchone()
    if not row:
        return {
            "tie_ending": "trial",
            "trial_url": TRIAL_URL,
            "trial_price": TRIAL_PRICE,
            "trial_term": TRIAL_TERM,
        }
    url = str(row.get("trial_url") or "").strip() or TRIAL_URL
    return {
        "tie_ending": str(row.get("tie_ending") or "trial").strip() or "trial",
        "trial_url": url,
        "trial_price": str(row.get("trial_price") or TRIAL_PRICE).strip()
        or TRIAL_PRICE,
        "trial_term": str(row.get("trial_term") or TRIAL_TERM).strip()
        or TRIAL_TERM,
    }


def list_hosts() -> list[dict[str, Any]]:
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT slug, display_name, organizer_name, organizer_email, "
                "sort_order FROM apply_hosts ORDER BY sort_order ASC, slug ASC"
            )
            rows = cur.fetchall() or []
    return [
        {
            "slug": str(r["slug"]),
            "display_name": str(r.get("display_name") or ""),
            "organizer_name": str(r.get("organizer_name") or ""),
            "organizer_email": str(r.get("organizer_email") or "").strip(),
            "sort_order": int(r.get("sort_order") or 0),
        }
        for r in rows
    ]


def get_host(slug: str) -> dict[str, Any]:
    key = (slug or "").strip()
    if key not in ("coach", "lakesia"):
        raise ApplyScoreError("host must be coach or lakesia")
    for host in list_hosts():
        if host["slug"] == key:
            return host
    raise ApplyScoreError(f"apply host {key} is not configured")


def update_host(slug: str, patch: dict[str, Any]) -> dict[str, Any]:
    current = get_host(slug)
    name = current["display_name"]
    organizer_name = current["organizer_name"]
    organizer_email = current["organizer_email"]
    if "display_name" in patch:
        name = str(patch.get("display_name") or "").strip()
        if not name:
            raise ApplyScoreError("display_name is required")
    if "organizer_name" in patch:
        organizer_name = str(patch.get("organizer_name") or "").strip()
        if not organizer_name:
            raise ApplyScoreError("organizer_name is required")
    if "organizer_email" in patch:
        organizer_email = str(patch.get("organizer_email") or "").strip()
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE apply_hosts SET display_name = %s, organizer_name = %s, "
                "organizer_email = %s WHERE slug = %s",
                (name, organizer_name, organizer_email, current["slug"]),
            )
            if cur.rowcount < 1:
                raise ApplyScoreError(f"apply host {slug} not found")
    return get_host(slug)


def public_hosts(hosts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {"slug": h["slug"], "display_name": h["display_name"]}
        for h in hosts
    ]
