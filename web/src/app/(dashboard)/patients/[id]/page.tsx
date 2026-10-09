import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PatientDetailView } from "./patient-detail-view";

export const metadata: Metadata = {
  title: "Detail Pasien",
};

export default async function PatientDetailPage(props: PageProps<"/patients/[id]">) {
  const { id } = await props.params;
  return (
    <AppShell permission="patient:read">
      <PatientDetailView patientId={id} />
    </AppShell>
  );
}