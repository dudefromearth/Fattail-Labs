/**
 * Structure prefills from the OPF-held chain only.
 *
 * There is no separate strike universe: every leg strike must be a listed
 * strike on the dual-side ladder for that expiration. Arithmetic
 * (center ± width) is only an *intent*; placement is always on the grid.
 */

import {
  normalizeStrike,
  snapToListed,
  listedWidthPoints,
  listedWingChoices,
} from "@/lib/options-lab/listedStrikes";
import type { LegInput, OptionRight } from "@/lib/options-lab/positionTypes";

export type StructureTemplate =
  | "single"
  | "vertical"
  | "butterfly"
  | "bwb"
  | "condor"
  | "straddle"
  | "strangle"
  | "iron_fly"
  | "iron_condor"
  | "calendar"
  | "diagonal";

function idxOf(listed: readonly number[], strike: number): number {
  const t = normalizeStrike(strike);
  return listed.findIndex((s) => normalizeStrike(s) === t);
}

/** Wing steps (index distance) for a desired point width on the listed grid. */
function wingStepsForWidth(
  listed: readonly number[],
  centerIdx: number,
  widthPts: number,
): number {
  if (centerIdx < 0 || centerIdx >= listed.length) return 1;
  const c = listed[centerIdx];
  const target = c + Math.max(0, widthPts);
  const wing = snapToListed(target, listed);
  if (wing == null) return 1;
  const wIdx = idxOf(listed, wing);
  if (wIdx < 0) return 1;
  return Math.max(1, Math.abs(wIdx - centerIdx));
}

function need(
  listed: readonly number[],
  indices: number[],
): number[] | null {
  for (const i of indices) {
    if (i < 0 || i >= listed.length) return null;
  }
  return indices.map((i) => listed[i]);
}

/**
 * Build template legs using only strikes present on `listed`.
 * Returns null when the chain cannot place the structure (too few strikes).
 */
export function buildListedStructure(opts: {
  template: StructureTemplate;
  listed: readonly number[];
  preferCenter: number;
  preferWidth: number;
  optionSide: OptionRight;
}): { body: number; width: number; legs: LegInput[] } | null {
  const listed = [...opts.listed]
    .map((s) => normalizeStrike(s))
    .filter((s) => Number.isFinite(s) && s > 0)
    .sort((a, b) => a - b);
  if (!listed.length) return null;

  const body =
    snapToListed(opts.preferCenter, listed) ??
    listed[Math.floor(listed.length / 2)];
  let centerIdx = idxOf(listed, body);
  if (centerIdx < 0) centerIdx = Math.floor(listed.length / 2);

  const side = opts.optionSide;
  let steps = wingStepsForWidth(listed, centerIdx, opts.preferWidth);

  const trySteps = (): LegInput[] | null => {
    for (let s = steps; s >= 1; s--) {
      const built = buildAtSteps(opts.template, listed, centerIdx, s, side);
      if (built) {
        steps = s;
        return built;
      }
    }
    return null;
  };

  let legs = trySteps();
  if (!legs) {
    if (
      opts.template === "single" ||
      opts.template === "straddle" ||
      opts.template === "calendar"
    ) {
      legs = buildAtSteps(opts.template, listed, centerIdx, 1, side);
    }
  }
  if (!legs) return null;

  const c = listed[centerIdx];
  let widthPts = 0;
  if (steps > 0 && centerIdx + steps < listed.length) {
    widthPts = normalizeStrike(listed[centerIdx + steps] - c);
  } else if (steps > 0 && centerIdx - steps >= 0) {
    widthPts = normalizeStrike(c - listed[centerIdx - steps]);
  }

  return { body: c, width: widthPts, legs };
}

function buildAtSteps(
  template: StructureTemplate,
  listed: readonly number[],
  centerIdx: number,
  steps: number,
  side: OptionRight,
): LegInput[] | null {
  const c = listed[centerIdx];

  switch (template) {
    case "single":
      return [
        {
          strike: c,
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    case "vertical": {
      const hi = centerIdx + Math.max(1, steps);
      const strikes = need(listed, [centerIdx, hi]);
      if (!strikes) return null;
      return [
        {
          strike: strikes[0],
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
        {
          strike: strikes[1],
          type: side,
          quantity: 1,
          side: "short",
          entry_price: 0,
        },
      ];
    }
    case "butterfly": {
      const strikes = need(listed, [
        centerIdx - steps,
        centerIdx,
        centerIdx + steps,
      ]);
      if (!strikes) return null;
      return [
        {
          strike: strikes[0],
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
        {
          strike: strikes[1],
          type: side,
          quantity: 2,
          side: "short",
          entry_price: 0,
        },
        {
          strike: strikes[2],
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    }
    case "bwb": {
      const strikes = need(listed, [
        centerIdx - steps,
        centerIdx,
        centerIdx + steps * 2,
      ]);
      if (!strikes) return null;
      return [
        {
          strike: strikes[0],
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
        {
          strike: strikes[1],
          type: side,
          quantity: 2,
          side: "short",
          entry_price: 0,
        },
        {
          strike: strikes[2],
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    }
    case "condor": {
      const strikes = need(listed, [
        centerIdx - steps * 2,
        centerIdx - steps,
        centerIdx + steps,
        centerIdx + steps * 2,
      ]);
      if (!strikes) return null;
      return [
        {
          strike: strikes[0],
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
        {
          strike: strikes[1],
          type: side,
          quantity: 1,
          side: "short",
          entry_price: 0,
        },
        {
          strike: strikes[2],
          type: side,
          quantity: 1,
          side: "short",
          entry_price: 0,
        },
        {
          strike: strikes[3],
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    }
    case "straddle":
      return [
        {
          strike: c,
          type: "call",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
        {
          strike: c,
          type: "put",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    case "strangle": {
      const strikes = need(listed, [centerIdx - steps, centerIdx + steps]);
      if (!strikes) return null;
      return [
        {
          strike: strikes[0],
          type: "put",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
        {
          strike: strikes[1],
          type: "call",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    }
    case "iron_fly": {
      const strikes = need(listed, [
        centerIdx - steps,
        centerIdx,
        centerIdx + steps,
      ]);
      if (!strikes) return null;
      return [
        {
          strike: strikes[0],
          type: "put",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
        {
          strike: strikes[1],
          type: "put",
          quantity: 1,
          side: "short",
          entry_price: 0,
        },
        {
          strike: strikes[1],
          type: "call",
          quantity: 1,
          side: "short",
          entry_price: 0,
        },
        {
          strike: strikes[2],
          type: "call",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    }
    case "iron_condor": {
      const strikes = need(listed, [
        centerIdx - steps * 2,
        centerIdx - steps,
        centerIdx + steps,
        centerIdx + steps * 2,
      ]);
      if (!strikes) return null;
      return [
        {
          strike: strikes[0],
          type: "put",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
        {
          strike: strikes[1],
          type: "put",
          quantity: 1,
          side: "short",
          entry_price: 0,
        },
        {
          strike: strikes[2],
          type: "call",
          quantity: 1,
          side: "short",
          entry_price: 0,
        },
        {
          strike: strikes[3],
          type: "call",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    }
    case "calendar":
      return [
        {
          strike: c,
          type: side,
          quantity: 1,
          side: "short",
          entry_price: 0,
        },
        {
          strike: c,
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    case "diagonal": {
      const strikes = need(listed, [
        centerIdx,
        centerIdx + Math.max(1, steps),
      ]);
      if (!strikes) return null;
      return [
        {
          strike: strikes[0],
          type: side,
          quantity: 1,
          side: "short",
          entry_price: 0,
        },
        {
          strike: strikes[1],
          type: side,
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ];
    }
    default:
      return null;
  }
}

/** Snap every leg onto listed; returns null if any leg cannot land. */
export function snapLegsToListed(
  legs: readonly LegInput[],
  listed: readonly number[],
): LegInput[] | null {
  if (!listed.length) return null;
  const out: LegInput[] = [];
  for (const leg of legs) {
    const s = snapToListed(leg.strike, listed);
    if (s == null) return null;
    out.push({ ...leg, strike: s });
  }
  return out;
}

export function preferListedWidth(
  center: number,
  listed: readonly number[],
  prefer: number,
): number {
  if (!listed.length) return prefer;
  const w = listedWidthPoints(center, prefer, listed);
  if (w > 0) return w;
  const choices = listedWingChoices(center, listed, 20);
  if (!choices.length) return prefer;
  return (
    choices.find((c) => c >= prefer) ??
    choices[choices.length - 1] ??
    prefer
  );
}
