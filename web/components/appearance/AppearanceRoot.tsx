"use client";

/**
 * Applies published (or admin draft preview) appearance to <html> data attrs.
 * Human Interface Spec v1.0 §10.8
 *
 * Must NOT wrap page content — useSearchParams suspends, and wrapping the
 * tree in Suspense was blocking course tab clicks and other client handlers.
 */

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type AppearanceDoc = {
  brand?: { tint?: string; display_name?: string };
  appearance?: {
    color_scheme?: string;
    density?: string;
    corner_style?: string;
  };
};

function AppearanceApplier() {
  const search = useSearchParams();
  const draftPreview = search.get("appearance") === "draft";

  useEffect(() => {
    let cancelled = false;
    const q = draftPreview ? "?appearance=draft" : "";
    fetch(`/api/appearance${q}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.appearance) return;
        applyAppearance(d.appearance as AppearanceDoc);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [draftPreview]);

  return null;
}

function applyAppearance(doc: AppearanceDoc) {
  const root = document.documentElement;
  const scheme = doc.appearance?.color_scheme || "system";
  if (scheme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", scheme);

  const density = doc.appearance?.density || "comfortable";
  root.setAttribute("data-density", density);

  const corners = doc.appearance?.corner_style || "rounded";
  root.setAttribute("data-corners", corners);

  const tint = doc.brand?.tint || "emerald";
  root.setAttribute("data-tint", tint);

  if (doc.brand?.display_name) {
    root.dataset.brandName = doc.brand.display_name;
  }
}

/** Side-effect-only mount point — place as a sibling of page content. */
export default function AppearanceRoot() {
  return (
    <Suspense fallback={null}>
      <AppearanceApplier />
    </Suspense>
  );
}
