"""Static knowledge pack for the Process Co-pilot.

Injected every turn so Grok can reason over taxonomy + workflow + package
contracts, not only the live card snapshot.
"""

from __future__ import annotations

from typing import Any

import packages as packages_mod

# Keep this pack curated and compact — not a dump of every Spec file.
# Update when taxonomy or package contracts change.

KNOWLEDGE_VERSION = "1.1-2026-08-01"

PRODUCT_TAXONOMY: dict[str, Any] = {
    "unifying_idea": (
        "Every board card is a work product that produces video and/or markdown "
        "content that can be reviewed as a package and placed/activated by a human. "
        "Never silent-publish member content from the factory."
    ),
    "first_class_v1": {
        "course": {
            "label": "Course",
            "goal": (
                "Multi-lesson member curriculum on Labs: pathway skill building "
                "with Header + Modules + Lessons (video+markdown) + Knowledge Check + Resources."
            ),
            "finished_shape": "Header · Outline (modules w/ descriptions → lessons) · KC · Resources",
            "cognitive_promise": "Multi-step skill / pathway segment",
            "gates": [
                "Approve Blueprint (Header+Outline descriptions) first",
                "Approve Package when all required stages present",
                "Human publish on course URL for members",
            ],
            "not": "Not a single viral YouTube packaging exercise; not a campaign funnel",
        },
        "tutorial": {
            "label": "Tutorial",
            "goal": "Exactly one tight teaching unit (one lesson) on Labs.",
            "finished_shape": "Header + exactly one lesson (video+markdown)",
            "cognitive_promise": "One skill or walkthrough",
            "gates": ["Package approval; single-lesson shape validation"],
            "not": "Not a multi-module course with empty modules",
        },
        "youtube_long": {
            "label": "YouTube Long",
            "goal": (
                "Public long-form show/video asset (attention + doctrine/education). "
                "Primary home may be YouTube; optional Labs library framing."
            ),
            "finished_shape": "Header + one primary long video (+ markdown framing)",
            "cognitive_promise": "One video promise; packaging matters for distribution",
            "gates": ["Package stages then human approval; no silent YT public upload from factory"],
            "not": "Not a multi-module course; not a funnel/campaign",
        },
        "campaign": {
            "label": "Campaign",
            "goal": "Marketing motion: funnel + landing page + mail list hooks.",
            "finished_shape": "Funnel · Lander · Mail list (+ supporting creative)",
            "cognitive_promise": "Acquisition / activation sequence",
            "gates": ["Campaign package approval; list/lander placement"],
            "not": "Not a course outline",
        },
    },
    "legacy_board_lines": {
        "coaching_short": {
            "label": "Coaching Short",
            "goal": (
                "Short-form coaching/teaching video (often portrait for HeyGen). "
                "Lighter package than a course: research → script → video → vision."
            ),
            "finished_shape": "One short video with production evidence package",
            "v1_note": (
                "Not a first-class frozen taxonomy type for the v1 factory; still "
                "selectable on the board. Prefer course/tutorial/youtube_long for new flagship work."
            ),
            "not": "Not multi-module curriculum; no blueprint gate required by package checklist",
        },
        "thematic_short": {
            "label": "Thematic Short",
            "goal": "Short thematic/doctrine clip; similar package to coaching_short.",
            "v1_note": "Legacy board line; not first-class frozen v1 type.",
        },
        "other": {
            "label": "Other",
            "goal": "Catch-all; minimal package (research + vision).",
            "v1_note": "Avoid for real factory work when a first-class type fits.",
        },
    },
    "doctrine": [
        "Stop the bleeding first (capital preservation / process before optimization)",
        "Process outcomes only — no profit guarantees or get-rich framing",
        "Capacity over dependency",
        "Pathway flagship-first where relevant",
        "Evidence over assertion — package stages are ground truth",
    ],
}

BOARD_WORKFLOW: dict[str, Any] = {
    "columns": [
        {
            "status": "draft",
            "meaning": "Parking lot — not released to production",
            "operator": "Clarify intent; for courses draft blueprint. Then Queue.",
        },
        {
            "status": "queued",
            "meaning": "Submitted / eligible to claim",
            "operator": "Claim → Scheduled (or let Quebec tick advance).",
        },
        {
            "status": "scheduled",
            "meaning": "Claimed; ready to work",
            "operator": "Start production (in_production).",
        },
        {
            "status": "in_production",
            "meaning": "Active factory — fill package stages",
            "operator": "Complete missing stages; then Submit for approval.",
            "sub_stages": [
                "research",
                "design",
                "script",
                "produce",
                "package",
                "guardian",
            ],
        },
        {
            "status": "awaiting_approval",
            "meaning": "Human package gate",
            "operator": "Approve (places draft where applicable), Reject, or Request revision.",
        },
        {
            "status": "revision_requested",
            "meaning": "Returned with instructions",
            "operator": "Fix artifacts/flags; return to in_production.",
        },
        {
            "status": "published",
            "meaning": "Board path complete",
            "operator": "Member publish may still be separate on course URL.",
        },
        {
            "status": "rejected",
            "meaning": "Stopped",
            "operator": "Only reopen per board policy (typically via draft).",
        },
    ],
    "orthogonal_dimensions": {
        "board_column": "Human process state (status)",
        "package_stages": "Evidence artifacts required to approve",
        "blueprint_gate": "Course structure freeze (approve Header+Outline) before expensive work",
    },
    "rule": (
        "Completing a script artifact does not complete the package. "
        "Being in_production does not mean checklist is green. "
        "Co-pilot never invents stage completion."
    ),
}

COURSE_FACTORY: dict[str, Any] = {
    "sequence": [
        {
            "step": 1,
            "skill": "course-blueprint",
            "gate": "human Approve Blueprint",
            "produces": "Header + Outline (descriptions required)",
        },
        {
            "step": 2,
            "skill": "course-research",
            "stage": "research_pack",
            "produces": "Claims map, sources, misconceptions",
        },
        {
            "step": 3,
            "skill": "course-knowledge-check",
            "produces": "Quiz lessons tied to outcomes (in outline/placement)",
        },
        {
            "step": 4,
            "skill": "course-resources",
            "produces": "Downloads/links tied to practice beats",
        },
        {
            "step": 5,
            "skill": "course-lesson-script",
            "stage": "script",
            "produces": "Plan-locked VO; voice profile; FILL IN discipline",
        },
        {
            "step": "5b",
            "skill": "course-lesson-edit",
            "stage": "script_edit_brief",
            "optional": True,
            "default": "ON for live HeyGen; OFF for map-only video",
            "produces": "On-screen/cut/B-roll retention brief",
        },
        {
            "step": 6,
            "skill": "course-lesson-video",
            "stage": "video_package",
            "produces": "HeyGen render or YouTube id map",
        },
        {
            "step": 7,
            "skill": "course-placement",
            "stage": "placement_proposal",
            "produces": "Full course JSON graph",
        },
        {
            "step": 8,
            "skill": "course-vision",
            "stage": "vision_alignment",
            "produces": "Content Vision alignment notes",
        },
        {
            "step": 9,
            "skill": "course-package",
            "gate": "human Approve Package",
            "produces": "Frozen approval package → place draft course",
        },
    ],
    "ui_surfaces": {
        "process_copilot": "Always-on AI peer; card snapshot + this knowledge pack",
        "workflow_cockpit": "Deterministic readiness/path/next CTA (course cards)",
        "blueprint_workspace": "/admin/board/blueprint/{id} — structure co-pilot only",
        "cast_heygen": "Cast select + produce/map video on board drawer",
    },
}


def package_contracts() -> dict[str, Any]:
    """Live from packages.REQUIRED_STAGES so code and co-pilot cannot drift."""
    out: dict[str, Any] = {}
    for pl, stages in packages_mod.REQUIRED_STAGES.items():
        out[pl] = {
            "required_stages": list(stages),
            "complete_when": "Every required stage has ≥1 content_artifact",
            "blocks_approval_if": "missing_stages non-empty OR open block flags",
        }
    out["_optional_enrichment"] = {
        "script_edit_brief": "Preferred before live HeyGen; not required for checklist complete",
        "voice_profile": "Package artifact for VO craft; not required stage",
    }
    return out


def operator_playbook() -> dict[str, Any]:
    return {
        "how_to_direct_operator": [
            "Lead with RED/GREEN and why (flags, blueprint, missing stages).",
            "Name the single highest-leverage next action on the board UI.",
            "Map action to concrete control: Queue button, blueprint workspace, Add artifact stage, Cast, Produce HeyGen, Submit for approval.",
            "If product_line mismatches intent (e.g. coaching_short but wants multi-module course), recommend changing product_line.",
            "Never claim a stage is done unless it appears in the live snapshot artifacts/checklist.",
            "Draft missing artifacts with ```artifact fences when the operator asks to move forward.",
        ],
        "common_stuck_states": [
            {
                "symptom": "Script attached but card still incomplete",
                "cause": "Other required stages missing for product_line",
                "fix": "List missing stages; produce next one in order",
            },
            {
                "symptom": "Course scripts/video before blueprint approved",
                "cause": "Skipped structure gate",
                "fix": "Open blueprint workspace; Approve Blueprint; then continue stages",
            },
            {
                "symptom": "Live HeyGen fails / no cast",
                "cause": "cast_id empty or budget/API",
                "fix": "Assign cast; dry-run; check budget; or map YouTube ids",
            },
            {
                "symptom": "Co-pilot fallback note about XAI_API_KEY",
                "cause": "Live Grok not configured on Labs API",
                "fix": "Set XAI_API_KEY in Labs .env and restart uvicorn for full reasoning",
            },
        ],
    }


def knowledge_pack() -> dict[str, Any]:
    return {
        "knowledge_version": KNOWLEDGE_VERSION,
        "product_taxonomy": PRODUCT_TAXONOMY,
        "board_workflow": BOARD_WORKFLOW,
        "package_contracts": package_contracts(),
        "course_factory": COURSE_FACTORY,
        "operator_playbook": operator_playbook(),
        "handoff_contract": {
            "name": "handoff_v1",
            "role": (
                "Machine skill-to-skill envelope (from/to, inputs_resolved, "
                "inputs_missing, constraints). Chat is not a handoff. "
                "Docs-first; not always persisted on board UI yet."
            ),
            "fail_rule": "Non-empty inputs_missing → fail loud / Red",
        },
        "cge_boundary": {
            "out_of_course_factory": ["video-idea-finder", "holy-trifecta"],
            "craft_in_course": [
                "scriptwriter → course-lesson-script",
                "editor-notes → course-lesson-edit",
            ],
        },
    }


def knowledge_pack_json(max_chars: int = 28000) -> str:
    import json

    text = json.dumps(knowledge_pack(), indent=2, default=str)
    if len(text) > max_chars:
        return text[: max_chars - 20] + "\n…[truncated]"
    return text
