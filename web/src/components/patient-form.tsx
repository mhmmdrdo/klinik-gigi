"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/date-picker";
import { FormField } from "@/components/form-field";
import { patientSchema, type PatientInput } from "@/lib/validators/schemas";
import { GENDER_LABEL, GENDER_OPTIONS } from "@/lib/constants";
import { formatDate, toDateInputValue } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { ApiError, patientService, type PatientListItem } from "@/lib/services";
import type { Gender } from "@/types";

export type PatientFormValues = PatientInput;

export function PatientForm({
  patient,
  onSaved,
  onCancel,
  lockedMrn,
}: {
  patient?: PatientListItem;
  onSaved: (patientId: string) => void;
  onCancel: () => void;
  /** Display-only: medical record number is generated server-side (PRD 53). */
  lockedMrn?: string;
}) {
  const { user } = useAuth();
  const isEditing = Boolean(patient);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: patient?.fullName ?? "",
      nik: patient?.nik ?? "",
      dateOfBirth: patient?.dateOfBirth ? toDateInputValue(patient.dateOfBirth) : "",
      gender: patient?.gender ?? ("male" as Gender),
      phone: patient?.phone ?? "",
      email: patient?.email ?? "",
      address: patient?.address ?? "",
      notes: patient?.notes ?? "",
      isActive: patient?.isActive ?? true,
    },
  });

  const { errors, isSubmitting } = form.formState;
  const isActive = form.watch("isActive");
  const gender = form.watch("gender");

  useEffect(() => {
    form.clearErrors();
  }, [patient?.id, form]);

  async function onSubmit(values: PatientFormValues) {
    if (!user) return;
    try {
      const saved = patient
        ? await patientService.update(patient.id, values, user)
        : await patientService.create(values, user);
      toast.success(
        isEditing ? "Data pasien diperbarui" : "Pasien berhasil disimpan",
        isEditing
          ? undefined
          : { description: `No. rekam ${saved.medicalRecordNumber}` },
      );
      onSaved(saved.id);
    } catch (error) {
      // PRD 62: surface a friendly message, never the raw DB error.
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal menyimpan data pasien. Silakan coba lagi.",
      );
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-sm font-semibold">Data Identitas</h2>
          <p className="text-sm text-muted-foreground">
            Hanya nama, nomor WhatsApp, dan jenis kelamin yang wajib diisi.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="No. Pasien"
            htmlFor="mrn"
            hint="Dibuat otomatis oleh sistem"
          >
            <Input
              id="mrn"
              value={lockedMrn ?? patient?.medicalRecordNumber ?? "Otomatis"}
              disabled
              readOnly
              className="font-mono"
            />
          </FormField>

          <FormField
            label="Nama Lengkap"
            htmlFor="fullName"
            error={errors.fullName?.message}
            required
          >
            <Input
              id="fullName"
              placeholder="Contoh: Budi Santoso"
              aria-invalid={Boolean(errors.fullName)}
              {...form.register("fullName")}
            />
          </FormField>

          <FormField label="NIK" htmlFor="nik" error={errors.nik?.message} hint="16 digit, opsional">
            <Input
              id="nik"
              inputMode="numeric"
              maxLength={16}
              placeholder="1401234567890001"
              aria-invalid={Boolean(errors.nik)}
              {...form.register("nik")}
            />
          </FormField>

          <FormField
            label="Tanggal Lahir"
            htmlFor="dateOfBirth"
            error={errors.dateOfBirth?.message}
            hint={patient?.dateOfBirth ? formatDate(patient.dateOfBirth) : "Opsional"}
          >
            <DateInput
              id="dateOfBirth"
              value={(form.watch("dateOfBirth") as string) ?? ""}
              onChange={(value) => form.setValue("dateOfBirth", value, { shouldDirty: true })}
              max={toDateInputValue(new Date())}
            />
          </FormField>

          <FormField
            label="Jenis Kelamin"
            error={errors.gender?.message}
            required
            className="sm:col-span-2"
          >
            <RadioGroup
              value={gender}
              onValueChange={(value) =>
                form.setValue("gender", value as Gender, { shouldDirty: true })
              }
              className="flex-row gap-6"
              aria-label="Jenis kelamin"
            >
              {GENDER_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`gender-${option.value}`}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                  {GENDER_LABEL[option.value]}
                </label>
              ))}
            </RadioGroup>
          </FormField>

          <FormField
            label="Nomor WhatsApp"
            htmlFor="phone"
            error={errors.phone?.message}
            required
          >
            <Input
              id="phone"
              inputMode="tel"
              placeholder="081234567890"
              aria-invalid={Boolean(errors.phone)}
              {...form.register("phone")}
            />
          </FormField>

          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              aria-invalid={Boolean(errors.email)}
              {...form.register("email")}
            />
          </FormField>

          <FormField label="Alamat" htmlFor="address" className="sm:col-span-2">
            <Textarea
              id="address"
              rows={2}
              placeholder="Alamat lengkap pasien"
              {...form.register("address")}
            />
          </FormField>

          <FormField label="Catatan" htmlFor="notes" className="sm:col-span-2">
            <Textarea
              id="notes"
              rows={2}
              placeholder="Catatan penting, misalnya alergi obat"
              {...form.register("notes")}
            />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <label htmlFor="isActive" className="text-sm font-medium">
                Status Pasien Aktif
              </label>
              <p className="text-xs text-muted-foreground">
                Pasien nonaktif tetap memiliki riwayat, hanya disembunyikan dari pencarian default.
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive ?? true}
              onCheckedChange={(checked) =>
                form.setValue("isActive", Boolean(checked), { shouldDirty: true })
              }
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting} className={cn("sm:min-w-40")}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Menyimpan...
            </>
          ) : isEditing ? (
            "Simpan Perubahan"
          ) : (
            "Simpan Pasien"
          )}
        </Button>
      </div>
    </form>
  );
}