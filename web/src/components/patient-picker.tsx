"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonLink } from "@/components/button-link";
import { SearchInput } from "@/components/search-input";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateShort } from "@/lib/format";
import { patientService } from "@/lib/services";
import type { Patient } from "@/types";

export function PatientSelectedCard({
  patient,
  onChange,
  onSelect,
  disabled,
}: {
  patient: Patient | null;
  /** Dipanggil saat "Ganti" ditekan (opsional, mis. untuk mengosongkan pilihan). */
  onChange?: () => void;
  onSelect: (patient: Patient) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        {patient ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{patient.fullName}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-xs">{patient.medicalRecordNumber}</span>
                {" · "}
                {patient.phone}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                onChange?.();
                setOpen(true);
              }}
            >
              Ganti
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-6 text-left transition-colors",
              "hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50",
            )}
          >
            <span className="text-sm text-muted-foreground">
              Pilih pasien untuk memulai kunjungan
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <PatientSearchDialog open={open} onOpenChange={setOpen} onSelect={onSelect} />
    </>
  );
}

function PatientSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (patient: Patient) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // Kosongkan pencarian setiap kali dialog dibuka ulang.
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const query = useQuery({
    queryKey: ["patient-picker", debouncedSearch],
    queryFn: () =>
      patientService.list({
        search: debouncedSearch,
        status: "active",
        page: 1,
        pageSize: 8,
      }),
    enabled: open,
  });

  const rows = query.data?.rows ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pilih Pasien</DialogTitle>
          <DialogDescription>
            Cari berdasarkan nama, nomor HP, atau nomor pasien.
          </DialogDescription>
        </DialogHeader>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama / nomor HP / nomor pasien..."
          autoFocus
        />

        <div className="max-h-80 overflow-y-auto rounded-lg border">
          {query.isPending ? (
            <LoadingState label="Mencari pasien..." className="py-8" />
          ) : query.isError ? (
            <ErrorState onRetry={() => query.refetch()} className="py-8" />
          ) : rows.length === 0 ? (
            <EmptyState
              title={debouncedSearch ? "Pasien tidak ditemukan" : "Belum ada pasien"}
              description={
                debouncedSearch
                  ? "Coba kata kunci lain, atau daftarkan pasien baru."
                  : "Daftarkan pasien terlebih dahulu."
              }
              action={
                <ButtonLink href="/patients/new" size="sm" variant="outline">
                  <UserPlus />
                  Tambah Pasien
                </ButtonLink>
              }
              className="py-8"
            />
          ) : (
            <ul className="divide-y">
              {rows.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(patient);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{patient.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{patient.medicalRecordNumber}</span>
                        {" · "}
                        {patient.phone}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {patient.lastVisitDate
                        ? `Terakhir ${formatDateShort(patient.lastVisitDate)}`
                        : "Belum pernah berkunjung"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}