"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combobox";
import { CurrencyInput } from "@/components/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/states";
import { TOOTH_NUMBERS } from "@/lib/constants";
import { formatRupiah } from "@/lib/format";
import { lineSubtotal } from "@/lib/domain";
import type { Treatment } from "@/types";

export interface TreatmentLine {
  key: string;
  treatmentId: string;
  toothNumber: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

const NO_TOOTH = "__none__";

const TOOTH_ITEMS = [
  { value: NO_TOOTH, label: "-" },
  ...TOOTH_NUMBERS.map((tooth) => ({ value: tooth as string, label: tooth as string })),
];

let lineCounter = 0;
export function createLine(
  treatment?: Treatment,
  overrides: Partial<TreatmentLine> = {},
): TreatmentLine {
  lineCounter += 1;
  return {
    key: `line-${lineCounter}`,
    treatmentId: treatment?.id ?? "",
    toothNumber: "",
    quantity: 1,
    unitPrice: treatment?.defaultPrice ?? 0,
    notes: "",
    ...overrides,
  };
}

/**
 * Visit treatment editor (PRD 19/20). Unit price is captured per line so later
 * price changes never rewrite history (PRD 41).
 */
export function VisitTreatmentEditor({
  lines,
  onChange,
  treatments,
  error,
  readOnly,
}: {
  lines: TreatmentLine[];
  onChange: (lines: TreatmentLine[]) => void;
  treatments: Treatment[];
  error?: string;
  readOnly?: boolean;
}) {
  const [pickerValue, setPickerValue] = useState<string | null>(null);

  const options = useMemo(
    () =>
      treatments.map((treatment) => ({
        value: treatment.id,
        label: treatment.name,
        description: `${treatment.category} · ${formatRupiah(treatment.defaultPrice)}`,
      })),
    [treatments],
  );

  const selectedTreatment = treatments.find((t) => t.id === pickerValue);

  function updateLine(key: string, patch: Partial<TreatmentLine>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    onChange(lines.filter((line) => line.key !== key));
  }

  function addTreatment(treatment: Treatment) {
    onChange([...lines, createLine(treatment)]);
    setPickerValue(null);
  }

  if (readOnly) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-sm leading-none font-medium">Tindakan</label>
          <Combobox
            options={options}
            value={pickerValue}
            onChange={setPickerValue}
            placeholder="Pilih tindakan..."
            searchPlaceholder="Cari tindakan..."
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (selectedTreatment) addTreatment(selectedTreatment);
          }}
          disabled={!selectedTreatment}
        >
          <Plus />
          Tambah Tindakan
        </Button>
      </div>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {lines.length === 0 ? (
        <div className="rounded-xl border border-dashed">
          <EmptyState
            title="Belum ada tindakan"
            description="Pilih tindakan di atas untuk menambahkan biaya perawatan."
            className="py-8"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Tindakan</TableHead>
                <TableHead className="w-28">Nomor Gigi</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-40">Harga</TableHead>
                <TableHead className="w-40 text-right">Subtotal</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => {
                const treatment = treatments.find((t) => t.id === line.treatmentId);
                return (
                  <TableRow key={line.key}>
                    <TableCell className="pl-4">
                      <p className="font-medium">{treatment?.name ?? "-"}</p>
                      {treatment ? (
                        <p className="text-xs text-muted-foreground">{treatment.category}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={line.toothNumber || NO_TOOTH}
                        items={TOOTH_ITEMS}
                        onValueChange={(value) =>
                          updateLine(line.key, {
                            toothNumber: !value || value === NO_TOOTH ? "" : (value as string),
                          })
                        }
                      >
                        <SelectTrigger size="sm" className="w-full" aria-label="Nomor gigi">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {TOOTH_ITEMS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(line.key, {
                            quantity: Math.max(1, Number.parseInt(event.target.value, 10) || 1),
                          })
                        }
                        className="h-7 tabular-nums"
                        aria-label="Jumlah"
                      />
                    </TableCell>
                    <TableCell>
                      <CurrencyInput
                        value={line.unitPrice}
                        onChange={(value) => updateLine(line.key, { unitPrice: value })}
                        className="h-7"
                        ariaLabel="Harga satuan"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatRupiah(lineSubtotal(line.quantity, line.unitPrice))}
                    </TableCell>
                    <TableCell className="pr-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeLine(line.key)}
                        aria-label={`Hapus ${treatment?.name ?? "tindakan"}`}
                        className={cn("text-destructive hover:bg-destructive/10")}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}