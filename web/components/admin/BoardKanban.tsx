"use client";

// Kanban production board — work-product cards move across process columns.
// Spec: FatTail-Labs-Content-Board-Spec-v1.0

import { useCallback, useEffect, useState } from "react";

type Card = {
  id: number;
  title: string;
  product_line: string;
  status: string;
  sub_stage: string | null;
  priority: number;
  claimed_callsign: string | null;
  open_flag_count: number;
  reject_reason?: string | null;
};

type ItemDetail = Card & {
  intent_md: string;
  acceptance_md: string | null;
  inputs_md: string | null;
  transitions: {
    id: number;
    from_status: string | null;
    to_status: string;
    sub_stage: string | null;
    actor_label: string;
    reason: string | null;
    created_at: string;
  }[];
  artifacts: {
    id: number;
    stage: string;
    title: string;
    body_md: string | null;
    url: string | null;
    actor_label: string;
  }[];
  flags: {
    id: number;
    guardian: string;
    severity: string;
    message: string;
    status: string;
  }[];
};

const COLUMNS: { key: string; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "queued", label: "Queued" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_production", label: "In production" },
  { key: "awaiting_approval", label: "Awaiting approval" },
  { key: "revision_requested", label: "Revision" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
];

const PRODUCT_LINES = [
  "course",
  "youtube_long",
  "coaching_short",
  "thematic_short",
  "other",
];

export default function BoardKanban() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [columns, setColumns] = useState<Record<string, Card[]>>({});
  const [vision, setVision] = useState("");
  const [visionOpen, setVisionOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ItemDetail | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // new card form
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIntent, setNewIntent] = useState("");
  const [newLine, setNewLine] = useState("course");
  const [newPriority, setNewPriority] = useState(0);

  const load = useCallback(() => {
    fetch("/api/admin/board", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          setState("denied");
          return;
        }
        setColumns(d.columns || {});
        setVision(d.vision?.body_md || "");
        setState("ready");
      })
      .catch(() => setState("denied"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCard = async (id: number) => {
    setError(null);
    const r = await fetch(`/api/admin/board/items/${id}`, {
      credentials: "same-origin",
    });
    if (!r.ok) {
      setError((await r.json().catch(() => ({}))).detail || "Load failed");
      return;
    }
    setSelected((await r.json()).item as ItemDetail);
  };

  const transition = async (
    id: number,
    to_status: string,
    extra?: { reason?: string; sub_stage?: string },
  ) => {
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/admin/board/items/${id}/transition`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_status, ...extra }),
    });
    const body = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setError(body.detail || `Move failed (${r.status})`);
      load();
      return false;
    }
    load();
    if (selected?.id === id) setSelected(body.item);
    return true;
  };

  const onDrop = async (toStatus: string) => {
    if (dragId == null) return;
    const id = dragId;
    setDragId(null);
    let reason: string | undefined;
    if (toStatus === "rejected" || toStatus === "revision_requested") {
      reason = window.prompt("Reason (required):") || undefined;
      if (!reason) {
        setError("Reason required for reject/revision");
        return;
      }
    }
    await transition(id, toStatus, { reason });
  };

  const createCard = async () => {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/admin/board/items", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        intent_md: newIntent,
        product_line: newLine,
        priority: newPriority,
      }),
    });
    const body = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setError(body.detail || "Create failed");
      return;
    }
    setShowNew(false);
    setNewTitle("");
    setNewIntent("");
    load();
    setSelected(body.item);
  };

  const saveVision = async () => {
    setBusy(true);
    const r = await fetch("/api/admin/board/vision", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body_md: vision }),
    });
    setBusy(false);
    if (!r.ok) {
      setError((await r.json().catch(() => ({}))).detail || "Vision save failed");
      return;
    }
    setVisionOpen(false);
  };

  if (state === "loading") {
    return <main className="p-8 text-zinc-500">Loading board…</main>;
  }
  if (state === "denied") {
    return (
      <main className="p-8" data-testid="board-denied">
        <h1 className="text-xl font-semibold">Production board</h1>
        <p className="mt-2 text-red-600">Administrator sign-in required.</p>
      </main>
    );
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col" data-testid="board-kanban">
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold">Production board</h1>
        <p className="text-xs text-zinc-500">
          Cards = work products · drag across process columns
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
            onClick={() => setVisionOpen((v) => !v)}
            data-testid="board-vision-toggle"
          >
            Content Vision
          </button>
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() => setShowNew(true)}
            data-testid="board-new-card"
          >
            + New card
          </button>
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
            onClick={() => load()}
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div
          className="mx-4 mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
          data-testid="board-error"
        >
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            dismiss
          </button>
        </div>
      )}

      {visionOpen && (
        <div className="border-b border-zinc-200 bg-amber-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-amber-950/20">
          <label className="text-xs font-medium uppercase text-zinc-500">
            Content Vision (binding context)
          </label>
          <textarea
            className="mt-1 w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-900"
            rows={6}
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            data-testid="board-vision-editor"
          />
          <button
            type="button"
            className="mt-2 rounded bg-zinc-900 px-3 py-1 text-xs text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void saveVision()}
          >
            Save vision
          </button>
        </div>
      )}

      {showNew && (
        <div className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium">New work product (starts in Draft)</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              data-testid="board-new-title"
            />
            <select
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={newLine}
              onChange={(e) => setNewLine(e.target.value)}
            >
              {PRODUCT_LINES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <textarea
              className="sm:col-span-2 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              placeholder="Intent (what & why)"
              rows={3}
              value={newIntent}
              onChange={(e) => setNewIntent(e.target.value)}
              data-testid="board-new-intent"
            />
            <input
              type="number"
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={newPriority}
              onChange={(e) => setNewPriority(Number(e.target.value))}
              title="Priority (higher first)"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
              disabled={busy}
              data-testid="board-new-submit"
              onClick={() => void createCard()}
            >
              Create draft
            </button>
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-xs"
              onClick={() => setShowNew(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-3 overflow-x-auto p-4" data-testid="board-columns">
        {COLUMNS.map((col) => (
          <section
            key={col.key}
            className="flex w-64 shrink-0 flex-col rounded-lg bg-zinc-100/80 dark:bg-zinc-900/80"
            data-testid={`board-col-${col.key}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => void onDrop(col.key)}
          >
            <h2 className="sticky top-0 border-b border-zinc-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
              {col.label}{" "}
              <span className="font-normal text-zinc-400">
                {(columns[col.key] || []).length}
              </span>
            </h2>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
              {(columns[col.key] || []).map((card) => (
                <article
                  key={card.id}
                  draggable
                  onDragStart={() => setDragId(card.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => void openCard(card.id)}
                  className={`cursor-grab rounded-md border border-zinc-200 bg-white p-3 text-left shadow-sm active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-950 ${
                    dragId === card.id ? "opacity-50" : ""
                  }`}
                  data-testid={`board-card-${card.id}`}
                >
                  <div className="text-sm font-medium leading-snug">{card.title}</div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600 dark:bg-zinc-800">
                      {card.product_line}
                    </span>
                    {card.priority !== 0 && (
                      <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700 dark:bg-sky-950">
                        P{card.priority}
                      </span>
                    )}
                    {card.sub_stage && (
                      <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700 dark:bg-violet-950">
                        {card.sub_stage}
                      </span>
                    )}
                    {card.open_flag_count > 0 && (
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">
                        {card.open_flag_count} flag
                        {card.open_flag_count === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  {card.claimed_callsign && (
                    <div className="mt-1 text-[11px] text-zinc-400">
                      @{card.claimed_callsign}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <aside
          className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          data-testid="board-drawer"
        >
          <div className="flex items-start gap-2 border-b border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{selected.title}</h2>
              <p className="text-xs text-zinc-500">
                #{selected.id} · {selected.status}
                {selected.sub_stage ? ` / ${selected.sub_stage}` : ""} ·{" "}
                {selected.product_line}
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-zinc-500"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
            <section>
              <h3 className="text-xs font-semibold uppercase text-zinc-500">Intent</h3>
              <pre className="mt-1 whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-200">
                {selected.intent_md}
              </pre>
            </section>
            {selected.acceptance_md && (
              <section>
                <h3 className="text-xs font-semibold uppercase text-zinc-500">
                  Acceptance
                </h3>
                <pre className="mt-1 whitespace-pre-wrap font-sans">
                  {selected.acceptance_md}
                </pre>
              </section>
            )}
            {selected.inputs_md && (
              <section>
                <h3 className="text-xs font-semibold uppercase text-zinc-500">Inputs</h3>
                <pre className="mt-1 whitespace-pre-wrap font-sans">{selected.inputs_md}</pre>
              </section>
            )}
            <section>
              <h3 className="text-xs font-semibold uppercase text-zinc-500">
                Flags ({selected.flags.filter((f) => f.status === "open").length} open)
              </h3>
              <ul className="mt-1 space-y-1">
                {selected.flags.map((f) => (
                  <li key={f.id} className="rounded bg-zinc-50 p-2 text-xs dark:bg-zinc-800">
                    <strong>{f.guardian}</strong> [{f.status}] {f.message}
                    {f.status === "open" && (
                      <button
                        type="button"
                        className="ml-2 underline"
                        onClick={async () => {
                          const r = await fetch(
                            `/api/admin/board/flags/${f.id}/clear`,
                            { method: "POST", credentials: "same-origin" },
                          );
                          if (r.ok) {
                            const d = await r.json();
                            setSelected(d.item);
                            load();
                          }
                        }}
                      >
                        clear
                      </button>
                    )}
                  </li>
                ))}
                {!selected.flags.length && (
                  <li className="text-xs text-zinc-400">None</li>
                )}
              </ul>
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase text-zinc-500">Artifacts</h3>
              <ul className="mt-1 space-y-1">
                {selected.artifacts.map((a) => (
                  <li key={a.id} className="rounded bg-zinc-50 p-2 text-xs dark:bg-zinc-800">
                    <span className="font-mono">{a.stage}</span> — {a.title}
                  </li>
                ))}
                {!selected.artifacts.length && (
                  <li className="text-xs text-zinc-400">None yet</li>
                )}
              </ul>
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase text-zinc-500">History</h3>
              <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs text-zinc-500">
                {selected.transitions.map((t) => (
                  <li key={t.id}>
                    {t.from_status ?? "∅"} → {t.to_status}
                    {t.sub_stage ? ` (${t.sub_stage})` : ""} · {t.actor_label}
                    {t.reason ? ` — ${t.reason}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-zinc-200 p-4 dark:border-zinc-700">
            {selected.status === "draft" && (
              <button
                type="button"
                className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white"
                disabled={busy}
                data-testid="board-queue"
                onClick={() => void transition(selected.id, "queued")}
              >
                Move to Queued
              </button>
            )}
            {selected.status === "awaiting_approval" && (
              <>
                <button
                  type="button"
                  className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white"
                  disabled={busy}
                  data-testid="board-approve"
                  onClick={() => void transition(selected.id, "published")}
                >
                  Approve → Published
                </button>
                <button
                  type="button"
                  className="rounded border border-red-400 px-3 py-1.5 text-xs text-red-700"
                  disabled={busy}
                  onClick={() => {
                    const reason = window.prompt("Reject reason:") || undefined;
                    if (reason) void transition(selected.id, "rejected", { reason });
                  }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="rounded border px-3 py-1.5 text-xs"
                  disabled={busy}
                  onClick={() => {
                    const reason = window.prompt("Revision instructions:") || undefined;
                    if (reason)
                      void transition(selected.id, "revision_requested", { reason });
                  }}
                >
                  Request revision
                </button>
              </>
            )}
            {selected.status === "queued" && (
              <button
                type="button"
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-white"
                disabled={busy}
                onClick={() => void transition(selected.id, "scheduled")}
              >
                Claim → Scheduled
              </button>
            )}
            {selected.status === "scheduled" && (
              <button
                type="button"
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-white"
                disabled={busy}
                onClick={() =>
                  void transition(selected.id, "in_production", {
                    sub_stage: "research",
                  })
                }
              >
                Start production
              </button>
            )}
            {selected.status === "in_production" && (
              <button
                type="button"
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-white"
                disabled={busy}
                data-testid="board-await-approval"
                onClick={() => void transition(selected.id, "awaiting_approval")}
              >
                Submit for approval
              </button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
