"use client";

// On a /courses/{slug} 404: if the caller is an admin and the slug is actually
// a draft, route them into the draft editor (spec v1.4 §4). Everyone else sees
// the plain 404 — drafts stay invisible to non-admins.

import { useEffect, useState } from "react";

export default function AdminDraftRedirect() {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/courses\/([^/]+)\/?$/);
    if (!match) return;
    const slug = decodeURIComponent(match[1]);
    let cancelled = false;
    fetch(`/api/admin/courses/${slug}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((course) => {
        if (cancelled || !course) return;
        setRedirecting(true);
        window.location.replace(`/admin/courses/${slug}`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!redirecting) return null;
  return (
    <p className="mt-4 text-sm text-emerald-600">
      This is one of your drafts — opening the editor…
    </p>
  );
}
