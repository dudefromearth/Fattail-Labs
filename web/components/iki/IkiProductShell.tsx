"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ikiAccessFromMe, ikiOnlyPathAllowed } from "@/lib/ikiAccess";
import { fetchMe } from "@/lib/useIsAdmin";

/** IKI-only members stay inside About / Catalog / Your Lab / Analyzer. */
export default function IkiProductShell() {
  const pathname = usePathname() || "";
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((me) => {
      if (cancelled) return;
      const a = ikiAccessFromMe(me);
      if (!a.ikiLabOnly) return;
      if (ikiOnlyPathAllowed(pathname)) return;
      if (pathname.startsWith("/admin")) return;
      router.replace("/app/iki/about");
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
