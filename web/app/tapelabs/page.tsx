import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TAPELAB_TOOLS } from "@/lib/tapelab/catalog";
import { requestHasTapeSession } from "@/lib/tapelab/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tape Labs",
  robots: { index: false, follow: false },
};

export default async function TapeLabsPage() {
  if (!(await requestHasTapeSession())) redirect("/login");
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Tape Labs</h1>
      <p className="mt-2 max-w-2xl text-[var(--color-label-secondary)]">
        Collected sessions. Open a tool from here. This page is not listed in the site menu.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {TAPELAB_TOOLS.map((tool) => (
          <li key={tool.id}>
            <Link
              href={tool.href}
              className="block h-full rounded-2xl border border-[var(--color-separator)] bg-[var(--color-fill)] p-5 transition-colors hover:border-[var(--color-tint)]"
            >
              <h2 className="text-lg font-semibold">{tool.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-label-secondary)]">
                {tool.blurb}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
