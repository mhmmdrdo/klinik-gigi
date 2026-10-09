"use client";

import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { formatRupiah, parseRupiah } from "@/lib/format";

/** Rupiah input: accepts digits, displays grouped formatting, emits a number. */
export function CurrencyInput({
  value,
  onChange,
  id,
  className,
  placeholder = "Rp 0",
  disabled,
  ariaLabel,
  invalid,
}: {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  invalid?: boolean;
}) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      className={cn("tabular-nums", className)}
      placeholder={placeholder}
      value={value === 0 ? "" : formatRupiah(value)}
      onChange={(event) => onChange(parseRupiah(event.target.value))}
      onFocus={(event) => event.target.select()}
    />
  );
}