"use client";

import { useEffect, useState } from "react";
import HeatmapChainPanel from "@/components/options-lab/HeatmapChainPanel";
import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import { ikiAccessFromMe } from "@/lib/ikiAccess";
import { OptionsLabProvider } from "@/lib/optionsLabContext";
import { fetchMe } from "@/lib/useIsAdmin";

const IKI_LAB_PRODUCT = { id: "iki-lab", label: "IKI Lab" } as const;

/** IKI Your Lab — owned products (first: IKI Lab) + Heatmap. */
export default function IkiYourLabPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [productId, setProductId] = useState(IKI_LAB_PRODUCT.id);

  useEffect(() => {
    fetchMe().then((me) => setAllowed(ikiAccessFromMe(me).hasIkiLab));
  }, []);

  return (
    <IkiSuiteChrome active="your-lab" workspace={!!allowed}>
      {allowed === null ? (
        <main className="px-6 py-10 text-sm text-[var(--color-label-tertiary)]">
          Loading…
        </main>
      ) : allowed ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="flex shrink-0 items-center gap-2 border-b border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2"
            data-testid="iki-your-lab-product-bar"
          >
            <label className="text-xs font-medium text-[var(--color-label-secondary)]">
              Product
              <select
                className="ml-2 rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-label)]"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                data-testid="iki-your-lab-product"
                aria-label="IKI product"
              >
                <option value={IKI_LAB_PRODUCT.id}>{IKI_LAB_PRODUCT.label}</option>
              </select>
            </label>
          </div>
          <div className="min-h-0 flex-1">
            <OptionsLabProvider>
              <HeatmapChainPanel />
            </OptionsLabProvider>
          </div>
        </div>
      ) : (
        <main className="px-6 py-10" data-testid="iki-your-lab-forbidden" />
      )}
    </IkiSuiteChrome>
  );
}
