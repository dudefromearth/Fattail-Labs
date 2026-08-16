"use client";

/**
 * Admin Edit (lower-left) → FatTail house strategies overlay.
 * Same convention as Journal AI Instructions / hub Edit.
 */

import { useState } from "react";
import DesignHouseLibrary from "@/components/strategy-lab/DesignHouseLibrary";
import { useIsAdmin } from "@/lib/useIsAdmin";
import type { StrategyConfig } from "@/lib/strategyPacks";

type Props = {
  strategyId: string;
  onApplied: (config: StrategyConfig, mode: "apply" | "copy_rebuild") => void;
  pushNotice?: (
    level: "info" | "success" | "warning" | "error",
    msg: string,
  ) => void;
};

export default function DesignHouseAdminChrome({
  strategyId,
  onApplied,
  pushNotice,
}: Props) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      {open ? (
        <div
          className="absolute inset-0 z-20 flex flex-col rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2)]"
          data-testid="design-house-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="design-house-overlay-title"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-separator)] px-4 py-2.5">
            <h2
              id="design-house-overlay-title"
              className="text-sm font-semibold text-[var(--color-label)]"
            >
              FatTail house strategies
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
              aria-label="Close"
              data-testid="design-house-overlay-close"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <DesignHouseLibrary
              strategyId={strategyId}
              pushNotice={pushNotice}
              onApplied={(cfg, mode) => {
                onApplied(cfg, mode);
                setOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="FatTail house strategies"
        data-testid="design-house-admin-edit"
        className="fixed bottom-6 left-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Edit
      </button>
    </>
  );
}
