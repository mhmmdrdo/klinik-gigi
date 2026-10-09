"use client";

import { useEffect, useMemo, useRef, useState } from "react"; // FIX: tambah useRef
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Loader2, Pencil, Plus, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ButtonLink } from "@/components/button-link";
import { DateInput, DateRangeFilter } from "@/components/date-picker";
import { FormField } from "@/components/form-field";
import { Pagination } from "@/components/pagination";
import { PatientSelectedCard } from "@/components/patient-picker";
import { FilterBar, PageHeader } from "@/components/page-parts";
import { SearchInput } from "@/components/search-input";
import { SimpleSelect } from "@/components/simple-select";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import {
  ApiError,
  appointmentService,
  patientService,
  type AppointmentListItem,
} from "@/lib/services";
import { getActiveDoctors } from "@/lib/queries/dashboard";
import { appointmentSchema } from "@/lib/validators/schemas";
import { APPOINTMENT_STATUS_OPTIONS } from "@/lib/constants";
import { formatDateCompact, formatTime, toDateInputValue } from "@/lib/format";
import { dateToNoonIso } from "@/lib/datetime";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/auth-provider";
import type { AppointmentStatus, Patient } from "@/types";

export function AppointmentsView({ createOnMount = false }: { createOnMount?: boolean }) {
  const searchParams = useSearchParams();
  const presetPatientId = searchParams.get("patientId");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = toDateInputValue(new Date());

  const [search, setSearch] = useState("");
  const [doctorId, setDoctorId] = useState("all");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState({ from: today, to: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(createOnMount);
  const [editing, setEditing] = useState<AppointmentListItem | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: getActiveDoctors,
    staleTime: 5 * 60_000,
  });

  const query = useQuery({
    queryKey: ["appointments", debouncedSearch, doctorId, status, range, page, pageSize],
    queryFn: () =>
      appointmentService.list({
        search: debouncedSearch,
        doctorId,
        status: status as AppointmentStatus | "all",
        dateFrom: range.from || undefined,
        dateTo: range.to || undefined,
        page,
        pageSize,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: AppointmentStatus }) =>
      appointmentService.setStatus(id, next),
    onSuccess: () => {
      toast.success("Status reservasi diperbarui");
      queryClient.invalidateQueries();
    },
    onError: () => toast.error("Gagal mengubah status reservasi."),
  });

  const doctorOptions = useMemo(
    () => [
      { value: "all", label: "Semua Dokter" },
      ...(doctorsQuery.data ?? []).map((d) => ({ value: d.id, label: d.fullName })),
    ],
    [doctorsQuery.data],
  );

  const data = query.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reservasi"
        description="Catat janji pasien yang masuk melalui WhatsApp secara manual."
        icon={CalendarCheck}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Tambah Reservasi
          </Button>
        }
      />

      {formOpen && user ? (
        <AppointmentForm
          key={editing?.appointment.id ?? "new"}
          appointment={editing}
          presetPatientId={editing ? null : presetPatientId}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setEditing(null);
            queryClient.invalidateQueries();
          }}
        />
      ) : null}

      <FilterBar className="flex-col lg:flex-col lg:items-stretch">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Cari pasien / no. pasien..."
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
            options={[{ value: "all", label: "Semua Status" }, ...APPOINTMENT_STATUS_OPTIONS]}
            className="w-44"
            ariaLabel="Filter status reservasi"
          />
        </div>
      </FilterBar>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {query.isPending ? (
          <TableSkeleton rows={pageSize} columns={6} />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : data && data.rows.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Belum ada reservasi"
            description="Tidak ada reservasi yang cocok dengan filter."
          />
        ) : data ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead className="hidden md:table-cell">Dokter</TableHead>
                  <TableHead className="hidden lg:table-cell">Keluhan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.appointment.id}>
                    <TableCell className="pl-4 tabular-nums">
                      {formatDateCompact(row.appointment.appointmentDate)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTime(row.appointment.appointmentTime)}
                    </TableCell>
                    <TableCell>
                      <ButtonLink
                        href={`/patients/${row.patient.id}`}
                        variant="link"
                        className="h-auto p-0 font-medium"
                      >
                        {row.patient.fullName}
                      </ButtonLink>
                      <p className="font-mono text-xs text-muted-foreground">
                        {row.patient.medicalRecordNumber}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {row.doctor.fullName}
                    </TableCell>
                    <TableCell className="hidden max-w-48 truncate text-muted-foreground lg:table-cell">
                      {row.appointment.complaint ?? "-"}
                    </TableCell>
                    <TableCell>
                      <SimpleSelect
                        value={row.appointment.status}
                        onChange={(next) => {
                          if (next && next !== row.appointment.status) {
                            statusMutation.mutate({
                              id: row.appointment.id,
                              next: next as AppointmentStatus,
                            });
                          }
                        }}
                        options={APPOINTMENT_STATUS_OPTIONS}
                        size="sm"
                        className="w-32"
                        ariaLabel="Ubah status reservasi"
                      />
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1.5">
                        {row.appointment.status === "confirmed" ||
                        row.appointment.status === "pending" ? (
                          <ButtonLink
                            href={`/visits/new?patientId=${row.patient.id}`}
                            variant="outline"
                            size="xs"
                          >
                            <Stethoscope />
                            Kunjungan
                          </ButtonLink>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Edit reservasi"
                          onClick={() => {
                            setEditing(row);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
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
              itemLabel="reservasi"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function AppointmentForm({
  appointment,
  presetPatientId,
  onSaved,
  onCancel,
}: {
  appointment: AppointmentListItem | null;
  presetPatientId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const isEditing = Boolean(appointment);

  const [patient, setPatient] = useState<Patient | null>(appointment?.patient ?? null);
  const [date, setDate] = useState(
    appointment
      ? toDateInputValue(appointment.appointment.appointmentDate)
      : toDateInputValue(new Date()),
  );
  const [time, setTime] = useState(appointment?.appointment.appointmentTime ?? "09:00");
  const [doctorId, setDoctorId] = useState(appointment?.appointment.doctorId ?? "");
  const [status, setStatus] = useState<AppointmentStatus>(
    appointment?.appointment.status ?? "confirmed",
  );
  const [complaint, setComplaint] = useState(appointment?.appointment.complaint ?? "");
  const [notes, setNotes] = useState(appointment?.appointment.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: getActiveDoctors,
    staleTime: 5 * 60_000,
  });

  const presetQuery = useQuery({
    queryKey: ["patient", presetPatientId],
    queryFn: () => patientService.get(presetPatientId as string),
    enabled: Boolean(presetPatientId) && !isEditing,
  });

  // FIX: preset hanya diterapkan sekali, sehingga tombol "Ganti" bisa mengosongkan pasien.
  const presetApplied = useRef(false);
  useEffect(() => {
    if (presetQuery.data && !presetApplied.current) {
      presetApplied.current = true;
      setPatient(presetQuery.data);
    }
  }, [presetQuery.data]);

  const doctorOptions = (doctorsQuery.data ?? []).map((d) => ({
    value: d.id,
    label: d.fullName,
  }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setErrors({});

    const parsed = appointmentSchema.safeParse({
      patientId: patient?.id ?? "",
      doctorId,
      appointmentDate: dateToNoonIso(date),
      appointmentTime: time,
      complaint: complaint.trim() || null,
      notes: notes.trim() || null,
      status,
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
      if (appointment) {
        await appointmentService.update(appointment.appointment.id, parsed.data, user);
      } else {
        await appointmentService.create(parsed.data, user);
      }
      toast.success(isEditing ? "Reservasi diperbarui" : "Reservasi berhasil dicatat");
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menyimpan reservasi. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
    >
      <h2 className="text-sm font-semibold">
        {isEditing ? "Edit Reservasi" : "Tambah Reservasi"}
      </h2>

      <div className="space-y-1.5">
        <PatientSelectedCard
          patient={patient}
          onChange={() => setPatient(null)}
          onSelect={setPatient}
        />
        {errors.patientId ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.patientId}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <FormField label="Tanggal" htmlFor="apt-date" error={errors.appointmentDate} required>
          <DateInput id="apt-date" value={date} onChange={setDate} />
        </FormField>
        <FormField label="Jam" htmlFor="apt-time" error={errors.appointmentTime} required>
          <Input
            id="apt-time"
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </FormField>
        <FormField label="Dokter" error={errors.doctorId} required>
          <SimpleSelect
            value={doctorId}
            onChange={setDoctorId}
            options={doctorOptions}
            placeholder="Pilih dokter"
            className="w-full"
            ariaLabel="Dokter"
          />
        </FormField>
        <FormField label="Status" required>
          <SimpleSelect
            value={status}
            onChange={(value) => setStatus(value as AppointmentStatus)}
            options={APPOINTMENT_STATUS_OPTIONS}
            className="w-full"
            ariaLabel="Status reservasi"
          />
        </FormField>
        <FormField label="Keluhan" htmlFor="apt-complaint" className="sm:col-span-2">
          <Input
            id="apt-complaint"
            value={complaint}
            onChange={(event) => setComplaint(event.target.value)}
            placeholder="Contoh: Gigi berlubang"
          />
        </FormField>
        <FormField label="Catatan" htmlFor="apt-notes" className="sm:col-span-2">
          <Textarea
            id="apt-notes"
            rows={1}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opsional"
          />
        </FormField>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="sm:min-w-40">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Reservasi"
          )}
        </Button>
      </div>
    </form>
  );
}