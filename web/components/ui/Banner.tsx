"use client";

import type { ReactNode } from "react";

type Tone = "info" | "warning" | "success";

const TONE: Record<Tone, string> = {
  info: "bg-[var(--color-tint-soft)] text-[var(--color-tint)]",
  warning:
    "bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-label)]",
  success:
    "bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-label)]",
};

/** HI Spec Banner — info / warning / success. */
export default function Banner({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className={
        "rounded-[var(--radius-md)] px-3 py-2.5 text-[length:var(--text-footnote)] leading-snug " +
        TONE[tone]
      }
    >
      {children}
    </div>
  );
}
