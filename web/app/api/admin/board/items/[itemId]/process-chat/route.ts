import { NextRequest, NextResponse } from "next/server";

/**
 * Long-timeout proxy for Process Co-pilot.
 * Default Next rewrites can fail with opaque HTTP 500 when Grok takes 30–90s.
 * This route takes precedence over the global /api rewrite.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

function apiBase(): string {
  const api = process.env.NEXT_PUBLIC_LABS_API_URL?.replace(/\/$/, "");
  if (!api) {
    throw new Error("NEXT_PUBLIC_LABS_API_URL is not set");
  }
  return api;
}

function forwardHeaders(req: NextRequest): Headers {
  const h = new Headers();
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const ct = req.headers.get("content-type");
  if (ct) h.set("content-type", ct);
  h.set("accept", "application/json");
  return h;
}

async function proxy(
  req: NextRequest,
  itemId: string,
  method: "GET" | "POST",
): Promise<NextResponse> {
  const url = `${apiBase()}/api/admin/board/items/${encodeURIComponent(itemId)}/process-chat`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 170_000);

  try {
    const init: RequestInit = {
      method,
      headers: forwardHeaders(req),
      signal: controller.signal,
      cache: "no-store",
    };
    if (method === "POST") {
      init.body = await req.text();
    }
    const upstream = await fetch(url, init);
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (e) {
    const aborted =
      (e instanceof Error && e.name === "AbortError") ||
      (typeof e === "object" &&
        e !== null &&
        "name" in e &&
        (e as { name: string }).name === "AbortError");
    const detail = aborted
      ? "Process co-pilot timed out waiting for Grok (170s). Try a shorter question, or retry."
      : e instanceof Error
        ? e.message
        : String(e);
    return NextResponse.json({ detail }, { status: aborted ? 504 : 502 });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await ctx.params;
  return proxy(req, itemId, "GET");
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await ctx.params;
  return proxy(req, itemId, "POST");
}
