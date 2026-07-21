import type { Metadata } from "next";
import ResourceLibrary from "@/components/ResourceLibrary";

export const metadata: Metadata = {
  title: "Resources",
};

export default function ResourcesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Resources</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Worksheets, templates, and tools from every course — the Trade Lab
        library.
      </p>
      <div className="mt-8">
        <ResourceLibrary />
      </div>
    </main>
  );
}
