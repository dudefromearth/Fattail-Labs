"use client";

/**
 * Journal conversation — Spec v0.6 §1 · §8.
 * Fixed-height scroll region; timestamps always visible; member first.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import JournalComposer from "@/components/journal/JournalComposer";
import {
  displayMessageBody,
  fetchAgentStatus,
  formatMessageTimestamp,
  getJournalSession,
  JOURNAL_AGENT_DISPLAY_NAME,
  postAgentTurn,
  postJournalMessage,
  type AgentDepth,
  type JournalMessage,
  type JournalSession,
} from "@/lib/journalSessionApi";
type Props = {
  session: JournalSession;
  busy?: boolean;
  onBusy?: (v: boolean) => void;
  onError?: (msg: string | null) => void;
  onUpdated: (session: JournalSession) => void;
  onFormFallback?: () => void;
  /** Spec v0.6 §1.6 — scroll thread to this message id once */
  scrollToMessageId?: number | null;
};

export default function SessionInterviewChat({
  session,
  busy = false,
  onBusy,
  onError,
  onUpdated,
  onFormFallback,
  scrollToMessageId = null,
}: Props) {
  const mutable =
    session.status === "open" || session.status === "partial";
  const [depth, setDepth] = useState<AgentDepth | null>(null);
  const [statusLoad, setStatusLoad] = useState<"loading" | "ok" | "err">(
    "loading",
  );
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const stickBottom = useRef(true);
  const scrolledToTarget = useRef<number | null>(null);

  const msgs: JournalMessage[] = session.messages || [];
  const agentReady =
    depth != null && depth.configured && depth.entitled;
  const blocked = busy || chatBusy;

  const refreshStatus = useCallback(async () => {
    setStatusLoad("loading");
    try {
      const s = await fetchAgentStatus(session.id);
      setDepth(s.agent);
      setStatusLoad("ok");
      if (!s.agent.configured || !s.agent.entitled) {
        setStatusNote(null); // Spec §1.3 — no surface-explaining copy
      } else {
        setStatusNote(null);
      }
      return s.agent;
    } catch {
      setDepth(null);
      setStatusLoad("err");
      setStatusNote(null);
      return null;
    }
  }, [session.id]);

  useEffect(() => {
    setDraft("");
    setChatBusy(false);
    stickBottom.current = true;
    scrolledToTarget.current = null;
    void refreshStatus();
  }, [session.id, refreshStatus]);

  // Scroll: bottom on new msgs unless user scrolled up; reopen → latest
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    if (
      scrollToMessageId != null &&
      scrolledToTarget.current !== scrollToMessageId
    ) {
      const target = el.querySelector(
        `[data-message-id="${scrollToMessageId}"]`,
      );
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" });
        scrolledToTarget.current = scrollToMessageId;
        stickBottom.current = false;
        return;
      }
    }
    if (stickBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [msgs.length, session.id, scrollToMessageId]);

  function onThreadScroll() {
    const el = threadRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickBottom.current = dist < 48;
  }

  async function savePlain(text: string) {
    await postJournalMessage(session.id, text);
    const s = await getJournalSession(session.id);
    onUpdated(s);
  }

  async function sendTurn() {
    if (!mutable || !draft.trim()) return;
    const text = draft.trim();
    setChatBusy(true);
    onBusy?.(true);
    onError?.(null);
    stickBottom.current = true;
    try {
      if (agentReady) {
        try {
          const res = await postAgentTurn(session.id, { body_md: text });
          setDraft("");
          onUpdated(res.session);
          if (res.turn.depth) setDepth(res.turn.depth);
          if (
            res.turn.form_fallback ||
            res.turn.kind === "form_fallback" ||
            res.turn.kind === "done"
          ) {
            onFormFallback?.();
          }
          return;
        } catch {
          await savePlain(text);
          setDraft("");
          return;
        }
      }
      await savePlain(text);
      setDraft("");
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not save note");
    } finally {
      setChatBusy(false);
      onBusy?.(false);
    }
  }

  // Paste images into composer — bubble via custom event for header upload
  function onPaste(e: React.ClipboardEvent) {
    const files = e.clipboardData?.files;
    if (!files?.length) return;
    const images = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (images.length === 0) return;
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("journal-paste-images", {
        detail: { sessionId: session.id, files: images },
      }),
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="journal-interview-chat"
      style={{ minHeight: "28rem", height: "min(42rem, 68vh)" }}
    >
      {/* Fixed-height thread — page does not grow (Spec §1.4) */}
      <div
        ref={threadRef}
        onScroll={onThreadScroll}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)]/50 p-3"
        data-testid="journal-interview-transcript"
      >
        {msgs.map((m) => {
          const isAgent = m.author === "agent";
          const body = displayMessageBody(m.body_md, m.author);
          const ts = formatMessageTimestamp(m.created_at);
          return (
            <div
              key={m.id}
              data-message-id={m.id}
              data-author={m.author}
              className={[
                "journal-bubble-arrive flex flex-col",
                isAgent ? "items-start" : "items-end",
              ].join(" ")}
            >
              <div
                className={[
                  "max-w-[85%] px-4 py-2.5 text-[length:var(--text-body)] font-semibold leading-[1.35]",
                  "rounded-[var(--journal-bubble-radius)]",
                  isAgent
                    ? "bg-[var(--journal-bubble-in)] text-[var(--journal-bubble-in-label)]"
                    : "bg-[var(--journal-bubble-out)] text-[var(--journal-bubble-out-label)]",
                ].join(" ")}
              >
                <p className="whitespace-pre-wrap">{body}</p>
              </div>
              {ts && (
                <p
                  className="mt-1 px-1 text-[length:var(--text-caption)] tabular-nums text-[var(--color-label-tertiary)]"
                  data-testid="journal-message-timestamp"
                >
                  {isAgent ? JOURNAL_AGENT_DISPLAY_NAME + " · " : ""}
                  {ts}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {mutable && (
        <div className="mt-2 shrink-0">
          <JournalComposer
            value={draft}
            onChange={setDraft}
            onSend={() => void sendTurn()}
            onPaste={onPaste}
            disabled={blocked}
            draftTestId="journal-interview-draft"
            sendTestId="journal-interview-send"
          />
        </div>
      )}

      {statusLoad === "err" && (
        <button
          type="button"
          className="mt-1 text-xs text-[var(--color-label-tertiary)] underline"
          onClick={() => void refreshStatus()}
          data-testid="journal-interview-retry"
        >
          Retry connection
        </button>
      )}
      {statusNote && (
        <p className="sr-only" role="status">
          {statusNote}
        </p>
      )}
    </div>
  );
}
