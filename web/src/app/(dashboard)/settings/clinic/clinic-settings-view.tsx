"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-parts";
import { CardSkeletonGrid, ErrorState } from "@/components/states";
import { ApiError, clinicService } from "@/lib/services";
import { clinicSchema } from "@/lib/validators/schemas";
import { useAuth } from "@/providers/auth-provider";
import type { Clinic } from "@/types";

export function ClinicSettingsView() {
  const query = useQuery({
    queryKey: ["clinic"],
    queryFn: () => clinicService.get(),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Profil Klinik"
        description="Informasi dasar klinik yang tampil di aplikasi."
        icon={Building2}
      />
      {query.isPending ? (
        <CardSkeletonGrid count={2} />
      ) : query.isError || !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <ClinicForm clinic={query.data} />
      )}
    </div>
  );
}

function ClinicForm({ clinic }: { clinic: Clinic }) {
  const { user, updateClinic } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(clinic.name);
  const [address, setAddress] = useState(clinic.address);
  const [phone, setPhone] = useState(clinic.phone);
  const [whatsapp, setWhatsapp] = useState(clinic.whatsapp);
  const [email, setEmail] = useState(clinic.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setErrors({});

    const parsed = clinicSchema.safeParse({ name, address, phone, whatsapp, email });
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
      const saved = await clinicService.update(parsed.data, user);
      updateClinic({ ...saved });
      queryClient.invalidateQueries({ queryKey: ["clinic"] });
      toast.success("Profil klinik diperbarui");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal menyimpan profil klinik. Silakan coba lagi.",
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
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nama Klinik"
          htmlFor="clinic-name"
          error={errors.name}
          required
          className="sm:col-span-2"
        >
          <Input id="clinic-name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField
          label="Alamat"
          htmlFor="clinic-address"
          error={errors.address}
          required
          className="sm:col-span-2"
        >
          <Textarea
            id="clinic-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </FormField>
        <FormField label="No. Telepon" htmlFor="clinic-phone" error={errors.phone} required>
          <Input id="clinic-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <FormField
          label="No. WhatsApp"
          htmlFor="clinic-wa"
          error={errors.whatsapp}
          required
        >
          <Input id="clinic-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </FormField>
        <FormField
          label="Email"
          htmlFor="clinic-email"
          error={errors.email}
          className="sm:col-span-2"
        >
          <Input
            id="clinic-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="sm:min-w-40">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Perubahan"
          )}
        </Button>
      </div>
    </form>
  );
}