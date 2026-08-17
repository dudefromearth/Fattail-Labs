export type SavedView = {
  id: string;
  name: string;
  inspect: Record<string, unknown>;
  updated_at: string;
};

export type SurfaceInspectPayload = {
  defaults: Record<string, unknown>;
  default_view_id: string | null;
  views: SavedView[];
};

export async function loadSurfaceInspect(): Promise<SurfaceInspectPayload> {
  const r = await fetch("/api/me/profile", { credentials: "same-origin" });
  if (!r.ok) {
    return { defaults: {}, default_view_id: null, views: [] };
  }
  const body = await r.json();
  const raw = body.surface_inspect;
  if (!raw || typeof raw !== "object") {
    return { defaults: {}, default_view_id: null, views: [] };
  }
  return {
    defaults: raw.defaults && typeof raw.defaults === "object" ? raw.defaults : {},
    default_view_id: raw.default_view_id ?? null,
    views: Array.isArray(raw.views) ? raw.views : [],
  };
}

export async function saveSurfaceInspect(
  payload: SurfaceInspectPayload,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const r = await fetch("/api/me/profile", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ surface_inspect: payload }),
  });
  let body: unknown = null;
  try {
    body = await r.json();
  } catch {
    body = null;
  }
  return { ok: r.ok, status: r.status, body };
}
