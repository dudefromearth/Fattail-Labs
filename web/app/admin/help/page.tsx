"use client";

// Admin help desk — triage queue + thread + answer (public reply or internal note).
// Data: /api/admin/help/questions (list), /{id} (thread), POST /{id}/messages, PATCH /{id}/status.
// Spec: FatTail-Labs-Help-System-Spec-v1.0.

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: number; email: string; subject: string; category: string; status: string;
  reply_count: number; team_reply_count: number; has_screenshot: boolean;
  created_at: string | null; updated_at: string | null; answered_at: string | null;
  member_last_viewed_at: string | null; member_replied: boolean; last_email_status: string | null;
};

// A ticket that was answered and then re-opened by a member reply reads as
// "Responded" (needs another look) — it sits between Open and Answered. Every
// other state shows its raw status.
function displayStatus(status: string, answeredAt: string | null): string {
  if (status === "open" && answeredAt) return "responded";
  return status;
}

// What the queue row says about replies: real team replies vs the AI-only case,
// so an open ticket the bot auto-answered never looks like a human handled it.
function replyLabel(r: Row): string {
  if (r.team_reply_count > 0)
    return `${r.team_reply_count} team repl${r.team_reply_count === 1 ? "y" : "ies"}`;
  if (r.reply_count > 0) return "no team reply yet · AI only";
  return "no replies";
}
type Msg = {
  id: number; author_role: string; visibility: string; body: string; created_at: string | null;
  email_status?: string | null; emailed_at?: string | null;
};

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
    member_last_viewed_at?: string | null;
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

  const deleteMessage = useCallback(async (messageId: number) => {
    if (!sel || busy) return;
    if (!window.confirm(
      "Delete this team reply from the thread?\n\nNote: if an email already went out, it can't be recalled — post the corrected reply after deleting.",
    )) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/help/questions/${sel}/messages/${messageId}`, {
        method: "DELETE", credentials: "same-origin",
      });
      if (r.ok) { await open(sel); await load(status, search); }
      else setError(await r.text());
    } finally { setBusy(false); }
  }, [sel, busy, open, load, status, search]);

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
          <a href="/admin/help/analytics" className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:border-zinc-400 dark:border-zinc-700">📊 Analytics</a>
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
                    <div className="text-xs text-zinc-500">{r.category} · {replyLabel(r)}{r.has_screenshot ? " · 📷" : ""}</div>
                    {(r.member_replied || r.member_last_viewed_at || r.last_email_status) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {r.member_replied && <Sig tone="sky">💬 replied</Sig>}
                        {r.member_last_viewed_at && <Sig tone="zinc">{`👁 seen ${fmtShort(r.member_last_viewed_at)}`}</Sig>}
                        {r.last_email_status === "sent" && <Sig tone="emerald">✉ sent</Sig>}
                        {r.last_email_status === "failed" && <Sig tone="red">⚠ email failed</Sig>}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.email || "—"}</td>
                  <td className="px-3 py-2"><StatusPill s={displayStatus(r.status, r.answered_at)} /></td>
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
                  <StatusPill s={displayStatus(detail.question.status, detail.question.answered_at)} />
                </div>
                <p className="text-xs text-zinc-500">
                  {detail.question.email} · {detail.question.category}
                  {detail.question.page_context ? ` · on ${detail.question.page_context}` : ""} · {fmt(detail.question.created_at)}
                </p>
                {detail.question.member_last_viewed_at && (
                  <p className="mt-0.5 text-xs text-zinc-400">👁 Member last viewed {fmt(detail.question.member_last_viewed_at)}</p>
                )}
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
                        {m.author_role === "admin" && m.visibility === "public" && m.email_status && (
                          m.email_status === "sent"
                            ? <Sig tone="emerald">{`✉ emailed${m.emailed_at ? " " + fmtShort(m.emailed_at) : ""}`}</Sig>
                            : m.email_status === "failed"
                              ? <Sig tone="red">⚠ email failed</Sig>
                              : <Sig tone="zinc">✉ not emailed</Sig>
                        )}
                        {m.author_role === "admin" && (
                          <button onClick={() => deleteMessage(m.id)} disabled={busy}
                            title="Delete this team reply from the thread"
                            className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40">
                            Delete
                          </button>
                        )}
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
  const color =
    s === "open" ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
    : s === "responded" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
    : s === "answered" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
    : s === "ai_resolved" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
    : s === "ai_pending" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800";
  const label = s === "ai_resolved" ? "AI resolved" : s === "ai_pending" ? "AI pending" : s;
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${color}`}>{label}</span>;
}

// Small read/sent signal pill.
function Sig({ tone, children }: { tone: string; children: string }) {
  const c: Record<string, string> = {
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  };
  return <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${c[tone] || c.zinc}`}>{children}</span>;
}

function fmtShort(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
