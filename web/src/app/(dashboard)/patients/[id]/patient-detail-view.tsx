"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Stethoscope,
  Trash2,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/button-link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CardSkeletonGrid, EmptyState, ErrorState, LoadingState, TableSkeleton } from "@/components/states";
import { ActiveBadge, DetailRow, PageHeader } from "@/components/page-parts";
import { PaymentStatusBadge } from "@/components/page-parts";
import { StatusBadge } from "@/components/badge-tone";
import { PatientForm } from "@/components/patient-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatCard } from "@/components/stat-card";
import { AuthContextView } from "@/components/auth-context-view";
import { ApiError, patientService } from "@/lib/services";
import {
  getPatientPayments,
  getPatientTreatmentHistory,
  getPatientVisits,
} from "@/lib/queries/dashboard";
import {
  calculateAge,
  formatDate,
  formatDateCompact,
  formatDateShort,
  formatNumber,
  formatRupiah,
} from "@/lib/format";
import { GENDER_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";

export function PatientDetailView({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const { user, can } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientService.get(patientId),
  });

  const visitsQuery = useQuery({
    queryKey: ["patient", patientId, "visits"],
    queryFn: () => getPatientVisits(patientId),
  });

  const treatmentsQuery = useQuery({
    queryKey: ["patient", patientId, "treatments"],
    queryFn: () => getPatientTreatmentHistory(patientId),
  });

  const paymentsQuery = useQuery({
    queryKey: ["patient", patientId, "payments"],
    queryFn: () => getPatientPayments(patientId),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("no session");
      return patientService.setActive(patientId, false, user);
    },
    onSuccess: () => {
      toast.success("Pasien dinonaktifkan", {
        description: "Riwayat kunjungan dan pembayaran tetap tersimpan.",
      });
      setConfirmDeactivate(false);
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: () => toast.error("Gagal menonaktifkan pasien. Silakan coba lagi."),
  });

  const patient = patientQuery.data;

  if (patientQuery.isPending) {
    return (
      <div className="space-y-4">
        <CardSkeletonGrid count={4} />
      </div>
    );
  }

  if (patientQuery.isError) {
    return (
      <ErrorState
        title="Pasien tidak ditemukan"
        description="Data yang Anda cari mungkin sudah tidak tersedia."
        onRetry={() => patientQuery.refetch()}
      />
    );
  }

  if (!patient) return null;

  const treatmentCount =
    treatmentsQuery.data?.reduce((sum, row) => sum + row.quantity, 0) ?? 0;
  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Semua Pasien
      </Link>

      <PageHeader
        title={patient.fullName}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-xs text-muted-foreground">
              {patient.medicalRecordNumber}
            </span>
            <span className="text-muted-foreground">{patient.phone}</span>
            {!patient.isActive ? <ActiveBadge isActive={false} /> : null}
          </span>
        }
        actions={
          can("patient:update") ? (
            <>
              {patient.isActive ? (
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeactivate(true)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 />
                  Nonaktifkan
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setIsEditing((value) => !value)}>
                <Pencil />
                {isEditing ? "Batal Edit" : "Edit Pasien"}
              </Button>
            </>
          ) : null
        }
      >
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/visits/new?patientId=${patient.id}`}>
            <Stethoscope />
            Kunjungan Baru
          </ButtonLink>
          <ButtonLink
            href={`/appointments/new?patientId=${patient.id}`}
            variant="outline"
          >
            <CalendarClock />
            Buat Reservasi
          </ButtonLink>
        </div>
      </PageHeader>

      {isEditing ? (
        <PatientForm
          patient={patient}
          onCancel={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
            queryClient.invalidateQueries({ queryKey: ["patients"] });
          }}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="mb-4 text-sm font-semibold">Data Pasien</h2>
            <dl className="space-y-3">
              <DetailRow label="Nama">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="size-3.5 text-muted-foreground" />
                  {patient.fullName}
                </span>
              </DetailRow>
              <DetailRow label="No. Rekam">
                <span className="font-mono text-xs">{patient.medicalRecordNumber}</span>
              </DetailRow>
              <DetailRow label="Tanggal Lahir">
                {patient.dateOfBirth ? (
                  <span>
                    {formatDate(patient.dateOfBirth)}
                    {age !== null ? (
                      <span className="text-muted-foreground"> ({age} tahun)</span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </DetailRow>
              <DetailRow label="Jenis Kelamin">{GENDER_LABEL[patient.gender]}</DetailRow>
              <DetailRow label="No. WhatsApp">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  {patient.phone}
                </span>
              </DetailRow>
              {patient.email ? (
                <DetailRow label="Email">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <a
                      href={`mailto:${patient.email}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {patient.email}
                    </a>
                  </span>
                </DetailRow>
              ) : null}
              <DetailRow label="Alamat">
                <span className="inline-flex items-start gap-1.5">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  {patient.address ?? <span className="text-muted-foreground">-</span>}
                </span>
              </DetailRow>
              {patient.nik ? (
                <DetailRow label="NIK">
                  <span className="font-mono text-xs">{patient.nik}</span>
                </DetailRow>
              ) : null}
              {patient.notes ? (
                <DetailRow label="Catatan">{patient.notes}</DetailRow>
              ) : null}
              <DetailRow label="Terdaftar">{formatDate(patient.createdAt)}</DetailRow>
            </dl>
          </section>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total Kunjungan" value={formatNumber(patient.visitCount)} />
            <StatCard label="Total Perawatan" value={formatNumber(treatmentCount)} />
            <StatCard
              label="Total Pengeluaran"
              value={formatRupiah(patient.totalSpent)}
              icon={UserRoundPlus}
            />
            <StatCard
              label="Saldo Belum Dibayar"
              value={formatRupiah(patient.outstanding)}
              tone={patient.outstanding > 0 ? "warning" : "positive"}
            />
          </div>

          <Tabs defaultValue="summary" className="gap-4">
            <TabsList>
              <TabsTrigger value="summary">Ringkasan</TabsTrigger>
              <TabsTrigger value="visits">Riwayat Kunjungan</TabsTrigger>
              <TabsTrigger value="treatments">Perawatan</TabsTrigger>
              <TabsTrigger value="payments">Pembayaran</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="rounded-xl bg-card ring-1 ring-foreground/10">
                {visitsQuery.isPending ? (
                  <TableSkeleton rows={4} columns={4} />
                ) : visitsQuery.isError ? (
                  <ErrorState onRetry={() => visitsQuery.refetch()} />
                ) : visitsQuery.data && visitsQuery.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Tanggal</TableHead>
                        <TableHead>Dokter</TableHead>
                        <TableHead className="hidden md:table-cell">Keluhan</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="pr-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitsQuery.data.slice(0, 5).map((row) => (
                        <TableRow key={row.visit.id}>
                          <TableCell className="pl-4 tabular-nums">
                            {formatDateCompact(row.visit.visitDate)}
                          </TableCell>
                          <TableCell>{row.doctorName}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {row.visit.complaint ?? "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(row.totals.total)}
                          </TableCell>
                          <TableCell className="pr-4">
                            <PaymentStatusBadge status={row.totals.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon={Stethoscope}
                    title="Belum ada kunjungan"
                    description="Riwayat kunjungan pasien akan tampil di sini."
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="visits">
              <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                {visitsQuery.isPending ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : visitsQuery.isError ? (
                  <ErrorState onRetry={() => visitsQuery.refetch()} />
                ) : visitsQuery.data && visitsQuery.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Tanggal</TableHead>
                        <TableHead>Dokter</TableHead>
                        <TableHead className="hidden md:table-cell">Keluhan</TableHead>
                        <TableHead className="hidden lg:table-cell">Tindakan</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="pr-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitsQuery.data.map((row) => (
                        <TableRow key={row.visit.id}>
                          <TableCell className="pl-4">
                            <ButtonLink
                              href={`/visits/${row.visit.id}`}
                              variant="link"
                              className={cn("h-auto p-0 tabular-nums")}
                            >
                              {formatDateCompact(row.visit.visitDate)}
                            </ButtonLink>
                            <p className="text-xs text-muted-foreground">
                              {row.visit.visitNumber}
                            </p>
                          </TableCell>
                          <TableCell>{row.doctorName}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {row.visit.complaint ?? "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {row.treatments.length > 0
                              ? row.treatments.map((t) => t.name).join(", ")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(row.totals.total)}
                          </TableCell>
                          <TableCell className="pr-4">
                            <PaymentStatusBadge status={row.totals.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon={Stethoscope}
                    title="Belum ada riwayat kunjungan"
                    description="Riwayat kunjungan pasien akan tampil di sini."
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="treatments">
              <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                {treatmentsQuery.isPending ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : treatmentsQuery.isError ? (
                  <ErrorState onRetry={() => treatmentsQuery.refetch()} />
                ) : treatmentsQuery.data && treatmentsQuery.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Tanggal</TableHead>
                        <TableHead>Perawatan</TableHead>
                        <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                        <TableHead>Gigi</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="pr-4 text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {treatmentsQuery.data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="pl-4 tabular-nums">
                            {formatDateCompact(row.visitDate)}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{row.treatmentName}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.visitNumber}
                            </p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {row.category}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {row.toothNumber ?? "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.quantity}
                          </TableCell>
                          <TableCell className="pr-4 text-right tabular-nums">
                            {formatRupiah(row.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon={Stethoscope}
                    title="Belum ada perawatan"
                    description="Riwayat perawatan gigi akan tampil di sini."
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                {paymentsQuery.isPending ? (
                  <TableSkeleton rows={5} columns={5} />
                ) : paymentsQuery.isError ? (
                  <ErrorState onRetry={() => paymentsQuery.refetch()} />
                ) : paymentsQuery.data && paymentsQuery.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Tanggal</TableHead>
                        <TableHead>No. Transaksi</TableHead>
                        <TableHead className="hidden sm:table-cell">Metode</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="pr-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsQuery.data.map((row) => (
                        <TableRow key={row.payment.id}>
                          <TableCell className="pl-4 tabular-nums">
                            {formatDateShort(row.payment.paymentDate)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.payment.paymentNumber}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {PAYMENT_METHOD_LABEL[row.payment.paymentMethod]}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(row.payment.amount)}
                          </TableCell>
                          <TableCell className="pr-4">
                            <PaymentStatusBadge status={row.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    title="Belum ada pembayaran"
                    description="Riwayat pembayaran pasien akan tampil di sini."
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Nonaktifkan pasien ini?"
        description={
          <>
            Apakah Anda yakin ingin menonaktifkan <strong>{patient.fullName}</strong>? Data
            pasien tidak akan dihapus dan seluruh riwayat kunjungan serta pembayaran tetap
            tersimpan.
          </>
        }
        confirmLabel="Ya, Nonaktifkan"
        destructive
        loading={deactivateMutation.isPending}
        onConfirm={() => deactivateMutation.mutate()}
      />
    </div>
  );
}