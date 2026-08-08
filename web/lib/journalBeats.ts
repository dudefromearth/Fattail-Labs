/**
 * Soft Journal beats for the daily scientific protocol (B4 / F5).
 * Prompts only — never hard gates. EOD records variance; never adjusts plan.
 */

export type JournalBeat = {
  id: string;
  phase: "hypothesis" | "reflection";
  label: string;
  /** Inserted into the freeform composer when tapped. */
  seed: string;
};

export const JOURNAL_HYPOTHESIS_BEATS: JournalBeat[] = [
  {
    id: "if-then",
    phase: "hypothesis",
    label: "IF / THEN",
    seed: "Hypothesis (IF / THEN):\nIF  →\nTHEN →\nInvalidation: \n",
  },
  {
    id: "state",
    phase: "hypothesis",
    label: "State check",
    seed: "State before the open:\nSleep / energy:\nFocus:\nWhat would contaminate the trial today:\n",
  },
  {
    id: "one-trial",
    phase: "hypothesis",
    label: "One clean trial",
    seed: "Today's experiment (one clean trial):\nWhat I'm testing:\nWhat counts as a clean run:\nSize / risk unit:\n",
  },
];

export const JOURNAL_REFLECTION_BEATS: JournalBeat[] = [
  {
    id: "variance",
    phase: "reflection",
    label: "Variance capture",
    seed: "Reflection — variance only (do not rewrite today's plan here):\nDid I run the trial as written? (yes / partial / no)\nWhere variance showed up:\nWhat data this day produced:\nWeekly pivot can adjust the charter; EOD only records.\n",
  },
  {
    id: "clean-trial",
    phase: "reflection",
    label: "Clean trial?",
    seed: "Clean trial check:\nFollowed plan: \nMoved stops / chased / resized: \nPnL is data, not the grade of the day.\n",
  },
  {
    id: "bias",
    phase: "reflection",
    label: "Bias note",
    seed: "Bias / process note:\nWhat I notice about myself (not the market):\nOne thing to bring to the weekly pivot:\n",
  },
];
