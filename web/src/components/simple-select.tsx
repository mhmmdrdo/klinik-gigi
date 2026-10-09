"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SimpleSelectOption {
  value: string;
  label: string;
}

/**
 * Thin wrapper around Base UI Select. Passing `items` is required so the
 * trigger renders the label instead of the raw value.
 */
export function SimpleSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  ariaLabel,
  size = "default",
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SimpleSelectOption[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  size?: "sm" | "default";
  disabled?: boolean;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(next) => onChange((next as string | null) ?? "")}
      items={options}
      disabled={disabled}
    >
      <SelectTrigger size={size} className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}