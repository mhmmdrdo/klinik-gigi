"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { cn } from "cn";
import { hasPermission, type Permission } from "@/lib/domain";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_SHORT_LABEL } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  /** Path prefix that marks this group as active. Defaults to href. */
  match?: string;
  icon: LucideIcon;
  permission?: Permission;
  children?: { label: string; href: string; permission?: Permission }[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Pasien",
    href: "/patients",
    icon: Users,
    permission: "patient:read",
    children: [
      { label: "Semua Pasien", href: "/patients" },
      { label: "Tambah Pasien", href: "/patients/new", permission: "patient:create" },
    ],
  },
  {
    label: "Kunjungan",
    href: "/visits",
    icon: Stethoscope,
    permission: "visit:read",
    children: [
      { label: "Semua Kunjungan", href: "/visits" },
      { label: "Tambah Kunjungan", href: "/visits/new", permission: "visit:create" },
    ],
  },
  { label: "Reservasi", href: "/appointments", icon: CalendarCheck },
  {
    label: "Perawatan",
    href: "/treatments",
    icon: ReceiptText,
    permission: "treatment:manage",
    children: [
      { label: "Daftar Tindakan", href: "/treatments" },
      { label: "Kategori Tindakan", href: "/treatments/categories" },
    ],
  },
  { label: "Pembayaran", href: "/payments", icon: CreditCard, permission: "payment:read" },
  {
    label: "Laporan",
    href: "/reports",
    icon: BarChart3,
    permission: "report:read",
    children: [
      { label: "Laporan Pendapatan", href: "/reports?tab=revenue" },
      { label: "Laporan Kunjungan", href: "/reports?tab=visits" },
      { label: "Laporan Perawatan", href: "/reports?tab=treatments" },
    ],
  },
  {
    label: "Pengaturan",
    href: "/settings/clinic",
    match: "/settings",
    icon: Settings,
    permission: "settings:manage",
    children: [
      { label: "Profil Klinik", href: "/settings/clinic" },
      { label: "Pengguna", href: "/settings/users", permission: "user:manage" },
      { label: "Tindakan & Harga", href: "/treatments", permission: "treatment:manage" },
    ],
  },
];

function isPathActive(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role, logout } = useAuth();

  const visible = NAV_ITEMS.filter(
    (item) => !item.permission || (role ? hasPermission(role, item.permission) : false),
  );

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {visible.map((item) => {
        const isActive = isPathActive(pathname, item.match ?? item.href);
        const Icon = item.icon;
        const children = (item.children ?? []).filter(
          (child) => !child.permission || (role ? hasPermission(role, child.permission) : false),
        );

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
            {isActive && children.length > 0 ? (
              <div className="mt-1 mb-1 ml-4 space-y-0.5 border-l pl-3">
                {children.map((child) => {
                  const childPath = child.href.split("?")[0];
                  const childActive = pathname === childPath;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-md px-2 py-1.5 text-xs transition-colors",
                        childActive
                          ? "font-medium text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="mt-auto border-t pt-3">
        {role ? (
          <p className="px-2.5 pb-2 text-[11px] text-muted-foreground">
            Masuk sebagai {ROLE_SHORT_LABEL[role]}
          </p>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}