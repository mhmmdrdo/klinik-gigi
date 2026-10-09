"use client";

import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-parts";
import { PatientForm } from "@/components/patient-form";
import { patientService } from "@/lib/services";
import { useQuery } from "@tanstack/react-query";

export function PatientCreateView() {
  const router = useRouter();

  // Preview the number the backend will assign (PRD 53: generated server-side).
  const previewQuery = useQuery({
    queryKey: ["patients", "next-mrn"],
    queryFn: async () => {
      const list = await patientService.list({ page: 1, pageSize: 1000 });
      const max = list.rows.reduce((acc, row) => {
        const n = Number.parseInt(row.medicalRecordNumber.replace(/\D/g, ""), 10);
        return Number.isNaN(n) ? acc : Math.max(acc, n);
      }, 0);
      return `P-${String(max + 1).padStart(6, "0")}`;
    },
    staleTime: 0,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Tambah Pasien"
        description="Lengkapi data identitas pasien. No. rekam dibuat otomatis."
        icon={UserPlus}
      />
      <PatientForm
        lockedMrn={previewQuery.data}
        onCancel={() => router.push("/patients")}
        onSaved={(patientId) => router.push(`/patients/${patientId}`)}
      />
    </div>
  );
}