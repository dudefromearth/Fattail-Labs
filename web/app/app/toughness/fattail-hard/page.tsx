"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PhysiologyCite from "@/components/hard/PhysiologyCite";
import ToughnessShell from "@/components/hard/ToughnessShell";
import { FatTailEnrollPanel } from "@/components/hard/ToughnessHub";
import { fetchHard, type HardSnapshot } from "@/lib/hardApi";

export default function FatTailHardPage() {
  const [data, setData] = useState<HardSnapshot | null>(null);

  useEffect(() => {
    fetchHard().then(setData);
  }, []);

  const phys = data?.physiology;

  return (
    <ToughnessShell crumb="FatTail Hard" active="fattail-hard">
      <header className="mt-6">
        <h1 className="text-2xl font-semibold text-[var(--color-label)]">
          FatTail Hard
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--color-label-secondary)]">
          These programs develop Mental Toughness. Complete every required
          activity every day for the full length. Fail any activity and you
          start from day one. Hard, effective, voluntary.
        </p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--color-label-secondary)]">
          <strong className="text-[var(--color-label)]">The path:</strong> after
          20 you might give up — or choose 40. Some people complete 20 twice
          before 40 feels possible. At 40 most people hit a major period of
          despair; if you get through it, you can make it to the end.
        </p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--color-label-secondary)]">
          <strong className="text-[var(--color-label)]">
            Life will still happen:
          </strong>{" "}
          vacations, weddings, holidays. No drinking and no diet cheating will
          reorder your priorities. Those days test resolve — the rules do not
          pause.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        {phys ? (
          <PhysiologyCite
            citation={phys.primary.citation}
            doi={phys.primary.doi}
            note={phys.note}
          />
        ) : null}

        <section>
          <h2 className="text-base font-semibold text-[var(--color-label)]">
            Choose a program
          </h2>
          <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
            Ladder: 20 → 40 → 75. Pick the rung you are ready for. Enroll only
            if you choose to. Exit anytime — Mental Toughness returns to empty.
          </p>
          <FatTailEnrollPanel />
        </section>

        <p className="text-sm text-[var(--color-label-secondary)]">
          <Link href="/app/toughness" className="hover:underline">
            ← Toughness hub
          </Link>
        </p>
      </div>
    </ToughnessShell>
  );
}
