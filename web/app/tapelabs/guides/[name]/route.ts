import { NextRequest, NextResponse } from "next/server";
import { readTapeGuide, TAPE_GUIDE_FILES, tapeGuideId } from "@/lib/tapelab/guides";
import { tapeSessionOk } from "@/lib/tapelab/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function loginRedirect(request: NextRequest): NextResponse {
  const next = request.nextUrl.pathname + request.nextUrl.search;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = (request.headers.get("x-forwarded-proto") || "http").split(",")[0].trim();
  const url = host
    ? new URL(`/login?next=${encodeURIComponent(next)}`, `${proto}://${host}`)
    : new URL(`/login?next=${encodeURIComponent(next)}`, "http://127.0.0.1:3000");
  return NextResponse.redirect(url);
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ name: string }> },
) {
  const { name } = await ctx.params;
  const id = tapeGuideId(name);
  if (!id) {
    return NextResponse.json(
      { error: "not found" },
      { status: 404, headers: { "x-robots-tag": "noindex, nofollow", "cache-control": "no-store" } },
    );
  }
  const cookie = request.headers.get("cookie") || "";
  if (!(await tapeSessionOk(cookie))) return loginRedirect(request);
  const filename = TAPE_GUIDE_FILES[id].filename;
  return new NextResponse(readTapeGuide(id), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
