"use client";

/**
 * Render sink (TR-P2). Stream of tile sets; re-render when content_hash
 * changes. stale / epoch_quality are props for the host — Runner does not
 * draw Keep-Warm chrome.
 */

import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import HeatmapChainPanel from "@/components/options-lab/HeatmapChainPanel";
import {
  emitToSink,
  get,
  type HeatmapTiles,
  type RunnerTemplate,
} from "../registry";
import { run } from "../run";
import { subscribe, type RunnerSnapshot } from "../subscribe";
import "@/lib/runner/templates/heatmap";
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

/** Push tiles; returns whether the hash changed (render fire). */
export function pushTileSet(
  lastHash: { current: string | null },
  tiles: HeatmapTiles,
  onRender: (tiles: HeatmapTiles) => void,
): boolean {
  const h = tiles.contentHash ?? "";
  if (h === (lastHash.current ?? "")) return false;
  lastHash.current = h;
  onRender(tiles);
  return true;
}

function SpreadTaxGrid(props: {
  tiles: HeatmapTiles | null;
  stale: boolean | null;
  epochQuality: string | null;
  error: string | null;
  side: string;
  minOi: number;
  onSide: (v: string) => void;
  onMinOi: (v: number) => void;
}): ReactElement {
  const { tiles, stale, epochQuality, error, side, minOi, onSide, onMinOi } =
    props;
  return createElement(
    "div",
    {
      className: "flex h-full min-h-[24rem] flex-col bg-[#0a0a0e] text-white",
      "data-testid": "spread-tax-host",
      "data-stale": stale == null ? "" : stale ? "1" : "0",
      "data-epoch-quality": epochQuality ?? "",
    },
    createElement(
      "div",
      { className: "flex flex-wrap items-center gap-3 px-3 py-2 text-sm" },
      createElement("label", { className: "flex items-center gap-2" }, "Side",
        createElement(
          "select",
          {
            value: side,
            "data-testid": "spread-tax-side",
            className: "rounded bg-black/40 px-2 py-1",
            onChange: (e: { target: { value: string } }) => onSide(e.target.value),
          },
          createElement("option", { value: "both" }, "both"),
          createElement("option", { value: "call" }, "call"),
          createElement("option", { value: "put" }, "put"),
        ),
      ),
      createElement("label", { className: "flex items-center gap-2" }, "min OI",
        createElement("input", {
          type: "number",
          min: 0,
          value: minOi,
          "data-testid": "spread-tax-min-oi",
          className: "w-24 rounded bg-black/40 px-2 py-1",
          onChange: (e: { target: { value: string } }) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onMinOi(n);
          },
        }),
      ),
      stale != null
        ? createElement(
            "span",
            { className: "text-white/50", "data-testid": "spread-tax-stale-prop" },
            `stale=${stale ? "true" : "false"}`,
          )
        : null,
      epochQuality
        ? createElement(
            "span",
            { className: "text-white/50", "data-testid": "spread-tax-epoch-prop" },
            `epoch_quality=${epochQuality}`,
          )
        : null,
    ),
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
            className: "w-full border-collapse text-sm",
            "data-testid": "spread-tax-grid",
          },
          createElement(
            "thead",
            null,
            createElement(
              "tr",
              null,
              createElement("th", { className: "px-2 py-1 text-left" }, "Strike"),
              ...tiles.cols.map((c) =>
                createElement("th", { key: c.id, className: "px-2 py-1" }, c.label),
              ),
            ),
          ),
          createElement(
            "tbody",
            null,
            ...tiles.rows.map((r, ri) =>
              createElement(
                "tr",
                { key: r.strike },
                createElement("td", { className: "px-2 py-1" }, r.label),
                ...tiles.cols.map((c, ci) => {
                  const cell = tiles.cells[ri]?.[ci];
                  const empty = !cell || !cell.valid || cell.value == null;
                  return createElement(
                    "td",
                    {
                      key: c.id,
                      className: "px-2 py-1 text-center tabular-nums",
                      "data-spread-tax-cell": "1",
                      "data-null": empty ? "1" : "0",
                    },
                    empty ? "" : cell.display,
                  );
                }),
              ),
            ),
          ),
        )
      : null,
  );
}

export function HeatmapRenderHost(): ReactElement {
  const [tplKey, setTplKey] = useState("sym-fly@0.2");
  const [side, setSide] = useState("both");
  const [minOi, setMinOi] = useState(0);
  const [tiles, setTiles] = useState<HeatmapTiles | null>(null);
  const [stale, setStale] = useState<boolean | null>(null);
  const [epochQuality, setEpochQuality] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastHash = useRef<string | null>(null);
  const chainRef = useRef<{ rows: unknown[] } | null>(null);

  const onSnap = useCallback(
    (snap: RunnerSnapshot) => {
      setStale(snap.stale);
      setEpochQuality(snap.epoch_quality);
      setError(null);
      const raw = snap.raw as {
        ladder?: { rows?: unknown[] };
        upserts?: unknown[];
      };
      if (snap.mode === "full" && raw.ladder?.rows) {
        chainRef.current = { rows: raw.ladder.rows };
      }
      if (tplKey !== "spread-tax@0.1") return;
      const tpl = get(SPREAD_TAX_ID, SPREAD_TAX_VERSION);
      const next = run(
        tpl,
        {
          chain: chainRef.current,
          content_hash: snap.content_hash,
          stale: snap.stale,
          epoch_quality: snap.epoch_quality,
        },
        { side, min_oi: minOi },
      );
      pushTileSet(lastHash, next, setTiles);
    },
    [tplKey, side, minOi],
  );

  useEffect(() => {
    try {
      return subscribe(
        {
          interestId: "runner-heatmap",
          topics: ["chain"],
          onError: (e) =>
            setError(e instanceof Error ? e.message : String(e)),
        },
        (snap) => {
          try {
            onSnap(snap);
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          }
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return undefined;
    }
  }, [onSnap]);

  const selector = createElement(
    "label",
    {
      className: "flex items-center gap-2 px-3 py-2 text-sm",
      "data-testid": "runner-template-selector",
    },
    "Template",
    createElement(
      "select",
      {
        value: tplKey,
        onChange: (e: { target: { value: string } }) => {
          lastHash.current = null;
          setTiles(null);
          setTplKey(e.target.value);
        },
        className: "rounded bg-black/40 px-2 py-1",
      },
      createElement("option", { value: "sym-fly@0.2" }, "Advanced flies"),
      createElement("option", { value: "spread-tax@0.1" }, "Spread Tax Map"),
    ),
  );

  const body =
    tplKey === "spread-tax@0.1"
      ? createElement(SpreadTaxGrid, {
          tiles,
          stale,
          epochQuality,
          error,
          side,
          minOi,
          onSide: setSide,
          onMinOi: setMinOi,
        })
      : createElement(HeatmapChainPanel);

  return createElement("div", { className: "flex h-full min-h-0 flex-col" }, selector, body);
}
