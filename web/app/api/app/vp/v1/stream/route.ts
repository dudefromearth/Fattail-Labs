import { type NextRequest } from "next/server";

/** Same-origin SSE hop so the member stream is not buffered by the /api rewrite. */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const api = process.env.NEXT_PUBLIC_LABS_API_URL;
  if (!api) {
    return new Response("NEXT_PUBLIC_LABS_API_URL missing", { status: 500 });
  }
  const dest = `${api}/api/app/vp/v1/stream?${req.nextUrl.searchParams.toString()}`;
  const r = await fetch(dest, {
    headers: {
      cookie: req.headers.get("cookie") || "",
      accept: "text/event-stream",
    },
    cache: "no-store",
  });
  return new Response(r.body, {
    status: r.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
