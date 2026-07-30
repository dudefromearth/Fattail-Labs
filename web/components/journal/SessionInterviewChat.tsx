"use client";

/**
 * Journal conversation — Spec v0.6 §1 · §8.
 * Fixed-height scroll region; timestamps always visible; member first.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
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
      style={{ minHeight: "18rem", height: "min(28rem, 50vh)" }}
    >
      {/* Fixed-height thread — page does not grow (Spec §1.4) */}
      <div
        ref={threadRef}
        onScroll={onThreadScroll}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)]/50 p-3"
        data-testid="journal-interview-transcript"
      >
        {msgs.length === 0 && (
          <p className="text-sm text-[var(--color-label-tertiary)]">
            Write below to begin.
          </p>
        )}
        {msgs.map((m) => {
          const isAgent = m.author === "agent";
          const body = displayMessageBody(m.body_md, m.author);
          const ts = formatMessageTimestamp(m.created_at);
          return (
            <div
              key={m.id}
              data-message-id={m.id}
              className={[
                "rounded-[var(--radius-md)] px-3 py-2 text-sm",
                isAgent
                  ? "bg-[var(--color-surface)] text-[var(--color-label)]"
                  : "bg-[var(--color-tint-soft)] text-[var(--color-label)]",
              ].join(" ")}
              data-author={m.author}
            >
              <p className="mb-0.5 flex flex-wrap items-baseline gap-x-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                <span>
                  {isAgent ? JOURNAL_AGENT_DISPLAY_NAME : "You"}
                </span>
                {ts && (
                  <span
                    className="font-normal normal-case tracking-normal tabular-nums"
                    data-testid="journal-message-timestamp"
                  >
                    {ts}
                  </span>
                )}
              </p>
              <p className="whitespace-pre-wrap">{body}</p>
            </div>
          );
        })}
      </div>

      {/* Composer pinned below thread */}
      {mutable && (
        <div className="relative mt-2 shrink-0">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={onPaste}
            rows={3}
            placeholder="Write in your words…"
            className="w-full resize-none rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3 pr-24 text-sm text-[var(--color-label)] placeholder:text-[var(--color-label-tertiary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
            aria-label="Journal message"
            data-testid="journal-interview-draft"
            disabled={blocked}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (draft.trim() && !blocked) void sendTurn();
              }
            }}
          />
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <Button
              type="button"
              variant="primary"
              className="!min-h-8 !px-3 !text-xs"
              disabled={blocked || !draft.trim()}
              onClick={() => void sendTurn()}
              data-testid="journal-interview-send"
            >
              Send
            </Button>
          </div>
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
