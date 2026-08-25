/**
 * IKI Lab suite — Information · Knowledge · Intelligence.
 * Inner nav: Factory · Runner · About · Catalog
 * Factory and Runner are administrator-only (server-enforced).
 */

export type IkiSuiteId = "factory" | "runner" | "about" | "catalog";

export type IkiSuiteAccess = "administrator" | "everyone";

export type IkiSuiteItem = {
  id: IkiSuiteId;
  label: string;
  href: string;
  blurb: string;
  access: IkiSuiteAccess;
  /** False = tab visible to entitled viewers but not a link (host 404). */
  available: boolean;
};

export const IKI_SUITE: IkiSuiteItem[] = [
  {
    id: "factory",
    label: "Factory",
    href: "/app/iki/factory",
    blurb: "Where Knowledge/Intelligence apps are produced.",
    access: "administrator",
    available: true,
  },
  {
    id: "runner",
    label: "Runner",
    href: "/app/iki/runner",
    blurb: "Factory testbed.",
    access: "administrator",
    available: true,
  },
  {
    id: "about",
    label: "About",
    href: "/app/iki/about",
    blurb: "",
    access: "everyone",
    available: true,
  },
  {
    id: "catalog",
    label: "Catalog",
    href: "/app/iki/catalog",
    blurb: "",
    access: "everyone",
    available: true,
  },
];

/** Coach owes public banner copy. Empty on purpose — not a draft, not a claim. */
export const IKI_ABOUT_BANNER_COPY = "";
export const IKI_CATALOG_BANNER_COPY = "";

export function ikiSuiteItem(id: IkiSuiteId): IkiSuiteItem {
  const item = IKI_SUITE.find((a) => a.id === id);
  if (!item) throw new Error(`Unknown IKI suite app: ${id}`);
  return item;
}

export function ikiSuiteNavItems(isAdmin: boolean): IkiSuiteItem[] {
  return IKI_SUITE.filter((item) =>
    item.access === "everyone" ? true : isAdmin,
  );
}
