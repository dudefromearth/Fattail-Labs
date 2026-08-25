"use client";

import { useEffect, useState } from "react";

type Lane = "backlog" | "research" | "spec" | "build" | "live";

export type Card = {
  id: number;
  title: string;
  description: string | null;
  originator_kind: "coach" | "system" | "agent" | "outside";
  originator_label: string | null;
  notes: string | null;
  lane: Lane;
  hold: boolean;
  card_status: string;
  blocked_reason: string | null;
  auto_move_reason: string | null;
  waiting_reason: string | null;
  rank?: number | null;
  rank_reason?: string | null;
  sources?: string[] | null;
  remainder?: Array<{ title?: string; rank?: number; reason?: string }> | null;
  spec_ready?: boolean;
  built_ready?: boolean;
  plan_ref?: string | null;
  product_type?: string | null;
  product_tier?: string | null;
  free_vs_paid?: string | null;
  published?: boolean;
  obtainable?: boolean;
  woo_reason?: string | null;
  failed_reason?: string | null;
};

export type Attachment = {
  id: number;
  kind: "link" | "upload";
  url: string | null;
  label: string | null;
  filename: string | null;
  content_type: string | null;
  size_bytes: number | null;
  created_by_label: string | null;
  created_at: string | null;
};

const LANES: { id: Lane; label: string }[] = [
  { id: "backlog", label: "Backlog" }, // IF-7: key now matches the label (spec v1.0 §2.1)
  { id: "research", label: "Research" },
  { id: "spec", label: "Spec" },
  { id: "build", label: "Build" },
  { id: "live", label: "Live" },
];
const LANE_IDS = LANES.map((l) => l.id);

function nextLane(lane: Lane): Lane | null {
  const i = LANE_IDS.indexOf(lane);
  return i >= 0 && i < LANE_IDS.length - 1 ? LANE_IDS[i + 1] : null;
}
function prevLane(lane: Lane): Lane | null {
  const i = LANE_IDS.indexOf(lane);
  return i > 0 ? LANE_IDS[i - 1] : null;
}

const ORIGINATOR_LABEL: Record<Card["originator_kind"], string> = {
  coach: "Coach",
  system: "System",
  agent: "Agent",
  outside: "Outside source",
};

export default function IkiFactoryItemPanel({
  card,
  busy,
  onClose,
  onMove,
  onPatch,
  onRework,
}: {
  card: Card;
  busy: boolean;
  onClose: () => void;
  onMove: (id: number, toLane: Lane) => void | Promise<void>;
  onPatch: (id: number, body: Record<string, unknown>) => void | Promise<void>;
  onRework: (id: number, destLane: Lane) => void | Promise<void>;
}) {
  const [description, setDescription] = useState(card.description ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [attachBusy, setAttachBusy] = useState(false);

  useEffect(() => {
    setDescription(card.description ?? "");
  }, [card.id, card.description]);

  async function loadAttachments() {
    const r = await fetch(`/api/admin/iki-factory/cards/${card.id}/attachments`, {
      credentials: "same-origin",
    });
    if (!r.ok) return;
    const data = (await r.json()) as { attachments: Attachment[] };
    setAttachments(data.attachments);
  }

  useEffect(() => {
    void loadAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkUrl.trim() || attachBusy) return;
    setAttachBusy(true);
    try {
      const r = await fetch(
        `/api/admin/iki-factory/cards/${card.id}/attachments/link`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkUrl.trim(), label: linkLabel.trim() || null }),
        },
      );
      if (!r.ok) {
        setAttachmentsError("Could not add link.");
        return;
      }
      setLinkUrl("");
      setLinkLabel("");
      setAttachmentsError(null);
      await loadAttachments();
    } finally {
      setAttachBusy(false);
    }
  }

  async function addUpload(file: File) {
    setAttachBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const params = uploadLabel.trim()
        ? `?label=${encodeURIComponent(uploadLabel.trim())}`
        : "";
      const r = await fetch(
        `/api/admin/iki-factory/cards/${card.id}/attachments/upload${params}`,
        { method: "POST", credentials: "same-origin", body: form },
      );
      if (!r.ok) {
        setAttachmentsError(
          r.status === 415 ? "Unsupported file type." : "Could not upload file.",
        );
        return;
      }
      setUploadLabel("");
      setAttachmentsError(null);
      await loadAttachments();
    } finally {
      setAttachBusy(false);
    }
  }

  async function removeAttachment(id: number) {
    setAttachBusy(true);
    try {
      await fetch(`/api/admin/iki-factory/cards/${card.id}/attachments/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      await loadAttachments();
    } finally {
      setAttachBusy(false);
    }
  }

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={`${card.title} detail`}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col overflow-y-auto border-l border-[var(--color-separator)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-3)]"
      data-testid={`iki-factory-panel-${card.id}`}
    >
      {/* No scrim by design (v1.0 §2.5) — the lanes stay live and readable
          behind the panel; this is a deliberate divergence from Trade Log's
          TradeSheet/ImportSheet, which block the background. */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">{card.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[var(--hit-min)] min-w-[var(--hit-min)] rounded-md border border-[var(--color-separator)] px-2 text-sm"
          data-testid="iki-factory-panel-close"
        >
          Close
        </button>
      </div>

      <p
        className="mt-1 text-xs text-[var(--color-label-secondary)]"
        data-testid={`iki-factory-panel-originator-${card.id}`}
      >
        {ORIGINATOR_LABEL[card.originator_kind]}
        {card.originator_label ? ` — ${card.originator_label}` : ""}
      </p>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-label-secondary)]">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== (card.description ?? "")) {
              void onPatch(card.id, { description: description || null });
            }
          }}
          rows={5}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-[var(--color-label)] dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="What it is, why it matters, constraints, what the originator knew."
          data-testid={`iki-factory-panel-description-${card.id}`}
        />
      </label>

      {card.auto_move_reason ? (
        <p className="mt-3 text-xs text-[var(--color-label-secondary)]">
          Auto: {card.auto_move_reason}
        </p>
      ) : null}
      {card.waiting_reason ? (
        <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
          {card.waiting_reason === "waiting for skills"
            ? "Research window open. Skills are running or waiting."
            : card.waiting_reason === "waiting for plan"
              ? "Waiting for a repo plan. Attaching a plan is Spec approval."
              : card.waiting_reason === "waiting for product spec"
                ? "Waiting for product type, tier, and free vs paid. That is the Deploy input — not a Wiki package."
                : card.waiting_reason}
        </p>
      ) : null}
      {card.rank != null ? (
        <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
          Rank {card.rank}
          {card.rank_reason ? ` — ${card.rank_reason}` : ""}
        </p>
      ) : null}
      {card.sources && card.sources.length > 0 ? (
        <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
          Sources: {card.sources.join("; ")}
        </p>
      ) : null}
      {card.remainder && card.remainder.length > 0 ? (
        <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
          Remainder on parent: {card.remainder.length} finding
          {card.remainder.length === 1 ? "" : "s"} not materialized.
        </p>
      ) : null}
      {card.blocked_reason ? (
        <p
          className="mt-1 text-xs text-amber-800 dark:text-amber-300"
          data-testid={`iki-factory-panel-blocked-${card.id}`}
        >
          {card.blocked_reason}
        </p>
      ) : null}
      {card.failed_reason ? (
        <p
          className="mt-1 text-xs text-red-700 dark:text-red-400"
          data-testid={`iki-factory-panel-failed-${card.id}`}
        >
          {card.failed_reason}
        </p>
      ) : null}
      {card.spec_ready ? (
        <p className="mt-1 text-xs text-[var(--color-label-secondary)]">Spec-ready</p>
      ) : null}
      {card.built_ready ? (
        <p className="mt-1 text-xs text-[var(--color-label-secondary)]">Built-ready</p>
      ) : null}
      {card.lane === "live" ? (
        <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
          {card.published ? "Published" : "Live"}
          {card.obtainable ? " · obtainable" : " · not obtainable"}
        </p>
      ) : null}
      {card.woo_reason ? (
        <p
          className="mt-1 text-xs text-[var(--color-label-secondary)]"
          data-testid={`iki-factory-panel-woo-reason-${card.id}`}
        >
          {card.woo_reason}
        </p>
      ) : null}

      {card.lane === "spec" || card.lane === "build" ? (
        <label className="mt-3 flex flex-col gap-1 text-xs text-[var(--color-label-secondary)]">
          Repo plan (attaching this is Spec approval)
          <input
            defaultValue={card.plan_ref ?? ""}
            className="min-h-[var(--hit-min)] rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-label)]"
            placeholder="docs/…-Plan-v1.0.md"
            data-testid={`iki-factory-plan-${card.id}`}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (card.plan_ref ?? "")) void onPatch(card.id, { plan_ref: v || null });
            }}
          />
        </label>
      ) : null}

      {card.lane === "spec" || card.lane === "build" ? (
        <div className="mt-3 grid gap-2">
          <p className="text-xs text-[var(--color-label-secondary)]">
            Product spec is the human promotion gate (invariant #7). Type, tier, and
            free vs paid — not a Wiki package.
          </p>
          <label className="flex flex-col gap-1 text-xs text-[var(--color-label-secondary)]">
            Type
            <input
              defaultValue={card.product_type ?? ""}
              className="min-h-[var(--hit-min)] rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-label)]"
              placeholder="template"
              data-testid={`iki-factory-product-type-${card.id}`}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (card.product_type ?? "")) void onPatch(card.id, { product_type: v || null });
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--color-label-secondary)]">
            Tier
            <input
              defaultValue={card.product_tier ?? ""}
              className="min-h-[var(--hit-min)] rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-label)]"
              placeholder="navigator"
              data-testid={`iki-factory-product-tier-${card.id}`}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (card.product_tier ?? "")) void onPatch(card.id, { product_tier: v || null });
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--color-label-secondary)]">
            Free vs paid
            <select
              defaultValue={card.free_vs_paid ?? ""}
              className="min-h-[var(--hit-min)] rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-label)]"
              data-testid={`iki-factory-free-vs-paid-${card.id}`}
              onChange={(e) => {
                const v = e.target.value;
                if (v !== (card.free_vs_paid ?? "")) void onPatch(card.id, { free_vs_paid: v || null });
              }}
            >
              <option value="">Choose</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </label>
        </div>
      ) : null}

      <div className="mt-5 border-t border-[var(--color-separator)] pt-4">
        <h3 className="text-sm font-semibold text-[var(--color-label)]">Attachments</h3>
        <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
          Often the whole substance of the item — a paper, a screenshot, a competitor
          page. Links and uploads both.
        </p>
        {attachmentsError ? (
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">{attachmentsError}</p>
        ) : null}
        <ul className="mt-2 flex flex-col gap-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-separator)] px-2 py-1 text-xs"
              data-testid={`iki-factory-attachment-${a.id}`}
            >
              <span className="truncate">
                <span className="uppercase text-[var(--color-label-tertiary)]">
                  {a.kind}
                </span>{" "}
                {a.kind === "link" ? (
                  <a href={a.url ?? "#"} target="_blank" rel="noreferrer" className="underline">
                    {a.label || a.url}
                  </a>
                ) : (
                  <a href={a.url ?? "#"} target="_blank" rel="noreferrer" className="underline">
                    {a.label || a.filename}
                  </a>
                )}
              </span>
              <button
                type="button"
                onClick={() => void removeAttachment(a.id)}
                disabled={attachBusy}
                className="min-h-[var(--hit-min)] shrink-0 rounded-md border border-zinc-300 px-2 dark:border-zinc-600"
                data-testid={`iki-factory-attachment-remove-${a.id}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={addLink} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs">
            <span className="text-[var(--color-label-secondary)]">Link URL</span>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="https://…"
              data-testid={`iki-factory-attach-link-url-${card.id}`}
            />
          </label>
          <label className="flex min-w-[8rem] flex-1 flex-col gap-1 text-xs">
            <span className="text-[var(--color-label-secondary)]">Label (optional)</span>
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <button
            type="submit"
            disabled={attachBusy || !linkUrl.trim()}
            className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-600"
            data-testid={`iki-factory-attach-link-btn-${card.id}`}
          >
            Add link
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-[8rem] flex-1 flex-col gap-1 text-xs">
            <span className="text-[var(--color-label-secondary)]">Upload label (optional)</span>
            <input
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label
            className="min-h-[var(--hit-min)] cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
            data-testid={`iki-factory-attach-upload-${card.id}`}
          >
            Upload file
            <input
              type="file"
              className="hidden"
              disabled={attachBusy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void addUpload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-separator)] pt-4">
        <button
          type="button"
          className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-600"
          disabled={busy || !prevLane(card.lane)}
          onClick={() => {
            const p = prevLane(card.lane);
            if (p) void onMove(card.id, p);
          }}
          data-testid={`iki-factory-detract-${card.id}`}
        >
          Back
        </button>
        <button
          type="button"
          className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-600"
          disabled={busy || !nextLane(card.lane)}
          onClick={() => {
            const n = nextLane(card.lane);
            if (n) void onMove(card.id, n);
          }}
          data-testid={`iki-factory-advance-${card.id}`}
        >
          Advance
        </button>
        <button
          type="button"
          className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-600"
          disabled={busy}
          onClick={() => void onPatch(card.id, { hold: !card.hold })}
          aria-pressed={card.hold}
          data-testid={`iki-factory-hold-${card.id}`}
        >
          {card.hold ? "Holding — belt stopped" : "Hold"}
        </button>
        <label className="flex items-center gap-1 text-xs text-[var(--color-label-secondary)]">
          Rework to
          <select
            className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 px-2 text-sm dark:border-zinc-600"
            defaultValue=""
            disabled={busy}
            data-testid={`iki-factory-rework-${card.id}`}
            onChange={(e) => {
              const dest = e.target.value as Lane;
              if (dest) void onRework(card.id, dest);
            }}
          >
            <option value="">Choose lane</option>
            {LANES.filter((l) => l.id !== "live" && l.id !== card.lane).map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {card.hold ? (
        <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
          Hold stops the belt. Clear it when you want the conveyor to move again.
        </p>
      ) : null}
    </aside>
  );
}
