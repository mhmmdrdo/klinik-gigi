"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Stethoscope } from "lucide-react";
import { cn } from "cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/sidebar-nav";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_SHORT_LABEL } from "@/lib/constants";
import { patientInitials } from "@/lib/domain";

function ClinicMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <Stethoscope className="size-5" />
    </span>
  );
}

export function AppSidebar() {
  const { user, clinic } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <div className="flex items-center gap-2.5 border-b px-4 py-4">
        <ClinicMark />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{clinic?.name ?? "Klinik Gigi"}</p>
          <p className="truncate text-xs text-muted-foreground">Manajemen Klinik</p>
        </div>
      </div>
      <SidebarNav />
      {user ? (
        <div className="flex items-center gap-2.5 border-t p-3">
          <Avatar size="sm">
            <AvatarFallback>{patientInitials({ fullName: user.fullName })}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {ROLE_SHORT_LABEL[user.role]}
            </p>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

export function MobileSidebar() {
  const { user, clinic } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon" className="lg:hidden" aria-label="Buka menu">
            <Menu />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2.5">
            <ClinicMark />
            <span className="truncate">{clinic?.name ?? "Klinik Gigi"}</span>
          </SheetTitle>
        </SheetHeader>
        <SidebarNav
          onNavigate={() => setOpen(false)}
        />
        <div className="border-t p-3">
          <div className="flex items-center gap-2.5">
            <Avatar size="sm">
              <AvatarFallback>
                {user ? patientInitials({ fullName: user.fullName }) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user ? ROLE_SHORT_LABEL[user.role] : ""}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-destructive"
            onClick={() => {
              setOpen(false);
              logout();
              router.push("/login");
            }}
          >
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}