"use client";

import IkiComingBanner from "@/components/iki/IkiComingBanner";
import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import IkiWikiPanel from "@/components/iki/IkiWikiPanel";
import { IKI_ABOUT_BANNER_COPY } from "@/lib/ikiSuite";

export default function IkiAboutPage() {
  return (
    <IkiSuiteChrome active="about">
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-label)]">
          About
        </h1>
        <div className="mt-6">
          <IkiComingBanner
            copy={IKI_ABOUT_BANNER_COPY}
            testId="iki-about-banner"
          />
        </div>
        <IkiWikiPanel />
      </main>
    </IkiSuiteChrome>
  );
}
