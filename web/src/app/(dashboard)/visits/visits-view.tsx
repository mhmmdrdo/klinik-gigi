"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { SimpleSelect } from "@/components/simple-select";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import {
  FilterBar,
  PageHeader,
  PaymentStatusBadge,
  VisitStatusBadge,
} from "@/components/page-parts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangeFilter } from "@/components/date-picker";
import { visitService } from "@/lib/services";
import { getActiveDoctors } from "@/lib/queries/dashboard";
import { formatDateCompact, formatRupiah, formatTime, toDateInputValue } from "@/lib/format";
import { PAYMENT_METHOD_OPTIONS, VISIT_STATUS_OPTIONS } from "@/lib/constants";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { PaymentMethod, VisitStatus } from "@/types";

export function VisitsView() {
  const today = toDateInputValue(new Date());
  const [search, setSearch] = useState("");
  const [doctorId, setDoctorId] = useState("all");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [range, setRange] = useState({ from: today, to: today });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebouncedValue(search, 300);

  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: getActiveDoctors,
    staleTime: 5 * 60_000,
  });

  const query = useQuery({
    // FIX: method masuk ke queryKey dan dikirim ke service.
    queryKey: ["visits", debouncedSearch, doctorId, status, method, range, page, pageSize],
    queryFn: () =>
      visitService.list({
        search: debouncedSearch,
        doctorId,
        status: status as VisitStatus | "all",
        method: method as PaymentMethod | "all",
        dateFrom: range.from,
        dateTo: range.to,
        page,
        pageSize,
      }),
  });

  const doctorOptions = useMemo(
    () => [
      { value: "all", label: "Semua Dokter" },
      ...(doctorsQuery.data ?? []).map((d) => ({ value: d.id, label: d.fullName })),
    ],
    [doctorsQuery.data],
  );
  const statusOptions = [{ value: "all", label: "Semua Status" }, ...VISIT_STATUS_OPTIONS];
  const methodOptions = [{ value: "all", label: "Semua Metode" }, ...PAYMENT_METHOD_OPTIONS];

  const data = query.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kunjungan"
        description="Catat dan pantau kunjungan pasien beserta biaya perawatannya."
        icon={Stethoscope}
        actions={
          <ButtonLink href="/visits/new">
            <Stethoscope />
            Tambah Kunjungan
          </ButtonLink>
        }
      />

      <FilterBar className="flex-col lg:flex-col lg:items-stretch">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Cari pasien / no. kunjungan / keluhan..."
            className="w-full lg:w-72"
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
            value={doctorId}
            onChange={(value) => {
              setDoctorId(value || "all");
              setPage(1);
            }}
            options={doctorOptions}
            className="w-44"
            ariaLabel="Filter dokter"
          />
          <SimpleSelect
            value={status}
            onChange={(value) => {
              setStatus(value || "all");
              setPage(1);
            }}
            options={statusOptions}
            className="w-44"
            ariaLabel="Filter status kunjungan"
          />
          <SimpleSelect
            value={method}
            onChange={(value) => {
              setMethod(value || "all");
              setPage(1);
            }}
            options={methodOptions}
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
            icon={Stethoscope}
            title="Belum ada kunjungan"
            description={
              debouncedSearch
                ? "Tidak ada kunjungan yang cocok dengan filter."
                : `Tidak ada kunjungan pada periode ${range.from} s.d. ${range.to}.`
            }
            action={
              <ButtonLink href="/visits/new" size="sm">
                <Stethoscope />
                Catat Kunjungan
              </ButtonLink>
            }
          />
        ) : data ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Tanggal</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead className="hidden lg:table-cell">Dokter</TableHead>
                  <TableHead className="hidden md:table-cell">Keluhan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Sisa</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.visit.id}>
                    <TableCell className="pl-4">
                      <Link
                        href={`/visits/${row.visit.id}`}
                        className="font-medium hover:underline"
                      >
                        {formatDateCompact(row.visit.visitDate)}
                      </Link>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {formatTime(row.visit.visitDate)} &middot; {row.visit.visitNumber}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/patients/${row.patient.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.patient.fullName}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">
                        {row.patient.medicalRecordNumber}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {row.doctor.fullName}
                    </TableCell>
                    <TableCell className="hidden max-w-48 truncate text-muted-foreground md:table-cell">
                      {row.visit.complaint ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRupiah(row.totals.total)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {row.totals.outstanding > 0 ? (
                        <span className="text-destructive">
                          {formatRupiah(row.totals.outstanding)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex flex-col items-start gap-1">
                        <VisitStatusBadge status={row.visit.status} />
                        {row.visit.status !== "cancelled" ? (
                          <PaymentStatusBadge status={row.totals.status} />
                        ) : null}
                      </div>
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
              itemLabel="kunjungan"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}