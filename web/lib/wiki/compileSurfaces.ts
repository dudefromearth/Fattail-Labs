/** Declared IKI/Wiki-local surface_key list (Wiki Spec v1.2 W1). */

export const DECLARED_SURFACES = {
  "iki.wiki.entry": "/app/wiki",
  "iki.wiki.article": "/app/wiki/",
  "iki.runner": "/app/iki/runner",
  "iki.factory": "/app/iki/factory",
} as const;

export type SurfaceKey = keyof typeof DECLARED_SURFACES;

export function surfaceForPath(pathname: string): SurfaceKey | null {
  const path = pathname.split("?")[0].split("#")[0];
  if (path === "/app/wiki") return "iki.wiki.entry";
  if (path.startsWith("/app/wiki/") && path.length > "/app/wiki/".length) {
    return "iki.wiki.article";
  }
  if (path === "/app/iki/runner" || path.startsWith("/app/iki/runner/")) {
    return "iki.runner";
  }
  if (path === "/app/iki/factory" || path.startsWith("/app/iki/factory/")) {
    return "iki.factory";
  }
  return null;
}

export type CompileCapture = {
  surface_key: string;
  state_key: null;
  route: string;
};

/** AT-WA3: route path only — never search, never entity ids. */
export function captureCompileContext(
  pathname: string,
  search: string
): CompileCapture | null {
  const surface = surfaceForPath(pathname);
  if (!surface) return null;
  void search; // deliberately unused — never copied
  const route = pathname.split("?")[0].split("#")[0];
  return { surface_key: surface, state_key: null, route };
}