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
import {
  DEFAULT_STRIKE_WINGS,
  fetchLadderExpirations,
} from "@/lib/chainLadderApi";
import { getMarketSocket } from "@/lib/market/MarketSocket";
import { useOptionsLab } from "@/lib/optionsLabContext";
import {
  emitToSink,
  type HeatmapTiles,
  type RunnerTemplate,
} from "../registry";
import { createShellSession, type ShellSession } from "../host";
import "@/lib/runner/templates/heatmap";
import "@/lib/runner/templates/spread-tax";
import {
  HEATMAP_TEMPLATE_ID,
  HEATMAP_TEMPLATE_VERSION,
} from "../templates/heatmap";
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
      className: "flex min-h-0 flex-1 flex-col overflow-auto bg-[#0a0a0e] text-white",
      "data-testid": "spread-tax-host",
      "data-stale": stale == null ? "" : stale ? "1" : "0",
      "data-epoch-quality": epochQuality ?? "",
    },
    stale != null
      ? createElement(
          "p",
          { className: "px-3 py-1 text-sm text-white/50", "data-testid": "runner-stale-prop" },
          `stale=${stale ? "true" : "false"} · epoch_quality=${epochQuality ?? ""}`,
        )
      : null,
    error
      ? createElement(
          "p",
          { className: "px-3 py-2 text-sm text-amber-200", "data-testid": "spread-tax-error" },
          error,
        )
      : null,
    tiles
      ? createElement(
          "table",
          { className: "w-full border-collapse text-sm", "data-testid": "spread-tax-grid" },
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
                      "data-heatmap-tile": "1",
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
  const { symbol } = useOptionsLab();
  const [expiration, setExpiration] = useState("");
  const [viewSide, setViewSide] = useState<"call" | "put">("call");
  const [tplKey, setTplKey] = useState("sym-fly@0.2");
  const [taxSide, setTaxSide] = useState("both");
  const [minOi, setMinOi] = useState(0);
  const [expiries, setExpiries] = useState<string[]>([]);
  const [tiles, setTiles] = useState<HeatmapTiles | null>(null);
  const [stale, setStale] = useState<boolean | null>(null);
  const [epochQuality, setEpochQuality] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<ShellSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchLadderExpirations(symbol).then((pack) => {
      if (cancelled) return;
      const list = (pack.contracts || []).map((c) => c.expiration);
      setExpiries(list);
      setExpiration((prev) =>
        prev && list.includes(prev) ? prev : pack.default_expiration || list[0] || "",
      );
    }).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    if (!symbol || !expiration) return;
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
        setError(null);
      },
      onError: (e) => setError(e instanceof Error ? e.message : String(e)),
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

  const selector = createElement(
    "div",
    {
      className: "flex flex-wrap items-center gap-3 px-3 py-2 text-sm",
      "data-testid": "runner-template-selector",
    },
    createElement("span", null, "Template"),
    createElement(
      "select",
      {
        value: tplKey,
        "data-testid": "runner-tpl-select",
        onChange: (e: { target: { value: string } }) => setTplKey(e.target.value),
        className: "rounded bg-black/40 px-2 py-1",
      },
      createElement("option", { value: `${HEATMAP_TEMPLATE_ID}@${HEATMAP_TEMPLATE_VERSION}` }, "Advanced flies"),
      createElement("option", { value: `${SPREAD_TAX_ID}@${SPREAD_TAX_VERSION}` }, "Spread Tax Map"),
    ),
    createElement("span", null, "Exp"),
    createElement(
      "select",
      {
        value: expiration,
        onChange: (e: { target: { value: string } }) => setExpiration(e.target.value),
        className: "rounded bg-black/40 px-2 py-1",
        "data-testid": "runner-expiration",
      },
      ...expiries.map((d) => createElement("option", { key: d, value: d }, d)),
    ),
    createElement("span", null, "Side"),
    createElement(
      "select",
      {
        value: viewSide,
        onChange: (e: { target: { value: string } }) =>
          setViewSide(e.target.value === "put" ? "put" : "call"),
        className: "rounded bg-black/40 px-2 py-1",
      },
      createElement("option", { value: "call" }, "call"),
      createElement("option", { value: "put" }, "put"),
    ),
    tplKey === "spread-tax@0.1"
      ? createElement(
          "span",
          { className: "flex items-center gap-2" },
          "Map",
          createElement(
            "select",
            {
              value: taxSide,
              "data-testid": "spread-tax-side",
              className: "rounded bg-black/40 px-2 py-1",
              onChange: (e: { target: { value: string } }) => setTaxSide(e.target.value),
            },
            createElement("option", { value: "both" }, "both"),
            createElement("option", { value: "call" }, "call"),
            createElement("option", { value: "put" }, "put"),
          ),
          "min OI",
          createElement("input", {
            type: "number",
            min: 0,
            value: minOi,
            "data-testid": "spread-tax-min-oi",
            className: "w-24 rounded bg-black/40 px-2 py-1",
            onChange: (e: { target: { value: string } }) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setMinOi(n);
            },
          }),
        )
      : null,
  );

  return createElement(
    "div",
    {
      className: "flex h-full min-h-0 flex-col",
      "data-testid": "runner-shell-host",
      "data-spread-tax-host": tplKey === "spread-tax@0.1" ? "1" : "0",
    },
    selector,
    createElement(TileGrid, { tiles, stale, epochQuality, error }),
  );
}
