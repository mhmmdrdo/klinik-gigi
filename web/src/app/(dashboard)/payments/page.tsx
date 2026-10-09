import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PaymentsView } from "./payments-view";

export const metadata: Metadata = {
  title: "Pembayaran",
};

export default function PaymentsPage() {
  return (
    <AppShell permission="payment:read">
      <PaymentsView />
    </AppShell>
  );
}