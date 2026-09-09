"use client";

/**
 * GSC4 — /resource/sessions. CSR member route. sessionView is SoR.
 * Static imports only. No fetch after identity. No storage writes.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ClosuresList from "@/components/resources/sessions/ClosuresList";
import SessionControls from "@/components/resources/sessions/SessionControls";
import SessionMap from "@/components/resources/sessions/SessionMap";
import StatusBanner from "@/components/resources/sessions/StatusBanner";
import { ResourcesSubNav } from "@/components/resources/ResourcesHub";
import { etMinutesNow } from "@/lib/sessions/segments";
import {
  nextOccupyingDay,
  occupiesAxis,
  sessionWindow,
  tradingDayInProgress,
} from "@/lib/sessions/sessionView";
import { formatEtClock } from "@/lib/sessions/timeAxis";
import { fetchMe } from "@/lib/useIsAdmin";

type Gate = "loading" | "anon" | "member";
type Scale = "focus" | "fit";

export default function SessionsPage() {
  const [gate, setGate] = useState<Gate>("loading");
  const [now, setNow] = useState(() => new Date());
  const [isoDate, setIsoDate] = useState(() =>
    tradingDayInProgress(new Date()),
  );
  const [scale, setScale] = useState<Scale>("focus");
  const [rearm, setRearm] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchMe().then((me) => {
      if (!cancelled) setGate(me ? "member" : "anon");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 20_000);
    return () => window.clearInterval(id);
  }, []);

  const win = useMemo(
    () => sessionWindow(isoDate, { now }),
    [isoDate, now],
  );
  const view = win.days[win.anchorIndex] ?? win.days[0];

  function goDate(next: string) {
    setIsoDate(occupiesAxis(next) ? next : nextOccupyingDay(next));
    setRearm((n) => n + 1);
  }

  const showSessions = gate === "member";

  return (
    <main className="mx-auto w-full max-w-5xl overflow-x-hidden px-6 py-10">
      <ResourcesSubNav active="sessions" showSessions={showSessions} />
      <h1 className="mt-8 text-2xl font-semibold text-[var(--color-label)]">
        Sessions
      </h1>
      {gate === "loading" ? (
        <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">
          Loading…
        </p>
      ) : null}
      {gate === "anon" ? (
        <p className="mt-8 text-sm" data-testid="sessions-anon-gate">
          <Link href="/login" className="font-medium text-[var(--color-tint)]">
            Sign in
          </Link>{" "}
          to use Sessions.
        </p>
      ) : null}
      {gate === "member" ? (
        <>
          <SessionControls
            isoDate={isoDate}
            scale={scale}
            onDate={goDate}
            onToday={() => goDate(tradingDayInProgress(new Date()))}
            onScale={(s) => {
              setScale(s);
              setRearm((n) => n + 1);
            }}
          />
          <StatusBanner view={view} clock={formatEtClock(etMinutesNow(now))} />
          <SessionMap
            window={win}
            scale={scale}
            now={now}
            rearmKey={`${isoDate}:${scale}:${rearm}`}
          />
          <ClosuresList view={view} />
          <section
            className="mt-8 space-y-2 text-xs text-[var(--color-label-tertiary)]"
            data-testid="sessions-disclosures"
          >
            <p>
              Daylight saving is taken from each exchange&apos;s own time zone,
              so the four regional calendars resolve even in the weeks they
              disagree.
            </p>
            <p>
              Toronto is shown on the Canadian calendar and is not adjusted
              here. Canadian holidays (including Thanksgiving) are a known
              omission — the TSX bar can read open when Toronto is actually
              closed.
            </p>
            <p>
              Foreign closures (Lunar New Year, Golden Week, UK bank holidays,
              and others) are not on this page. They can hollow out the
              overnight session even when New York is open.
            </p>
            <p>
              The axis skips 5:00–6:00 PM ET: CME Globex maintenance.
            </p>
            <p>
              Morning, Afternoon, and Closing are a FatTail teaching frame on
              the US cash session. They are not exchange hours. Nothing at the
              venue changes at 12:30 or 2:30 PM.
            </p>
          </section>
        </>
      ) : null}
    </main>
  );
}
