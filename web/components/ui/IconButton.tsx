"use client";

import type { ButtonHTMLAttributes } from "react";

export default function IconButton({
  label,
  className = "",
  tone = "default",
  type = "button",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Accessible name — required for icon-only controls (HIG). */
  label: string;
  tone?: "default" | "destructive" | "tint";
}) {
  const toneCls =
    tone === "destructive"
      ? "text-[var(--color-label-secondary)] hover:bg-[var(--color-destructive-soft)] hover:text-[var(--color-destructive)]"
      : tone === "tint"
        ? "text-[var(--color-tint)] hover:bg-[var(--color-tint-soft)]"
        : "text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)] hover:text-[var(--color-label)]";

  return (
    <button
      type={type}
      aria-label={label}
      title={rest.title ?? label}
      className={[
        "relative z-10 inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors",
        "min-h-[var(--hit-min)] min-w-[var(--hit-min)]",
        toneCls,
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
