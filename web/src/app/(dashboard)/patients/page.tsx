import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PatientsView } from "./patients-view";

export const metadata: Metadata = {
  title: "Data Pasien",
};

export default function PatientsPage() {
  return (
    <AppShell permission="patient:read">
      <PatientsView />
    </AppShell>
  );
}