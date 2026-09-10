"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXCHANGES } from "@/lib/sessions/exchanges";
import {
  etMinutesNow,
  todayEtIso,
} from "@/lib/sessions/segments";
import {
  tradingDayInProgress,
  type SessionWindow,
} from "@/lib/sessions/sessionView";
import {
  DAY_MINUTES,
  formatEtClock,
  noonUtc,
  segmentOnWindowAxis,
  toWindowAxis,
  zoneOffset,
} from "@/lib/sessions/timeAxis";

const GUTTER = 232;
const FOCUS_PX = 85;
const GROUPS = ["Americas", "Futures", "Europe", "Asia-Pacific"] as const;

const REGION: Record<(typeof GROUPS)[number], string> = {
  Americas: "var(--color-session-americas, var(--color-tint))",
  Futures: "var(--color-session-futures, #c2410c)",
  Europe: "var(--color-session-europe, #2563eb)",
  "Asia-Pacific": "var(--color-session-apac, #7c3aed)",
};

const HATCH =
  "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-session-closed, var(--color-label-tertiary)) 40%, transparent) 0 1px, var(--color-fill) 1px 7px)";

function hoursOnDay(
  dayIndex: number,
  isoDate: string,
): Array<{ h: number; x: number; label: boolean; dayStart: boolean }> {
  const when = noonUtc(isoDate);
  const et = zoneOffset("America/New_York", when);
  const out: Array<{ h: number; x: number; label: boolean; dayStart: boolean }> =
    [];
  for (let step = 0; step <= 23; step++) {
    const h = (18 + step) % 24;
    const x = toWindowAxis(dayIndex, h * 60, et, et);
    const isTerminal = h === 17;
    out.push({
      h,
      x,
      label: h % 2 === 0 || isTerminal,
      dayStart: h === 18,
    });
    if (isTerminal) break;
  }
  return out;
}

function nowAxisMinutes(win: SessionWindow, now: Date): number {
  const td = tradingDayInProgress(now);
  const min = etMinutesNow(now);
  const idx = win.isoDates.indexOf(td);
  if (idx < 0) {
    return win.days[win.anchorIndex]?.axisOrigin ?? 0;
  }
  const when = noonUtc(td);
  const et = zoneOffset("America/New_York", when);
  const cal = todayEtIso(now);
  if (min >= 18 * 60) return toWindowAxis(idx, min, et, et);
  if (min >= 17 * 60) return (idx + 1) * DAY_MINUTES;
  if (cal !== td) return idx * DAY_MINUTES;
  return toWindowAxis(idx, min, et, et);
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function SessionMap({
  window: win,
  scale,
  now,
  rearmKey,
}: {
  window: SessionWindow;
  scale: "focus" | "fit";
  now: Date;
  rearmKey: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [fitWidth, setFitWidth] = useState(800);
  const [panned, setPanned] = useState(false);
  const markPan = useCallback(() => setPanned(true), []);

  useEffect(() => {
    setPanned(false);
  }, [rearmKey, scale]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setFitWidth(Math.max(320, el.clientWidth));
    });
    ro.observe(el);
    setFitWidth(Math.max(320, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const hourPx =
    scale === "focus" ? FOCUS_PX : Math.max(18, (fitWidth - GUTTER) / 23);
  const axisW = hourPx * 23 * win.count;
  const span = win.span || 1;
  const ticks = useMemo(
    () => win.days.flatMap((d) => hoursOnDay(d.dayIndex, d.isoDate)),
    [win],
  );

  const nowMin = etMinutesNow(now);
  const nowAxis = nowAxisMinutes(win, now);
  const nowX = (nowAxis / span) * 100;
  const intra = ((nowAxis % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const badgeLeft = intra / DAY_MINUTES > 0.8;

  useEffect(() => {
    if (panned) return;
    const el = scrollerRef.current;
    if (!el) return;
    const xPx = (nowAxis / span) * axisW;
    el.scrollLeft = Math.max(0, xPx - (el.clientWidth - GUTTER) / 2);
  }, [panned, nowAxis, axisW, span, fitWidth, scale]);

  const paintOf = (id: string) => {
    const anchor = win.days[win.anchorIndex] ?? win.days[0];
    return anchor?.rows.find((r) => r.id === id)?.paint;
  };

  return (
    <div
      className="surface-card mt-4 overflow-x-hidden py-2"
      data-testid="sessions-map"
      data-days={win.count}
      data-span={span}
    >
      <div
        ref={scrollerRef}
        className="overflow-x-auto overflow-y-hidden motion-reduce:scroll-auto"
        data-testid="sessions-scroller"
        onPointerDown={markPan}
        onWheel={markPan}
        onKeyDown={markPan}
      >
        <div
          className="relative"
          style={{ width: GUTTER + axisW, minWidth: "100%" }}
          data-testid="sessions-axis"
          data-axis-width={axisW}
        >
          <div className="relative flex" style={{ height: 44 }}>
            <div
              className="sticky left-0 z-20 shrink-0 bg-[var(--color-surface)]"
              style={{ width: GUTTER }}
            />
            <div className="relative" style={{ width: axisW, height: 44 }}>
              {ticks.map((t) => (
                <div
                  key={`g-${t.x}`}
                  className="absolute top-0 h-full w-px bg-[var(--color-separator)]"
                  style={{ left: `${(t.x / span) * 100}%` }}
                />
              ))}
              {ticks
                .filter((t) => t.label)
                .map((t) => (
                  <span
                    key={`l-${t.x}`}
                    className="absolute top-1 -translate-x-1/2 text-[11px] font-medium tabular-nums text-[var(--color-label-secondary)]"
                    style={{ left: `${(t.x / span) * 100}%` }}
                    data-tick={t.h === 17 ? "17" : undefined}
                  >
                    {t.dayStart
                      ? shortDate(
                          win.days.find((d) => d.dayIndex * DAY_MINUTES === t.x)
                            ?.isoDate ?? "",
                        )
                      : formatEtClock(t.h * 60).replace(":00 ", " ")}
                  </span>
                ))}
              {win.seams.map((s) => (
                <div
                  key={`seam-${s.afterIndex}`}
                  className="absolute top-0 h-full w-0.5 bg-[var(--color-label)]/40"
                  style={{
                    left: `${(((s.afterIndex + 1) * DAY_MINUTES) / span) * 100}%`,
                  }}
                  data-testid={`sessions-seam-${s.kind}-${s.afterIndex}`}
                  title={s.kind === "weekend" ? "Weekend" : "CME closed"}
                />
              ))}
            </div>
          </div>

          <div className="relative flex" data-testid="sessions-ribbon">
            <div
              className="sticky left-0 z-20 shrink-0 bg-[var(--color-surface)] px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--color-label-tertiary)]"
              style={{ width: GUTTER }}
            >
              Frame
            </div>
            <div className="relative" style={{ width: axisW, height: 28 }}>
              {win.days.map((day) =>
                day.segments.map((s) => (
                  <div
                    key={`${day.isoDate}-${s.id}`}
                    className="absolute top-0.5 flex h-6 min-w-[3.5rem] items-center justify-center overflow-visible rounded-sm bg-[var(--color-fill)] px-1 text-[11px] font-medium text-[var(--color-label)]"
                    style={{
                      left: `${(s.axisStart / span) * 100}%`,
                      width: `${((s.axisEnd - s.axisStart) / span) * 100}%`,
                    }}
                    data-testid={`sessions-seg-${day.isoDate}-${s.id}`}
                    data-truncated={s.truncated ? "true" : "false"}
                  >
                    {s.label}
                    {s.truncated ? (
                      <span className="ml-1 lowercase text-[var(--color-label-tertiary)]">
                        truncated
                      </span>
                    ) : null}
                  </div>
                )),
              )}
            </div>
          </div>

          {GROUPS.map((g) => (
            <div key={g}>
              <div className="relative flex h-7">
                <div
                  className="sticky left-0 z-20 shrink-0 bg-[var(--color-surface)] px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]"
                  style={{ width: GUTTER }}
                >
                  {g}
                </div>
                <div style={{ width: axisW }} />
              </div>
              {EXCHANGES.filter((e) => e.group === g).map((row) => {
                const paint = paintOf(row.id);
                const warn = paint?.kind === "early";
                return (
                  <div
                    key={row.id}
                    className="relative flex h-11"
                    data-testid={`sessions-row-${row.id}`}
                  >
                    <div
                      className="sticky left-0 z-20 flex shrink-0 flex-col justify-center bg-[var(--color-surface)] px-2"
                      style={{ width: GUTTER }}
                      data-testid={`sessions-gutter-${row.id}`}
                    >
                      <span className="truncate text-xs font-medium text-[var(--color-label)]">
                        {row.name}
                      </span>
                      <span
                        className={[
                          "truncate text-[10px]",
                          warn
                            ? "text-[var(--color-session-early,var(--color-warning))]"
                            : "text-[var(--color-label-tertiary)]",
                        ].join(" ")}
                      >
                        {row.subLabel ? `${row.subLabel} · ` : ""}
                        {paint?.kind === "open" || paint?.kind === "early"
                          ? paint.etLabel
                          : paint?.label}
                      </span>
                    </div>
                    <div className="relative h-11" style={{ width: axisW }}>
                      {win.days.map((day) => {
                        const dp = day.rows.find((r) => r.id === row.id)?.paint;
                        const hatched =
                          dp?.kind === "closed" || dp?.kind === "modified";
                        const origin = day.axisOrigin;
                        return (
                          <div
                            key={day.isoDate}
                            data-testid={`sessions-day-${row.id}-${day.isoDate}`}
                          >
                            {day.bandEndEtMin != null ? (
                              (() => {
                                const { a, b } = segmentOnWindowAxis(
                                  day.dayIndex,
                                  day.isoDate,
                                  "America/New_York",
                                  9 * 60 + 30,
                                  day.bandEndEtMin,
                                );
                                return (
                                  <div
                                    className="absolute inset-y-0 bg-[var(--color-label)]/5"
                                    style={{
                                      left: `${(a / span) * 100}%`,
                                      width: `${((b - a) / span) * 100}%`,
                                    }}
                                    data-testid={
                                      row.id === "nyse"
                                        ? `sessions-rth-${day.isoDate}`
                                        : undefined
                                    }
                                  />
                                );
                              })()
                            ) : null}
                            {hatched ? (
                              <div
                                className="absolute inset-y-2 rounded-sm"
                                style={{
                                  left: `${(origin / span) * 100}%`,
                                  width: `${(DAY_MINUTES / span) * 100}%`,
                                  background: HATCH,
                                }}
                                data-testid={`sessions-hatch-${row.id}-${day.isoDate}`}
                              />
                            ) : (
                              row.segments.map((seg, i) => {
                                const { a, b } = segmentOnWindowAxis(
                                  day.dayIndex,
                                  day.isoDate,
                                  row.tz,
                                  seg.startMin,
                                  seg.endMin,
                                );
                                return (
                                  <div
                                    key={`${day.isoDate}-${i}`}
                                    className="absolute top-2 h-7 rounded-sm"
                                    style={{
                                      left: `${(a / span) * 100}%`,
                                      width: `${((b - a) / span) * 100}%`,
                                      background: REGION[row.group],
                                    }}
                                  />
                                );
                              })
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div
            className="pointer-events-none absolute top-0 bottom-0"
            style={{
              left: GUTTER + (nowX / 100) * axisW,
              width: 0,
            }}
            data-testid="sessions-now"
          >
            <div className="absolute top-0 bottom-0 w-px bg-[var(--color-session-now,var(--color-label))]" />
            <span
              className={[
                "absolute top-0 whitespace-nowrap rounded bg-[var(--color-label)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-surface)]",
                badgeLeft ? "-translate-x-full pr-2" : "translate-x-1",
              ].join(" ")}
              data-testid="sessions-now-badge"
              data-flip={badgeLeft ? "left" : "right"}
            >
              {formatEtClock(nowMin)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
