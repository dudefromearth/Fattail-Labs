"use client";

/**
 * Shared chrome: breadcrumb · suite nav · symbol selector.
 * Apple HIG: surface cards, token chrome, ≥44pt controls (HIS v1.0).
 *
 * Modes:
 * - default: stacked page (max-w-5xl)
 * - wide: full width; controls max-w-5xl
 * - workspace: compact top nav only; children fill remaining viewport
 *   (heatmap 1/5 + 4/5 layout owns its own controls)
 */

import Link from "next/link";
import type { ReactNode } from "react";
import OptionsLabNav from "./OptionsLabNav";
import { useOptionsLab } from "@/lib/optionsLabContext";
import { optionsLabApp, type OptionsLabAppId } from "@/lib/optionsLabSuite";

const CONTROLS_WIDTH = "mx-auto w-full max-w-5xl px-3 sm:px-4";

const selectControl =
  "mt-1 block min-h-11 min-w-[8.5rem] rounded-[var(--radius-md,0.5rem)] border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-label)] " +
  "shadow-[var(--elevation-1)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] " +
  "disabled:opacity-45";

export default function OptionsLabChrome({
  active,
  children,
  fillHeight = false,
  wide = false,
  /** Compact top bar only — no title/blurb/symbol strip (child owns controls). */
  workspace = false,
}: {
  active: OptionsLabAppId;
  children: ReactNode;
  fillHeight?: boolean;
  wide?: boolean;
  workspace?: boolean;
}) {
  const item = optionsLabApp(active);
  const { symbol, setSymbol, universe, loading, error } = useOptionsLab();

  const topNav = (
    <div
      className="shrink-0 grid grid-cols-1 items-center gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3 sm:px-4"
      data-testid="options-lab-chrome-top"
    >
      <nav
        className="justify-self-start text-sm text-[var(--color-label-secondary)]"
        aria-label="Breadcrumb"
      >
        <Link
          href="/app"
          className="rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
        >
          Apps
        </Link>
        <span className="mx-2 text-[var(--color-label-tertiary)]" aria-hidden>
          ›
        </span>
        <Link
          href="/app/options-lab"
          className="rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
        >
          Options Lab
        </Link>
        <span className="mx-2 text-[var(--color-label-tertiary)]" aria-hidden>
          ›
        </span>
        <span className="font-medium text-[var(--color-label)]">
          {item.label}
        </span>
      </nav>

      <div className="justify-self-center">
        <OptionsLabNav active={active} />
      </div>

      <div className="hidden sm:block" aria-hidden />
    </div>
  );

  if (workspace) {
    return (
      <main
        className="flex h-[calc(100dvh-4.5rem)] min-h-0 w-full max-w-none flex-col overflow-hidden"
        data-testid="options-lab-workspace"
      >
        <div className="shrink-0 border-b border-[var(--color-separator)] bg-[var(--color-surface)]">
          {topNav}
        </div>
        {error && (
          <div
            className="shrink-0 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-700 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </main>
    );
  }

  const controls = (
    <>
      {topNav}

      <header className="shrink-0 max-w-2xl px-3 pt-1 sm:px-0">
        <h1
          className="font-semibold tracking-tight text-[var(--color-label)]"
          style={{ fontSize: "var(--text-title-1)", lineHeight: 1.15 }}
        >
          {item.label}
        </h1>
        <p
          className="mt-1 text-[var(--color-label-secondary)]"
          style={{ fontSize: "var(--text-subheadline)", lineHeight: 1.4 }}
        >
          {item.blurb}
        </p>
      </header>

      <div
        className="flex shrink-0 flex-wrap items-end gap-4 rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)]"
        data-testid="options-lab-context-bar"
      >
        <label className="text-xs font-medium text-[var(--color-label-secondary)]">
          Symbol
          <select
            className={selectControl}
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
        {loading ? (
          <span className="pb-2 text-xs text-[var(--color-label-tertiary)]">
            Loading universe…
          </span>
        ) : null}
      </div>

      {error && (
        <div
          className="shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}
    </>
  );

  return (
    <main
      className={[
        "flex w-full flex-col gap-4",
        fillHeight
          ? "h-[calc(100dvh-4.5rem)] min-h-0 overflow-hidden"
          : "min-h-screen",
        wide ? "max-w-none py-5" : "mx-auto max-w-5xl px-3 py-5 sm:px-4",
      ].join(" ")}
    >
      {wide ? (
        <div className={`flex shrink-0 flex-col gap-4 ${CONTROLS_WIDTH}`}>
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
