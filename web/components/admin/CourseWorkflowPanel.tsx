"use client";

// Human-facing workflow cockpit for course production cards.
// Answers: Where am I? What's done? What's next? Why am I blocked?

import { useMemo, useState } from "react";

type ChecklistStage = {
  stage: string;
  required: boolean;
  complete: boolean;
  artifact_title: string | null;
};

type ItemDetail = {
  id: number;
  title: string;
  product_line: string;
  status: string;
  sub_stage: string | null;
  cast_id?: string | null;
  blueprint_status?: string | null;
  open_flag_count?: number;
  package?: {
    checklist: {
      complete: boolean;
      missing_stages: string[];
      open_block_flags: number;
      stages: ChecklistStage[];
    };
  } | null;
  artifacts: {
    id: number;
    stage: string;
    title: string;
    body_md: string | null;
    actor_label: string;
  }[];
  transitions: {
    id: number;
    from_status: string | null;
    to_status: string;
    sub_stage: string | null;
    actor_label: string;
    reason: string | null;
    created_at: string;
  }[];
  flags: { id: number; status: string; severity: string; message: string }[];
};

const STAGE_META: Record<
  string,
  { label: string; skill: string; youDo: string }
> = {
  research_pack: {
    label: "Research pack",
    skill: "course-research",
    youDo: "Claims, sources, misconceptions — ground truth for teaching.",
  },
  lesson_plan: {
    label: "Lesson plan / outline",
    skill: "course-lesson-plan",
    youDo: "Modules + lessons with outcomes (often from approved blueprint).",
  },
  script: {
    label: "Scripts (VO)",
    skill: "course-lesson-script",
    youDo: "Plan-locked lesson scripts. One primary idea per lesson.",
  },
  script_edit_brief: {
    label: "Edit brief (optional)",
    skill: "course-lesson-edit",
    youDo: "On-screen text, cuts, B-roll before live HeyGen (preferred).",
  },
  video_package: {
    label: "Videos",
    skill: "course-lesson-video",
    youDo: "HeyGen render or map existing YouTube ids per lesson slug.",
  },
  placement_proposal: {
    label: "Placement graph",
    skill: "course-placement",
    youDo: "Full course JSON: header + modules + video + markdown + KC + resources.",
  },
  vision_alignment: {
    label: "Vision alignment",
    skill: "course-vision",
    youDo: "Prove this course serves Content Vision (process outcomes only).",
  },
};

const STATUS_HELP: Record<string, string> = {
  draft:
    "Parking lot. Nothing is required to run yet. When intent is clear, move to Queued to start the factory path.",
  queued:
    "Submitted for production. Next: claim it (Scheduled) or let Quebec tick advance columns. Blueprint should be approved for courses before expensive stages.",
  scheduled:
    "Claimed / ready to work. Start production to enter the stage pipeline (research → … → package).",
  in_production:
    "Active factory work. Fill package stages below. When complete and clean, submit for approval.",
  awaiting_approval:
    "Human gate. Review package checklist, then Approve (places draft course) or request revision.",
  revision_requested:
    "Returned for changes. Read the revision reason in history, fix artifacts, return to production.",
  published:
    "Approved and published on the board. Member course publish may still be a separate admin step on the course URL.",
  rejected: "Stopped. Can reopen as Draft only if you restart the work product.",
};

type Props = {
  item: ItemDetail;
  busy: boolean;
  onChanged: () => void;
  onError: (msg: string) => void;
  onTransition: (
    id: number,
    toStatus: string,
    extra?: { reason?: string; sub_stage?: string },
  ) => Promise<void>;
};

function hasStage(item: ItemDetail, stage: string): boolean {
  return item.artifacts.some((a) => a.stage === stage);
}

export default function CourseWorkflowPanel({
  item,
  busy,
  onChanged,
  onError,
  onTransition,
}: Props) {
  const [artStage, setArtStage] = useState("script");
  const [artTitle, setArtTitle] = useState("");
  const [artBody, setArtBody] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const bpApproved = item.blueprint_status === "approved";
  const openBlocks = (item.flags || []).filter(
    (f) => f.status === "open" && f.severity === "block",
  ).length;
  const checklist = item.package?.checklist;
  const missing = checklist?.missing_stages || [];
  const stages = checklist?.stages?.filter((s) => s.required) || [];

  const readiness = useMemo(() => {
    if (openBlocks > 0) {
      return {
        tone: "red" as const,
        label: "RED — blocked",
        detail: `${openBlocks} open block flag(s). Clear flags before the factory can finish.`,
      };
    }
    if (item.product_line === "course" && !bpApproved) {
      return {
        tone: "red" as const,
        label: "RED — blueprint not approved",
        detail:
          "Approve the Course Blueprint (Header + Outline) first. Scripts and video must not run on an unvalidated outline.",
      };
    }
    if (item.status === "awaiting_approval" && checklist?.complete) {
      return {
        tone: "green" as const,
        label: "GREEN — ready for human approval",
        detail: "All required package stages present. Approve or request revision.",
      };
    }
    if (item.status === "published") {
      return {
        tone: "green" as const,
        label: "GREEN — board published",
        detail: "This work product finished the board path.",
      };
    }
    if (missing.length > 0 && ["in_production", "scheduled", "queued"].includes(item.status)) {
      const next = missing[0];
      const meta = STAGE_META[next];
      return {
        tone: "red" as const,
        label: "RED — package incomplete",
        detail: `Still need: ${missing.map((s) => STAGE_META[s]?.label || s).join(", ")}. Next focus: ${meta?.label || next}.`,
      };
    }
    if (item.status === "draft") {
      return {
        tone: "amber" as const,
        label: "IDLE — draft",
        detail: "Not in the factory yet. Queue when ready.",
      };
    }
    return {
      tone: "green" as const,
      label: "GREEN — path clear for current column",
      detail: "No open blocks. Follow “What to do next” below.",
    };
  }, [openBlocks, bpApproved, item.status, checklist?.complete, missing]);

  const nextAction = useMemo(() => {
    if (item.status === "draft") {
      return {
        title: "Move to Queued",
        body: "Starts the production path. You can still edit intent and blueprint.",
        action: () => onTransition(item.id, "queued"),
        label: "Queue this card",
      };
    }
    if (item.product_line === "course" && !bpApproved) {
      return {
        title: "Approve Course Blueprint",
        body: "Open the Blueprint workspace above. Chat or paste Header + Outline until min bar passes, then Approve Blueprint. That freezes structure for the factory.",
        action: null as null | (() => void),
        label: null as string | null,
        href: `/admin/board/blueprint/${item.id}`,
        hrefLabel: "Open blueprint workspace",
      };
    }
    if (item.status === "queued") {
      return {
        title: "Claim → Scheduled",
        body: "Marks the card as owned/ready. Then start production to work package stages.",
        action: () => onTransition(item.id, "scheduled"),
        label: "Claim → Scheduled",
      };
    }
    if (item.status === "scheduled") {
      return {
        title: "Start production",
        body: "Enters in_production at research. Add or produce package stages until the checklist is complete.",
        action: () =>
          onTransition(item.id, "in_production", { sub_stage: "research" }),
        label: "Start production",
      };
    }
    if (item.status === "in_production") {
      if (missing.length > 0) {
        const next = missing[0];
        const meta = STAGE_META[next];
        return {
          title: `Add or produce: ${meta?.label || next}`,
          body:
            (meta?.youDo || "") +
            (meta?.skill ? ` Skill: ${meta.skill}.` : "") +
            " Use “Add package artifact” below, Tick + produce, or HeyGen produce when scripts exist.",
          action: null,
          label: null,
          focusStage: next,
        };
      }
      return {
        title: "Submit for approval",
        body: "All required stages look complete. Move to Awaiting approval for the human package gate.",
        action: () => onTransition(item.id, "awaiting_approval"),
        label: "Submit for approval",
      };
    }
    if (item.status === "awaiting_approval") {
      return {
        title: "Human approval gate",
        body: "Review checklist and artifacts. Approve places a draft course; Reject or Request revision if not ready.",
        action: null,
        label: null,
      };
    }
    return {
      title: "No automatic next step",
      body: STATUS_HELP[item.status] || "See board column actions at the bottom of this drawer.",
      action: null,
      label: null,
    };
  }, [item, missing, bpApproved, onTransition]);

  const factorySteps = useMemo(() => {
    const steps: {
      key: string;
      label: string;
      state: "done" | "current" | "todo" | "blocked";
      hint: string;
    }[] = [];

    // Blueprint gate
    steps.push({
      key: "blueprint",
      label: "1. Blueprint",
      state: bpApproved
        ? "done"
        : item.blueprint_status === "pending_validation"
          ? "current"
          : "blocked",
      hint: bpApproved
        ? "Approved — structure frozen"
        : "Approve Header + Outline first",
    });

    const req = stages.length
      ? stages.map((s) => s.stage)
      : [
          "research_pack",
          "lesson_plan",
          "script",
          "video_package",
          "placement_proposal",
          "vision_alignment",
        ];

    let foundCurrent = !bpApproved;
    req.forEach((stage, i) => {
      const complete =
        stages.find((s) => s.stage === stage)?.complete || hasStage(item, stage);
      let state: "done" | "current" | "todo" | "blocked" = "todo";
      if (!bpApproved) state = "blocked";
      else if (complete) state = "done";
      else if (!foundCurrent) {
        state = "current";
        foundCurrent = true;
      }
      const meta = STAGE_META[stage];
      steps.push({
        key: stage,
        label: `${i + 2}. ${meta?.label || stage}`,
        state,
        hint: meta?.youDo || stage,
      });
    });

    steps.push({
      key: "approve",
      label: `${req.length + 2}. Package approve`,
      state:
        item.status === "published"
          ? "done"
          : item.status === "awaiting_approval"
            ? "current"
            : checklist?.complete && bpApproved
              ? "todo"
              : "blocked",
      hint: "Human Approve → draft course placed",
    });

    return steps;
  }, [bpApproved, stages, item, checklist?.complete]);

  const addArtifact = async () => {
    if (!artTitle.trim()) {
      onError("Artifact needs a title");
      return;
    }
    setMsg(null);
    const r = await fetch(`/api/admin/board/items/${item.id}/artifacts`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: artStage,
        title: artTitle.trim(),
        body_md: artBody || null,
      }),
    });
    if (!r.ok) {
      onError((await r.json().catch(() => ({}))).detail || "Add artifact failed");
      return;
    }
    const meta = STAGE_META[artStage];
    const stillMissing = missing.filter((s) => s !== artStage);
    setMsg(
      `Recorded “${artTitle.trim()}” as ${meta?.label || artStage}.` +
        (stillMissing.length
          ? ` Still missing: ${stillMissing.map((s) => STAGE_META[s]?.label || s).join(", ")}.`
          : " Required package stages may now be complete — refresh checklist and consider Submit for approval when ready.") +
        (artStage === "script"
          ? " Next for live video: optional edit brief, then Produce HeyGen (or map YouTube ids)."
          : ""),
    );
    setArtTitle("");
    setArtBody("");
    setShowAdd(false);
    onChanged();
  };

  const toneClass =
    readiness.tone === "red"
      ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100"
      : readiness.tone === "amber"
        ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        : "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100";

  const stepDot = (state: string) => {
    if (state === "done") return "bg-emerald-500";
    if (state === "current") return "bg-violet-600 ring-2 ring-violet-300";
    if (state === "blocked") return "bg-zinc-300 dark:bg-zinc-600";
    return "bg-zinc-200 dark:bg-zinc-700";
  };

  return (
    <section
      className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/40 p-3 dark:border-violet-900 dark:bg-violet-950/20"
      data-testid="course-workflow-panel"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-200">
            Workflow cockpit
          </h3>
          <p className="mt-0.5 text-[11px] text-violet-700/80 dark:text-violet-300/80">
            Course factory · you stay in control · process talks back
          </p>
        </div>
      </div>

      {/* Readiness */}
      <div className={`rounded-md border px-3 py-2 text-xs ${toneClass}`} data-testid="workflow-readiness">
        <div className="font-semibold">{readiness.label}</div>
        <p className="mt-1 leading-snug opacity-90">{readiness.detail}</p>
      </div>

      {/* Where am I */}
      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950">
        <div className="font-medium text-zinc-700 dark:text-zinc-200">
          Where this card is
        </div>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          Column: <strong>{item.status.replace(/_/g, " ")}</strong>
          {item.sub_stage ? (
            <>
              {" "}
              · sub-stage: <span className="font-mono">{item.sub_stage}</span>
            </>
          ) : null}
          {item.cast_id ? (
            <>
              {" "}
              · cast: <span className="font-mono">{item.cast_id}</span>
            </>
          ) : (
            <span className="text-amber-700"> · no cast (needed for live HeyGen)</span>
          )}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-zinc-500">
          {STATUS_HELP[item.status] || "Board column tracks human process, not package completeness."}
        </p>
      </div>

      {/* Factory path */}
      <div>
        <div className="text-[11px] font-semibold uppercase text-zinc-500">
          Course factory path
        </div>
        <ol className="mt-2 space-y-1.5">
          {factorySteps.map((s) => (
            <li key={s.key} className="flex gap-2 text-[11px]">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${stepDot(s.state)}`}
                title={s.state}
              />
              <div className="min-w-0">
                <div
                  className={
                    s.state === "current"
                      ? "font-semibold text-violet-800 dark:text-violet-200"
                      : s.state === "done"
                        ? "text-zinc-600 dark:text-zinc-300"
                        : "text-zinc-400"
                  }
                >
                  {s.label}
                  {s.state === "current" ? " ← you are here" : ""}
                  {s.state === "done" ? " ✓" : ""}
                </div>
                <div className="text-zinc-500">{s.hint}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Package checklist humanized */}
      {stages.length > 0 && (
        <div data-testid="workflow-package-human">
          <div className="text-[11px] font-semibold uppercase text-zinc-500">
            Package checklist
          </div>
          <ul className="mt-1 space-y-1 text-[11px]">
            {stages.map((s) => {
              const meta = STAGE_META[s.stage];
              return (
                <li key={s.stage} className="flex gap-2">
                  <span>{s.complete ? "✓" : "○"}</span>
                  <span>
                    <span className="font-medium">{meta?.label || s.stage}</span>
                    <span className="text-zinc-400"> · {s.stage}</span>
                    {s.artifact_title ? (
                      <span className="text-zinc-500"> — {s.artifact_title}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {hasStage(item, "script_edit_brief") && (
            <p className="mt-1 text-[11px] text-emerald-700">
              ✓ Optional edit brief present (good for live HeyGen)
            </p>
          )}
        </div>
      )}

      {/* Next action */}
      <div
        className="rounded-md border border-violet-300 bg-white px-3 py-2 dark:border-violet-700 dark:bg-zinc-950"
        data-testid="workflow-next-action"
      >
        <div className="text-[11px] font-semibold uppercase text-violet-700 dark:text-violet-300">
          What to do next
        </div>
        <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {nextAction.title}
        </div>
        <p className="mt-1 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">
          {nextAction.body}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {nextAction.label && nextAction.action && (
            <button
              type="button"
              className="rounded bg-violet-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
              disabled={busy}
              onClick={() => void nextAction.action?.()}
              data-testid="workflow-primary-cta"
            >
              {nextAction.label}
            </button>
          )}
          {"href" in nextAction && nextAction.href && (
            <a
              href={nextAction.href}
              className="rounded bg-violet-700 px-3 py-1.5 text-xs text-white"
              data-testid="workflow-blueprint-link"
            >
              {nextAction.hrefLabel || "Open"}
            </a>
          )}
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
            disabled={busy}
            onClick={() => setShowAdd((v) => !v)}
            data-testid="workflow-toggle-add-artifact"
          >
            {showAdd ? "Hide add artifact" : "Add package artifact"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100"
          data-testid="workflow-feedback"
        >
          {msg}
          <button type="button" className="ml-2 underline" onClick={() => setMsg(null)}>
            dismiss
          </button>
        </div>
      )}

      {showAdd && (
        <div className="space-y-2 rounded border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
          <div className="text-[11px] font-medium text-zinc-600">
            Attach an artifact the checklist can see
          </div>
          <select
            className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900"
            value={artStage}
            onChange={(e) => setArtStage(e.target.value)}
            data-testid="workflow-artifact-stage"
          >
            {Object.entries(STAGE_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label} ({k})
              </option>
            ))}
          </select>
          <input
            className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900"
            placeholder="Title (e.g. Stop the Bleed — lesson VO pack)"
            value={artTitle}
            onChange={(e) => setArtTitle(e.target.value)}
            data-testid="workflow-artifact-title"
          />
          <textarea
            className="w-full rounded border border-zinc-300 px-2 py-1 font-mono text-[11px] dark:border-zinc-600 dark:bg-zinc-900"
            rows={5}
            placeholder="Paste markdown body (script, research, etc.)"
            value={artBody}
            onChange={(e) => setArtBody(e.target.value)}
            data-testid="workflow-artifact-body"
          />
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            disabled={busy}
            onClick={() => void addArtifact()}
            data-testid="workflow-artifact-submit"
          >
            Save artifact → update checklist
          </button>
          <p className="text-[10px] text-zinc-400">
            After save, the process replies with what is still missing and the
            recommended next move.
          </p>
        </div>
      )}

      {/* Recent process voice */}
      <div>
        <div className="text-[11px] font-semibold uppercase text-zinc-500">
          Recent process activity
        </div>
        <ul className="mt-1 max-h-28 space-y-1 overflow-y-auto text-[11px] text-zinc-500">
          {item.transitions.slice(0, 8).map((t) => (
            <li key={t.id}>
              <span className="text-zinc-700 dark:text-zinc-300">
                {t.actor_label}
              </span>
              : {t.from_status ?? "start"} → {t.to_status}
              {t.sub_stage ? ` (${t.sub_stage})` : ""}
              {t.reason ? ` — ${t.reason}` : ""}
            </li>
          ))}
          {!item.transitions.length && (
            <li className="text-zinc-400">No transitions yet.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
