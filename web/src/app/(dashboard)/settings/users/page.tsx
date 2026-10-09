import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { UsersView } from "./users-view";

export const metadata: Metadata = {
  title: "Pengguna",
};

export default function UsersPage() {
  return (
    <AppShell permission="user:manage">
      <UsersView />
    </AppShell>
  );
}