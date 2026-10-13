import { NextRequest, NextResponse } from "next/server";
import { cleanTapePath, TAPELAB_HOME, tapeProxyKind } from "@/lib/tapelab/catalog";
import { rewriteTapeDocument, rewriteTapeUrls } from "@/lib/tapelab/rewrite";
import { tapeSessionOk } from "@/lib/tapelab/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function origin(): string {
  const raw = process.env.TAPELAB_ORIGIN?.trim();
  if (!raw) throw new Error("TAPELAB_ORIGIN is not set");
  return raw.replace(/\/$/, "");
}

function loginRedirect(request: NextRequest): NextResponse {
  const next = request.nextUrl.pathname + request.nextUrl.search;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = (request.headers.get("x-forwarded-proto") || "http").split(",")[0].trim();
  const url = host
    ? new URL(`/login?next=${encodeURIComponent(next)}`, `${proto}://${host}`)
    : new URL(`/login?next=${encodeURIComponent(next)}`, "http://127.0.0.1:3000");
  return NextResponse.redirect(url);
}

function blocked(): NextResponse {
  const html = `<!doctype html><meta charset="utf-8"><title>Tape Labs</title>
<body style="font:15px system-ui;background:#0d1117;color:#e6edf3;padding:32px">
<p>That tool is not on this dashboard.</p>
<p><a style="color:#58a6ff" href="${TAPELAB_HOME}">Tape Labs</a></p>
</body>`;
  return new NextResponse(html, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function rewriteBody(path: string, contentType: string, text: string): string {
  if (tapeProxyKind(path) === "page" || contentType.includes("text/html")) {
    return rewriteTapeDocument(text);
  }
  return rewriteTapeUrls(text);
}

async function proxy(request: NextRequest, parts: string[] | undefined): Promise<NextResponse> {
  const path = cleanTapePath(parts);
  if (path == null) return blocked();
  const cookie = request.headers.get("cookie") || "";
  if (!(await tapeSessionOk(cookie))) {
    if (path.startsWith("api/") || path.startsWith("v1/") || /\.(js|css)$/.test(path)) {
      return NextResponse.json(
        { error: "sign in" },
        { status: 401, headers: { "x-robots-tag": "noindex, nofollow" } },
      );
    }
    return loginRedirect(request);
  }
  const kind = tapeProxyKind(path);
  if (kind === "no") return blocked();

  let upstream: string;
  try {
    upstream = `${origin()}/${path}${request.nextUrl.search}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tape Lab is not configured";
    return NextResponse.json(
      { error: message },
      { status: 503, headers: { "x-robots-tag": "noindex, nofollow" } },
    );
  }

  const headers = new Headers();
  const contentTypeIn = request.headers.get("content-type");
  if (contentTypeIn) headers.set("content-type", contentTypeIn);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  let res: Response;
  try {
    res = await fetch(upstream, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      { error: "Tape Lab is not reachable" },
      { status: 502, headers: { "x-robots-tag": "noindex, nofollow" } },
    );
  }

  const contentType = res.headers.get("content-type") || (kind === "page" ? "text/html; charset=utf-8" : "application/octet-stream");
  const textual = /text\/html|javascript|ecmascript|text\/css/.test(contentType);
  if (!textual) {
    return new NextResponse(await res.arrayBuffer(), {
      status: res.status,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }
  const text = rewriteBody(path, contentType, await res.text());
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

type Ctx = { params: Promise<{ path?: string[] }> };

export function GET(request: NextRequest, ctx: Ctx) {
  return ctx.params.then((p) => proxy(request, p.path));
}

export function POST(request: NextRequest, ctx: Ctx) {
  return ctx.params.then((p) => proxy(request, p.path));
}
