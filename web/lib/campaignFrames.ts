/**
 * Optional starting frames for Practice Campaign create (Concept Spec §4.3b / §4.4).
 * Pure copy scaffolds into goals_md — never schema, never required.
 */

export type CampaignFrame = {
  id: string;
  label: string;
  /** Prefills goals_md when selected; member may edit freely. */
  goalsScaffold: string;
};

export const CAMPAIGN_FRAMES: CampaignFrame[] = [
  {
    id: "learning",
    label: "Learning a new playbook",
    goalsScaffold: [
      "## North Star",
      "Practice one setup cleanly until process is boring.",
      "",
      "## Scope",
      "- Symbols / structures in bounds:",
      "- Out of bounds (skip):",
      "",
      "## Capital mandate",
      "Size so a full stop is tuition, not crisis.",
      "",
      "## Timeframe",
      "Campaign ends when: (e.g. N clean trials or calendar date)",
      "",
      "Daily pulse: Hypothesis → Experiment → Reflection (Journal + Trade Log).",
    ].join("\n"),
  },
  {
    id: "discipline",
    label: "Proving discipline",
    goalsScaffold: [
      "## North Star",
      "Zero-variance days over outcome hunting — follow the plan written before the open.",
      "",
      "## Scope",
      "- Rules I will not break:",
      "- Max decisions per session:",
      "",
      "## Capital mandate",
      "Fixed risk unit; no size renegotiation mid-trade.",
      "",
      "## Timeframe",
      "Timeframe / length:",
      "",
      "Daily pulse: Hypothesis → Experiment → Reflection.",
    ].join("\n"),
  },
  {
    id: "capital",
    label: "Capital campaign",
    goalsScaffold: [
      "## North Star",
      "Operate this book under an explicit capital contract (process outcomes only).",
      "",
      "## Scope",
      "- What this capital is for:",
      "- What it is not for:",
      "",
      "## Capital mandate",
      "- Starting capital (book):",
      "- Max risk per trial / per day:",
      "- Drawdown pause rule:",
      "",
      "## Timeframe",
      "Shelf life / review date:",
      "",
      "Daily pulse under the charter. Weekly pivot: variance · thesis · cost basis.",
    ].join("\n"),
  },
  {
    id: "transition",
    label: "Fresh start / transition",
    goalsScaffold: [
      "## North Star",
      "Close the last chapter cleanly; install the next routine without drama.",
      "",
      "## Scope",
      "- What I am leaving behind:",
      "- What I am installing:",
      "",
      "## Capital mandate",
      "Reduced size until routine is stable.",
      "",
      "## Timeframe",
      "Transition window:",
      "",
      "Daily pulse: Hypothesis → Experiment → Reflection.",
    ].join("\n"),
  },
  {
    id: "strategic",
    label: "Strategic market campaign",
    goalsScaffold: [
      "## North Star",
      "One thesis, one risk contract, process-faithful execution.",
      "",
      "## Scope",
      "- Thesis / zone:",
      "- Catalyst / invalidation:",
      "- Structures allowed:",
      "",
      "## Capital mandate",
      "- Risk budget for the operation:",
      "- Scale-in / scale-out rules:",
      "",
      "## Timeframe",
      "Horizon / event boundary:",
      "",
      "Optional 5-stage blueprint lives under this charter (playbook), not instead of the day.",
      "Daily pulse: Hypothesis → Experiment → Reflection. Adjustments only at weekly pivot.",
    ].join("\n"),
  },
];
