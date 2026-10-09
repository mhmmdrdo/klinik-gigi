import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PatientCreateView } from "./patient-create-view";

export const metadata: Metadata = {
  title: "Tambah Pasien",
};

export default function NewPatientPage() {
  return (
    <AppShell permission="patient:create">
      <PatientCreateView />
    </AppShell>
  );
}