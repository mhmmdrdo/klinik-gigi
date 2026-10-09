"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/currency-input";
import { DateInput } from "@/components/date-picker";
import { FormField } from "@/components/form-field";
import { PatientSelectedCard } from "@/components/patient-picker";
import { SimpleSelect } from "@/components/simple-select";
import {
  createLine,
  VisitTreatmentEditor,
  type TreatmentLine,
} from "@/components/visit-treatment-editor";
import {
  ApiError,
  paymentService,
  treatmentService,
  visitService,
  type VisitListItem,
} from "@/lib/services";
import { getActiveDoctors } from "@/lib/queries/dashboard";
import { visitSchema } from "@/lib/validators/schemas";
import { PAYMENT_METHOD_OPTIONS, VISIT_STATUS_OPTIONS } from "@/lib/constants";
import { computeVisitTotals, lineSubtotal } from "@/lib/domain";
import { formatRupiah, toDateInputValue } from "@/lib/format";
import { dateToIsoWithNow } from "@/lib/datetime";
import { useAuth } from "@/providers/auth-provider";
import type { Patient, PaymentMethod, VisitStatus } from "@/types";

export function VisitForm({
  visit,
  initialPatient,
  onSaved,
  onCancel,
}: {
  visit?: VisitListItem;
  initialPatient?: Patient | null;
  onSaved: (visitId: string) => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = Boolean(visit);

  const [patient, setPatient] = useState<Patient | null>(
    visit?.patient ?? initialPatient ?? null,
  );
  const [visitDate, setVisitDate] = useState(
    visit ? toDateInputValue(visit.visit.visitDate) : toDateInputValue(new Date()),
  );
  const [doctorId, setDoctorId] = useState(visit?.visit.doctorId ?? "");
  const [status, setStatus] = useState<VisitStatus>(visit?.visit.status ?? "in_progress");
  const [complaint, setComplaint] = useState(visit?.visit.complaint ?? "");
  const [examinationNotes, setExaminationNotes] = useState(visit?.visit.examinationNotes ?? "");
  const [diagnosis, setDiagnosis] = useState(visit?.visit.diagnosis ?? "");
  const [notes, setNotes] = useState(visit?.visit.notes ?? "");
  const [discount, setDiscount] = useState(visit?.visit.discount ?? 0);
  const [paidNow, setPaidNow] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [lines, setLines] = useState<TreatmentLine[]>(() =>
    visit
      ? visit.treatments.map((vt) =>
          createLine(undefined, {
            treatmentId: vt.treatmentId,
            toothNumber: vt.toothNumber ?? "",
            quantity: vt.quantity,
            unitPrice: vt.unitPrice,
            notes: vt.notes ?? "",
          }),
        )
      : [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: getActiveDoctors,
    staleTime: 5 * 60_000,
  });
  const treatmentsQuery = useQuery({
    queryKey: ["treatments", "all"],
    queryFn: () => treatmentService.list({}),
    staleTime: 60_000,
  });

  const effectiveDoctorId = doctorId || (user?.role === "doctor" ? user.id : "");

  const doctorOptions = useMemo(() => {
    const list = (doctorsQuery.data ?? []).map((d) => ({ value: d.id, label: d.fullName }));
    if (visit && !list.some((o) => o.value === visit.doctor.id)) {
      list.push({ value: visit.doctor.id, label: visit.doctor.fullName });
    }
    return list;
  }, [doctorsQuery.data, visit]);

  const selectableTreatments = useMemo(() => {
    const used = new Set(lines.map((l) => l.treatmentId));
    return (treatmentsQuery.data ?? []).filter((t) => t.isActive || used.has(t.id));
  }, [treatmentsQuery.data, lines]);

  const totals = computeVisitTotals(
    lines.map((l) => ({
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      subtotal: lineSubtotal(l.quantity, l.unitPrice),
    })),
    discount,
    isEditing ? (visit?.totals.paid ?? 0) : paidNow,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setErrors({});

    const parsed = visitSchema.safeParse({
      patientId: patient?.id ?? "",
      doctorId: effectiveDoctorId,
      visitDate: isEditing ? visit!.visit.visitDate : dateToIsoWithNow(visitDate),
      complaint: complaint.trim() || null,
      examinationNotes: examinationNotes.trim() || null,
      diagnosis: diagnosis.trim() || null,
      notes: notes.trim() || null,
      status,
      discount,
      items: lines.map((l) => ({
        treatmentId: l.treatmentId,
        toothNumber: l.toothNumber || null,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        notes: l.notes.trim() || null,
      })),
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >;
      setErrors(
        Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])),
      );
      toast.error("Periksa kembali isian formulir.");
      return;
    }

    if (!isEditing && paidNow > totals.total) {
      setErrors({ paid: "Jumlah dibayar tidak boleh melebihi total tagihan." });
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = isEditing
        ? await visitService.update(visit!.visit.id, parsed.data, user)
        : await visitService.create(parsed.data, user);

      if (!isEditing && paidNow > 0) {
        try {
          await paymentService.create(
            {
              visitId: saved.id,
              amount: paidNow,
              paymentMethod: method,
              paymentDate: dateToIsoWithNow(visitDate),
              notes: null,
            },
            user,
          );
        } catch {
          toast.warning("Kunjungan tersimpan, tetapi pembayaran gagal dicatat.", {
            description: "Silakan catat pembayaran dari halaman detail kunjungan.",
          });
        }
      }

      toast.success(isEditing ? "Kunjungan diperbarui" : "Kunjungan berhasil disimpan", {
        description: saved.visitNumber,
      });
      queryClient.invalidateQueries();
      onSaved(saved.id);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menyimpan kunjungan. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">1. Pasien</h2>
        <PatientSelectedCard
          patient={patient}
          onChange={() => {
            if (!isEditing) setPatient(null);
          }}
          onSelect={setPatient}
          disabled={isEditing}
        />
        {errors.patientId ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.patientId}
          </p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-semibold">2. Informasi Kunjungan</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Tanggal" htmlFor="visitDate" error={errors.visitDate} required>
            <DateInput
              id="visitDate"
              value={visitDate}
              onChange={setVisitDate}
              disabled={isEditing}
            />
          </FormField>
          <FormField label="Dokter" error={errors.doctorId} required>
            <SimpleSelect
              value={effectiveDoctorId}
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
              onChange={(value) => setStatus(value as VisitStatus)}
              options={VISIT_STATUS_OPTIONS}
              className="w-full"
              ariaLabel="Status kunjungan"
            />
          </FormField>
          <FormField
            label="Keluhan Utama"
            htmlFor="complaint"
            error={errors.complaint}
            className="sm:col-span-3"
          >
            <Input
              id="complaint"
              value={complaint}
              onChange={(event) => setComplaint(event.target.value)}
              placeholder="Contoh: Gigi belakang sakit"
            />
          </FormField>
          <FormField
            label="Catatan Pemeriksaan"
            htmlFor="examinationNotes"
            className="sm:col-span-3"
          >
            <Textarea
              id="examinationNotes"
              rows={3}
              value={examinationNotes}
              onChange={(event) => setExaminationNotes(event.target.value)}
              placeholder="Hasil pemeriksaan, kondisi gigi, nomor gigi terkait..."
            />
          </FormField>
          <FormField label="Diagnosa" htmlFor="diagnosis" className="sm:col-span-3">
            <Input
              id="diagnosis"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="Contoh: Karies"
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-semibold">3. Perawatan / Tindakan</h2>
        <VisitTreatmentEditor
          lines={lines}
          onChange={setLines}
          treatments={selectableTreatments}
          error={errors.items}
        />

        <div className="ml-auto max-w-xs space-y-2 border-t pt-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatRupiah(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Diskon</span>
            <CurrencyInput
              value={discount}
              onChange={setDiscount}
              className="h-7 w-36 text-right"
              ariaLabel="Diskon"
            />
          </div>
          <div className="flex items-center justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatRupiah(totals.total)}</span>
          </div>
        </div>
      </section>

      {!isEditing ? (
        <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div>
            <h2 className="text-sm font-semibold">4. Pembayaran (opsional)</h2>
            <p className="text-sm text-muted-foreground">
              Kosongkan jika pasien belum membayar. Pembayaran bisa dicatat nanti dari detail
              kunjungan.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Dibayar" htmlFor="paidNow" error={errors.paid}>
              <CurrencyInput id="paidNow" value={paidNow} onChange={setPaidNow} />
            </FormField>
            <FormField label="Metode">
              <SimpleSelect
                value={method}
                onChange={(value) => setMethod(value as PaymentMethod)}
                options={PAYMENT_METHOD_OPTIONS}
                className="w-full"
                ariaLabel="Metode pembayaran"
              />
            </FormField>
            <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Sisa tagihan</p>
              <p className="font-semibold tabular-nums">{formatRupiah(totals.outstanding)}</p>
            </div>
          </div>
        </section>
      ) : null}

      <FormField label="Catatan Tambahan" htmlFor="notes">
        <Textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Opsional"
        />
      </FormField>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="sm:min-w-44">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Menyimpan...
            </>
          ) : isEditing ? (
            "Simpan Perubahan"
          ) : (
            "Simpan Kunjungan"
          )}
        </Button>
      </div>
    </form>
  );
}