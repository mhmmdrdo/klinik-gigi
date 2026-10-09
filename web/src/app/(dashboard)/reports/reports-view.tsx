"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangeFilter } from "@/components/date-picker";
import { FilterBar, PageHeader, PaymentStatusBadge } from "@/components/page-parts";
import { StatCard } from "@/components/stat-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import {
  getRevenueReport,
  getTreatmentReport,
  getVisitReport,
} from "@/lib/queries/dashboard";
import { formatDateShort, formatNumber, formatRupiah, toDateInputValue } from "@/lib/format";
import type { PaymentStatus } from "@/types";

type ReportTab = "revenue" | "visits" | "treatments";

function isTab(value: string | null): value is ReportTab {
  return value === "revenue" || value === "visits" || value === "treatments";
}

export function ReportsView() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const now = new Date();
  const monthStart = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = toDateInputValue(now);

  const [tab, setTab] = useState<ReportTab>(isTab(tabParam) ? tabParam : "revenue");
  const [range, setRange] = useState({ from: monthStart, to: today });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isTab(tabParam)) setTab(tabParam);
  }, [tabParam]);

  const validRange = Boolean(range.from && range.to && range.from <= range.to);

  const revenueQuery = useQuery({
    queryKey: ["report", "revenue", range.from, range.to],
    queryFn: () => getRevenueReport(range.from, range.to),
    enabled: validRange && tab === "revenue",
  });
  const visitQuery = useQuery({
    queryKey: ["report", "visits", range.from, range.to],
    queryFn: () => getVisitReport(range.from, range.to),
    enabled: validRange && tab === "visits",
  });
  const treatmentQuery = useQuery({
    queryKey: ["report", "treatments", range.from, range.to],
    queryFn: () => getTreatmentReport(range.from, range.to),
    enabled: validRange && tab === "treatments",
  });

  async function handleExport() {
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      let rows: Record<string, string | number>[] = [];
      let sheetName = "Laporan";
      let fileName = "laporan";

      if (tab === "revenue" && revenueQuery.data) {
        sheetName = "Pendapatan";
        fileName = "laporan-pendapatan";
        rows = revenueQuery.data.rows.map((r) => ({
          Tanggal: formatDateShort(r.date),
          "No. Kunjungan": r.visitNumber,
          "No. RM": r.patientMrn,
          Pasien: r.patientName,
          Perawatan: r.treatments,
          Total: r.total,
          Dibayar: r.paid,
          Sisa: r.outstanding,
          Status: r.status,
        }));
      } else if (tab === "visits" && visitQuery.data) {
        sheetName = "Kunjungan";
        fileName = "laporan-kunjungan";
        rows = visitQuery.data.daily.map((d) => ({
          Tanggal: d.label,
          "Jumlah Kunjungan": d.value,
        }));
      } else if (tab === "treatments" && treatmentQuery.data) {
        sheetName = "Perawatan";
        fileName = "laporan-perawatan";
        rows = treatmentQuery.data.map((t) => ({
          Perawatan: t.name,
          Kategori: t.category,
          Jumlah: t.count,
          Pendapatan: t.revenue,
        }));
      }

      if (rows.length === 0) {
        toast.info("Tidak ada data untuk diekspor.");
        return;
      }

      const sheet = XLSX.utils.json_to_sheet(rows);
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, sheetName);
      XLSX.writeFile(book, `${fileName}-${range.from}-${range.to}.xlsx`);
      toast.success("File Excel berhasil dibuat");
    } catch {
      toast.error("Gagal mengekspor laporan. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Laporan"
        description="Ringkasan pendapatan, kunjungan, dan perawatan klinik."
        icon={BarChart3}
        actions={
          <Button variant="outline" onClick={handleExport} disabled={isExporting || !validRange}>
            <Download />
            {isExporting ? "Menyiapkan..." : "Export Excel"}
          </Button>
        }
      />

      <FilterBar>
        <DateRangeFilter
          from={range.from}
          to={range.to}
          onChange={setRange}
        />
        {!validRange ? (
          <p className="text-sm text-destructive">Rentang tanggal tidak valid.</p>
        ) : null}
      </FilterBar>

      <Tabs value={tab} onValueChange={(value) => setTab(value as ReportTab)} className="gap-4">
        <TabsList>
          <TabsTrigger value="revenue">Pendapatan</TabsTrigger>
          <TabsTrigger value="visits">Kunjungan</TabsTrigger>
          <TabsTrigger value="treatments">Perawatan</TabsTrigger>
        </TabsList>

        {/* Pendapatan */}
        <TabsContent value="revenue" className="space-y-4">
          {revenueQuery.isPending && validRange ? (
            <TableSkeleton rows={6} columns={6} />
          ) : revenueQuery.isError ? (
            <ErrorState onRetry={() => revenueQuery.refetch()} />
          ) : revenueQuery.data ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Total Transaksi"
                  value={formatRupiah(revenueQuery.data.totalTransaction)}
                  hint={`${revenueQuery.data.transactionCount} kunjungan`}
                />
                <StatCard
                  label="Total Pembayaran"
                  value={formatRupiah(revenueQuery.data.totalPayment)}
                  tone="positive"
                />
                <StatCard
                  label="Piutang"
                  value={formatRupiah(revenueQuery.data.receivable)}
                  tone="warning"
                />
              </div>
              <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                {revenueQuery.data.rows.length === 0 ? (
                  <EmptyState title="Tidak ada data pada periode ini." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Tanggal</TableHead>
                        <TableHead>Pasien</TableHead>
                        <TableHead className="hidden md:table-cell">Perawatan</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Dibayar</TableHead>
                        <TableHead className="text-right">Sisa</TableHead>
                        <TableHead className="pr-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueQuery.data.rows.map((row) => (
                        <TableRow key={row.visitId}>
                          <TableCell className="pl-4 tabular-nums">
                            {formatDateShort(row.date)}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{row.patientName}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {row.visitNumber}
                            </p>
                          </TableCell>
                          <TableCell className="hidden max-w-64 truncate text-muted-foreground md:table-cell">
                            {row.treatments || "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(row.total)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(row.paid)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(row.outstanding)}
                          </TableCell>
                          <TableCell className="pr-4">
                            <PaymentStatusBadge status={row.status as PaymentStatus} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Kunjungan */}
        <TabsContent value="visits" className="space-y-4">
          {visitQuery.isPending && validRange ? (
            <TableSkeleton rows={6} columns={4} />
          ) : visitQuery.isError ? (
            <ErrorState onRetry={() => visitQuery.refetch()} />
          ) : visitQuery.data ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Total Kunjungan"
                  value={formatNumber(visitQuery.data.totalVisits)}
                />
                <StatCard
                  label="Pasien Baru"
                  value={formatNumber(visitQuery.data.newPatients)}
                  tone="positive"
                />
                <StatCard
                  label="Pasien Lama"
                  value={formatNumber(visitQuery.data.returningPatients)}
                />
              </div>

              <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <h2 className="mb-3 text-sm font-semibold">Jumlah Pasien per Hari</h2>
                {visitQuery.data.daily.length === 0 ? (
                  <EmptyState title="Tidak ada data pada periode ini." className="py-10" />
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={visitQuery.data.daily}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          width={32}
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        />
                        <ChartTooltip
                          cursor={{ fill: "var(--muted)", radius: 6 }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                                <p className="font-medium">{label}</p>
                                <p className="tabular-nums text-muted-foreground">
                                  {Number(payload[0].value ?? 0)} kunjungan
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="value" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                <h2 className="border-b px-4 py-3 text-sm font-semibold">Kunjungan per Dokter</h2>
                {visitQuery.data.byDoctor.length === 0 ? (
                  <EmptyState title="Tidak ada data." className="py-8" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Dokter</TableHead>
                        <TableHead className="pr-4 text-right">Jumlah Kunjungan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitQuery.data.byDoctor.map((row) => (
                        <TableRow key={row.doctorName}>
                          <TableCell className="pl-4">{row.doctorName}</TableCell>
                          <TableCell className="pr-4 text-right tabular-nums">
                            {row.count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            </>
          ) : null}
        </TabsContent>

        {/* Perawatan */}
        <TabsContent value="treatments">
          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            {treatmentQuery.isPending && validRange ? (
              <TableSkeleton rows={6} columns={4} />
            ) : treatmentQuery.isError ? (
              <ErrorState onRetry={() => treatmentQuery.refetch()} />
            ) : treatmentQuery.data && treatmentQuery.data.length === 0 ? (
              <EmptyState title="Tidak ada data pada periode ini." />
            ) : treatmentQuery.data ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Perawatan</TableHead>
                    <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="pr-4 text-right">Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatmentQuery.data.map((row) => (
                    <TableRow key={row.treatmentId}>
                      <TableCell className="pl-4 font-medium">{row.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {row.category}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">
                        {formatRupiah(row.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}