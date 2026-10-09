import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { TreatmentsView } from "./treatments-view";

export const metadata: Metadata = {
  title: "Daftar Tindakan",
};

export default function TreatmentsPage() {
  return (
    <AppShell permission="treatment:manage">
      <TreatmentsView />
    </AppShell>
  );
}