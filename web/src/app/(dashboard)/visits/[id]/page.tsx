import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { VisitDetailView } from "./visit-detail-view";

export const metadata: Metadata = {
  title: "Detail Kunjungan",
};

export default async function VisitDetailPage(props: PageProps<"/visits/[id]">) {
  const { id } = await props.params;
  return (
    <AppShell permission="visit:read">
      <VisitDetailView visitId={id} />
    </AppShell>
  );
}