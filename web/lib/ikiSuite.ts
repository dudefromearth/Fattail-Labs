/**
 * IKI Lab suite — Information · Knowledge · Intelligence.
 * Apps card: IKI Lab. Inner nav: Wiki · IKI Factory
 * (Practice / Options Lab segmented-control grammar).
 */

export type IkiSuiteId = "wiki" | "factory" | "runner";

export type IkiSuiteItem = {
  id: IkiSuiteId;
  label: string;
  href: string;
  blurb: string;
  status: "live" | "soon";
};

export const IKI_SUITE: IkiSuiteItem[] = [
  {
    id: "wiki",
    label: "Wiki",
    href: "/app/wiki",
    blurb: "The compiled map of what we teach — search, articles, graph.",
    status: "live",
  },
  {
    id: "factory",
    label: "IKI Factory",
    href: "/app/iki/factory",
    blurb: "Where Knowledge/Intelligence templates are produced.",
    status: "live",
  },
  {
    id: "runner",
    label: "Runner",
    href: "/app/iki/runner",
    blurb: "IKI template runner — same Runner as Options Lab. Render sink only.",
    status: "live",
  },
];

export function ikiSuiteItem(id: IkiSuiteId): IkiSuiteItem {
  const item = IKI_SUITE.find((a) => a.id === id);
  if (!item) throw new Error(`Unknown IKI suite app: ${id}`);
  return item;
}
