"use client";

import { useState, type ReactNode } from "react";
import { HUD_PANEL } from "./hudChrome";

/**
 * Left-rail section. Starts collapsed. Named-view detents stay outside this.
 */
export default function HudCollapse({
  title,
  testId,
  children,
}: {
  title: string;
  testId: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={HUD_PANEL} data-testid={testId} data-open={open ? "1" : "0"}>
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left font-medium text-white/85"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid={`${testId}-toggle`}
      >
        <span>{title}</span>
        <span className="text-white/45" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? <div className="border-t border-white/10 px-3 pb-3">{children}</div> : null}
    </div>
  );
}
