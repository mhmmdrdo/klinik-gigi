import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "warning";
  className?: string;
}) {
  const toneClasses = {
    default: "bg-muted text-muted-foreground",
    positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  } as const;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-muted-foreground" title={label}>
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              toneClasses[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p
          className="truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl"
          title={value}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={hint}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}