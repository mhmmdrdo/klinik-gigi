import type {
  AppointmentStatus,
  Gender,
  PaymentMethod,
  PaymentStatus,
  Role,
  VisitStatus,
} from "@/types";

export const APP_NAME = "Sistem Manajemen Klinik Gigi";
export const DEFAULT_CLINIC_NAME = "Klinik Gigi Sejahtera";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin / Perawat",
  doctor: "Dokter",
};

export const ROLE_SHORT_LABEL: Record<Role, string> = {
  admin: "Admin",
  doctor: "Dokter",
};

export const GENDER_LABEL: Record<Gender, string> = {
  male: "Laki-laki",
  female: "Perempuan",
};

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  waiting: "Menunggu",
  in_progress: "Sedang Diperiksa",
  completed: "Selesai",
  cancelled: "Batal",
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Tunai",
  bank_transfer: "Transfer",
  qris: "QRIS",
  debit: "Debit",
  other: "Lainnya",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Belum Lunas",
  partial: "Sebagian",
  paid: "Lunas",
};

export const TREATMENT_CATEGORIES = [
  "Konsultasi",
  "Preventif",
  "Restoratif",
  "Bedah",
  "Ortodonti",
  "Estetika",
  "Lainnya",
] as const;

export const TREATMENT_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Semua Kategori" },
  ...TREATMENT_CATEGORIES.map((c) => ({ value: c, label: c })),
];

export const TOOTH_NUMBERS = [
  "11", "12", "13", "14", "15", "16", "17", "18",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "31", "32", "33", "34", "35", "36", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48",
] as const;

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] =
  (Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((value) => ({
    value,
    label: PAYMENT_METHOD_LABEL[value],
  }));

export const VISIT_STATUS_OPTIONS: { value: VisitStatus; label: string }[] = (
  Object.keys(VISIT_STATUS_LABEL) as VisitStatus[]
).map((value) => ({ value, label: VISIT_STATUS_LABEL[value] }));

export const APPOINTMENT_STATUS_OPTIONS: {
  value: AppointmentStatus;
  label: string;
}[] = (Object.keys(APPOINTMENT_STATUS_LABEL) as AppointmentStatus[]).map(
  (value) => ({ value, label: APPOINTMENT_STATUS_LABEL[value] }),
);

export const GENDER_OPTIONS: { value: Gender; label: string }[] = (
  Object.keys(GENDER_LABEL) as Gender[]
).map((value) => ({ value, label: GENDER_LABEL[value] }));

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];