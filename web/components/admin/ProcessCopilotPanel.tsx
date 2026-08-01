"use client";

// Always-available AI process co-pilot on a board card.
// Peers into checklist/status/artifacts; drafts fixes; optional apply artifact.

import { useCallback, useEffect, useRef, useState } from "react";

type ChatTurn = {
  role: string;
  content: string;
  at?: string;
  actor_label?: string;
  provider?: string;
  model?: string;
};

type ProposedArtifact = {
  stage: string;
  title: string;
  body_md: string;
};

type Props = {
  itemId: number;
  busy?: boolean;
  onChanged?: () => void;
  onError?: (msg: string) => void;
};

export default function ProcessCopilotPanel({
  itemId,
  busy: parentBusy,
  onChanged,
  onError,
}: Props) {
  const [open, setOpen] = useState(true);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [useFixtures, setUseFixtures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposed, setProposed] = useState<ProposedArtifact[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/board/items/${itemId}/process-chat`, {
        credentials: "same-origin",
      });
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(
          typeof b.detail === "string" ? b.detail : `HTTP ${r.status}`,
        );
      }
      const data = await r.json();
      setChat((data.process_chat?.chat as ChatTurn[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, sending]);

  const formatDetail = (detail: unknown, status: number): string => {
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) =>
          typeof d === "object" && d && "msg" in d
            ? String((d as { msg: string }).msg)
            : JSON.stringify(d),
        )
        .join("; ");
    }
    if (detail && typeof detail === "object") return JSON.stringify(detail);
    return `HTTP ${status}`;
  };

  const send = async (override?: string) => {
    const text = (override ?? message).trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setProposed([]);
    if (!override) setMessage("");
    // optimistic user turn — keep visible even if the request fails
    setChat((c) => [
      ...c,
      { role: "user", content: text, at: new Date().toISOString() },
    ]);
    try {
      const r = await fetch(`/api/admin/board/items/${itemId}/process-chat`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          use_fixtures: useFixtures,
        }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(formatDetail(body.detail, r.status));
      }
      // Server returns full history including the user turn
      setChat((body.chat as ChatTurn[]) || []);
      setProposed((body.proposed_artifacts as ProposedArtifact[]) || []);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      onError?.(msg);
      // Keep optimistic user message; append a visible failure note (do NOT reload — that wiped the log)
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          content: `⚠️ Co-pilot request failed:\n${msg}\n\nYour question is still above. Fix the error (API key / migration / server) and try again.`,
          at: new Date().toISOString(),
          model: "error",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const applyArtifact = async (a: ProposedArtifact) => {
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/board/items/${itemId}/artifacts`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: a.stage,
          title: a.title,
          body_md: a.body_md,
        }),
      });
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(
          typeof b.detail === "string" ? b.detail : `HTTP ${r.status}`,
        );
      }
      setProposed((list) => list.filter((x) => x !== a));
      onChanged?.();
      void send(
        `I applied artifact “${a.title}” as stage ${a.stage}. Re-check readiness and tell me what is still missing.`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      onError?.(msg);
    } finally {
      setSending(false);
    }
  };

  const quickPrompts = [
    "Where am I in the process and what's next?",
    "Is anything stuck or RED? Why?",
    "What package stages are still missing?",
    "Draft whatever is missing next as an artifact I can apply.",
  ];

  const busy = sending || parentBusy;

  return (
    <section
      className="flex flex-col rounded-lg border border-sky-300 bg-sky-50/50 dark:border-sky-800 dark:bg-sky-950/30"
      data-testid="process-copilot-panel"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
        data-testid="process-copilot-toggle"
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100">
            Process co-pilot
          </div>
          <div className="text-[11px] text-sky-800/80 dark:text-sky-200/80">
            AI peer for the whole card lifecycle — check, diagnose, fix
          </div>
        </div>
        <span className="text-xs text-sky-700 dark:text-sky-300">
          {open ? "Collapse" : "Expand"}
        </span>
      </button>

      {open && (
        <div className="flex min-h-[280px] flex-col border-t border-sky-200 dark:border-sky-900">
          <div className="flex flex-wrap gap-1 border-b border-sky-200 px-2 py-1.5 dark:border-sky-900">
            {quickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                className="rounded-full border border-sky-300 bg-white px-2 py-0.5 text-[10px] text-sky-900 disabled:opacity-50 dark:border-sky-700 dark:bg-zinc-950 dark:text-sky-100"
                disabled={busy}
                onClick={() => void send(q)}
              >
                {q.length > 42 ? `${q.slice(0, 40)}…` : q}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-1 text-[10px] text-zinc-500">
              <input
                type="checkbox"
                checked={useFixtures}
                onChange={(e) => setUseFixtures(e.target.checked)}
              />
              fixtures
            </label>
          </div>

          <div
            className="max-h-64 flex-1 space-y-2 overflow-y-auto px-3 py-2 text-xs"
            data-testid="process-copilot-messages"
          >
            {loading && (
              <p className="text-zinc-400">Loading co-pilot history…</p>
            )}
            {!loading && !chat.length && (
              <p className="text-zinc-500">
                Ask anything about this card: progress, blockers, drafts for
                missing stages. Context includes checklist, artifacts, flags,
                and blueprint status.
              </p>
            )}
            {chat.map((t, i) => (
              <div
                key={i}
                className={
                  t.role === "user"
                    ? "ml-4 rounded-md bg-white px-2 py-1.5 text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                    : "mr-2 rounded-md bg-sky-100/80 px-2 py-1.5 text-zinc-800 dark:bg-sky-950/60 dark:text-sky-50"
                }
              >
                <div className="mb-0.5 text-[10px] font-semibold uppercase text-zinc-400">
                  {t.role === "user" ? "You" : "Co-pilot"}
                  {t.model ? ` · ${t.model}` : ""}
                </div>
                <pre className="whitespace-pre-wrap font-sans leading-snug">
                  {t.content}
                </pre>
              </div>
            ))}
            {sending && (
              <p className="text-[11px] text-sky-700 dark:text-sky-300">
                Co-pilot is thinking with Grok (often 15–60s). Leave this open…
              </p>
            )}
            <div ref={endRef} />
          </div>

          {proposed.length > 0 && (
            <div className="space-y-1 border-t border-sky-200 px-3 py-2 dark:border-sky-900">
              <div className="text-[10px] font-semibold uppercase text-sky-800 dark:text-sky-200">
                Proposed artifacts — apply to checklist
              </div>
              {proposed.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-2 rounded border border-sky-200 bg-white px-2 py-1 text-[11px] dark:border-sky-800 dark:bg-zinc-950"
                >
                  <div>
                    <span className="font-mono">{a.stage}</span> — {a.title}
                    <div className="max-h-16 overflow-hidden text-zinc-500">
                      {(a.body_md || "").slice(0, 160)}
                      {(a.body_md || "").length > 160 ? "…" : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded bg-sky-700 px-2 py-1 text-[10px] text-white disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void applyArtifact(a)}
                    data-testid="process-copilot-apply-artifact"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div
              className="border-t border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100"
              role="alert"
              data-testid="process-copilot-error"
            >
              <div className="font-semibold">Co-pilot error</div>
              <pre className="mt-1 whitespace-pre-wrap font-sans font-normal leading-snug">
                {error}
              </pre>
            </div>
          )}

          <div className="flex gap-2 border-t border-sky-200 p-2 dark:border-sky-900">
            <textarea
              className="min-h-[2.5rem] flex-1 resize-y rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-950"
              rows={2}
              placeholder="Ask the process… e.g. Why is this stuck? Draft the next missing stage."
              value={message}
              disabled={busy}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              data-testid="process-copilot-input"
            />
            <button
              type="button"
              className="self-end rounded bg-sky-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
              disabled={busy || !message.trim()}
              onClick={() => void send()}
              data-testid="process-copilot-send"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
