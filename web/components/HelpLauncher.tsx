"use client";

// Member help widget — floating button that opens an "Ask / My questions" panel.
// Questions + threaded answers are stored in the Labs DB (see routes/help.py).
// Only rendered for authenticated members. Optional attachment is a plain image
// upload (native file picker) — no auto-capture, no extra dependency. Mounted
// behind an ErrorBoundary so it can never affect the rest of the app.
// Spec: FatTail-Labs-Help-System-Spec-v1.0.

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Q = {
  id: number; subject: string; body: string; status: string;
  screenshot_url: string | null; created_at: string | null;
};
type Msg = { id: number; author_role: string; body: string; created_at: string | null };

const CATEGORIES = ["general", "account", "billing", "courses", "technical"];

function fmt(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

export default function HelpLauncher() {
  const pathname = usePathname() || "";
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ask" | "mine">("ask");

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setAuthed(!!d && d.identity_id !== 0); })
      .catch(() => {});
    return () => { alive = false; };
  }, [pathname]);

  if (!authed || pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Get help"
          className="fixed bottom-5 right-5 z-50 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-emerald-500">
          Help
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex max-h-[80vh] w-[min(92vw,400px)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="flex gap-3 text-sm font-medium">
              <button className={tab === "ask" ? "text-emerald-600" : "text-zinc-500"} onClick={() => setTab("ask")}>Ask</button>
              <button className={tab === "mine" ? "text-emerald-600" : "text-zinc-500"} onClick={() => setTab("mine")}>My questions</button>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-zinc-400 hover:text-zinc-600">✕</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "ask" ? <AskForm pathname={pathname} onSent={() => setTab("mine")} /> : <MyQuestions />}
          </div>
        </div>
      )}
    </>
  );
}

function AskForm({ pathname, onSent }: { pathname: string; onSent: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onPickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setErr(null);
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("Image is too large (max 5MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => setShot(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setErr("Couldn't read that image — you can still send your question.");
    reader.readAsDataURL(file);
  }, []);

  const submit = useCallback(async () => {
    if (!subject.trim() || !body.trim() || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/help/questions", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(), body: body.trim(), category,
          page_context: pathname,
          screenshot_base64: shot ? shot.replace(/^data:image\/[a-z+]+;base64,/, "") : null,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.detail || "Couldn't send — please try again."); return; }
      setDone(true);
      setTimeout(onSent, 1200);
    } catch {
      setErr("Network error — your question wasn't sent. Try again.");
    } finally { setBusy(false); }
  }, [subject, body, category, shot, pathname, busy, onSent]);

  if (done) return <div className="py-8 text-center text-sm text-emerald-600">Sent — the team will reply and you'll be notified.</div>;

  return (
    <div className="space-y-3 text-sm">
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What do you need help with?"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Add details…"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 capitalize dark:border-zinc-700 dark:bg-zinc-800">
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="flex items-center gap-2">
        {shot ? (
          <div className="flex items-center gap-2">
            <img src={shot} alt="attachment" className="h-10 rounded border border-zinc-300 dark:border-zinc-700" />
            <button onClick={() => setShot(null)} className="text-xs text-zinc-500 underline">remove</button>
          </div>
        ) : (
          <label className="cursor-pointer rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300">
            📎 Attach an image (optional)
            <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          </label>
        )}
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button onClick={submit} disabled={busy || !subject.trim() || !body.trim()}
        className="w-full rounded-md bg-emerald-600 py-2 font-medium text-white disabled:opacity-50">
        {busy ? "Sending…" : "Send question"}
      </button>
    </div>
  );
}

function MyQuestions() {
  const [list, setList] = useState<Q[] | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [q, setQ] = useState<Q | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const r = await fetch("/api/help/questions", { credentials: "same-origin" });
    if (r.ok) setList((await r.json()).questions || []);
    else setList([]);
  }, []);
  useEffect(() => { loadList(); }, [loadList]);

  const openQ = useCallback(async (id: number) => {
    setSel(id);
    const r = await fetch(`/api/help/questions/${id}`, { credentials: "same-origin" });
    if (r.ok) { const d = await r.json(); setQ(d.question); setMsgs(d.messages || []); }
  }, []);

  const sendReply = useCallback(async () => {
    if (!sel || !reply.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/help/questions/${sel}/messages`, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: reply.trim() }),
      });
      if (r.ok) { setReply(""); await openQ(sel); }
    } finally { setBusy(false); }
  }, [sel, reply, busy, openQ]);

  if (sel && q) {
    return (
      <div className="space-y-3 text-sm">
        <button onClick={() => { setSel(null); setQ(null); loadList(); }} className="text-xs text-zinc-500 underline">← Back</button>
        <div>
          <div className="font-medium">{q.subject}</div>
          <div className="text-xs capitalize text-zinc-500">{q.status}</div>
        </div>
        <div className="rounded-md bg-zinc-50 p-2 whitespace-pre-wrap dark:bg-zinc-800/60">{q.body}</div>
        {msgs.map((m) => (
          <div key={m.id} className={`rounded-md p-2 ${m.author_role === "admin" ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-zinc-50 dark:bg-zinc-800/60"}`}>
            <div className="mb-0.5 text-xs text-zinc-500">{m.author_role === "admin" ? "Team" : "You"} · {fmt(m.created_at)}</div>
            <div className="whitespace-pre-wrap">{m.body}</div>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…"
            onKeyDown={(e) => e.key === "Enter" && sendReply()}
            className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-800" />
          <button onClick={sendReply} disabled={busy || !reply.trim()} className="rounded-md bg-emerald-600 px-3 text-white disabled:opacity-50">Send</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {list === null && <p className="text-zinc-400">Loading…</p>}
      {list && list.length === 0 && <p className="text-zinc-400">You haven't asked anything yet.</p>}
      {(list || []).map((it) => (
        <button key={it.id} onClick={() => openQ(it.id)}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200 p-2 text-left hover:border-zinc-400 dark:border-zinc-700">
          <span className="truncate">{it.subject}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs capitalize ${it.status === "answered" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : it.status === "open" ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>{it.status}</span>
        </button>
      ))}
    </div>
  );
}
