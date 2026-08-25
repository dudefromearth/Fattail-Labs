"use client";

/**
 * Render sink + TR-P3 shell host.
 * Flag 1: every template through subscribe → run → this grid.
 * HeatmapChainPanel is not mounted here.
 */

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { DEFAULT_STRIKE_WINGS } from "@/lib/chainLadderApi";
import { getMarketSocket } from "@/lib/market/MarketSocket";
import { useOptionsLab } from "@/lib/optionsLabContext";
import {
  emitToSink,
  type HeatmapTiles,
  type RunnerTemplate,
} from "../registry";
import { createShellSession, type ShellSession } from "../host";
import "@/lib/runner/templates/heatmap";
import "@/lib/runner/templates/width-fit";
import "@/lib/runner/templates/spread-tax";
import {
  SPREAD_TAX_ID,
  SPREAD_TAX_VERSION,
} from "../templates/spread-tax";

export type RenderMeta = {
  content_hash: string | null;
  stale: boolean;
  epoch_quality: string;
};

export function deliverRender(
  template: RunnerTemplate,
  tiles: HeatmapTiles,
): HeatmapTiles {
  emitToSink(template, "render");
  return tiles;
}

export { pushTileSet } from "../host";

function TileGrid(props: {
  tiles: HeatmapTiles | null;
  stale: boolean | null;
  epochQuality: string | null;
  error: string | null;
}): ReactElement {
  const { tiles, stale, epochQuality, error } = props;
  return createElement(
    "div",
    {
      className:
        "flex min-h-0 flex-1 flex-col overflow-auto bg-[#0a0a0e] text-white",
      "data-testid": "spread-tax-host",
      "data-stale": stale == null ? "" : stale ? "1" : "0",
      "data-epoch-quality": epochQuality ?? "",
    },
    error
      ? createElement(
          "p",
          {
            className: "px-3 py-2 text-sm text-amber-200",
            "data-testid": "spread-tax-error",
          },
          error,
        )
      : null,
    tiles
      ? createElement(
          "table",
          {
            className: "w-full border-collapse",
            "data-testid": "spread-tax-grid",
          },
          createElement(
            "thead",
            null,
            createElement(
              "tr",
              { className: "h-9" },
              createElement(
                "th",
                {
                  className:
                    "sticky left-0 top-0 z-[2] h-9 w-[7rem] min-w-[7rem] border-b border-r border-white/[0.08] bg-[#121218] px-1 text-center text-[11px] font-medium uppercase tracking-wide text-white/45",
                },
                "Strike",
              ),
              ...tiles.cols.map((c) =>
                createElement(
                  "th",
                  {
                    key: c.id,
                    className:
                      "sticky top-0 z-[1] h-9 border-b border-white/[0.08] bg-[#121218] px-1 text-center text-[11px] font-medium text-white/55",
                  },
                  c.label,
                ),
              ),
            ),
          ),
          createElement(
            "tbody",
            null,
            ...tiles.rows.map((r, ri) =>
              createElement(
                "tr",
                {
                  key: r.strike,
                  "data-spot": r.isSpot ? "1" : "0",
                  className: [
                    "h-14 border-b border-white/[0.03]",
                    r.isSpot ? "border-t-2 border-amber-400/80" : "",
                  ].join(" "),
                },
                createElement(
                  "td",
                  {
                    className: [
                      "sticky left-0 z-[1] h-14 w-[7rem] min-w-[7rem] border-r border-white/[0.08] px-1 text-center align-middle text-[24px] tabular-nums",
                      r.isSpot
                        ? "bg-black/40 font-bold text-amber-400"
                        : "bg-[#16161c] text-white/45",
                    ].join(" "),
                  },
                  r.label,
                ),
                ...tiles.cols.map((c, ci) => {
                  const cell = tiles.cells[ri]?.[ci];
                  const empty = !cell || !cell.valid || cell.value == null;
                  const face = empty ? "—" : (cell.display ?? "—");
                  const bg = cell?.bgCss || "#1a1a1a";
                  return createElement(
                    "td",
                    {
                      key: c.id,
                      title: cell?.tooltip || face,
                      "data-heatmap-tile": "1",
                      "data-spread-tax-cell": "1",
                      "data-null": empty ? "1" : "0",
                      className: [
                        "h-14 min-w-[2.75rem] cursor-default overflow-hidden px-1 text-center align-middle tabular-nums text-[24px] text-amber-400",
                        "[text-shadow:0_0_2px_rgba(0,0,0,0.8)]",
                        "hover:z-[1] hover:ring-1 hover:ring-white/35",
                        empty ? "text-white/25" : "",
                      ].join(" "),
                      style: { backgroundColor: bg },
                    },
                    face,
                  );
                }),
              ),
            ),
          ),
        )
      : null,
  );
}

export type HeatmapRenderHostProps = {
  expiration: string;
  viewSide: "call" | "put";
  tplKey: string;
  taxSide: string;
  minOi: number;
  onMeta?: (meta: {
    stale: boolean | null;
    epochQuality: string | null;
    contentHash: string | null;
    error: string | null;
    tplLabel: string;
  }) => void;
};

export function HeatmapRenderHost(props: HeatmapRenderHostProps): ReactElement {
  const { symbol } = useOptionsLab();
  const { expiration, viewSide, tplKey, taxSide, minOi, onMeta } = props;
  const [tiles, setTiles] = useState<HeatmapTiles | null>(null);
  const [stale, setStale] = useState<boolean | null>(null);
  const [epochQuality, setEpochQuality] = useState<string | null>(null);
  const [contentHash, setContentHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<ShellSession | null>(null);
  const onMetaRef = useRef(onMeta);
  onMetaRef.current = onMeta;
  const tplLabel =
    tplKey === `${SPREAD_TAX_ID}@${SPREAD_TAX_VERSION}`
      ? "Spread Tax Map"
      : "Advanced flies";

  useEffect(() => {
    if (!symbol || !expiration) return;
    setTiles(null);
    setContentHash(null);
    setStale(null);
    setEpochQuality(null);
    const [id, version] = tplKey.split("@");
    const session = createShellSession({
      socket: getMarketSocket(),
      chain: {
        symbol,
        expiration,
        side: viewSide,
        wings: DEFAULT_STRIKE_WINGS,
      },
      templateId: id,
      templateVersion: version,
      controls:
        tplKey === "spread-tax@0.1" ? { side: taxSide, min_oi: minOi } : {},
      onTiles(next, meta) {
        setTiles(next);
        setStale(meta.stale);
        setEpochQuality(meta.epoch_quality);
        setContentHash(meta.content_hash);
        setError(null);
        onMetaRef.current?.({
          stale: meta.stale,
          epochQuality: meta.epoch_quality,
          contentHash: meta.content_hash,
          error: null,
          tplLabel,
        });
      },
      onError: (e) => {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        onMetaRef.current?.({
          stale: null,
          epochQuality: null,
          contentHash: null,
          error: msg,
          tplLabel,
        });
      },
    });
    sessionRef.current = session;
    return () => {
      session.dispose();
      sessionRef.current = null;
    };
    // Recreate session only when chain identity changes — not on template (setTemplate).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, expiration, viewSide]);

  useEffect(() => {
    const s = sessionRef.current;
    if (!s) return;
    const [id, version] = tplKey.split("@");
    s.setTemplate(id, version);
    if (tplKey === "spread-tax@0.1") {
      s.setControls({ side: taxSide, min_oi: minOi });
    } else {
      s.setControls({});
    }
  }, [tplKey, taxSide, minOi]);

  return createElement(
    "div",
    {
      className: "flex h-full min-h-0 flex-col",
      "data-testid": "runner-shell-host",
      "data-symbol": symbol,
      "data-content-hash": contentHash ?? "",
      "data-spread-tax-host": tplKey === "spread-tax@0.1" ? "1" : "0",
    },
    createElement(TileGrid, { tiles, stale, epochQuality, error }),
  );
}
