import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { VisitCreateView } from "./visit-create-view";

export const metadata: Metadata = {
  title: "Tambah Kunjungan",
};

export default function NewVisitPage() {
  return (
    <AppShell permission="visit:create">
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <VisitCreateView />
      </Suspense>
    </AppShell>
  );
}