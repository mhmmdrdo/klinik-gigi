import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";
import { formatDateCompact, formatTime } from "@/lib/format";
import {
  APPOINTMENT_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  VISIT_STATUS_LABEL,
} from "@/lib/constants";
import type {
  AppointmentStatus,
  PaymentStatus,
  VisitStatus,
} from "@/types";
import { StatusBadge, type BadgeTone } from "@/components/badge-tone";

export const VISIT_STATUS_TONE: Record<VisitStatus, BadgeTone> = {
  waiting: "warning",
  in_progress: "info",
  completed: "success",
  cancelled: "neutral",
};

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "neutral",
  no_show: "danger",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  unpaid: "danger",
  partial: "warning",
  paid: "success",
};

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return <StatusBadge tone={VISIT_STATUS_TONE[status]} label={VISIT_STATUS_LABEL[status]} />;
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <StatusBadge tone={APPOINTMENT_STATUS_TONE[status]} label={APPOINTMENT_STATUS_LABEL[status]} />
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge tone={PAYMENT_STATUS_TONE[status]} label={PAYMENT_STATUS_LABEL[status]} />;
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <StatusBadge tone="success" label="Aktif" />
  ) : (
    <StatusBadge tone="neutral" label="Nonaktif" />
  );
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* FIX: min-w-0 agar judul panjang tidak mendorong tombol aksi keluar layar */}
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4.5" />
            </span>
          ) : null}
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-lg font-semibold tracking-tight break-words sm:text-xl">
              {title}
            </h1>
            {description ? (
              <div className="text-sm text-muted-foreground">{description}</div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function DateTimeCell({
  date,
  time,
  className,
}: {
  date: string | null | undefined;
  time?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("leading-tight", className)}>
      <p className="text-sm tabular-nums">{formatDateCompact(date)}</p>
      {time ? <p className="text-xs text-muted-foreground tabular-nums">{formatTime(time)}</p> : null}
    </div>
  );
}