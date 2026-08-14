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
    label: "Did I do it?",
    seed: "Did I do what I said?\nYes / partial / no:\nWhat got in the way:\n",
  },
  {
    id: "clean-trial",
    phase: "reflection",
    label: "What got in the way?",
    seed: "What got in the way:\nWhat still worked:\n",
  },
  {
    id: "bias",
    phase: "reflection",
    label: "One thing this week",
    seed: "One thing to bring to the retrospective:\n",
  },
];
