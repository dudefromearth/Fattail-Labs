import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import TapeGuide from "@/components/tapelabs/TapeGuide";
import { TAPELAB_TOOLS } from "@/lib/tapelab/catalog";
import { readTapeGuide, TAPE_GUIDE_FILES, type TapeGuideId } from "@/lib/tapelab/guides";
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
          <li
            key={tool.id}
            className="flex h-full flex-col rounded-2xl border border-[var(--color-separator)] bg-[var(--color-fill)] p-5"
          >
            <h2 className="text-lg font-semibold">
              <Link
                href={tool.href}
                className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
              >
                {tool.title}
              </Link>
            </h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-[var(--color-label-secondary)]">
              {tool.blurb}
            </p>
            <p className="mt-4">
              <Link
                href={`#guide-${tool.id}`}
                className="text-sm font-medium text-[var(--color-tint)] underline rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
              >
                Read the {tool.title} guide
              </Link>
            </p>
          </li>
        ))}
      </ul>
      <section aria-labelledby="tape-guides-heading" className="mt-14">
        <h2 id="tape-guides-heading" className="text-2xl font-semibold tracking-tight">
          Guides
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-label-secondary)]">
          Plain-language help for each tool. Each guide is Markdown. The reading view formats
          tables, footnotes, strikethrough, task lists, and automatic links. Download saves the file.
          The editor changes this browser only.
        </p>
        <nav aria-label="Guides" className="mt-4">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {TAPELAB_TOOLS.map((tool) => (
              <li key={tool.id}>
                <a
                  href={`#guide-${tool.id}`}
                  className="font-medium text-[var(--color-tint)] underline rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
                >
                  {tool.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-10 space-y-12">
          {TAPELAB_TOOLS.map((tool) => {
            const id = tool.id as TapeGuideId;
            return (
              <TapeGuide
                key={id}
                id={id}
                title={tool.title}
                href={tool.href}
                markdown={readTapeGuide(id)}
                downloadHref={`/tapelabs/guides/${id}`}
                downloadName={TAPE_GUIDE_FILES[id].filename}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
