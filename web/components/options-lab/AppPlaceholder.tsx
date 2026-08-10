"use client";

import { useOptionsLab } from "@/lib/optionsLabContext";

/**
 * Placeholder panel for suite apps not yet fully implemented.
 */
export default function AppPlaceholder({
  title,
  body,
  testId,
}: {
  title: string;
  body: string;
  testId?: string;
}) {
  const { symbol } = useOptionsLab();
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-6 py-12 text-center"
      data-testid={testId}
    >
      <p className="text-sm font-medium text-[var(--color-label)]">{title}</p>
      <p className="max-w-md text-sm text-[var(--color-label-secondary)]">
        {body}
      </p>
      <p className="text-xs text-[var(--color-label-tertiary)]">
        Active symbol{" "}
        <span className="font-medium tabular-nums text-[var(--color-label)]">
          {symbol}
        </span>
        {" · "}
        switch in the bar above — this app will follow.
      </p>
    </div>
  );
}
