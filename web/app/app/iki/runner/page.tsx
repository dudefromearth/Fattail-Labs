"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import {
  fetchLadderExpirations,
  type LadderExpirationContract,
} from "@/lib/chainLadderApi";
import { OptionsLabProvider, useOptionsLab } from "@/lib/optionsLabContext";
import { HeatmapRenderHost } from "@/lib/runner/sinks/render";
import IkiRunnerRail, {
  type StreamTone,
} from "./IkiRunnerRail";

function streamFromDoc(
  stale: boolean | null,
  error: string | null,
): { label: string; tone: StreamTone } {
  if (error) return { label: "Stream error", tone: "error" };
  if (stale == null) return { label: "Connecting…", tone: "idle" };
  if (stale) return { label: "Held", tone: "held" };
  return { label: "Live stream", tone: "live" };
}

function IkiRunnerWorkspace() {
  const { symbol, setSymbol, universe, loading } = useOptionsLab();
  const [expiration, setExpiration] = useState("");
  const [expiryContracts, setExpiryContracts] = useState<
    LadderExpirationContract[]
  >([]);
  const [viewSide, setViewSide] = useState<"call" | "put">("call");
  const [tplKey, setTplKey] = useState("sym-fly@0.2");
  const [taxSide, setTaxSide] = useState("both");
  const [minOi, setMinOi] = useState(0);
  const [stale, setStale] = useState<boolean | null>(null);
  const [epochQuality, setEpochQuality] = useState<string | null>(null);
  const [contentHash, setContentHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tplLabel, setTplLabel] = useState("Advanced flies");

  useEffect(() => {
    let cancelled = false;
    void fetchLadderExpirations(symbol, 3)
      .then((pack) => {
        if (cancelled) return;
        const list = pack.contracts || [];
        setExpiryContracts(list);
        setExpiration((prev) =>
          prev && list.some((c) => c.expiration === prev)
            ? prev
            : pack.default_expiration || list[0]?.expiration || "",
        );
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const onMeta = useCallback(
    (meta: {
      stale: boolean | null;
      epochQuality: string | null;
      contentHash: string | null;
      error: string | null;
      tplLabel: string;
    }) => {
      setStale(meta.stale);
      setEpochQuality(meta.epochQuality);
      setContentHash(meta.contentHash);
      setError(meta.error);
      setTplLabel(meta.tplLabel);
    },
    [],
  );

  const status = streamFromDoc(stale, error);
  const dte = expiryContracts.find((c) => c.expiration === expiration)?.dte;
  const dteLine = dte != null ? `${dte} DTE` : null;
  const genLine = contentHash ? `gen ${contentHash.slice(0, 8)}` : null;
  const epochLine = epochQuality ? `epoch_quality ${epochQuality}` : null;

  const headerChip = useMemo(() => {
    if (error) return "Error";
    if (stale == null) return "…";
    return stale ? "Held" : "Live";
  }, [error, stale]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col md:flex-row"
      data-testid="iki-runner-host"
    >
      <IkiRunnerRail
        statusLabel={status.label}
        statusTone={status.tone}
        error={error}
        symbol={symbol}
        universe={universe}
        universeLoading={loading}
        onSymbolChange={setSymbol}
        tplKey={tplKey}
        onTplKey={setTplKey}
        taxSide={taxSide}
        onTaxSide={setTaxSide}
        minOi={minOi}
        onMinOi={setMinOi}
        expiration={expiration}
        expiryContracts={expiryContracts}
        onExpirationChange={setExpiration}
        viewSide={viewSide}
        onViewSide={setViewSide}
        spotLabel="—"
        genLine={genLine}
        dteLine={dteLine}
        epochLine={epochLine}
      />
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-canvas)] p-2 sm:p-3"
        aria-label="Runner view"
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2,0_4px_16px_rgba(0,0,0,0.18))]"
          data-testid="iki-runner-view-panel"
        >
          <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--color-separator)] bg-[var(--color-surface-secondary,var(--color-fill))] px-3 py-2 sm:px-4">
            <div className="min-w-0 flex-1">
              <h3
                className="truncate font-semibold tracking-tight text-[var(--color-label)]"
                style={{ fontSize: "var(--text-headline, 1.0625rem)" }}
              >
                {tplLabel}
              </h3>
              <p className="mt-0.5 truncate text-[11px] text-[var(--color-label-tertiary)]">
                {[
                  symbol || null,
                  viewSide === "call" ? "Calls" : "Puts",
                  expiration || null,
                  dteLine,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-label-secondary)]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-label)]">
                <span
                  className={[
                    "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                    status.tone === "live"
                      ? "bg-[var(--color-tint)]"
                      : status.tone === "held"
                        ? "bg-[var(--color-warning)]"
                        : "bg-[var(--color-label-tertiary)]",
                  ].join(" ")}
                  aria-hidden
                />
                {headerChip}
              </span>
              {genLine ? (
                <span className="hidden tabular-nums text-[var(--color-label-tertiary)] sm:inline">
                  {genLine}
                </span>
              ) : null}
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-auto bg-[#0a0a0e]">
            {expiration ? (
              <HeatmapRenderHost
                expiration={expiration}
                viewSide={viewSide}
                tplKey={tplKey}
                taxSide={taxSide}
                minOi={minOi}
                onMeta={onMeta}
              />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * IKI-P3 — Heatmap workspace chrome. Administrator-only URL (server gate
 * in proxy.ts + layout.tsx). Render sink unchanged.
 */
export default function IkiRunnerPage() {
  return (
    <IkiSuiteChrome active="runner" workspace>
      <OptionsLabProvider>
        <IkiRunnerWorkspace />
      </OptionsLabProvider>
    </IkiSuiteChrome>
  );
}
