/**
 * Loopback client for the links worker on 127.0.0.1:4017.
 * Sends slug, ua, and referrer. logAfter also sends the peer address.
 * Does not attach a session header.
 */

const WORKER = "http://127.0.0.1:4017";

export type RedirectDecision = {
  status: number;
  location: string | null;
  body: string;
};

export async function decide(
  slug: string,
  ua: string,
  referrer: string,
): Promise<RedirectDecision> {
  const res = await fetch(`${WORKER}/decide`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ slug, ua, referrer }),
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) {
    return { status: 404, location: null, body: "Not found" };
  }
  const data = (await res.json()) as Partial<RedirectDecision>;
  return {
    status: typeof data.status === "number" ? data.status : 404,
    location: typeof data.location === "string" ? data.location : null,
    body: typeof data.body === "string" ? data.body : "",
  };
}

export async function logAfter(
  slug: string,
  ua: string,
  referrer: string,
  peer: string,
): Promise<void> {
  try {
    await fetch(`${WORKER}/log`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, ua, referrer, peer }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Logging failure must not change the redirect.
  }
}
