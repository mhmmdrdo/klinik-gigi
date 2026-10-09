"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/page-parts";
import { LoadingState } from "@/components/states";
import { VisitForm } from "@/components/visit-form";
import { patientService } from "@/lib/services";

export function VisitCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientService.get(patientId as string),
    enabled: Boolean(patientId),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Tambah Kunjungan"
        description="Pilih pasien, catat pemeriksaan, tambahkan tindakan, lalu simpan."
        icon={Stethoscope}
      />
      {patientId && patientQuery.isPending ? (
        <LoadingState label="Memuat data pasien..." />
      ) : (
        <VisitForm
          initialPatient={patientQuery.data ?? null}
          onCancel={() => router.push("/visits")}
          onSaved={(visitId) => router.push(`/visits/${visitId}`)}
        />
      )}
    </div>
  );
}