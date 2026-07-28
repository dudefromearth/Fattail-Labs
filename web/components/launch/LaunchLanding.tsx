"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LaunchCountdown from "./LaunchCountdown";

export default function LaunchLanding({
  launchAtIso,
  launchLabel,
}: {
  launchAtIso: string;
  /** Human-readable launch window for copy, e.g. "this weekend". */
  launchLabel: string;
}) {
  const router = useRouter();
  const target = new Date(launchAtIso).getTime();

  // When the countdown hits zero, go to the live hub.
  useEffect(() => {
    const check = () => {
      if (Date.now() >= target) {
        router.replace("/hub");
        router.refresh();
      }
    };
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, [target, router]);

  const when = new Date(launchAtIso);
  const whenText = when.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <main className="relative flex min-h-[calc(100vh-var(--header-height-lg))] flex-col overflow-hidden">
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-zinc-950 to-zinc-950"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(16,185,129,0.25), transparent 40%), radial-gradient(circle at 80% 20%, rgba(45,212,191,0.15), transparent 35%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Link href="/" className="mb-8 inline-flex" aria-label="FatTail Labs">
          <Image
            src="/brand/fattail-labs-logo.jpg"
            alt="FatTail Labs"
            width={72}
            height={72}
            className="rounded-2xl shadow-lg ring-1 ring-white/10"
            priority
          />
        </Link>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          FatTail Labs
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Launching {launchLabel}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          Membership education for convex options trading — capital preservation
          first. Courses, live sessions, resources, and practice apps. Built for
          the month-end Navigator campaign and everyone ready to{" "}
          <span className="text-emerald-300">stop the bleeding</span>.
        </p>

        <div className="mt-10 w-full">
          <LaunchCountdown launchAtIso={launchAtIso} />
          <p className="mt-4 text-sm text-zinc-400">Opens {whenText}</p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/membership"
            className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-emerald-600"
          >
            Membership
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-white/25 bg-white/5 px-6 py-2.5 text-sm font-medium text-white backdrop-blur transition-colors hover:border-white/50 hover:bg-white/10"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="rounded-full px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Log in
          </Link>
        </div>

        <p className="mt-12 max-w-md text-xs leading-relaxed text-zinc-500">
          Navigator annuals and the Labs library open together. Until then, the
          public course hub is staged at{" "}
          <Link href="/hub" className="text-emerald-500/90 hover:underline">
            /hub
          </Link>{" "}
          for the team.
        </p>
      </div>
    </main>
  );
}
