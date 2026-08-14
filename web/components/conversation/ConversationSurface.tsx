"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  appearanceVars,
  CS_TOKENS,
  type ConversationAppearance,
} from "./conversationTokens";
import "./conversationSurface.css";

export type ConversationDirection = "incoming" | "outgoing";

export type ConversationMessage = {
  id: string | number;
  direction: ConversationDirection;
  body: string;
  at: string;
};

export type SenderIdentity = {
  name: string;
  avatarUrl: string;
};

type Props = {
  messages: ConversationMessage[];
  senderIdentity: SenderIdentity;
  onSend: (text: string) => void;
  typing?: boolean;
  onPlusTap?: () => void;
  sendKey?: "enter" | "mod-enter";
  startedAt?: string | Date | null;
  appearance?: ConversationAppearance;
  unavailableCopy?: string | null;
};

function parseAt(at: string): Date {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayTime(d: Date): string {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startToday.getTime() - startThat.getTime()) / 86400000);
  const time = formatClock(d);
  if (days === 0) return `Today ${time}`;
  if (days === 1) return `Yesterday ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}`;
}

function formatStamp(startedAt: string | Date): string {
  const d = startedAt instanceof Date ? startedAt : parseAt(startedAt);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Conversation started ${date} · ${formatClock(d)}`;
}

function relativeRead(latestOutgoing: Date): string {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(
    latestOutgoing.getFullYear(),
    latestOutgoing.getMonth(),
    latestOutgoing.getDate(),
  );
  const days = Math.round((startToday.getTime() - startThat.getTime()) / 86400000);
  if (days <= 0) return "Read";
  if (days === 1) return "Read Yesterday";
  return `Read ${latestOutgoing.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function needsSeparator(prev: Date | null, cur: Date): boolean {
  if (!prev) return false;
  if (prev.toDateString() !== cur.toDateString()) return true;
  return cur.getTime() - prev.getTime() >= CS_TOKENS.separatorGapMs;
}

export default function ConversationSurface({
  messages,
  senderIdentity,
  onSend,
  typing = false,
  onPlusTap,
  sendKey = "enter",
  startedAt = null,
  appearance,
  unavailableCopy = null,
}: Props) {
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    const onScroll = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickRef.current = gap < 48;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  function submit() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    const send =
      sendKey === "mod-enter"
        ? e.key === "Enter" && (e.metaKey || e.ctrlKey)
        : e.key === "Enter" && !e.shiftKey;
    if (send) {
      e.preventDefault();
      submit();
    }
  }

  const lastOutgoing = [...messages]
    .reverse()
    .find((m) => m.direction === "outgoing");

  let prevAt: Date | null = null;

  return (
    <div
      className="cs-root"
      style={appearanceVars(appearance)}
      data-testid="conversation-surface"
    >
      <header className="cs-header">
        <span className="cs-back" aria-hidden="true">
          ‹
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="cs-avatar"
          src={senderIdentity.avatarUrl}
          alt=""
          width={56}
          height={56}
        />
        <div className="cs-name-pill">
          {senderIdentity.name}
          <span className="cs-name-chevron">›</span>
        </div>
      </header>

      <div className="cs-thread" ref={threadRef} data-testid="cs-thread">
        {startedAt ? (
          <div className="cs-stamp">{formatStamp(startedAt)}</div>
        ) : null}
        {messages.map((m) => {
          const at = parseAt(m.at);
          const sep = needsSeparator(prevAt, at);
          prevAt = at;
          return (
            <div key={m.id}>
              {sep ? <div className="cs-separator">{formatDayTime(at)}</div> : null}
              <div
                className={
                  m.direction === "outgoing"
                    ? "cs-row cs-row-outgoing cs-enter"
                    : "cs-row cs-row-incoming cs-enter"
                }
              >
                <div className="cs-bubble-wrap">
                  <div
                    className={
                      m.direction === "outgoing"
                        ? "cs-bubble cs-bubble-outgoing"
                        : "cs-bubble cs-bubble-incoming"
                    }
                  >
                    {m.body}
                  </div>
                  <div className="cs-bubble-time">{formatClock(at)}</div>
                </div>
              </div>
            </div>
          );
        })}
        {typing ? (
          <div className="cs-row cs-row-incoming cs-enter">
            <div className="cs-bubble-wrap">
              <div className="cs-bubble cs-bubble-incoming">
                <span className="cs-typing" aria-label="Typing">
                  <span className="cs-dot" />
                  <span className="cs-dot" />
                  <span className="cs-dot" />
                </span>
              </div>
            </div>
          </div>
        ) : null}
        {lastOutgoing && !typing ? (
          <div className="cs-receipt">
            {relativeRead(parseAt(lastOutgoing.at))}
          </div>
        ) : null}
      </div>

      {unavailableCopy ? (
        <div className="cs-notice" data-testid="cs-unavailable">
          {unavailableCopy}
        </div>
      ) : null}

      <div className="cs-composer">
        <button
          type="button"
          className="cs-plus"
          aria-label="More"
          onClick={() => onPlusTap?.()}
        >
          +
        </button>
        <input
          className="cs-field"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="Message"
          aria-label="Message"
        />
        <button
          type="button"
          className="cs-send"
          hidden={!draft.trim()}
          aria-label="Send"
          onClick={submit}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M7 12V2M3 6l4-4 4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
