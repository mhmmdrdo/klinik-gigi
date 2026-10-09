import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CategoriesView } from "./categories-view";

export const metadata: Metadata = {
  title: "Kategori Tindakan",
};

export default function TreatmentCategoriesPage() {
  return (
    <AppShell permission="treatment:manage">
      <CategoriesView />
    </AppShell>
  );
}