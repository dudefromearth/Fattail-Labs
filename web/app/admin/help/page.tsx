"use client";

// Admin help desk — triage queue + thread + answer (public reply or internal note).
// Data: /api/admin/help/questions (list), /{id} (thread), POST /{id}/messages, PATCH /{id}/status.
// Spec: FatTail-Labs-Help-System-Spec-v1.0.

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: number; email: string; subject: string; category: string; status: string;
  reply_count: number; has_screenshot: boolean;
  created_at: string | null; updated_at: string | null;
};
type Msg = { id: number; author_role: string; visibility: string; body: string; created_at: string | null };

// Who sent a message, made visually distinct so the bot is never mistaken for the member.
function roleStyle(authorRole: string, visibility?: string): { label: string; box: string; badge: string } {
  if (authorRole === "assistant")
    return {
      label: "AI assistant",
      box: "border-l-violet-400 bg-violet-50/70 dark:bg-violet-950/30",
      badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    };
  if (authorRole === "admin")
    return visibility === "internal"
      ? {
          label: "Team · internal note",
          box: "border-l-amber-400 bg-amber-50/70 dark:bg-amber-950/30",
          badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
        }
      : {
          label: "Team",
          box: "border-l-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30",
          badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
        };
  return {
    label: "Member",
    box: "border-l-sky-400 bg-sky-50/70 dark:bg-sky-950/30",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  };
}
type Detail = {
  question: {
    id: number; email: string; subject: string; body: string; category: string;
    status: string; page_context: string | null; screenshot_url: string | null;
    created_at: string | null; answered_at: string | null;
  };
  messages: Msg[];
};

const STATUSES = ["all", "open", "answered", "closed"];

function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function AdminHelpPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reply, setReply] = useState("");
  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (st: string, q: string) => {
    setError(null);
    const r = await fetch(
      `/api/admin/help/questions?status=${encodeURIComponent(st)}&search=${encodeURIComponent(q)}&limit=100`,
      { credentials: "same-origin" },
    );
    if (!r.ok) { setError(r.status === 403 ? "Administrator sign-in required." : await r.text()); setRows([]); return; }
    setRows((await r.json()).questions || []);
  }, []);

  useEffect(() => { load(status, ""); }, [load, status]);

  const open = useCallback(async (id: number) => {
    setSel(id); setDetail(null); setReply("");
    const r = await fetch(`/api/admin/help/questions/${id}`, { credentials: "same-origin" });
    if (r.ok) setDetail(await r.json());
  }, []);

  const submitReply = useCallback(async () => {
    if (!sel || !reply.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/help/questions/${sel}/messages`, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim(), visibility }),
      });
      if (r.ok) { await open(sel); await load(status, search); }
      else setError(await r.text());
    } finally { setBusy(false); }
  }, [sel, reply, visibility, busy, open, load, status, search]);

  const setQStatus = useCallback(async (id: number, s: string) => {
    await fetch(`/api/admin/help/questions/${id}/status`, {
      method: "PATCH", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }),
    });
    await open(id); await load(status, search);
  }, [open, load, status, search]);

  return (
    <main className="space-y-5 p-6" data-testid="admin-help">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Help</h1>
          <p className="mt-1 text-sm text-zinc-500">Member questions — answer publicly or leave an internal note.</p>
        </div>
        <div className="flex items-center gap-2">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-md border px-2.5 py-1 text-xs capitalize ${status === s ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" : "border-zinc-300 dark:border-zinc-700"}`}>
              {s}
            </button>
          ))}
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(status, search)}
            placeholder="Search…" className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </div>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(380px,520px)]">
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase text-zinc-500 dark:bg-zinc-800">
              <tr><th className="px-3 py-2">Subject</th><th className="px-3 py-2">From</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Updated</th></tr>
            </thead>
            <tbody>
              {(rows || []).map((r) => (
                <tr key={r.id} onClick={() => open(r.id)}
                  className={`cursor-pointer border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${sel === r.id ? "bg-emerald-50 dark:bg-emerald-950/40" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.subject}</div>
                    <div className="text-xs text-zinc-500">{r.category} · {r.reply_count} repl{r.reply_count === 1 ? "y" : "ies"}{r.has_screenshot ? " · 📷" : ""}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{r.email || "—"}</td>
                  <td className="px-3 py-2"><StatusPill s={r.status} /></td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{fmt(r.updated_at)}</td>
                </tr>
              ))}
              {rows && rows.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-zinc-400">No questions.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          {!sel && <p className="text-sm text-zinc-400">Select a question.</p>}
          {sel && !detail && <p className="text-sm text-zinc-400">Loading…</p>}
          {detail && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{detail.question.subject}</h2>
                  <StatusPill s={detail.question.status} />
                </div>
                <p className="text-xs text-zinc-500">
                  {detail.question.email} · {detail.question.category}
                  {detail.question.page_context ? ` · on ${detail.question.page_context}` : ""} · {fmt(detail.question.created_at)}
                </p>
              </div>

              <div className="rounded-md border-l-4 border-l-sky-400 bg-sky-50/70 p-3 dark:bg-sky-950/30">
                <div className="mb-1">
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                    Member · original question
                  </span>
                </div>
                <div className="whitespace-pre-wrap">{detail.question.body}</div>
                {detail.question.screenshot_url && (
                  <a href={detail.question.screenshot_url} target="_blank" rel="noreferrer">
                    <img src={detail.question.screenshot_url} alt="attached screenshot"
                      className="mt-2 max-h-48 rounded border border-zinc-200 dark:border-zinc-700" />
                  </a>
                )}
              </div>

              <ul className="space-y-2">
                {detail.messages.map((m) => {
                  const s = roleStyle(m.author_role, m.visibility);
                  return (
                    <li key={m.id} className={`rounded-md border-l-4 p-3 ${s.box}`}>
                      <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${s.badge}`}>
                          {s.label}
                        </span>
                        <span>{fmt(m.created_at)}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                    </li>
                  );
                })}
              </ul>

              <div className="space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4}
                  placeholder={visibility === "public" ? "Reply to the member…" : "Internal note (member won't see this)…"}
                  className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} /> Public reply
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="radio" checked={visibility === "internal"} onChange={() => setVisibility("internal")} /> Internal note
                  </label>
                  <button onClick={submitReply} disabled={busy || !reply.trim()}
                    className="ml-auto rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
                    {busy ? "Sending…" : "Send"}
                  </button>
                </div>
                <div className="flex gap-2 text-xs">
                  {["open", "answered", "closed"].map((s) => (
                    <button key={s} onClick={() => setQStatus(detail.question.id, s)}
                      className="rounded border border-zinc-300 px-2 py-0.5 capitalize text-zinc-500 hover:border-zinc-400 dark:border-zinc-700">
                      mark {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function StatusPill({ s }: { s: string }) {
  const color = s === "open" ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
    : s === "answered" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${color}`}>{s}</span>;
}
