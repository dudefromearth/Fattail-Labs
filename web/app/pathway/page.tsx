import type { Metadata } from "next";
import Pathway from "@/components/Pathway";

export const metadata: Metadata = {
  title: "Your Pathway",
};

export default function PathwayPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Your Pathway</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Two minutes of questions, one ordered path through the doctrine — starting
        where every trader must: stopping the bleeding.
      </p>
      <div className="mt-8">
        <Pathway />
      </div>
    </main>
  );
}
