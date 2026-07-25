/**
 * User's Guide outline — hierarchical TOC for Help-style navigation (HIG).
 * Add sections here as the guide grows; chrome stays a compact sidebar/list.
 */

export type GuideSection = {
  id: string;
  label: string;
};

export type GuideGroup = {
  title: string;
  sections: GuideSection[];
};

export const GUIDE_GROUPS: GuideGroup[] = [
  {
    title: "Start here",
    sections: [{ id: "getting-started", label: "Getting started" }],
  },
  {
    title: "Learning",
    sections: [
      { id: "finding-courses", label: "Finding courses" },
      { id: "taking-a-course", label: "Taking a course" },
      { id: "quizzes", label: "Quizzes" },
      { id: "your-progress", label: "Your progress" },
    ],
  },
  {
    title: "Live & library",
    sections: [
      { id: "live-sessions", label: "Live sessions" },
      { id: "resources", label: "Resources" },
    ],
  },
  {
    title: "Account",
    sections: [
      { id: "membership", label: "Membership & the trial" },
      { id: "billing", label: "Billing" },
    ],
  },
];

export const GUIDE_SECTIONS: GuideSection[] = GUIDE_GROUPS.flatMap(
  (g) => g.sections,
);
