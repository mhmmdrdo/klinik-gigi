import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { VisitsView } from "./visits-view";

export const metadata: Metadata = {
  title: "Kunjungan",
};

export default function VisitsPage() {
  return (
    <AppShell permission="visit:read">
      <VisitsView />
    </AppShell>
  );
}