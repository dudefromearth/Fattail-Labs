"use client";

// Journal — calendar-first Practice suite app (T-D3 Calendar variant).

import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import JournalCalendar from "@/components/journal/JournalCalendar";

export default function JournalPage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome active="journal" hideTitle>
        <JournalCalendar />
      </PracticeSuiteChrome>
    </main>
  );
}
