// Unlisted Tape Lab tools on FatTail Labs. Do not add these hrefs to
// SiteHeader, the apps catalog, home quick nav, or the sitemap.

export const TAPELAB_HOME = "/tapelabs";
export const TAPELAB_MOUNT = "/tapelabs/t";

export type TapeTool = {
  id: string;
  title: string;
  href: string;
  blurb: string;
};

export const TAPELAB_TOOLS: TapeTool[] = [
  {
    id: "health",
    title: "Health",
    href: TAPELAB_MOUNT,
    blurb: "Whether the capture and the data API are answering, and which days are on disk.",
  },
  {
    id: "symbol",
    title: "Symbol view",
    href: `${TAPELAB_MOUNT}/symbol?sym=SPX`,
    blurb: "One symbol’s chain, price, and session from the collected snapshots.",
  },
  {
    id: "backtest",
    title: "Backtest",
    href: `${TAPELAB_MOUNT}/backtest`,
    blurb: "Replay a structure on a captured day.",
  },
  {
    id: "gaps",
    title: "Gaps",
    href: `${TAPELAB_MOUNT}/gaps`,
    blurb: "Where the open sat against yesterday’s close, and whether that gap filled.",
  },
];

const PAGES = new Set(["", "index.html", "symbol", "backtest", "gaps", "view"]);

export function cleanTapePath(parts: string[] | undefined): string | null {
  const raw = (parts || []).map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  }).filter((part) => part !== "");
  if (raw.some((part) => part === "." || part === ".." || part.includes("\\") || part.includes("/"))) {
    return null;
  }
  return raw.join("/");
}

/** Pages we publish, plus the scripts and data those pages request. */
export function tapeProxyKind(path: string): "page" | "asset" | "no" {
  if (PAGES.has(path)) return "page";
  if (path.startsWith("api/") || path.startsWith("v1/")) return "asset";
  if (/^[A-Za-z0-9._-]+\.(js|css|map|svg|png|ico)$/.test(path)) return "asset";
  return "no";
}
