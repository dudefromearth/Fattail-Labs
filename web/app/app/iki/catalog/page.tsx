"use client";

import IkiComingBanner from "@/components/iki/IkiComingBanner";
import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import { IKI_CATALOG_BANNER_COPY } from "@/lib/ikiSuite";

/** Nav slot + banner only. Catalog contents wait on Woo API. */
export default function IkiCatalogPage() {
  return (
    <IkiSuiteChrome active="catalog">
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-label)]">
          Catalog
        </h1>
        <div className="mt-6">
          <IkiComingBanner
            copy={IKI_CATALOG_BANNER_COPY}
            testId="iki-catalog-banner"
          />
        </div>
      </main>
    </IkiSuiteChrome>
  );
}
