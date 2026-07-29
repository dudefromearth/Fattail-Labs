"use client";

import { useSearchParams } from "next/navigation";

export default function LoginIdleNotice() {
  const params = useSearchParams();
  if (params.get("idle") !== "1") return null;
  return (
    <p
      className="mt-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
      role="status"
    >
      You were signed out after a period of inactivity. Sign in again to
      continue.
    </p>
  );
}
