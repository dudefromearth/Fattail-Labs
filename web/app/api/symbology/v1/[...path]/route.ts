import { type NextRequest } from "next/server";

/**
 * Same-origin hop: browser /api/symbology/v1/* → Labs API /symbology/v1/*
 * (the registry is not under /api on :4000). Session cookie stays host-only.
 */
export const dynamic = "force-dynamic";

function dest(req: NextRequest, path: string[]): string {
  const api = process.env.NEXT_PUBLIC_LABS_API_URL;
  if (!api) throw new Error("NEXT_PUBLIC_LABS_API_URL is not set");
  const qs = req.nextUrl.searchParams.toString();
  const suffix = path.map(encodeURIComponent).join("/");
  return `${api.replace(/\/$/, "")}/symbology/v1/${suffix}${qs ? `?${qs}` : ""}`;
}

async function hop(req: NextRequest, path: string[]): Promise<Response> {
  const headers: Record<string, string> = {
    cookie: req.headers.get("cookie") || "",
    accept: req.headers.get("accept") || "application/json",
  };
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  if (origin) headers.origin = origin;
  if (referer) headers.referer = referer;
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;
  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }
  const r = await fetch(dest(req, path), init);
  const body = await r.arrayBuffer();
  const out = new Headers();
  const ct = r.headers.get("content-type");
  if (ct) out.set("content-type", ct);
  return new Response(body, { status: r.status, headers: out });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return hop(req, path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return hop(req, path);
}
