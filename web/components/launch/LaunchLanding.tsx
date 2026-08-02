"use client";

// Public feature-gate surface: hide until ready + anticipation countdown + waitlist.

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import type { FeatureGatePublic } from "@/lib/featureGates";
import GateVideo from "./GateVideo";
import LaunchCountdown from "./LaunchCountdown";

export default function LaunchLanding({ gate }: { gate: FeatureGatePublic }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "saving" | "ok" | "err"
  >("idle");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const targetMs = gate.opens_at
    ? new Date(
        gate.opens_at.includes("T")
          ? gate.opens_at
          : gate.opens_at.replace(" ", "T") +
            (gate.opens_at.endsWith("Z") ? "" : "Z"),
      ).getTime()
    : null;

  // When countdown hits zero, go to the reveal path.
  useEffect(() => {
    if (targetMs == null) return;
    const check = () => {
      if (Date.now() >= targetMs) {
        router.replace(gate.reveal_path || "/hub");
        router.refresh();
      }
    };
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, [targetMs, gate.reveal_path, router]);

  const whenText =
    targetMs != null
      ? new Date(targetMs).toLocaleString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        })
      : null;

  async function onWaitlist(e: FormEvent) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!v) return;
    setEmailStatus("saving");
    setEmailMsg(null);
    try {
      const r = await fetch(
        `/api/feature-gates/${encodeURIComponent(gate.surface_key)}/waitlist`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: v, source: "gate" }),
        },
      );
      if (!r.ok) {
        const t = await r.text();
        setEmailStatus("err");
        setEmailMsg(t || `Could not save (${r.status})`);
        return;
      }
      setEmailStatus("ok");
      setEmailMsg("You're on the list — we'll notify you when it opens.");
      setEmail("");
    } catch (err) {
      setEmailStatus("err");
      setEmailMsg(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950">
      {/* Atmosphere only — solid zinc-950 base so body canvas never bleeds through */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/50 via-zinc-950 to-zinc-950"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(16,185,129,0.22), transparent 40%), radial-gradient(circle at 80% 20%, rgba(45,212,191,0.12), transparent 35%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        {/*
          Contrast panel: dark surface + border so type, countdown, and CTAs
          read clearly against the soft atmospheric backdrop.
        */}
        <div
          data-testid="launch-panel"
          className="w-full rounded-3xl border border-white/10 bg-zinc-900/95 px-6 py-10 text-center shadow-2xl shadow-black/50 ring-1 ring-black/40 backdrop-blur-md sm:px-10 sm:py-12"
        >
          <Link href="/" className="mb-8 inline-flex" aria-label="FatTail Labs">
            <Image
              src="/brand/fattail-labs-logo.jpg"
              alt="FatTail Labs"
              width={72}
              height={72}
              className="rounded-2xl shadow-lg ring-1 ring-white/15"
              priority
            />
          </Link>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            FatTail Labs
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {gate.headline || "Coming soon"}
          </h1>
          {gate.body_md ? (
            <div className="mt-4 max-w-xl mx-auto text-base leading-relaxed text-zinc-300 sm:text-lg [&_a]:text-emerald-400 [&_p]:my-2 [&_strong]:text-emerald-300 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 text-left sm:text-center">
              <Markdown>{gate.body_md}</Markdown>
            </div>
          ) : null}

          {gate.video_url ? (
            <GateVideo url={gate.video_url} title={gate.headline || "Intro"} />
          ) : null}

          {targetMs != null && (
            <div className="mt-10 w-full">
              <LaunchCountdown launchAtIso={new Date(targetMs).toISOString()} />
              {whenText && (
                <p className="mt-4 text-sm text-zinc-400">Opens {whenText}</p>
              )}
            </div>
          )}

          {gate.collect_email && (
            <form
              onSubmit={onWaitlist}
              className="mx-auto mt-10 w-full max-w-md space-y-3 text-left"
            >
              <label
                htmlFor="gate-email"
                className="block text-center text-sm font-medium text-zinc-200"
              >
                {gate.email_prompt || "Get notified when we open"}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="gate-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 rounded-full border border-white/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none ring-emerald-400/50 placeholder:text-zinc-500 focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={emailStatus === "saving"}
                  className="shrink-0 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {emailStatus === "saving" ? "Saving…" : "Notify me"}
                </button>
              </div>
              {emailMsg && (
                <p
                  className={`text-center text-xs ${
                    emailStatus === "ok" ? "text-emerald-300" : "text-red-300"
                  }`}
                  role="status"
                >
                  {emailMsg}
                </p>
              )}
            </form>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {gate.cta_primary_label && gate.cta_primary_href && (
              <Link
                href={gate.cta_primary_href}
                className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-600"
              >
                {gate.cta_primary_label}
              </Link>
            )}
            {gate.cta_secondary_label && gate.cta_secondary_href && (
              <Link
                href={gate.cta_secondary_href}
                className="rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/15"
              >
                {gate.cta_secondary_label}
              </Link>
            )}
            <Link
              href="/login"
              className="rounded-full px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              Log in
            </Link>
          </div>

          {gate.footer_note && (
            <p className="mx-auto mt-10 max-w-md text-xs leading-relaxed text-zinc-500">
              {gate.footer_note}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
