"use client";

/**
 * Full Toughness program guide — long-form rules, ladder, physiology.
 * Hub keeps only status + programs + video teaser so returners are not buried.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import HowItWorks from "@/components/hard/HowItWorks";
import PhysiologyCite from "@/components/hard/PhysiologyCite";
import ToughnessShell from "@/components/hard/ToughnessShell";
import { fetchHard, type HardSnapshot } from "@/lib/hardApi";
import type { SitePage } from "@/lib/sitePage";

export default function ToughnessAboutPage() {
  const [data, setData] = useState<HardSnapshot | null | "err">(null);
  const [cmsVideo, setCmsVideo] = useState<{
    id: string | null;
    title: string | null;
  }>({ id: null, title: null });

  useEffect(() => {
    fetch("/api/site-pages/toughness", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p: SitePage | null) => {
        if (p) {
          setCmsVideo({
            id: p.intro_video_id,
            title: p.intro_video_title,
          });
        }
      })
      .catch(() => {});
    fetchHard()
      .then((d) => setData(d ?? "err"))
      .catch(() => setData("err"));
  }, []);

  if (data === null) {
    return (
      <ToughnessShell crumb="How it works">
        <p className="mt-8 text-sm text-[var(--color-label-secondary)]">
          Loading…
        </p>
      </ToughnessShell>
    );
  }
  if (data === "err") {
    return (
      <ToughnessShell crumb="How it works">
        <p className="mt-8 text-sm text-[var(--color-destructive)]">
          Could not load the guide. Try again later.
        </p>
        <Link
          href="/app/toughness"
          className="mt-4 inline-block text-sm text-[var(--color-tint)] hover:underline"
        >
          ← Back to Toughness
        </Link>
      </ToughnessShell>
    );
  }

  const hiw = data.how_it_works;
  const block = hiw
    ? {
        ...hiw,
        intro_video_id: cmsVideo.id || hiw.intro_video_id || null,
        intro_video_title: cmsVideo.title || hiw.intro_video_title || null,
      }
    : null;
  const phys = data.physiology;

  return (
    <ToughnessShell crumb="How it works">
      <header className="mt-6 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-label)]">
          How Toughness programs work
        </h1>
        <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
          Full rules, the 20 → 40 → 75 ladder, and the physiology behind the
          training. Prefer the video when you have one.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <HowItWorks block={block} />
        <PhysiologyCite
          citation={phys.primary.citation}
          doi={phys.primary.doi}
          note={phys.note}
        />
        <p className="text-center text-sm text-[var(--color-label-secondary)]">
          <Link href="/app/toughness" className="hover:underline">
            ← Back to Toughness
          </Link>
          {" · "}
          <Link href="/app/toughness/today" className="hover:underline">
            Today&apos;s log
          </Link>
        </p>
      </div>
    </ToughnessShell>
  );
}
