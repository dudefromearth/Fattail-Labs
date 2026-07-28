"use client";

// Wiki article body renderer — Wiki Interface Spec §3.
// Wraps the site markdown approach (components/Markdown.tsx): same sanitize
// schema and prose classes, plus [[wikilink]] preprocessing. Links that point
// at unresolved slugs render as muted, non-navigable spans.

import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";

/** Default schema + GFM table elements (mirrors components/Markdown.tsx). */
const markdownSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
  ],
  attributes: {
    ...defaultSchema.attributes,
    th: [...(defaultSchema.attributes?.th ?? []), ["align"], ["colSpan"], ["rowSpan"]],
    td: [...(defaultSchema.attributes?.td ?? []), ["align"], ["colSpan"], ["rowSpan"]],
    table: [...(defaultSchema.attributes?.table ?? [])],
  },
};

// Prose classes mirror components/Markdown.tsx, minus the [&_a] rule —
// anchors are styled by the custom renderer below (wiki tokens, not emerald).
const PROSE =
  "space-y-4 leading-relaxed " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-500 " +
  "[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm dark:[&_code]:bg-zinc-800 " +
  "[&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold " +
  "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-xl " +
  "[&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 " +
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm " +
  "[&_thead]:border-b [&_thead]:border-zinc-300 dark:[&_thead]:border-zinc-600 " +
  "[&_th]:bg-zinc-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold " +
  "dark:[&_th]:bg-zinc-900/60 " +
  "[&_td]:border-t [&_td]:border-zinc-200 [&_td]:px-3 [&_td]:py-2 " +
  "dark:[&_td]:border-zinc-700 " +
  "[&_tr:nth-child(even)_td]:bg-zinc-50/50 dark:[&_tr:nth-child(even)_td]:bg-zinc-900/30";

const WIKI_HREF = /^\/app\/wiki\/([^/?#]+)$/;

/** [[slug]] and [[slug|label]] → [label](/app/wiki/slug). */
export function preprocessWikilinks(md: string): string {
  return md.replace(
    /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g,
    (_m, slug: string, label?: string) => {
      const s = slug.trim();
      const text = (label ?? s).trim();
      return `[${text}](/app/wiki/${encodeURIComponent(s)})`;
    },
  );
}

function WikiAnchor({
  href,
  children,
  unresolved,
}: {
  href?: string;
  children?: ReactNode;
  unresolved: Set<string>;
}) {
  const h = href ?? "";
  const m = h.match(WIKI_HREF);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    if (unresolved.has(slug)) {
      return (
        <span
          className="cursor-default text-[var(--color-label-tertiary)]"
          title="Not published yet"
        >
          {children}
        </span>
      );
    }
    return (
      <Link href={h} className="text-[var(--color-tint)] underline hover:no-underline">
        {children}
      </Link>
    );
  }
  return (
    <a href={h} className="text-[var(--color-tint)] underline hover:no-underline">
      {children}
    </a>
  );
}

export default function WikiMarkdown({
  children,
  unresolvedSlugs = [],
}: {
  children: string;
  unresolvedSlugs?: string[];
}) {
  const unresolved = new Set(unresolvedSlugs);
  return (
    <div className={`overflow-x-auto ${PROSE}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSchema]]}
        components={{
          a: ({ href, children: kids }) => (
            <WikiAnchor href={href} unresolved={unresolved}>
              {kids}
            </WikiAnchor>
          ),
        }}
      >
        {preprocessWikilinks(children)}
      </ReactMarkdown>
    </div>
  );
}
