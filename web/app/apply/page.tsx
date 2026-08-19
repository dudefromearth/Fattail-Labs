import type { Metadata } from "next";
import ApplyPageShell from "@/components/ApplyPageShell";
import "./apply.css";

export const metadata: Metadata = {
  title: "Apply",
  description: "Apply so the desk can book. One question at a time.",
};

export default function ApplyPage() {
  return <ApplyPageShell />;
}
