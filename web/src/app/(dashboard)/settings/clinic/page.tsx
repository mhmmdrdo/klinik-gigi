import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ClinicSettingsView } from "./clinic-settings-view";

export const metadata: Metadata = {
  title: "Profil Klinik",
};

export default function ClinicSettingsPage() {
  return (
    <AppShell permission="settings:manage">
      <ClinicSettingsView />
    </AppShell>
  );
}