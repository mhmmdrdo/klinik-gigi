"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tags } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ButtonLink } from "@/components/button-link";
import { PageHeader } from "@/components/page-parts";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { treatmentService } from "@/lib/services";
import { TREATMENT_CATEGORIES } from "@/lib/constants";
import { formatRupiah } from "@/lib/format";

export function CategoriesView() {
  const query = useQuery({
    queryKey: ["treatments", "all"],
    queryFn: () => treatmentService.list({}),
  });

  const rows = useMemo(() => {
    const treatments = query.data ?? [];
    const names = new Set<string>([...TREATMENT_CATEGORIES, ...treatments.map((t) => t.category)]);
    return Array.from(names).map((name) => {
      const items = treatments.filter((t) => t.category === name);
      const prices = items.map((t) => t.defaultPrice);
      return {
        name,
        total: items.length,
        active: items.filter((t) => t.isActive).length,
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      };
    });
  }, [query.data]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kategori Tindakan"
        description="Ringkasan kategori. Kategori baru dibuat otomatis saat menambahkan tindakan."
        icon={Tags}
        actions={
          <ButtonLink href="/treatments" variant="outline">
            Kelola Tindakan
          </ButtonLink>
        }
      />

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {query.isPending ? (
          <TableSkeleton rows={7} columns={4} />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Tags} title="Belum ada kategori" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Kategori</TableHead>
                <TableHead className="text-right">Jumlah Tindakan</TableHead>
                <TableHead className="text-right">Aktif</TableHead>
                <TableHead className="pr-4 text-right">Rentang Harga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="pl-4 font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.active}</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums text-muted-foreground">
                    {row.total === 0
                      ? "-"
                      : row.min === row.max
                        ? formatRupiah(row.min)
                        : `${formatRupiah(row.min)} – ${formatRupiah(row.max)}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}