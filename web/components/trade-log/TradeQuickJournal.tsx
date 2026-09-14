"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import JournalComposer from "@/components/journal/JournalComposer";
import {
  createJournalSession,
  getJournalSession,
  listJournalSessions,
  postJournalMessage,
  uploadJournalAttachment,
  type JournalMessage,
  type JournalSession,
} from "@/lib/journalSessionApi";

type Props = {
  journalDate: string;
  disabled?: boolean;
};

function ymd(raw: string): string {
  const s = String(raw || "").replace(" ", "T");
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

export default function TradeQuickJournal({ journalDate, disabled }: Props) {
  const date = ymd(journalDate);
  const [session, setSession] = useState<JournalSession | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!date) return;
    setErr(null);
    try {
      const rows = await listJournalSessions({
        journal_date: date,
        limit: 8,
      });
      const pick = rows.find((s) => s.status === "open") || rows[0] || null;
      if (!pick) {
        setSession(null);
        setMessages([]);
        return;
      }
      const full = await getJournalSession(pick.id);
      setSession(full);
      setMessages(full.messages || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load Journal");
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const open = () => fileRef.current?.click();
    window.addEventListener("journal-open-attach", open);
    return () => window.removeEventListener("journal-open-attach", open);
  }, []);

  async function ensureSession(): Promise<JournalSession> {
    if (session) return session;
    const sess = await createJournalSession({
      journal_date: date,
      tag: "reflection",
    });
    setSession(sess);
    return sess;
  }

  async function send() {
    const body = draft.trim();
    if (!body || disabled || !date) return;
    setBusy(true);
    setErr(null);
    try {
      const sess = await ensureSession();
      const msg = await postJournalMessage(sess.id, body);
      setMessages((prev) => [...prev, msg]);
      setDraft("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not write Journal");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(list: FileList | null) {
    const file = list?.[0];
    if (!file || disabled || !date) return;
    setBusy(true);
    setErr(null);
    try {
      const sess = await ensureSession();
      await uploadJournalAttachment(sess.id, file);
      const full = await getJournalSession(sess.id);
      setSession(full);
      setMessages(full.messages || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not attach");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div
      className="space-y-3 rounded-xl border-2 border-[var(--color-separator)] bg-[var(--color-surface)] p-3"
      data-testid="trade-quick-journal"
    >
      <div>
        <p className="text-sm font-semibold text-[var(--color-label)]">
          Journal
        </p>
        <p className="text-[11px] text-[var(--color-label-tertiary)]">
          Same Journal as {date || "this fill’s date"} — existing entries show
          here; new lines append. Not a second notes field.
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={(e) => void onFile(e.target.files)}
      />
      {err ? (
        <p className="text-[11px] text-red-600">{err}</p>
      ) : null}
      {messages.length > 0 ? (
        <ul className="max-h-48 space-y-2 overflow-y-auto text-[13px] leading-snug text-[var(--color-label)]">
          {messages.map((m) => (
            <li
              key={m.id}
              className={[
                "rounded-[var(--journal-bubble-radius)] px-3 py-2 whitespace-pre-wrap",
                m.author === "agent"
                  ? "bg-[var(--journal-bubble-in)] text-[var(--journal-bubble-in-label)]"
                  : "bg-[var(--journal-bubble-out)] text-[var(--journal-bubble-out-label)]",
              ].join(" ")}
            >
              {m.body_md}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-[var(--color-label-tertiary)]">
          No Journal on this date yet. Write below — it will appear in Journal.
        </p>
      )}
      <JournalComposer
        value={draft}
        onChange={setDraft}
        onSend={() => void send()}
        disabled={disabled || busy || !date}
        placeholder="Add to this day’s Journal…"
        ariaLabel="Quick Journal entry"
        draftTestId="trade-quick-journal-draft"
        sendTestId="trade-quick-journal-send"
      />
    </div>
  );
}
