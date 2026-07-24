"use client";

// Course Blueprint workspace — full-size streaming chat for outline development.
// Drawer mode is a launch pad only; real work happens in layout="workspace".
// API: /api/admin/board/items/{id}/blueprint/*

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

export type ChatTurn = {
  role: string;
  content: string;
  at?: string;
  parse_error?: boolean;
  provider?: string;
  model?: string;
  streamed?: boolean;
};

type ModuleStub = {
  title?: string;
  description_md?: string;
  lessons?: { title?: string; outcomes?: string[] }[];
};

export type Blueprint = {
  id: number;
  content_item_id: number;
  version: number;
  status: string;
  header: {
    course_title?: string;
    subtitle?: string | null;
    description_md?: string;
    level?: string | null;
    trailer_intent?: string | null;
  };
  outline: { modules?: ModuleStub[] };
  chat: ChatTurn[];
  validation: {
    ok: boolean;
    min_descriptions_ok?: boolean;
    errors: string[];
  };
  approved_at?: string | null;
  approved_actor_label?: string | null;
};

type Props = {
  itemId: number;
  /** drawer = launch pad on board; workspace = full-size chat (primary) */
  layout?: "drawer" | "workspace";
  cardTitle?: string;
  onChanged?: () => void;
};

export default function CourseBlueprintPanel({
  itemId,
  layout = "workspace",
  cardTitle,
  onChanged,
}: Props) {
  const workspace = layout === "workspace";
  const [bp, setBp] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [useFixtures, setUseFixtures] = useState(false);
  const [assistantHint, setAssistantHint] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [localChat, setLocalChat] = useState<ChatTurn[] | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/board/items/${itemId}/blueprint`, {
        credentials: "same-origin",
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(
          typeof body.detail === "string" ? body.detail : `HTTP ${r.status}`,
        );
      }
      const data = await r.json();
      setBp(data.blueprint as Blueprint);
      setLocalChat(null);
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
    if (workspace) inputRef.current?.focus();
  }, [workspace, loading]);

  const displayChat = localChat ?? bp?.chat ?? [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayChat.length, streamText, assistantHint]);

  const stopStream = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const sendChat = async () => {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setAssistantHint(null);
    setStreamText("");

    const optimisticUser: ChatTurn = {
      role: "user",
      content: text,
      at: new Date().toISOString(),
    };
    setLocalChat([...(bp?.chat || []), optimisticUser]);
    setMessage("");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const r = await fetch(
        `/api/admin/board/items/${itemId}/blueprint/chat/stream`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            use_fixtures: useFixtures,
          }),
          signal: ac.signal,
        },
      );

      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(
          typeof body.detail === "string" ? body.detail : `HTTP ${r.status}`,
        );
      }
      if (!r.body) throw new Error("No response body for stream");

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const block of parts) {
          const line = block
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));
          if (!line) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          let ev: {
            type: string;
            text?: string;
            detail?: string;
            blueprint?: Blueprint;
            parse_error?: boolean;
          };
          try {
            ev = JSON.parse(raw);
          } catch {
            continue;
          }
          if (ev.type === "delta" && typeof ev.text === "string") {
            acc += ev.text;
            setStreamText(acc);
          } else if (ev.type === "error") {
            throw new Error(ev.detail || "stream error");
          } else if (ev.type === "done" && ev.blueprint) {
            setBp(ev.blueprint);
            setLocalChat(null);
            setStreamText("");
            if (ev.parse_error) {
              setAssistantHint(
                "Streamed reply could not be fully parsed as blueprint JSON — outline may be unchanged. Try a clearer instruction.",
              );
            }
            onChanged?.();
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setAssistantHint("Generation stopped.");
      } else {
        setError(e instanceof Error ? e.message : String(e));
        void load();
      }
      setStreamText("");
      setLocalChat(null);
    } finally {
      setBusy(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  const validate = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/admin/board/items/${itemId}/blueprint/validate`,
        { method: "POST", credentials: "same-origin" },
      );
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(
          typeof body.detail === "string" ? body.detail : `HTTP ${r.status}`,
        );
      }
      if (body.blueprint) setBp(body.blueprint as Blueprint);
      else await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (busy) return;
    if (
      !window.confirm(
        "Approve this Course Blueprint? Downstream production (scripts, video) may proceed from this outline.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/admin/board/items/${itemId}/blueprint/approve`,
        { method: "POST", credentials: "same-origin" },
      );
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(
          typeof body.detail === "string" ? body.detail : `HTTP ${r.status}`,
        );
      }
      setBp(body.blueprint as Blueprint);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section data-testid="course-blueprint-panel" className="text-sm text-zinc-500">
        Loading blueprint…
      </section>
    );
  }

  const status = bp?.status || "draft";
  const ok = bp?.validation?.ok === true;
  const approved = status === "approved";
  const modules = bp?.outline?.modules || [];
  const lessonCount = modules.reduce(
    (n, m) => n + ((m.lessons || []).length || 0),
    0,
  );

  // --- Board drawer: launch pad only (no cramped chat) ---
  if (!workspace) {
    return (
      <section
        data-testid="course-blueprint-panel"
        data-layout="drawer"
        className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900/50 dark:bg-violet-950/25"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
              Course outline workspace
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Develop Header, modules, and lessons in a full-size streaming chat — not
              this narrow drawer.
            </p>
          </div>
          <StatusBadge status={status} ok={ok} />
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded bg-white/80 px-1 py-2 dark:bg-zinc-900/60">
            <dt className="text-zinc-500">Modules</dt>
            <dd className="text-base font-semibold">{modules.length}</dd>
          </div>
          <div className="rounded bg-white/80 px-1 py-2 dark:bg-zinc-900/60">
            <dt className="text-zinc-500">Lessons</dt>
            <dd className="text-base font-semibold">{lessonCount}</dd>
          </div>
          <div className="rounded bg-white/80 px-1 py-2 dark:bg-zinc-900/60">
            <dt className="text-zinc-500">Min bar</dt>
            <dd
              className={
                ok
                  ? "text-base font-semibold text-emerald-700"
                  : "text-base font-semibold text-red-600"
              }
            >
              {ok ? "OK" : "…"}
            </dd>
          </div>
        </dl>
        {(bp?.header?.course_title || cardTitle) && (
          <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">
            {bp?.header?.course_title || cardTitle}
          </p>
        )}
        <Link
          href={`/admin/board/blueprint/${itemId}`}
          className="flex w-full items-center justify-center rounded-lg bg-violet-700 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-violet-600"
          data-testid="blueprint-open-workspace"
        >
          Open outline workspace →
        </Link>
        <p className="text-[10px] text-zinc-500">
          Full-page chat + live outline · Grok streaming · Approve when ready
        </p>
      </section>
    );
  }

  // --- Full workspace: chat-first ---
  return (
    <section
      data-testid="course-blueprint-panel"
      data-layout="workspace"
      className="flex h-[calc(100vh-5.5rem)] min-h-[32rem] flex-col gap-3"
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {cardTitle || bp?.header?.course_title || "Course outline"}
            </h1>
            <StatusBadge status={status} ok={ok} />
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Full-size co-pilot for Header · Modules · Lessons · Preview updates live ·
            Structured blueprint is the product
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/board?item=${itemId}`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
          >
            ← Board
          </Link>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
            disabled={busy}
            data-testid="blueprint-validate"
            onClick={() => void validate()}
          >
            Validate
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            disabled={busy || approved || !ok}
            data-testid="blueprint-approve"
            onClick={() => void approve()}
          >
            {approved ? "Approved" : "Approve Blueprint"}
          </button>
        </div>
      </header>

      {(error || assistantHint || (bp?.validation?.errors?.length && !ok)) && (
        <div className="shrink-0 space-y-1">
          {error && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
              data-testid="blueprint-error"
            >
              {error}
            </p>
          )}
          {assistantHint && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              {assistantHint}
            </p>
          )}
          {!ok && bp?.validation?.errors?.length ? (
            <ul
              className="list-inside list-disc text-xs text-red-700 dark:text-red-300"
              data-testid="blueprint-validation-errors"
            >
              {bp.validation.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}
          {ok && (
            <p
              className="text-xs text-emerald-700 dark:text-emerald-400"
              data-testid="blueprint-validation-ok"
            >
              Minimum bar met
              {approved ? " · blueprint approved" : " · ready to approve"}
            </p>
          )}
        </div>
      )}

      {/* Chat-dominant grid: ~2/3 chat, ~1/3 outline */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-5">
        {/* CHAT — primary surface */}
        <div
          className="flex min-h-0 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950 lg:col-span-3"
          data-testid="blueprint-chat"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Co-pilot chat
            </span>
            <label className="flex items-center gap-2 text-[11px] text-zinc-500">
              <input
                type="checkbox"
                checked={useFixtures}
                onChange={(e) => setUseFixtures(e.target.checked)}
                data-testid="blueprint-use-fixtures"
              />
              Fixtures (off = live Grok)
            </label>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {!displayChat.length && !streamText && (
              <div className="mx-auto max-w-lg space-y-3 py-12 text-center">
                <p className="text-base font-medium text-zinc-800 dark:text-zinc-100">
                  Develop the course outline here
                </p>
                <p className="text-sm leading-relaxed text-zinc-500">
                  Talk through Header, modules, and lessons. Streaming Grok replies
                  update the live outline on the right. When descriptions look right,
                  Validate and Approve Blueprint.
                </p>
                <p className="text-xs text-zinc-400">
                  Try: “Draft a beginner course from the card intent with 3 modules.”
                </p>
              </div>
            )}
            {displayChat.map((t, i) => (
              <div
                key={`${t.at}-${i}`}
                className={
                  t.role === "user"
                    ? "ml-8 rounded-2xl bg-violet-100 px-4 py-3 text-[15px] leading-relaxed text-violet-950 dark:bg-violet-900/40 dark:text-violet-100"
                    : "mr-8 rounded-2xl bg-zinc-100 px-4 py-3 text-[15px] leading-relaxed text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                }
              >
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-50">
                  {t.role}
                  {t.parse_error ? " · parse error" : ""}
                  {t.streamed ? " · streamed" : ""}
                </div>
                <pre className="whitespace-pre-wrap font-sans">{t.content}</pre>
              </div>
            ))}
            {streamText && (
              <div
                className="mr-8 rounded-2xl bg-zinc-100 px-4 py-3 text-[15px] leading-relaxed text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                data-testid="blueprint-stream-live"
              >
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-50">
                  assistant · streaming…
                </div>
                <pre className="whitespace-pre-wrap font-sans">
                  {streamText}
                  <span className="animate-pulse">{"\u258c"}</span>
                </pre>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="shrink-0 border-t border-zinc-100 p-4 dark:border-zinc-800">
            <textarea
              ref={inputRef}
              className="min-h-[5.5rem] w-full resize-y rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-[15px] leading-relaxed dark:border-zinc-600 dark:bg-zinc-900"
              placeholder={
                approved
                  ? "Request a revision to modules or lessons…"
                  : "Describe the course, modules, or lessons you want…"
              }
              value={message}
              disabled={busy}
              data-testid="blueprint-chat-input"
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void sendChat();
                }
              }}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                disabled={busy || !message.trim()}
                data-testid="blueprint-chat-send"
                onClick={() => void sendChat()}
              >
                {busy ? "Streaming…" : "Send"}
              </button>
              {busy && (
                <button
                  type="button"
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm dark:border-zinc-600"
                  onClick={stopStream}
                >
                  Stop
                </button>
              )}
              <span className="text-[11px] text-zinc-400">⌘/Ctrl+Enter</span>
            </div>
          </div>
        </div>

        {/* OUTLINE PREVIEW — live product */}
        <aside
          className="flex min-h-0 flex-col rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 lg:col-span-2"
          data-testid="blueprint-preview"
        >
          <div className="shrink-0 border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Live outline (product)
            </span>
            <p className="text-[10px] text-zinc-400">
              {modules.length} modules · {lessonCount} lessons
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {bp?.header?.course_title || "—"}
              </h2>
              {bp?.header?.subtitle && (
                <p className="text-xs text-zinc-500">{bp.header.subtitle}</p>
              )}
              {bp?.header?.level && (
                <p className="text-[11px] text-zinc-400">Level: {bp.header.level}</p>
              )}
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-3 font-sans text-xs leading-relaxed text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                {(bp?.header?.description_md || "").trim() || (
                  <span className="text-red-600">No course description yet</span>
                )}
              </pre>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold uppercase text-zinc-500">
                Modules & lessons
              </h3>
              {!modules.length && (
                <p className="mt-2 text-xs text-red-600">
                  No modules yet — describe them in chat.
                </p>
              )}
              <ol className="mt-2 space-y-3">
                {modules.map((m, i) => (
                  <li
                    key={`${m.title}-${i}`}
                    className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {i + 1}. {m.title || "Untitled module"}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {(m.description_md || "").trim() || (
                        <span className="text-red-600">Missing description</span>
                      )}
                    </p>
                    <ul className="mt-2 space-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                      {(m.lessons || []).map((l, j) => (
                        <li
                          key={`${l.title}-${j}`}
                          className="text-xs text-zinc-600 dark:text-zinc-400"
                        >
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {i + 1}.{j + 1}
                          </span>{" "}
                          {l.title || "Untitled lesson"}
                          {l.outcomes?.length ? (
                            <span className="block pl-4 text-[10px] text-zinc-400">
                              → {l.outcomes.join("; ")}
                            </span>
                          ) : null}
                        </li>
                      ))}
                      {!(m.lessons || []).length && (
                        <li className="text-xs text-red-600">No lesson stubs</li>
                      )}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function StatusBadge({ status, ok }: { status: string; ok: boolean }) {
  let cls =
    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ";
  if (status === "approved") {
    cls +=
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
  } else if (status === "pending_validation" || ok) {
    cls += "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100";
  } else {
    cls += "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  }
  return (
    <span className={cls} data-testid="blueprint-status">
      {status.replace(/_/g, " ")}
    </span>
  );
}
