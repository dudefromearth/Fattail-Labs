import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/lib/api";

/** Public page path prefixes that may be revalidated after edits. */
const ALLOWED_PREFIXES = [
  "/course",
  "/campaign",
  "/resource",
  "/app",
  "/live",
  "/",
] as const;

const ALLOWED_TAGS = new Set(["hub", "site-pages"]);

function allowedPath(path: string): boolean {
  return ALLOWED_PREFIXES.some(
    (p) => path === p || path.startsWith(p === "/" ? "/" : `${p}/`) || path.startsWith(p),
  );
}

// Regenerates a statically-generated page after an admin edit.
// Authorization: the caller's session cookie must resolve to the administrator
// role at the Labs API — this route never trusts the client's word for it.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { path?: string; tag?: string };
  const { path, tag } = body;
  if ((!path || !path.startsWith("/") || !allowedPath(path)) && !tag) {
    return NextResponse.json(
      {
        error: `path must be a public SEO namespace (${ALLOWED_PREFIXES.filter((p) => p !== "/").join(", ")}) or a known tag`,
      },
      { status: 422 },
    );
  }
  if (tag && !ALLOWED_TAGS.has(tag)) {
    return NextResponse.json({ error: `unknown tag ${tag}` }, { status: 422 });
  }

  const me = await fetch(apiUrl("/api/auth/me"), {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!me.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const identity = (await me.json()) as { role?: string };
  // Course pages: any authenticated session may regenerate (idempotent; reviews
  // and other member writes need fresh aggregates — Reviews spec §3). All other
  // paths remain admin-only.
  if (
    identity.role !== "administrator" &&
    !(path && path.startsWith("/course"))
  ) {
    return NextResponse.json({ error: "administrator required" }, { status: 403 });
  }

  if (tag) revalidateTag(tag, "max");
  if (path) {
    revalidatePath(path);
    // Home is force-static; layout scope forces a full tree rebuild.
    if (path === "/") revalidatePath("/", "layout");
  }
  return NextResponse.json({
    ok: true,
    revalidated: path ?? null,
    tag: tag ?? null,
  });
}
