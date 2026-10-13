// Site-wide markdown renderer (In-Place Admin spec v1.1 §4).
// Sanitized — admin-authored markdown must never become an XSS surface.
// This is THE renderer: public pages, editor previews, everything.
// GFM (remark-gfm): pipe tables, strikethrough, task lists, autolinks.

import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";

/** Default schema + GFM table elements (otherwise rehype-sanitize strips them). */
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
    // GFM alignment on table cells
    th: [...(defaultSchema.attributes?.th ?? []), ["align"], ["colSpan"], ["rowSpan"]],
    td: [...(defaultSchema.attributes?.td ?? []), ["align"], ["colSpan"], ["rowSpan"]],
    table: [...(defaultSchema.attributes?.table ?? [])],
  },
};

const PROSE =
  "space-y-4 leading-relaxed " +
  "[&_a]:text-emerald-600 [&_a]:underline " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-500 " +
  "[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm dark:[&_code]:bg-zinc-800 " +
  "[&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold " +
  "[&_h4]:text-base [&_h4]:font-semibold [&_h5]:text-base [&_h5]:font-medium " +
  "[&_li.task-list-item]:list-none [&_li.task-list-item_input]:mr-2 " +
  "[&_section.footnotes]:mt-6 [&_section.footnotes]:border-t [&_section.footnotes]:border-zinc-200 [&_section.footnotes]:pt-3 [&_section.footnotes]:text-sm " +
  "dark:[&_section.footnotes]:border-zinc-700 " +
  "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-xl " +
  "[&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 " +
  // GFM tables — scroll on small screens; clear header/cell chrome
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm " +
  "[&_thead]:border-b [&_thead]:border-zinc-300 dark:[&_thead]:border-zinc-600 " +
  "[&_th]:bg-zinc-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold " +
  "dark:[&_th]:bg-zinc-900/60 " +
  "[&_td]:border-t [&_td]:border-zinc-200 [&_td]:px-3 [&_td]:py-2 " +
  "dark:[&_td]:border-zinc-700 " +
  "[&_tr:nth-child(even)_td]:bg-zinc-50/50 dark:[&_tr:nth-child(even)_td]:bg-zinc-900/30";

const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

function shiftedHeadings(offset: number, titleId?: string): Components | undefined {
  if (!offset && !titleId) return undefined;
  function make(level: 1 | 2 | 3 | 4 | 5 | 6) {
    const Tag = HEADING_TAGS[Math.min(6, Math.max(1, level + offset)) - 1];
    return function Heading({
      children,
      className,
      id,
    }: {
      children?: ReactNode;
      className?: string;
      id?: string;
    }) {
      if (level === 1 && titleId) {
        return (
          <Tag
            id={titleId}
            className={["!text-xl !font-semibold tracking-tight", className].filter(Boolean).join(" ")}
          >
            {children}
          </Tag>
        );
      }
      return (
        <Tag id={id} className={className}>
          {children}
        </Tag>
      );
    };
  }
  return { h1: make(1), h2: make(2), h3: make(3), h4: make(4), h5: make(5), h6: make(6) };
}

export default function Markdown({
  children,
  headingOffset = 0,
  titleId,
}: {
  children: string;
  /** Move headings down this many levels so a guide sits under the page title. 0 keeps Markdown levels. */
  headingOffset?: number;
  /** Set on the document's first heading, after headingOffset is applied. */
  titleId?: string;
}) {
  return (
    <div className={`overflow-x-auto ${PROSE}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSchema]]}
        components={shiftedHeadings(headingOffset, titleId)}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
