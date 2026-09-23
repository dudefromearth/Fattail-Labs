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
import {
  horizontalColumnHoverClass,
  strikesLeftToRight,
  type MatrixView,
} from "@/lib/options-lab/templates/matrixView";
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
  matrixView: MatrixView;
}): ReactElement {
  const { tiles, stale, epochQuality, error, matrixView } = props;
  const horizontal = matrixView === "horizontal";
  const [hoverStrike, setHoverStrike] = useState<number | null>(null);
  const hRows = tiles ? strikesLeftToRight(tiles.rows) : [];
  const hRowIndex = new Map(
    (tiles?.rows ?? []).map((r, i) => [r.strike, i] as const),
  );
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
      ? horizontal
        ? createElement(
            "table",
            {
              className: "w-full table-fixed border-collapse",
              "data-testid": "spread-tax-grid",
              "data-matrix-view": "horizontal",
              onMouseLeave: () => setHoverStrike(null),
            },
            createElement(
              "thead",
              null,
              createElement(
                "tr",
                { className: "h-8" },
                createElement(
                  "th",
                  {
                    className:
                      "sticky left-0 top-0 z-[2] h-8 w-12 min-w-12 border-b border-r border-white/[0.08] bg-[#121218] px-0.5 text-center text-[9px] font-medium uppercase leading-tight tracking-wide text-white/45",
                  },
                  "Width",
                  createElement(
                    "span",
                    {
                      className:
                        "block normal-case tracking-normal text-white/35",
                    },
                    "\\ body",
                  ),
                ),
                ...hRows.map((r) =>
                  createElement(
                    "th",
                    {
                      key: r.strike,
                      "data-spot": r.isSpot ? "1" : "0",
                      "data-em": r.isEm ? "1" : "0",
                      "data-col-hover": hoverStrike === r.strike ? "1" : "0",
                      onMouseEnter: () => setHoverStrike(r.strike),
                      className: [
                        "sticky top-0 z-[1] h-8 min-w-0 border-b border-white/[0.08] bg-[#121218] text-center text-[11px] font-semibold tabular-nums",
                        r.isSpot
                          ? "text-amber-400 shadow-[inset_2px_0_0_#fbbf24,inset_-2px_0_0_#fbbf24]"
                          : r.isEm
                            ? "text-violet-300 shadow-[inset_2px_0_0_#c084fc,inset_-2px_0_0_#c084fc]"
                            : "text-white/55",
                        horizontalColumnHoverClass(
                          hoverStrike === r.strike,
                          "head",
                        ),
                      ].join(" "),
                    },
                    r.label,
                  ),
                ),
                createElement(
                  "th",
                  {
                    "data-testid": "heatmap-width-col-right-head",
                    className:
                      "sticky right-0 top-0 z-[2] h-8 w-12 min-w-12 border-b border-l border-white/[0.08] bg-[#121218] px-0.5 text-center text-[9px] font-medium uppercase leading-tight tracking-wide text-white/45",
                  },
                  "Width",
                ),
              ),
            ),
            createElement(
              "tbody",
              null,
              ...tiles.cols.map((c, ci) =>
                createElement(
                  "tr",
                  {
                    key: c.id,
                    className: "h-8 border-b border-white/[0.03]",
                  },
                  createElement(
                    "th",
                    {
                      className:
                        "sticky left-0 z-[1] h-8 w-12 min-w-12 border-r border-white/[0.08] bg-[#16161c] px-0.5 text-center align-middle text-[12px] font-semibold tabular-nums text-emerald-400",
                    },
                    c.label,
                  ),
                  ...hRows.map((r) => {
                    const ri = hRowIndex.get(r.strike) ?? 0;
                    const cell = tiles.cells[ri]?.[ci];
                    const empty = !cell || !cell.valid || cell.value == null;
                    const face = empty ? "—" : (cell.display ?? "—");
                    const bg = cell?.bgCss || "#1a1a1a";
                    return createElement(
                      "td",
                      {
                        key: r.strike,
                        title: cell?.tooltip || face,
                        "data-heatmap-tile": "1",
                        "data-spread-tax-cell": "1",
                        "data-spot": r.isSpot ? "1" : "0",
                        "data-em": r.isEm ? "1" : "0",
                        "data-col-hover": hoverStrike === r.strike ? "1" : "0",
                        "data-null": empty ? "1" : "0",
                        onMouseEnter: () => setHoverStrike(r.strike),
                        className: [
                          "h-8 min-w-0 cursor-default text-center align-middle tabular-nums text-[12px] text-amber-400",
                          "[text-shadow:0_0_2px_rgba(0,0,0,0.8)]",
                          r.isSpot
                            ? "shadow-[inset_2px_0_0_#fbbf24,inset_-2px_0_0_#fbbf24]"
                            : r.isEm
                              ? "shadow-[inset_2px_0_0_#c084fc,inset_-2px_0_0_#c084fc]"
                              : "",
                          empty ? "text-white/25" : "",
                          horizontalColumnHoverClass(
                            hoverStrike === r.strike,
                            "cell",
                          ),
                        ].join(" "),
                        style: { backgroundColor: bg },
                      },
                      face,
                    );
                  }),
                  createElement(
                    "th",
                    {
                      className:
                        "sticky right-0 z-[1] h-8 w-12 min-w-12 border-l border-white/[0.08] bg-[#16161c] px-0.5 text-center align-middle text-[12px] font-semibold tabular-nums text-emerald-400",
                    },
                    c.label,
                  ),
                ),
              ),
            ),
          )
        : createElement(
          "table",
          {
            className: "w-full border-collapse",
            "data-testid": "spread-tax-grid",
            "data-matrix-view": "vertical",
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
                  "data-em": r.isEm ? "1" : "0",
                  className: [
                    "h-14 border-b border-white/[0.03]",
                    r.isSpot
                      ? "border-t-2 border-amber-400/80"
                      : r.isEm
                        ? "border-t-2 border-b-2 border-violet-400/80"
                        : "",
                  ].join(" "),
                },
                createElement(
                  "td",
                  {
                    className: [
                      "sticky left-0 z-[1] h-14 w-[7rem] min-w-[7rem] border-r border-white/[0.08] px-1 text-center align-middle text-[24px] tabular-nums",
                      r.isSpot
                        ? "bg-black/40 font-bold text-amber-400"
                        : r.isEm
                          ? "bg-violet-950/50 font-bold text-violet-300"
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
  matrixView?: MatrixView;
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
  const { expiration, viewSide, tplKey, taxSide, minOi, matrixView = "vertical", onMeta } = props;
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
    createElement(TileGrid, {
      tiles,
      stale,
      epochQuality,
      error,
      matrixView,
    }),
  );
}
