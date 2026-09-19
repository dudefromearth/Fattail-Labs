import type { ResolvePayload, UniversePayload } from "./types";

const BASE = "/api/symbology/v1";

function rolesParam(roles: readonly string[]): string {
  return [...roles].join(",");
}

async function readJson<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
      else if (body.detail && typeof body.detail === "object") {
        const d = body.detail as { message?: string; code?: string };
        detail = d.message || d.code || detail;
      }
    } catch {
      /* keep status */
    }
    throw new Error(`symbology ${path}: ${detail}`);
  }
  return (await res.json()) as T;
}

export async function fetchUniverse(
  roles: readonly string[],
): Promise<UniversePayload> {
  const qs = new URLSearchParams({ roles: rolesParam(roles) });
  const res = await fetch(`${BASE}/universe?${qs}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return readJson<UniversePayload>(res, "universe");
}

export async function fetchResolve(
  q: string,
  roles: readonly string[],
): Promise<ResolvePayload> {
  const qs = new URLSearchParams({ q, roles: rolesParam(roles) });
  const res = await fetch(`${BASE}/resolve?${qs}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return readJson<ResolvePayload>(res, "resolve");
}

export async function postGrayTelemetry(
  q: string,
  reasonCode: string,
): Promise<void> {
  try {
    await fetch(`${BASE}/telemetry`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, reason_code: reasonCode }),
    });
  } catch {
    /* aggregate-only; a dropped event is not a silent miss in the list */
  }
}
