"use client";

// Member help concierge — floating button opens an AI chat that answers from a
// member-facing knowledge base with hard guardrails; it escalates to the human
// help desk when it can't answer (or the member asks for a person). Compose starts
// as a topic picker + one message box; on submit the panel grows into a chat view.
// Only rendered for authenticated members; mounted behind an ErrorBoundary so it
// can never affect the rest of the app.
// Spec: FatTail-Labs-Help-Concierge-Spec-v1.0.

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Q = {
  id: number; subject: string; body: string; category: string; status: string;
  closed_reason?: string | null;
  screenshot_url: string | null; created_at: string | null;
};
type Msg = { id: number; author_role: string; body: string; rating?: string | null; created_at: string | null };

const IDLE_WARN_MS = 4 * 60 * 1000;   // banner appears
const IDLE_CLOSE_MS = 5 * 60 * 1000;  // chat auto-closes

const TOPICS: { value: string; label: string }[] = [
  { value: "bug", label: "Report a bug" },
  { value: "struggling", label: "I'm struggling with…" },
  { value: "general", label: "General" },
];

function fmt(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

type View = { mode: "compose" } | { mode: "chat"; id: number } | { mode: "list" };

export default function HelpLauncher() {
  const pathname = usePathname() || "";
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ mode: "compose" });

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setAuthed(!!d && d.identity_id !== 0); })
      .catch(() => {});
    return () => { alive = false; };
  }, [pathname]);

  if (!authed || pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  const compact = view.mode === "compose";
  const widthCls = compact ? "w-[min(92vw,400px)]" : "w-[min(94vw,480px)]";

  return (
    <>
      {!open && (
        <button onClick={() => { setOpen(true); setView({ mode: "compose" }); }} aria-label="Get help"
          className="fixed bottom-5 right-5 z-50 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-emerald-500">
          Help
        </button>
      )}
      {open && (
        <div className={`fixed bottom-5 right-5 z-50 flex max-h-[85vh] ${widthCls} flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl transition-all dark:border-zinc-700 dark:bg-zinc-900`}>
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="text-emerald-600">Help</span>
              <button className={view.mode === "compose" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600"}
                onClick={() => setView({ mode: "compose" })}>New</button>
              <button className={view.mode === "list" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600"}
                onClick={() => setView({ mode: "list" })}>My questions</button>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-zinc-400 hover:text-zinc-600">✕</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view.mode === "compose" && (
              <Compose onStarted={(id) => setView({ mode: "chat", id })} />
            )}
            {view.mode === "chat" && <Chat id={view.id} onBack={() => setView({ mode: "list" })} />}
            {view.mode === "list" && <MyQuestions onOpen={(id) => setView({ mode: "chat", id })} />}
          </div>
        </div>
      )}
    </>
  );
}

function Compose({ onStarted }: { onStarted: (id: number) => void }) {
  const pathname = usePathname() || "";
  const [category, setCategory] = useState("");
  const [text, setText] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onPickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setErr(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("Image is too large (max 5MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => setShot(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setErr("Couldn't read that image — you can still send your question.");
    reader.readAsDataURL(file);
  }, []);

  const submit = useCallback(async () => {
    if (!text.trim() || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/help/questions", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category, body: text.trim(), page_context: pathname,
          screenshot_base64: shot ? shot.replace(/^data:image\/[a-z+]+;base64,/, "") : null,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.detail || "Couldn't send — please try again."); return; }
      onStarted(d.id);
    } catch {
      setErr("Network error — your question wasn't sent. Try again.");
    } finally { setBusy(false); }
  }, [category, text, shot, pathname, busy, onStarted]);

  return (
    <div className="space-y-3 p-4 text-sm">
      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className={`w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 ${category ? "" : "text-zinc-400"}`}>
        <option value="">What's it about? (optional — we'll sort it)</option>
        {TOPICS.map((t) => <option key={t.value} value={t.value} className="text-zinc-900 dark:text-zinc-100">{t.label}</option>)}
      </select>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5}
        placeholder="Ask your question…" autoFocus
        className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
      {category === "bug" && (
        <div className="flex items-center gap-2">
          {shot ? (
            <div className="flex items-center gap-2">
              <img src={shot} alt="attachment" className="h-10 rounded border border-zinc-300 dark:border-zinc-700" />
              <button onClick={() => setShot(null)} className="text-xs text-zinc-500 underline">remove</button>
            </div>
          ) : (
            <label className="cursor-pointer rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300">
              📎 Attach a screenshot (optional)
              <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            </label>
          )}
        </div>
      )}
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button onClick={submit} disabled={busy || !text.trim()}
        className="w-full rounded-md bg-emerald-600 py-2 font-medium text-white disabled:opacity-50">
        {busy ? "Sending…" : "Start chat"}
      </button>
      <p className="text-center text-xs text-zinc-400">
        Our assistant answers instantly. If it can't help, our team takes over.
      </p>
    </div>
  );
}

function Bubble({ m, onRate }: { m: Msg; onRate?: (id: number, r: "up" | "down") => void }) {
  const mine = m.author_role === "member";
  const who = mine ? "You" : m.author_role === "admin" ? "Support team" : "Assistant";
  // Rate real, persisted assistant answers only (positive ids).
  const canRate = m.author_role === "assistant" && m.id > 0 && !!onRate;
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
        mine ? "bg-emerald-600 text-white"
        : m.author_role === "admin" ? "bg-amber-100 text-zinc-800 dark:bg-amber-950/50 dark:text-amber-100"
        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"}`}>
        {!mine && <div className="mb-0.5 text-[11px] font-medium opacity-70">{who}</div>}
        <div className="whitespace-pre-wrap text-sm">{m.body}</div>
      </div>
      {canRate && (
        <div className="mt-0.5 flex items-center gap-2 pl-1 text-xs text-zinc-400">
          {m.rating ? (
            <span>{m.rating === "up" ? "Thanks for the feedback 👍" : "Thanks — noted 👎"}</span>
          ) : (
            <>
              <span>Helpful?</span>
              <button onClick={() => onRate!(m.id, "up")} className="hover:text-emerald-600" aria-label="Helpful">👍</button>
              <button onClick={() => onRate!(m.id, "down")} className="hover:text-red-500" aria-label="Not helpful">👎</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Chat({ id, onBack }: { id: number; onBack: () => void }) {
  const [q, setQ] = useState<Q | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const lastActivity = useRef<number>(Date.now());
  const closedRef = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/help/questions/${id}`, { credentials: "same-origin" });
    if (r.ok) { const d = await r.json(); setQ(d.question); setMsgs(d.messages || []); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, thinking]);
  // Any new message (yours or the bot's) resets the inactivity clock.
  useEffect(() => { lastActivity.current = Date.now(); }, [msgs.length]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(t); }, []);

  const humanInLoop = q ? ["open", "answered"].includes(q.status) : false;
  const isClosed = q?.status === "closed";
  const botHandled = q ? ["ai_pending", "ai_resolved"].includes(q.status) : false;
  const idleMs = now - lastActivity.current;
  const showWarn = botHandled && !isClosed && idleMs >= IDLE_WARN_MS;
  const secsToClose = Math.max(0, Math.ceil((IDLE_CLOSE_MS - idleMs) / 1000));

  // Auto-close a bot-handled chat after inactivity (never a thread the team is on).
  useEffect(() => {
    if (botHandled && !isClosed && !closedRef.current && idleMs >= IDLE_CLOSE_MS) {
      closedRef.current = true;
      fetch(`/api/help/questions/${id}/close`, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "inactivity" }),
      }).then(() => load()).catch(() => {});
    }
  }, [now, botHandled, isClosed, idleMs, id, load]);

  const send = useCallback(async () => {
    if (!reply.trim() || busy || isClosed) return;
    const mine = reply.trim();
    setBusy(true); setReply(""); lastActivity.current = Date.now();
    setMsgs((m) => [...m, { id: -Date.now(), author_role: "member", body: mine, created_at: null }]);
    setThinking(true);
    try {
      const r = await fetch(`/api/help/questions/${id}/messages`, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: mine }),
      });
      await r.json().catch(() => ({}));
    } finally { setThinking(false); setBusy(false); await load(); }
  }, [reply, busy, isClosed, id, load]);

  const rate = useCallback(async (msgId: number, r: "up" | "down") => {
    lastActivity.current = Date.now();
    setMsgs((prev) => prev.map((m) => (m.id === msgId ? { ...m, rating: r } : m)));
    try {
      await fetch(`/api/help/messages/${msgId}/rating`, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating: r }),
      });
    } catch { /* optimistic */ }
  }, []);

  const talkToHuman = useCallback(async () => {
    if (busy) return;
    setBusy(true); lastActivity.current = Date.now();
    try {
      await fetch(`/api/help/questions/${id}/escalate`, { method: "POST", credentials: "same-origin" });
      await load();
    } finally { setBusy(false); }
  }, [busy, id, load]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 text-xs dark:border-zinc-800">
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-700">← My questions</button>
        {humanInLoop && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">Support team notified</span>}
      </div>

      {showWarn && (
        <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <span>Still there? This chat closes in ~{secsToClose}s.</span>
          <button onClick={() => { lastActivity.current = Date.now(); setNow(Date.now()); }} className="font-medium underline">Keep open</button>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {q && <Bubble m={{ id: 0, author_role: "member", body: q.body, created_at: null }} />}
        {msgs.map((m) => <Bubble key={m.id} m={m} onRate={humanInLoop || isClosed ? undefined : rate} />)}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-500 dark:bg-zinc-800">Assistant is typing…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {isClosed ? (
        <div className="border-t border-zinc-100 p-3 text-center text-xs text-zinc-500 dark:border-zinc-800">
          This chat is closed{q?.closed_reason === "inactivity" ? " (inactivity)" : ""} — it's saved in your questions.{" "}
          <button onClick={onBack} className="font-medium text-emerald-600 underline">Start a new one</button>
        </div>
      ) : (
        <div className="border-t border-zinc-100 p-2 dark:border-zinc-800">
          <div className="flex gap-2">
            <input value={reply} onChange={(e) => { setReply(e.target.value); lastActivity.current = Date.now(); }} placeholder="Type your reply…"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
            <button onClick={send} disabled={busy || !reply.trim()}
              className="rounded-md bg-emerald-600 px-3 text-sm text-white disabled:opacity-50">Send</button>
          </div>
          {!humanInLoop && (
            <button onClick={talkToHuman} disabled={busy}
              className="mt-1.5 text-xs text-zinc-400 underline hover:text-zinc-600">
              Talk to a human instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MyQuestions({ onOpen }: { onOpen: (id: number) => void }) {
  const [list, setList] = useState<Q[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/help/questions", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .then((d) => { if (alive) setList(d.questions || []); })
      .catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, []);

  const statusLabel = (s: string) =>
    s === "ai_resolved" ? "Answered by assistant"
    : s === "answered" ? "Team replied"
    : s === "open" ? "With the team"
    : s === "ai_pending" ? "In progress"
    : s === "closed" ? "Closed"
    : s;

  return (
    <div className="space-y-2 p-4 text-sm">
      {list === null && <p className="text-zinc-400">Loading…</p>}
      {list && list.length === 0 && <p className="text-zinc-400">You haven't asked anything yet.</p>}
      {(list || []).map((it) => (
        <button key={it.id} onClick={() => onOpen(it.id)}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200 p-2 text-left hover:border-zinc-400 dark:border-zinc-700">
          <span className="truncate">{it.subject}</span>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">{statusLabel(it.status)}</span>
        </button>
      ))}
    </div>
  );
}
