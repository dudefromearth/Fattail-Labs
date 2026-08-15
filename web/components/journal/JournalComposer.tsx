"use client";

/**
 * Journal composer — Echo IF1 · Spec §6.3 · ref1.png floor.
 * Grows with input. + attach and send live in the shell.
 */

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  draftTestId: string;
  sendTestId: string;
  onPaste?: (e: React.ClipboardEvent) => void;
};

export default function JournalComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Write…",
  ariaLabel = "Journal message",
  draftTestId,
  sendTestId,
  onPaste,
}: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(Math.max(el.scrollHeight, 52), 160);
    el.style.height = `${next}px`;
  }, [value]);

  function send() {
    if (disabled || !value.trim()) return;
    onSend();
  }

  return (
    <div
      className="journal-composer shrink-0 rounded-[var(--journal-composer-radius)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 pb-3 pt-3 shadow-[var(--journal-composer-shadow)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-tint)]"
      data-testid="journal-composer"
    >
      <textarea
        ref={areaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        rows={1}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent text-[length:var(--text-body)] leading-[1.45] text-[var(--color-label)] placeholder:text-[var(--color-label-tertiary)] focus:outline-none"
        aria-label={ariaLabel}
        data-testid={draftTestId}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[1.35rem] leading-none text-[var(--color-label)] hover:bg-[var(--color-fill)] disabled:opacity-40"
          aria-label="Add attachment"
          disabled={disabled}
          onClick={() =>
            window.dispatchEvent(new CustomEvent("journal-open-attach"))
          }
        >
          +
        </button>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[0.65rem] bg-[var(--journal-send)] text-[var(--color-on-tint)] disabled:opacity-40"
          title="Send"
          aria-label="Send"
          disabled={disabled || !value.trim()}
          onClick={send}
          data-testid={sendTestId}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
