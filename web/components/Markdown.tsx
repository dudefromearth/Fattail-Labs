// Site-wide markdown renderer (In-Place Admin spec v1.1 §4).
// Sanitized — admin-authored markdown must never become an XSS surface.
// This is THE renderer: public pages, editor previews, everything.

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-4 leading-relaxed [&_a]:text-emerald-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-500 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm dark:[&_code]:bg-zinc-800 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-xl [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
  );
}
