"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Pencil, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/states";
import {
  DetailRow,
  PageHeader,
  PaymentStatusBadge,
  VisitStatusBadge,
} from "@/components/page-parts";
import { PaymentDialog } from "@/components/payment-dialog";
import { SimpleSelect } from "@/components/simple-select";
import { VisitForm } from "@/components/visit-form";
import { treatmentService, visitService } from "@/lib/services";
import { PAYMENT_METHOD_LABEL, VISIT_STATUS_OPTIONS } from "@/lib/constants";
import { formatDate, formatDateShort, formatRupiah, formatTime } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import type { VisitStatus } from "@/types";

export function VisitDetailView({ visitId }: { visitId: string }) {
  const queryClient = useQueryClient();
  const { user, can } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const visitQuery = useQuery({
    queryKey: ["visit", visitId],
    queryFn: () => visitService.get(visitId),
  });
  const paymentsQuery = useQuery({
    queryKey: ["visit", visitId, "payments"],
    queryFn: () => visitService.paymentsFor(visitId),
  });
  const treatmentsQuery = useQuery({
    queryKey: ["treatments", "all"],
    queryFn: () => treatmentService.list({}),
    staleTime: 60_000,
  });

  const treatmentMap = useMemo(
    () => new Map((treatmentsQuery.data ?? []).map((t) => [t.id, t])),
    [treatmentsQuery.data],
  );

  const statusMutation = useMutation({
    mutationFn: async (status: VisitStatus) => {
      if (!user) throw new Error("no session");
      return visitService.setStatus(visitId, status, user);
    },
    onSuccess: () => {
      toast.success("Status kunjungan diperbarui");
      queryClient.invalidateQueries();
    },
    onError: () => toast.error("Gagal mengubah status. Silakan coba lagi."),
  });

  if (visitQuery.isPending) return <CardSkeletonGrid count={4} />;

  if (visitQuery.isError || !visitQuery.data) {
    return (
      <ErrorState
        title="Kunjungan tidak ditemukan"
        description="Data yang Anda cari mungkin sudah tidak tersedia."
        onRetry={() => visitQuery.refetch()}
      />
    );
  }

  const { visit, patient, doctor, treatments, totals } = visitQuery.data;
  const canPay =
    can("payment:create") && visit.status !== "cancelled" && totals.outstanding > 0;

  return (
    <div className="space-y-6">
      <Link
        href="/visits"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Semua Kunjungan
      </Link>

      <PageHeader
        title="Detail Kunjungan"
        icon={Stethoscope}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-xs">{visit.visitNumber}</span>
            <VisitStatusBadge status={visit.status} />
            {visit.status !== "cancelled" ? <PaymentStatusBadge status={totals.status} /> : null}
          </span>
        }
        actions={
          <>
            {canPay ? (
              <Button onClick={() => setPayOpen(true)}>
                <CreditCard />
                Catat Pembayaran
              </Button>
            ) : null}
            {can("visit:update") ? (
              <Button variant="outline" onClick={() => setIsEditing((v) => !v)}>
                <Pencil />
                {isEditing ? "Batal Edit" : "Edit Kunjungan"}
              </Button>
            ) : null}
          </>
        }
      />

      {isEditing ? (
        <VisitForm
          visit={visitQuery.data}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="mb-4 text-sm font-semibold">Informasi</h2>
              <dl className="space-y-3">
                <DetailRow label="Pasien">
                  <Link href={`/patients/${patient.id}`} className="font-medium hover:underline">
                    {patient.fullName}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">
                    {patient.medicalRecordNumber}
                  </p>
                </DetailRow>
                <DetailRow label="Tanggal">
                  {formatDate(visit.visitDate)} · {formatTime(visit.visitDate)}
                </DetailRow>
                <DetailRow label="Dokter">{doctor.fullName}</DetailRow>
                <DetailRow label="No. WhatsApp">{patient.phone}</DetailRow>
                <DetailRow label="Status Kunjungan">
                  {can("visit:update") ? (
                    <SimpleSelect
                      value={visit.status}
                      onChange={(value) => {
                        if (value && value !== visit.status) {
                          statusMutation.mutate(value as VisitStatus);
                        }
                      }}
                      options={VISIT_STATUS_OPTIONS}
                      size="sm"
                      className="w-44"
                      ariaLabel="Ubah status kunjungan"
                      disabled={statusMutation.isPending}
                    />
                  ) : (
                    <VisitStatusBadge status={visit.status} />
                  )}
                </DetailRow>
              </dl>
            </section>

            <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="mb-4 text-sm font-semibold">Pembayaran</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{formatRupiah(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Diskon</dt>
                  <dd className="tabular-nums">{formatRupiah(totals.discount)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <dt>Total Tagihan</dt>
                  <dd className="tabular-nums">{formatRupiah(totals.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Dibayar</dt>
                  <dd className="tabular-nums">{formatRupiah(totals.paid)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sisa</dt>
                  <dd
                    className={
                      totals.outstanding > 0
                        ? "font-medium tabular-nums text-destructive"
                        : "tabular-nums"
                    }
                  >
                    {formatRupiah(totals.outstanding)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="mb-4 text-sm font-semibold">Pemeriksaan</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Keluhan">{visit.complaint ?? "-"}</DetailRow>
                <DetailRow label="Diagnosa">{visit.diagnosis ?? "-"}</DetailRow>
                <DetailRow label="Catatan Pemeriksaan" className="sm:col-span-2">
                  <span className="whitespace-pre-wrap">{visit.examinationNotes ?? "-"}</span>
                </DetailRow>
                {visit.notes ? (
                  <DetailRow label="Catatan Tambahan" className="sm:col-span-2">
                    <span className="whitespace-pre-wrap">{visit.notes}</span>
                  </DetailRow>
                ) : null}
              </dl>
            </section>

            <section className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <h2 className="border-b px-4 py-3 text-sm font-semibold">Perawatan</h2>
              {treatments.length === 0 ? (
                <EmptyState title="Belum ada tindakan" className="py-8" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Tindakan</TableHead>
                      <TableHead>Gigi</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="pr-4 text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatments.map((line) => {
                      const treatment = treatmentMap.get(line.treatmentId);
                      return (
                        <TableRow key={line.id}>
                          <TableCell className="pl-4">
                            <p className="font-medium">{treatment?.name ?? "-"}</p>
                            <p className="text-xs text-muted-foreground">
                              {treatment?.category ?? ""}
                            </p>
                          </TableCell>
                          <TableCell className="tabular-nums">{line.toothNumber ?? "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(line.unitPrice)}
                          </TableCell>
                          <TableCell className="pr-4 text-right tabular-nums">
                            {formatRupiah(line.subtotal)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </section>

            <section className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <h2 className="border-b px-4 py-3 text-sm font-semibold">Riwayat Pembayaran</h2>
              {paymentsQuery.isPending ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Memuat pembayaran...</p>
              ) : paymentsQuery.data && paymentsQuery.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Tanggal</TableHead>
                      <TableHead>No. Transaksi</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead className="pr-4 text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsQuery.data.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="pl-4 tabular-nums">
                          {formatDateShort(payment.paymentDate)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {payment.paymentNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {PAYMENT_METHOD_LABEL[payment.paymentMethod]}
                        </TableCell>
                        <TableCell className="pr-4 text-right tabular-nums">
                          {formatRupiah(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title="Belum ada pembayaran" className="py-8" />
              )}
            </section>
          </div>
        </div>
      )}

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        visitId={visit.id}
        visitNumber={visit.visitNumber}
        patientName={patient.fullName}
        outstanding={totals.outstanding}
      />
    </div>
  );
}