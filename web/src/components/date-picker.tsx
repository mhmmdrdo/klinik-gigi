"use client";

import { CalendarIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate, toDate, toDateInputValue } from "@/lib/format";
import type { Matcher } from "react-day-picker";

/**
 * react-day-picker's Matcher union rejects objects that mix optional keys, so
 * an interval needs both bounds. Fill the missing side with an extreme date.
 */
const MIN_DATE = new Date(1900, 0, 1);
const MAX_DATE = new Date(2100, 0, 1);

function rangeMatcher(min?: string, max?: string): Matcher | undefined {
  if (min && max) {
    return {
      after: toDate(min) ?? MIN_DATE,
      before: toDate(max) ?? MAX_DATE,
    };
  }
  if (min) return { after: toDate(min) ?? MIN_DATE };
  if (max) return { before: toDate(max) ?? MAX_DATE };
  return undefined;
}

/**
 * Date picker built on react-day-picker, backed by a native <input type="date">
 * so keyboard/mobile entry and form integration keep working.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled,
  id,
  className,
  max,
  min,
}: {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  max?: string;
  min?: string;
}) {
  const selected = toDate(value);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn("w-full justify-start font-normal", !value && "text-muted-foreground", className)}
          >
            <CalendarIcon />
            {selected ? formatDate(selected) : placeholder}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          defaultMonth={selected ?? undefined}
          onSelect={(date) => onChange(date ? toDateInputValue(date) : "")}
          autoFocus
          captionLayout="dropdown"
          disabled={rangeMatcher(min, max)}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateInput({
  value,
  onChange,
  id,
  className,
  disabled,
  ariaLabel,
  max,
  min,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  max?: string;
  min?: string;
}) {
  return (
    <Input
      id={id}
      type="date"
      value={value}
      max={max}
      min={min}
      onChange={(event) => onChange(event.target.value)}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  );
}

export function DateRangeFilter({
  from,
  to,
  onChange,
  className,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Input
        type="date"
        value={from}
        onChange={(event) => onChange({ from: event.target.value, to })}
        className="w-auto"
        aria-label="Tanggal mulai"
      />
      <span className="text-sm text-muted-foreground">s.d.</span>
      <Input
        type="date"
        value={to}
        onChange={(event) => onChange({ from, to: event.target.value })}
        className="w-auto"
        aria-label="Tanggal akhir"
      />
    </div>
  );
}