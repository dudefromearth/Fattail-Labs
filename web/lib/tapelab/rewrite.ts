import { TAPELAB_HOME, TAPELAB_MOUNT } from "./catalog";

// Root-absolute URLs in the Tape Lab pages and scripts. A subpath proxy
// has to prefix them or the browser calls the Labs origin instead.
const ATTR_ROOT = /(src|href|action)=(["'])\/(?!\/|tapelabs\b)/g;
const QUOTED_ROOT =
  /(['"`])\/(?!\/|tapelabs\b)(?=api\/|v1\/|view[?#]|backtest[?#]|symbol[?#]|gaps[?#]|board[?#]|studies[?#]|visions[?#]|walkforward[?#]|tester[?#])/g;
const CSS_URL = /url\(\/(?!\/|tapelabs\b)/g;
const NAV = /<nav\b[^>]*>[\s\S]*?<\/nav>/gi;

export function rewriteTapeUrls(text: string): string {
  return text
    .replace(ATTR_ROOT, `$1=$2${TAPELAB_MOUNT}/`)
    .replace(QUOTED_ROOT, `$1${TAPELAB_MOUNT}/`)
    .replace(CSS_URL, `url(${TAPELAB_MOUNT}/`);
}

export function rewriteTapeDocument(html: string): string {
  const linked = rewriteTapeUrls(html);
  return linked.replace(
    NAV,
    `<nav><a href="${TAPELAB_HOME}">Tape Labs</a></nav>`,
  );
}
