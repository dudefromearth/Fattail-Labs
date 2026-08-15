"use client";

/**
 * Shared markdown window — Playbook / Toughness / Journal instructions.
 * Monospace textarea in token chrome. Display uses <Markdown>, not this.
 */

import type { TextareaHTMLAttributes } from "react";

const EDITOR_CLASS =
  "w-full resize-none rounded-lg border border-[var(--color-separator)] " +
  "bg-[var(--color-canvas)] px-3 py-2 font-mono text-sm leading-relaxed " +
  "text-[var(--color-label)] placeholder:text-[var(--color-label-tertiary)] " +
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-tint)]";

export default function MarkdownEditor({
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      spellCheck={false}
      className={[EDITOR_CLASS, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
