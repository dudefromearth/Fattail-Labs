"""Agent runtime — load bench charters and run task-shaped completions.

Gives life to P2 studio agents through the model interface (Grok primary).
Does not invent work: callers supply inputs; Quebec (or tests) supply the task.

See Specs/FatTail-Labs-Agent-Model-Interface-Spec-v1.0.md § agent runtime (v1.1 notes).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ai.client import complete
from ai.config import AIConfig, get_ai_config
from ai.types import AiError, CompletionResult, Message

# server/ai/agents.py → server/ → repo root
_REPO_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_BENCH = _REPO_ROOT / "agents" / "bench"

# Studio + guardian agents expected to perform LLM-backed tasks in P2.
STUDIO_AGENTS = frozenset(
    {
        "quebec",
        "bravo",
        "november",
        "romeo",
        "papa",
        "hotel",
        "victor",
        "whiskey",
        "yankee",
        "tango",
    }
)


@dataclass(frozen=True)
class TaskSpec:
    """One executable task an agent can perform."""

    id: str
    description: str
    # Placeholders in braces become required input keys, e.g. {intent}
    user_template: str
    # Substrings that must appear in the model output (case-insensitive)
    required_markers: tuple[str, ...] = ()
    # Prefer primary unless a test or env overrides via complete()
    prefer: str = "primary"


@dataclass(frozen=True)
class AgentTaskResult:
    callsign: str
    task_id: str
    text: str
    provider: str
    model: str
    usage: dict[str, int] = field(default_factory=dict)
    charter_path: str = ""
    markers_found: tuple[str, ...] = ()


# Canonical task catalog — characterization targets for "can perform their job".
AGENT_TASKS: dict[str, dict[str, TaskSpec]] = {
    "quebec": {
        "seed_from_backlog": TaskSpec(
            id="seed_from_backlog",
            description="Translate a queued backlog item into an executable seed packet",
            user_template=(
                "Backlog item ID: {item_id}\n"
                "Title: {title}\n"
                "Administrator intent: {intent}\n"
                "Content Vision summary: {vision}\n\n"
                "Produce a seed packet with these exact section headers:\n"
                "## Seed Contract\n## Stage Pipeline\n## Guardian Checkpoints\n"
                "## Acceptance Criteria\n"
            ),
            required_markers=(
                "## Seed Contract",
                "## Stage Pipeline",
                "## Guardian Checkpoints",
                "## Acceptance Criteria",
            ),
        ),
        "approval_package_checklist": TaskSpec(
            id="approval_package_checklist",
            description="Assemble an approval-package checklist from stage artifacts",
            user_template=(
                "Item: {title}\nArtifacts present: {artifacts}\n"
                "Guardian flags: {flags}\n\n"
                "Produce:\n## Package Complete\n## Missing Items\n## Ready For Approval\n"
                "(Ready For Approval must be YES or NO)\n"
            ),
            required_markers=(
                "## Package Complete",
                "## Missing Items",
                "## Ready For Approval",
            ),
        ),
    },
    "bravo": {
        "research_pack": TaskSpec(
            id="research_pack",
            description="Build a claims-grounded research pack from source material",
            user_template=(
                "Intent: {intent}\n"
                "Source material:\n{source}\n\n"
                "Produce a research pack with exact headers:\n"
                "## Sources\n## Claims Inventory\n## Misconceptions\n"
                "## Forbidden Risk List\n## Prior Art\n## Open Questions\n"
                "Every claim in Claims Inventory must include a source reference.\n"
                "Process outcomes only — no profit claims.\n"
            ),
            required_markers=(
                "## Sources",
                "## Claims Inventory",
                "## Misconceptions",
                "## Forbidden Risk List",
                "## Prior Art",
                "## Open Questions",
            ),
        ),
    },
    "november": {
        "lesson_plan": TaskSpec(
            id="lesson_plan",
            description="Design a lesson plan from a research pack (outcome-first)",
            user_template=(
                "Module intent: {intent}\n"
                "Research pack summary:\n{research}\n\n"
                "Produce a lesson plan with exact headers:\n"
                "## Learning Outcomes\n## Prerequisites\n## Lesson Beats\n"
                "## Practice CFU\n## Resources\n## Free Preview Notes\n"
                "Include at least one practice/check-for-understanding beat.\n"
            ),
            required_markers=(
                "## Learning Outcomes",
                "## Prerequisites",
                "## Lesson Beats",
                "## Practice CFU",
                "## Resources",
            ),
        ),
    },
    "romeo": {
        "lesson_script": TaskSpec(
            id="lesson_script",
            description="Write a plan-locked lesson VO script",
            user_template=(
                "Cast: {cast}\n"
                "Lesson plan:\n{lesson_plan}\n\n"
                "Write a VO script with exact headers:\n"
                "## Cast\n## Timing\n## Voiceover\n## On-Screen\n## Production Notes\n"
                "Process outcomes only. No profit claims.\n"
            ),
            required_markers=(
                "## Cast",
                "## Timing",
                "## Voiceover",
                "## On-Screen",
                "## Production Notes",
            ),
        ),
        "coaching_short_script": TaskSpec(
            id="coaching_short_script",
            description="Write a single-beat coaching short script",
            user_template=(
                "Moment: {moment}\nDoctrine notes: {doctrine}\n\n"
                "Produce:\n## Hook\n## Claim\n## Close\n## CTA\n"
                "One primary claim only. Process outcomes only.\n"
            ),
            required_markers=("## Hook", "## Claim", "## Close"),
        ),
    },
    "papa": {
        "placement_proposal": TaskSpec(
            id="placement_proposal",
            description="Build Labs + YouTube placement proposal from approved script metadata",
            user_template=(
                "Script title: {title}\n"
                "Cast: {cast}\n"
                "Format: {format}\n"
                "Duration target: {duration}\n"
                "HeyGen session/video ids (if any): {heygen_ids}\n\n"
                "Produce:\n## Asset Provenance\n## YouTube Package\n"
                "## Labs Placement\n## Human Gate Required\n"
            ),
            required_markers=(
                "## Asset Provenance",
                "## YouTube Package",
                "## Labs Placement",
                "## Human Gate Required",
            ),
        ),
    },
    "hotel": {
        "accuracy_review": TaskSpec(
            id="accuracy_review",
            description="Review trading claims for accuracy and risk framing",
            user_template=(
                "Work product type: {work_type}\n"
                "Content to review:\n{content}\n\n"
                "Produce:\n## Verdict\n(APPROVED or BLOCKED)\n"
                "## Claim Findings\n## Risk Framing\n## Required Fixes\n"
            ),
            required_markers=(
                "## Verdict",
                "## Claim Findings",
                "## Risk Framing",
                "## Required Fixes",
            ),
        ),
    },
    "victor": {
        "lineage_review": TaskSpec(
            id="lineage_review",
            description="Taleb-lineage fidelity review",
            user_template=(
                "Content:\n{content}\n\n"
                "Review for antifragility, skin in the game, via negativa, narrative fallacy.\n"
                "Produce:\n## Verdict\n(APPROVED or BLOCKED or RETURNED)\n"
                "## Concepts Used\n## Misuse\n## Required Fixes\n"
                "No invented quotes.\n"
            ),
            required_markers=(
                "## Verdict",
                "## Concepts Used",
                "## Misuse",
                "## Required Fixes",
            ),
        ),
    },
    "whiskey": {
        "lineage_review": TaskSpec(
            id="lineage_review",
            description="Spitznagel-lineage strategy fidelity review",
            user_template=(
                "Content:\n{content}\n\n"
                "Review for capital preservation as strategy, cost of insurance, "
                "ruin-first framing, process vs panic hedging.\n"
                "Produce:\n## Verdict\n(APPROVED or BLOCKED or RETURNED)\n"
                "## Strategy Checks\n## Forbidden Frames\n## Required Fixes\n"
            ),
            required_markers=(
                "## Verdict",
                "## Strategy Checks",
                "## Forbidden Frames",
                "## Required Fixes",
            ),
        ),
    },
    "yankee": {
        "lineage_review": TaskSpec(
            id="lineage_review",
            description="Mandelbrot-lineage fat-tail fidelity review",
            user_template=(
                "Content:\n{content}\n\n"
                "Review for fat tails, discontinuity, mild-Gaussian smuggling.\n"
                "Produce:\n## Verdict\n(APPROVED or BLOCKED or RETURNED)\n"
                "## Randomness Framing\n## Mild Randomness Issues\n## Required Fixes\n"
            ),
            required_markers=(
                "## Verdict",
                "## Randomness Framing",
                "## Mild Randomness Issues",
                "## Required Fixes",
            ),
        ),
    },
    "tango": {
        "member_experience_review": TaskSpec(
            id="member_experience_review",
            description="Member archetype / capacity-over-dependency review",
            user_template=(
                "Content or flow:\n{content}\n\n"
                "Walk as a bleeding trader short on trust and time.\n"
                "Produce:\n## Verdict\n(APPROVED or BLOCKED)\n"
                "## Cognitive Load\n## Capacity Over Dependency\n"
                "## Honesty\n## Required Fixes\n"
            ),
            required_markers=(
                "## Verdict",
                "## Cognitive Load",
                "## Capacity Over Dependency",
                "## Honesty",
            ),
        ),
    },
}


def bench_dir(root: Path | None = None) -> Path:
    return (root or _DEFAULT_BENCH).resolve()


def list_seated_agents(root: Path | None = None) -> list[str]:
    """Callsigns with both a charter file and a task catalog entry."""
    d = bench_dir(root)
    seated: list[str] = []
    for callsign in sorted(STUDIO_AGENTS):
        if (d / f"{callsign}.md").is_file() and callsign in AGENT_TASKS:
            seated.append(callsign)
    return seated


def list_tasks(callsign: str) -> list[str]:
    cs = callsign.strip().lower()
    if cs not in AGENT_TASKS:
        raise AiError(f"unknown agent or no tasks registered: {callsign!r}")
    return sorted(AGENT_TASKS[cs].keys())


def load_charter(callsign: str, *, root: Path | None = None) -> str:
    cs = callsign.strip().lower()
    path = bench_dir(root) / f"{cs}.md"
    if not path.is_file():
        raise AiError(f"missing agent charter: {path}")
    text = path.read_text(encoding="utf-8")
    if not text.strip():
        raise AiError(f"empty agent charter: {path}")
    return text


def _template_keys(template: str) -> list[str]:
    return re.findall(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}", template)


def build_messages(
    callsign: str,
    task_id: str,
    inputs: dict[str, Any],
    *,
    root: Path | None = None,
) -> tuple[list[Message], TaskSpec, Path]:
    cs = callsign.strip().lower()
    if cs not in AGENT_TASKS:
        raise AiError(f"unknown agent or no tasks registered: {callsign!r}")
    tasks = AGENT_TASKS[cs]
    if task_id not in tasks:
        raise AiError(
            f"unknown task {task_id!r} for agent {cs}; "
            f"known: {sorted(tasks)}"
        )
    spec = tasks[task_id]
    for key in _template_keys(spec.user_template):
        if key not in inputs or inputs[key] is None or str(inputs[key]).strip() == "":
            raise AiError(f"missing required input {key!r} for task {task_id}")

    charter_path = bench_dir(root) / f"{cs}.md"
    charter = load_charter(cs, root=root)

    system = (
        f"You are the FatTail Labs agent {cs.upper()}.\n"
        f"Follow your charter. Do not invent sources. Process outcomes only — "
        f"never profit claims. Capacity over dependency.\n\n"
        f"--- CHARTER ---\n{charter}\n--- END CHARTER ---\n\n"
        f"Task: {spec.id} — {spec.description}\n"
        f"Respond with the exact section headers requested in the user message."
    )
    user = spec.user_template.format(**{k: str(inputs[k]) for k in _template_keys(spec.user_template)})
    return (
        [Message(role="system", content=system), Message(role="user", content=user)],
        spec,
        charter_path,
    )


def _markers_present(text: str, markers: tuple[str, ...]) -> tuple[str, ...]:
    lower = text.lower()
    found = []
    for m in markers:
        if m.lower() in lower:
            found.append(m)
    return tuple(found)


def validate_task_output(text: str, spec: TaskSpec) -> tuple[str, ...]:
    """Return markers found; raise AiError if any required marker missing."""
    if not text or not text.strip():
        raise AiError("agent produced empty output")
    found = _markers_present(text, spec.required_markers)
    missing = [m for m in spec.required_markers if m not in found]
    if missing:
        raise AiError(
            f"agent output missing required sections: {missing}; "
            f"found={list(found)}"
        )
    return found


def run_agent_task(
    callsign: str,
    task_id: str,
    inputs: dict[str, Any],
    *,
    root: Path | None = None,
    prefer: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 4096,
    cfg: AIConfig | None = None,
    providers: dict | None = None,
) -> AgentTaskResult:
    """Load charter, build task messages, complete via model interface, validate."""
    messages, spec, charter_path = build_messages(
        callsign, task_id, inputs, root=root
    )
    # Only pass prefer when the caller sets it; otherwise complete() resolves
    # agent env overrides (LABS_AI_AGENT_<CS>_PREFER) then defaults to primary.
    complete_kwargs: dict = {
        "agent": callsign.strip().lower(),
        "temperature": temperature,
        "max_tokens": max_tokens,
        "cfg": cfg,
        "providers": providers,
    }
    if prefer is not None:
        complete_kwargs["prefer"] = prefer
    elif spec.prefer != "primary":
        complete_kwargs["prefer"] = spec.prefer

    result: CompletionResult = complete(messages, **complete_kwargs)
    found = validate_task_output(result.text, spec)
    return AgentTaskResult(
        callsign=callsign.strip().lower(),
        task_id=task_id,
        text=result.text,
        provider=result.provider,
        model=result.model,
        usage=dict(result.usage or {}),
        charter_path=str(charter_path),
        markers_found=found,
    )


def default_fixture_inputs(callsign: str, task_id: str) -> dict[str, str]:
    """Deterministic fixtures for characterization tests (and dry runs)."""
    cs = callsign.strip().lower()
    fixtures: dict[str, dict[str, dict[str, str]]] = {
        "quebec": {
            "seed_from_backlog": {
                "item_id": "BL-1001",
                "title": "Defined-risk butterflies free-preview lesson",
                "intent": "Turn webinar notes into one free-preview lesson on defined risk.",
                "vision": "Stop the bleeding first; process outcomes only; pathway through flagship.",
            },
            "approval_package_checklist": {
                "title": "Defined-risk butterflies free-preview",
                "artifacts": "research_pack, lesson_plan, script, captions",
                "flags": "none",
            },
        },
        "bravo": {
            "research_pack": {
                "intent": "Free-preview lesson: define max loss before entry.",
                "source": (
                    "Webinar excerpt: defined-risk structures bound loss to debit paid. "
                    "Misconception: iron condors are always 'safe'. Doctrine: process over P&L."
                ),
            },
        },
        "november": {
            "lesson_plan": {
                "intent": "One lesson: name max loss before placing a butterfly.",
                "research": (
                    "Claims: max loss = net debit for long butterfly (source: webinar). "
                    "Misconception: unlimited profit frames."
                ),
            },
        },
        "romeo": {
            "lesson_script": {
                "cast": "AVATAR-COACH",
                "lesson_plan": (
                    "Outcomes: learner can state max loss before entry. "
                    "Beats: hook, define debit risk, worked example, CFU worksheet."
                ),
            },
            "coaching_short_script": {
                "moment": "Member wants to size up after one green day.",
                "doctrine": "Process streak over P&L; capacity over dependency.",
            },
        },
        "papa": {
            "placement_proposal": {
                "title": "Define max loss first",
                "cast": "AVATAR-COACH",
                "format": "course_lesson",
                "duration": "6:00",
                "heygen_ids": "session=demo video=demo",
            },
        },
        "hotel": {
            "accuracy_review": {
                "work_type": "lesson_script",
                "content": (
                    "VO: A long butterfly's maximum loss is the net debit paid "
                    "if held to structure assumptions; risk is defined before entry."
                ),
            },
        },
        "victor": {
            "lineage_review": {
                "content": (
                    "We teach via negativa: stop unbounded loss first. "
                    "Skin in the game: advisors do not transfer ruin to the student."
                ),
            },
        },
        "whiskey": {
            "lineage_review": {
                "content": (
                    "Crash protection is insurance with a cost; ruin avoidance is the first job. "
                    "No free crash hedge."
                ),
            },
        },
        "yankee": {
            "lineage_review": {
                "content": (
                    "Markets jump; variance understates ruin. Fat tails are not a slogan."
                ),
            },
        },
        "tango": {
            "member_experience_review": {
                "content": (
                    "Free preview ends with a respectful sign-in prompt, not a shame wall. "
                    "CTA teaches the next process step."
                ),
            },
        },
    }
    if cs not in fixtures or task_id not in fixtures[cs]:
        raise AiError(f"no default fixture for {cs}/{task_id}")
    return dict(fixtures[cs][task_id])


def synthetic_success_output(spec: TaskSpec) -> str:
    """Minimal valid body for fake-provider tests (includes all required markers)."""
    lines = [f"(synthetic task output for {spec.id})", ""]
    for m in spec.required_markers:
        lines.append(m)
        lines.append("placeholder content for characterization.")
        lines.append("")
    if "## Verdict" in spec.required_markers:
        # ensure verdict line exists under header
        lines.append("APPROVED")
    if "## Ready For Approval" in spec.required_markers:
        lines.append("YES")
    return "\n".join(lines)
