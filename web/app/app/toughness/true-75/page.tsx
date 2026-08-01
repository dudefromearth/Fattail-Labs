"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PhysiologyCite from "@/components/hard/PhysiologyCite";
import ToughnessShell from "@/components/hard/ToughnessShell";
import { enrollHard, fetchHard, type HardSnapshot } from "@/lib/hardApi";

export default function True75Page() {
  const [data, setData] = useState<HardSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchHard().then(setData);
  }, []);

  const phys = data?.physiology;
  const true75 = data?.variants.find((v) => v.variant_id === "true_75_honor");

  async function linkHonor() {
    if (!true75) return;
    setBusy(true);
    setErr(null);
    const r = await enrollHard("true_75", "true_75_honor");
    setBusy(false);
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { detail?: string };
      setErr(j.detail || `Failed (${r.status})`);
      return;
    }
    window.location.href = "/app/toughness/today";
  }

  return (
    <ToughnessShell crumb="True 75 Hard" active="true-75">
      <header className="mt-6">
        <h1 className="text-2xl font-semibold text-[var(--color-label)]">
          True 75 Hard
        </h1>
        <p className="mt-2 text-[15px] text-[var(--color-label-secondary)]">
          The original free program by <strong>Andy Frisella</strong> — offered{" "}
          <strong>as-is</strong> with full credit. Labs does not replace
          Frisella&apos;s program; we offer an optional honor-system tracker so
          Mental Toughness can reflect your show-up.
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

        <section className="rounded-2xl border border-[var(--color-separator)] p-5">
          <h2 className="font-semibold text-[var(--color-label)]">
            Full credit
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
            True 75 Hard is Andy Frisella&apos;s program. Search for the
            official rules and community outside Labs. FatTail Labs claims no
            ownership of True 75 Hard.
          </p>
          {true75?.credit ? (
            <p className="mt-3 text-sm text-[var(--color-label)]">
              {true75.credit}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[var(--color-separator)] p-5">
          <h2 className="font-semibold text-[var(--color-label)]">
            Track in Labs (optional)
          </h2>
          <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
            Enroll the honor-system variant, then check off the classic daily
            tasks in Labs. Voluntary — never a membership gate.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={busy || !!data?.active_enrollment}
              onClick={() => void linkHonor()}
            >
              {data?.active_enrollment
                ? "Already enrolled in a challenge"
                : "Link True 75 (honor system)"}
            </Button>
            <Link href="/app/toughness">
              <Button type="button" variant="secondary">
                Back to hub
              </Button>
            </Link>
          </div>
          {err ? (
            <p className="mt-2 text-sm text-[var(--color-destructive)]">{err}</p>
          ) : null}
        </section>
      </div>
    </ToughnessShell>
  );
}
