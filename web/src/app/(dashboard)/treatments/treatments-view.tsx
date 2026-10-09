"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurrencyInput } from "@/components/currency-input";
import { FormField } from "@/components/form-field";
import { ActiveBadge, FilterBar, PageHeader } from "@/components/page-parts";
import { SearchInput } from "@/components/search-input";
import { SimpleSelect } from "@/components/simple-select";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { ApiError, treatmentService, type TreatmentFilters } from "@/lib/services";
import { treatmentSchema } from "@/lib/validators/schemas";
import { TREATMENT_CATEGORIES } from "@/lib/constants";
import { formatRupiah } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/auth-provider";
import type { Treatment } from "@/types";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

export function TreatmentsView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Treatment | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: ["treatments", debouncedSearch, status],
    queryFn: () =>
      treatmentService.list({
        search: debouncedSearch,
        status: status as TreatmentFilters["status"],
      }),
  });

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(TREATMENT_CATEGORIES);
    (query.data ?? []).forEach((t) => set.add(t.category));
    return [
      { value: "all", label: "Semua Kategori" },
      ...Array.from(set).map((c) => ({ value: c, label: c })),
    ];
  }, [query.data]);

  const rows = (query.data ?? []).filter((t) => category === "all" || t.category === category);

  async function toggleActive(treatment: Treatment) {
    if (!user) return;
    try {
      await treatmentService.setActive(treatment.id, !treatment.isActive, user);
      toast.success(treatment.isActive ? "Tindakan dinonaktifkan" : "Tindakan diaktifkan");
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
    } catch {
      toast.error("Gagal mengubah status tindakan.");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Daftar Tindakan"
        description="Kelola tindakan dan harga default. Perubahan harga tidak mengubah transaksi lama."
        icon={ReceiptText}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            Tambah Tindakan
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama / kategori tindakan..."
          className="w-full lg:w-80"
        />
        <div className="flex flex-wrap items-center gap-2">
          <SimpleSelect
            value={category}
            onChange={(value) => setCategory(value || "all")}
            options={categoryOptions}
            className="w-44"
            ariaLabel="Filter kategori"
          />
          <SimpleSelect
            value={status}
            onChange={(value) => setStatus(value || "all")}
            options={STATUS_OPTIONS}
            className="w-40"
            ariaLabel="Filter status"
          />
        </div>
      </FilterBar>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {query.isPending ? (
          <TableSkeleton rows={8} columns={5} />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Belum ada tindakan"
            description="Tambahkan tindakan agar bisa dipilih saat mencatat kunjungan."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Tindakan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga Default</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((treatment) => (
                <TableRow key={treatment.id}>
                  <TableCell className="pl-4">
                    <p className="font-medium">{treatment.name}</p>
                    {treatment.description ? (
                      <p className="max-w-80 truncate text-xs text-muted-foreground">
                        {treatment.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{treatment.category}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRupiah(treatment.defaultPrice)}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge isActive={treatment.isActive} />
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setEditing(treatment);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil />
                        Edit
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => toggleActive(treatment)}>
                        {treatment.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <TreatmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        treatment={editing}
        extraCategories={(query.data ?? []).map((t) => t.category)}
        onSaved={() => {
          setDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ["treatments"] });
        }}
      />
    </div>
  );
}

function TreatmentDialog({
  open,
  onOpenChange,
  treatment,
  extraCategories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: Treatment | null;
  extraCategories: string[];
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(treatment?.name ?? "");
      setCategory(treatment?.category ?? "");
      setPrice(treatment?.defaultPrice ?? 0);
      setDescription(treatment?.description ?? "");
      setIsActive(treatment?.isActive ?? true);
      setErrors({});
    }
  }, [open, treatment]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>([...TREATMENT_CATEGORIES, ...extraCategories]);
    return Array.from(set).map((c) => ({ value: c, label: c }));
  }, [extraCategories]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setErrors({});

    const parsed = treatmentSchema.safeParse({
      name,
      category,
      defaultPrice: price,
      description: description.trim() || null,
      isActive,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >;
      setErrors(
        Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (treatment) {
        await treatmentService.update(treatment.id, parsed.data, user);
      } else {
        await treatmentService.create(parsed.data, user);
      }
      toast.success(treatment ? "Tindakan diperbarui" : "Tindakan berhasil ditambahkan");
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menyimpan tindakan. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{treatment ? "Edit Tindakan" : "Tambah Tindakan"}</DialogTitle>
            <DialogDescription>
              Harga hanya menjadi default. Transaksi lama menyimpan harga saat kunjungan dibuat.
            </DialogDescription>
          </DialogHeader>

          <FormField label="Nama Tindakan" htmlFor="trt-name" error={errors.name} required>
            <Input
              id="trt-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Scaling"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Kategori" error={errors.category} required>
              <SimpleSelect
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                placeholder="Pilih kategori"
                className="w-full"
                ariaLabel="Kategori"
              />
            </FormField>
            <FormField
              label="Harga Default"
              htmlFor="trt-price"
              error={errors.defaultPrice}
              required
            >
              <CurrencyInput id="trt-price" value={price} onChange={setPrice} />
            </FormField>
          </div>

          <FormField label="Deskripsi" htmlFor="trt-desc">
            <Textarea
              id="trt-desc"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <label htmlFor="trt-active" className="text-sm font-medium">
              Status Aktif
            </label>
            <Switch
              id="trt-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(Boolean(checked))}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Tindakan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}