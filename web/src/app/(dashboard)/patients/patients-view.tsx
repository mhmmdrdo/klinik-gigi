"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { SimpleSelect } from "@/components/simple-select";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { ActiveBadge, FilterBar, PageHeader } from "@/components/page-parts";
import { StatusBadge } from "@/components/badge-tone";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { patientService, type PatientFilters } from "@/lib/services";
import { formatDateShort, formatRupiah } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/auth-provider";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

export function PatientsView() {
  const { can } = useAuth();
  const canCreate = can("patient:create");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: ["patients", debouncedSearch, status, page, pageSize],
    queryFn: () =>
      patientService.list({
        search: debouncedSearch,
        status: status as PatientFilters["status"],
        page,
        pageSize,
      }),
  });

  const data = query.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Data Pasien"
        description="Kelola data identitas dan riwayat pasien klinik."
        icon={Users}
        actions={
          canCreate ? (
            <ButtonLink href="/patients/new">
              <UserPlus />
              Tambah Pasien
            </ButtonLink>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Cari nama / nomor HP / nomor pasien..."
          className="w-full lg:w-80"
        />
        <SimpleSelect
          value={status}
          onChange={(value) => {
            setStatus(value || "all");
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          className="w-36"
          ariaLabel="Filter status pasien"
        />
      </FilterBar>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {query.isPending ? (
          <TableSkeleton rows={pageSize} columns={6} />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : data && data.rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={debouncedSearch ? "Pasien tidak ditemukan" : "Belum ada pasien"}
            description={
              debouncedSearch
                ? "Coba kata kunci lain, atau periksa nomor pasien / nomor HP."
                : "Belum ada data pasien yang terdaftar."
            }
            action={
              canCreate && !debouncedSearch ? (
                <ButtonLink href="/patients/new" size="sm">
                  <UserPlus />
                  Tambah Pasien
                </ButtonLink>
              ) : null
            }
          />
        ) : data ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">No. RM</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">No. HP</TableHead>
                  <TableHead className="hidden md:table-cell">L/P</TableHead>
                  <TableHead className="hidden lg:table-cell">Kunjungan Terakhir</TableHead>
                  <TableHead className="text-right">Sisa Tagihan</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="pl-4 font-mono text-xs">
                      {patient.medicalRecordNumber}
                    </TableCell>
                    <TableCell>
                      <ButtonLink
                        href={`/patients/${patient.id}`}
                        variant="link"
                        className="h-auto p-0 font-medium"
                      >
                        {patient.fullName}
                      </ButtonLink>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {!patient.isActive ? <ActiveBadge isActive={false} /> : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell tabular-nums text-muted-foreground">
                      {patient.phone}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {patient.gender === "male" ? "L" : "P"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell tabular-nums text-muted-foreground">
                      {patient.lastVisitDate ? formatDateShort(patient.lastVisitDate) : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {patient.outstanding > 0 ? (
                        <StatusBadge tone="danger" label={formatRupiah(patient.outstanding)} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <ButtonLink href={`/patients/${patient.id}`} variant="outline" size="xs">
                        Detail
                      </ButtonLink>
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
              itemLabel="pasien"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}