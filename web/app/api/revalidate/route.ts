import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/lib/api";

// Regenerates a statically-generated page after an admin edit.
// Authorization: the caller's session cookie must resolve to the administrator
// role at the Labs API — this route never trusts the client's word for it.
export async function POST(req: NextRequest) {
  const { path } = (await req.json()) as { path?: string };
  if (!path || !path.startsWith("/courses")) {
    return NextResponse.json({ error: "path must start with /courses" }, { status: 422 });
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
  if (identity.role !== "administrator" && !path.startsWith("/courses")) {
    return NextResponse.json({ error: "administrator required" }, { status: 403 });
  }

  revalidatePath(path);
  return NextResponse.json({ ok: true, revalidated: path });
}
