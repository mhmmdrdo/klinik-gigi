import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { AppointmentsView } from "./appointments-view";

export const metadata: Metadata = {
  title: "Reservasi",
};

export default function AppointmentsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <AppointmentsView />
      </Suspense>
    </AppShell>
  );
}