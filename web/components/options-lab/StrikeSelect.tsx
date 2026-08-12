"use client";

/**
 * Listed-only strike dropdown (PB6 / OC6a).
 * Options come from the client chain ladder; value always snaps to a listed strike.
 */

import { useMemo } from "react";
import {
  formatStrike,
  isListedStrike,
  normalizeStrike,
  snapToListed,
  windowAroundStrike,
} from "@/lib/options-lab/listedStrikes";

const field =
  "w-full rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] " +
  "px-2 py-1.5 text-sm text-[var(--color-label)]";

export default function StrikeSelect({
  listed,
  value,
  onChange,
  /** Anchor for the visible window (spot / body). Defaults to value. */
  center,
  radiusN = 50,
  disabled = false,
  className = "",
  testId,
  emptyLabel = "No listed strikes",
}: {
  listed: readonly number[];
  value: number;
  onChange: (strike: number) => void;
  center?: number;
  radiusN?: number;
  disabled?: boolean;
  className?: string;
  testId?: string;
  emptyLabel?: string;
}) {
  const options = useMemo(() => {
    const c = center ?? value;
    return windowAroundStrike(listed, c, radiusN);
  }, [listed, center, value, radiusN]);

  const selected = useMemo(() => {
    if (!listed.length) return value;
    if (isListedStrike(value, listed)) return normalizeStrike(value);
    return snapToListed(value, listed) ?? value;
  }, [value, listed]);

  // Ensure selected appears even if outside window (edge wing)
  const opts = useMemo(() => {
    if (!options.length) return options;
    if (options.some((s) => normalizeStrike(s) === normalizeStrike(selected))) {
      return options;
    }
    return [...options, selected].sort((a, b) => a - b);
  }, [options, selected]);

  // OT-EF / DL-309: OPF-held chain is sole truth. Never free-type a strike
  // that is not on the dual-side ladder — wait for hydrate instead.
  if (!listed.length) {
    return (
      <span
        className={`${field} ${className} inline-flex items-center justify-end text-[var(--color-label-tertiary)]`.trim()}
        data-testid={testId}
        data-listed-count={0}
        title={emptyLabel || "Loading OPF chain strikes…"}
        role="status"
      >
        {emptyLabel || "…"}
      </span>
    );
  }

  return (
    <select
      className={`${field} ${className}`.trim()}
      value={String(selected)}
      disabled={disabled}
      data-testid={testId}
      data-listed-count={listed.length}
      size={1}
      onChange={(e) => {
        const n = normalizeStrike(parseFloat(e.target.value));
        if (Number.isFinite(n)) onChange(n);
      }}
    >
      {opts.map((s) => (
        <option key={String(s)} value={String(s)}>
          {formatStrike(s)}
        </option>
      ))}
    </select>
  );
}
