// Shared client-side API helpers (refactor step 3/4, decision log 2026-07-21).
// One implementation of the fetch/credentials/JSON dances that were pasted
// across components: JSON verbs, media upload, and static-page revalidation.

export async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { credentials: "same-origin" });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

export function postJSON(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function putJSON(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function del(url: string): Promise<Response> {
  return fetch(url, { method: "DELETE", credentials: "same-origin" });
}

/** Upload to the media store. Returns the stored URL, or null on failure. */
export async function uploadMedia(
  file: File,
  opts?: { privateTier?: boolean },
): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(
    opts?.privateTier ? "/api/admin/media?private=true" : "/api/admin/media",
    { method: "POST", credentials: "same-origin", body: form },
  );
  if (!r.ok) return null;
  return ((await r.json()) as { url: string }).url;
}

/** Regenerate statically-prerendered pages after an admin edit. */
export async function revalidate(paths: string[]): Promise<void> {
  for (const path of paths) {
    await postJSON("/api/revalidate", { path });
  }
}
