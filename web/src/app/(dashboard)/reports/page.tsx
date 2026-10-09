import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ReportsView } from "./reports-view";

export const metadata: Metadata = {
  title: "Laporan",
};

export default function ReportsPage() {
  return (
    <AppShell permission="report:read">
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ReportsView />
      </Suspense>
    </AppShell>
  );
}