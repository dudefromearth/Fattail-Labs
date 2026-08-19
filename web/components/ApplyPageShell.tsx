"use client";

import ApplyForm from "@/components/ApplyForm";
import ApplySlotsEditBar from "@/components/edit/ApplySlotsEditBar";
import { ApplySlotsEditProvider } from "@/components/edit/ApplySlotsEditContext";

export default function ApplyPageShell() {
  return (
    <ApplySlotsEditProvider>
      <ApplySlotsEditBar />
      <main>
        <ApplyForm />
      </main>
    </ApplySlotsEditProvider>
  );
}
