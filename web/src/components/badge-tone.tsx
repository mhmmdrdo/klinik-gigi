import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

const badgeToneClasses: Record<string, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  outline: "border border-border text-foreground",
};

export type BadgeTone = keyof typeof badgeToneClasses;

export function ToneBadge({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        badgeToneClasses[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function StatusBadge({
  tone = "neutral",
  label,
  icon: Icon,
  className,
}: {
  tone?: BadgeTone;
  label: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <ToneBadge tone={tone} className={className}>
      {Icon ? <Icon className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
      {label}
    </ToneBadge>
  );
}