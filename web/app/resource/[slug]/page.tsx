import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl, sessionCookieHeader } from "@/lib/api";
import { siteUrl } from "@/lib/catalog";
import Markdown from "@/components/Markdown";

export const dynamic = "force-dynamic";

type ResourceDetail = {
  slug: string;
  title: string;
  description_md: string | null;
  type: string;
  category_slug: string | null;
  emoji: string | null;
  version: number;
  kind: string;
  url: string | null;
  free: boolean;
  download_path: string;
  changelog_md: string | null;
  courses?: { slug: string; title: string; free_preview: boolean }[];
};

async function fetchResource(slug: string): Promise<ResourceDetail | null> {
  try {
    const cookie = await sessionCookieHeader();
    const res = await fetch(
      apiUrl(`/api/resources/${encodeURIComponent(slug)}`),
      {
        cache: "no-store",
        headers: cookie ? { cookie } : {},
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as ResourceDetail;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await fetchResource(slug);
  if (!r) return { title: "Resource" };
  return {
    title: r.title,
    description: (r.description_md || r.title).slice(0, 300),
    alternates: { canonical: siteUrl(`/resource/${r.slug}`) },
  };
}

export default async function ResourceDetailPage({ params }: Props) {
  const { slug } = await params;
  const r = await fetchResource(slug);
  if (!r) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/resource" className="hover:underline">
          Resources
        </Link>
        <span className="mx-2">›</span>
        <span>{r.title}</span>
      </nav>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {r.emoji ? `${r.emoji} ` : ""}
        {r.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        {r.type}
        {r.category_slug ? ` · ${r.category_slug}` : ""} · v{r.version}
        {r.free ? " · free preview" : ""}
      </p>
      {r.description_md && (
        <div className="prose prose-zinc mt-6 dark:prose-invert">
          <Markdown>{r.description_md}</Markdown>
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {r.kind === "link" && r.url ? (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Open link
          </a>
        ) : (
          <a
            href={r.download_path}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Download
          </a>
        )}
        <Link href="/resource" className="chip">
          Back to library
        </Link>
      </div>
    </main>
  );
}
