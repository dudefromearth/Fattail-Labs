"use client";

/**
 * Shared chrome: breadcrumb · suite nav · symbol selector.
 * When `wide`, controls stay max-w-5xl centered; children may go full-bleed.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import OptionsLabNav from "./OptionsLabNav";
import { useOptionsLab } from "@/lib/optionsLabContext";
import { optionsLabApp, type OptionsLabAppId } from "@/lib/optionsLabSuite";

/** Standard content width for suite controls (matches Practice / ladder). */
const CONTROLS_WIDTH = "mx-auto w-full max-w-5xl px-3 sm:px-4";

export default function OptionsLabChrome({
  active,
  children,
  /** Fill viewport height; children grow into remaining space (charts). */
  fillHeight = false,
  /**
   * Width mode:
   * - default: whole page max-w-5xl
   * - wide: full window for children; controls stay max-w-5xl
   */
  wide = false,
}: {
  active: OptionsLabAppId;
  children: ReactNode;
  fillHeight?: boolean;
  wide?: boolean;
}) {
  const item = optionsLabApp(active);
  const { symbol, setSymbol, universe, loading, error } = useOptionsLab();

  const controls = (
    <>
      <div
        className="shrink-0 grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3"
        data-testid="options-lab-chrome-top"
      >
        <nav
          className="justify-self-start text-sm text-[var(--color-label-secondary)]"
          aria-label="Breadcrumb"
        >
          <Link href="/app" className="hover:underline">
            Apps
          </Link>
          <span className="mx-2">›</span>
          <Link href="/app/options-lab" className="hover:underline">
            Options Lab
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[var(--color-label)]">{item.label}</span>
        </nav>

        <div className="justify-self-center">
          <OptionsLabNav active={active} />
        </div>

        <div className="hidden sm:block" aria-hidden />
      </div>

      <div className="flex shrink-0 flex-wrap items-end gap-3 rounded-lg border border-[var(--color-separator)] p-3">
        <label className="text-xs text-[var(--color-label-secondary)]">
          Symbol
          <select
            className="mt-0.5 block min-h-11 min-w-[8rem] rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm font-medium text-[var(--color-label)]"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={loading || !universe.length}
            data-testid="options-lab-symbol"
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol}
                {u.kind ? ` · ${u.kind}` : ""}
                {u.feed_symbol ? ` (${u.feed_symbol})` : ""}
              </option>
            ))}
            {!universe.length && !loading && (
              <option value={symbol}>{symbol}</option>
            )}
          </select>
        </label>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-[var(--color-label-secondary)]">
            App
          </span>
          <span className="text-sm font-medium text-[var(--color-label)]">
            {item.label}
          </span>
        </div>
        <p className="ml-auto max-w-sm text-right text-[11px] text-[var(--color-label-tertiary)]">
          {item.blurb}
        </p>
      </div>

      {error && (
        <p className="shrink-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );

  return (
    <main
      className={[
        "flex w-full flex-col gap-3",
        fillHeight
          ? "h-[calc(100dvh-4.5rem)] min-h-0 overflow-hidden"
          : "min-h-screen",
        wide ? "max-w-none py-4" : "mx-auto max-w-5xl px-3 py-4 sm:px-4",
      ].join(" ")}
    >
      {wide ? (
        <div className={`flex shrink-0 flex-col gap-3 ${CONTROLS_WIDTH}`}>
          {controls}
        </div>
      ) : (
        controls
      )}

      <div
        className={
          fillHeight
            ? wide
              ? "flex min-h-0 flex-1 flex-col px-0"
              : "flex min-h-0 flex-1 flex-col"
            : undefined
        }
      >
        {children}
      </div>
    </main>
  );
}
