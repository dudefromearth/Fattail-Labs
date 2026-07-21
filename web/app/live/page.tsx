import type { Metadata } from "next";
import LiveSessions from "@/components/LiveSessions";

export const metadata: Metadata = {
  title: "Live Sessions",
};

export default function LivePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Live Sessions</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        The live trading room and weekly workshops — trade and build alongside the
        FatTail team. Replays land in the course library.
      </p>
      <div className="mt-8">
        <LiveSessions />
      </div>
    </main>
  );
}
