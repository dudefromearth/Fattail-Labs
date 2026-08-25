"use client";

import WikiSearchWidget from "@/components/wiki/WikiSearchWidget";

/** Wiki search on About — under the banner, not a second face. */
export default function IkiWikiPanel() {
  return (
    <section className="mt-8" data-testid="iki-wiki-panel">
      <WikiSearchWidget inputId="iki-about-wiki-search" />
    </section>
  );
}
