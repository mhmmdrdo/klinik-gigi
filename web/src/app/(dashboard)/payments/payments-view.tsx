"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Pagination } from "@/components/pagination";
import { PaymentDialog } from "@/components/payment-dialog";
import { SearchInput } from "@/components/search-input";
import { SimpleSelect } from "@/components/simple-select";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { paymentService, type PaymentFilters, type PaymentListItem } from "@/lib/services";
import { PAYMENT_METHOD_LABEL, PAYMENT_METHOD_OPTIONS } from "@/lib/constants";
import { formatDateCompact, formatRupiah } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/auth-provider";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "unpaid", label: "Belum Lunas" },
  { value: "partial", label: "Sebagian" },
  { value: "paid", label: "Lunas" },
];

export function PaymentsView() {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [range, setRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [payTarget, setPayTarget] = useState<PaymentListItem | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: ["payments", debouncedSearch, status, method, range, page, pageSize],
    queryFn: () =>
      paymentService.list({
        search: debouncedSearch,
        status: status as PaymentFilters["status"],
        method: method as PaymentFilters["method"],
        dateFrom: range.from || undefined,
        dateTo: range.to || undefined,
        page,
        pageSize,
      }),
  });

  const data = query.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pembayaran"
        description="Pantau tagihan, pembayaran, dan piutang pasien."
        icon={CreditCard}
      />

      <FilterBar className="flex-col lg:flex-col lg:items-stretch">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Cari pasien / no. transaksi / no. kunjungan..."
            className="w-full lg:w-80"
          />
          <DateRangeFilter
            from={range.from}
            to={range.to}
            onChange={(next) => {
              setRange(next);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SimpleSelect
            value={status}
            onChange={(value) => {
              setStatus(value || "all");
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            className="w-40"
            ariaLabel="Filter status pembayaran"
          />
          <SimpleSelect
            value={method}
            onChange={(value) => {
              setMethod(value || "all");
              setPage(1);
            }}
            options={[{ value: "all", label: "Semua Metode" }, ...PAYMENT_METHOD_OPTIONS]}
            className="w-40"
            ariaLabel="Filter metode pembayaran"
          />
        </div>
      </FilterBar>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {query.isPending ? (
          <TableSkeleton rows={pageSize} columns={7} />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : data && data.rows.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Tidak ada data pembayaran"
            description="Tidak ada transaksi yang cocok dengan filter."
          />
        ) : data ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Tanggal</TableHead>
                  <TableHead>No. Transaksi</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Dibayar</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.visit.id}>
                    <TableCell className="pl-4 tabular-nums">
                      {formatDateCompact(row.payment.paymentDate)}
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs">{row.payment.paymentNumber}</p>
                      {row.paid > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {PAYMENT_METHOD_LABEL[row.payment.paymentMethod]}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/visits/${row.visit.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.patient.fullName}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">
                        {row.visit.visitNumber}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRupiah(row.total)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {formatRupiah(row.paid)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.outstanding > 0 ? (
                        <span className="text-destructive">{formatRupiah(row.outstanding)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {row.outstanding > 0 && can("payment:create") ? (
                        <Button variant="outline" size="xs" onClick={() => setPayTarget(row)}>
                          Bayar
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              pageCount={data.pageCount}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="transaksi"
            />
          </>
        ) : null}
      </div>

      {payTarget ? (
        <PaymentDialog
          open
          onOpenChange={(open) => {
            if (!open) setPayTarget(null);
          }}
          visitId={payTarget.visit.id}
          visitNumber={payTarget.visit.visitNumber}
          patientName={payTarget.patient.fullName}
          outstanding={payTarget.outstanding}
        />
      ) : null}
    </div>
  );
}