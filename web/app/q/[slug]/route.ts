import { after } from "next/server";

import { decide, logAfter } from "@/lib/links/publicRedirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

const CACHE: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "*",
};

function schemeIsHttps(location: string): boolean {
  try {
    const url = new URL(location);
    return url.protocol === "https:" && url.username === "" && url.password === "" && url.hash === "";
  } catch {
    return false;
  }
}

function peerAddress(req: Request): string {
  // Cloudflare's edge sets this authoritatively on every request that
  // reaches us (we sit entirely behind a Cloudflare Tunnel) — the client
  // cannot set or override it, unlike X-Forwarded-For. Prefer it.
  const cf = req.headers.get("cf-connecting-ip");
  if (cf && cf.trim()) {
    return cf.trim();
  }
  // Fallback for paths with no Cloudflare in front (local/dev testing).
  // Client-suppliable and therefore not trustworthy as an identity source
  // — RD-L3's discard-after-lookup and D4's honesty rule still apply.
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) {
    return "";
  }
  return forwarded.split(",")[0]?.trim() ?? "";
}

async function handle(req: Request, ctx: Ctx, head: boolean): Promise<Response> {
  const { slug } = await ctx.params;
  // Request query is not a destination (RD-L5). Session header is not read.
  const ua = req.headers.get("user-agent") ?? "";
  const referrer = req.headers.get("referer") ?? "";
  const peer = peerAddress(req);
  const decision = await decide(slug, ua, referrer);
  after(() => logAfter(slug, ua, referrer, peer));

  const headers = new Headers(CACHE);
  if (decision.status === 302 && decision.location && schemeIsHttps(decision.location)) {
    headers.set("Location", decision.location);
    return new Response(null, { status: 302, headers });
  }
  if (decision.status === 302) {
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new Response(head ? null : "Not found", { status: 404, headers });
  }
  const status = decision.status === 200 ? 200 : 404;
  headers.set("Content-Type", "text/plain; charset=utf-8");
  const body = decision.body || (status === 404 ? "Not found" : "");
  return new Response(head ? null : body, { status, headers });
}

export function GET(req: Request, ctx: Ctx) {
  return handle(req, ctx, false);
}

export function HEAD(req: Request, ctx: Ctx) {
  return handle(req, ctx, true);
}
