"use client";

import { useCallback, useEffect, useState } from "react";
import JournalComposer from "@/components/journal/JournalComposer";
import {
  createJournalSession,
  getJournalSession,
  listJournalSessions,
  postJournalMessage,
  type JournalMessage,
  type JournalSession,
} from "@/lib/journalSessionApi";

type Props = {
  journalDate: string;
  disabled?: boolean;
};

export default function TradeQuickJournal({ journalDate, disabled }: Props) {
  const [session, setSession] = useState<JournalSession | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(journalDate)) return;
    setErr(null);
    try {
      const rows = await listJournalSessions({
        journal_date: journalDate,
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
  }, [journalDate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    const body = draft.trim();
    if (!body || disabled) return;
    setBusy(true);
    setErr(null);
    try {
      let sess = session;
      if (!sess) {
        sess = await createJournalSession({
          journal_date: journalDate,
          tag: "reflection",
        });
        setSession(sess);
      }
      const msg = await postJournalMessage(sess.id, body);
      setMessages((prev) => [...prev, msg]);
      setDraft("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not write Journal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="space-y-2 rounded-xl border border-[var(--color-separator)] p-3"
      data-testid="trade-quick-journal"
    >
      <p className="text-xs font-semibold text-[var(--color-label)]">
        Journal
      </p>
      <p className="text-[10px] text-[var(--color-label-tertiary)]">
        Same Journal as the day view — {journalDate}. Not a second notes field.
      </p>
      {err ? (
        <p className="text-[11px] text-red-600">{err}</p>
      ) : null}
      {messages.length > 0 ? (
        <ul className="max-h-40 space-y-2 overflow-y-auto text-[13px] leading-snug text-[var(--color-label)]">
          {messages.map((m) => (
            <li
              key={m.id}
              className="rounded-lg bg-[var(--color-fill)] px-2 py-1.5 whitespace-pre-wrap"
            >
              {m.body_md}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-[var(--color-label-tertiary)]">
          No Journal on this date yet.
        </p>
      )}
      <JournalComposer
        value={draft}
        onChange={setDraft}
        onSend={() => void send()}
        disabled={disabled || busy || !/^\d{4}-\d{2}-\d{2}$/.test(journalDate)}
        placeholder="Add to this day’s Journal…"
        ariaLabel="Quick Journal entry"
        draftTestId="trade-quick-journal-draft"
        sendTestId="trade-quick-journal-send"
      />
    </div>
  );
}
