// Minimal renderer for the course-copy subset of markdown: paragraphs and "- " lists.
// A full markdown library arrives only if course copy ever needs more than this.

import type { ReactNode } from "react";

export function renderCopy(md: string): ReactNode[] {
  const blocks = md.split(/\n\n+/);
  return blocks.map((block, i) => {
    const lines = block.split("\n");
    if (lines.every((l) => l.startsWith("- "))) {
      return (
        <ul key={i} className="list-disc pl-6 space-y-1">
          {lines.map((l, j) => (
            <li key={j}>{l.slice(2)}</li>
          ))}
        </ul>
      );
    }
    return <p key={i}>{block}</p>;
  });
}
