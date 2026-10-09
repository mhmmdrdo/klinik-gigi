import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const patientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(120, "Nama terlalu panjang"),
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "NIK harus 16 digit angka")
    .or(z.literal(""))
    .optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female"], {
    message: "Jenis kelamin wajib dipilih",
  }),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor WhatsApp minimal 8 digit")
    .max(20, "Nomor terlalu panjang"),
  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .or(z.literal(""))
    .optional(),
  address: optionalText,
  notes: optionalText,
  isActive: z.boolean().optional(),
});

export type PatientInput = z.infer<typeof patientSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  remember: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const treatmentSchema = z.object({
  name: z.string().trim().min(2, "Nama tindakan minimal 2 karakter").max(100),
  category: z.string().trim().min(1, "Kategori wajib dipilih"),
  defaultPrice: z.coerce
    .number({ message: "Harga harus berupa angka" })
    .min(0, "Harga tidak boleh negatif"),
  description: optionalText,
  isActive: z.boolean().optional(),
});

export type TreatmentInput = z.infer<typeof treatmentSchema>;

export const visitTreatmentLineSchema = z.object({
  treatmentId: z.string().min(1, "Tindakan wajib dipilih"),
  toothNumber: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Qty minimal 1").max(99),
  unitPrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  notes: optionalText,
});

export type VisitTreatmentLineInput = z.infer<typeof visitTreatmentLineSchema>;

export const visitSchema = z.object({
  patientId: z.string().min(1, "Pasien wajib dipilih"),
  doctorId: z.string().min(1, "Dokter wajib dipilih"),
  visitDate: z.string().min(1, "Tanggal kunjungan wajib diisi"),
  complaint: z.string().trim().max(255).optional().nullable(),
  examinationNotes: z.string().trim().optional().nullable(),
  diagnosis: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  status: z.enum(["waiting", "in_progress", "completed", "cancelled"]),
  discount: z.coerce.number().min(0).optional(),
  items: z
    .array(visitTreatmentLineSchema)
    .min(1, "Minimal tambahkan satu tindakan perawatan"),
});

export type VisitInput = z.infer<typeof visitSchema>;

export const paymentSchema = z.object({
  visitId: z.string().min(1, "Kunjungan wajib dipilih"),
  amount: z.coerce
    .number({ message: "Jumlah bayar wajib diisi" })
    .min(1, "Jumlah bayar harus lebih dari 0"),
  paymentMethod: z.enum(["cash", "bank_transfer", "qris", "debit", "other"]),
  paymentDate: z.string().min(1, "Tanggal bayar wajib diisi"),
  notes: optionalText,
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Pasien wajib dipilih"),
  doctorId: z.string().min(1, "Dokter wajib dipilih"),
  appointmentDate: z.string().min(1, "Tanggal reservasi wajib diisi"),
  appointmentTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format jam harus HH:MM"),
  complaint: optionalText,
  notes: optionalText,
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const clinicSchema = z.object({
  name: z.string().trim().min(2, "Nama klinik minimal 2 karakter").max(120),
  address: z.string().trim().min(1, "Alamat wajib diisi"),
  phone: z.string().trim().min(1, "No. telepon wajib diisi"),
  whatsapp: z.string().trim().min(1, "No. WhatsApp wajib diisi"),
  email: z.string().trim().email("Format email tidak valid").or(z.literal("")).optional(),
  doctorName: z.string().trim().optional(),
});

export type ClinicInput = z.infer<typeof clinicSchema>;

export const userSchema = z.object({
  fullName: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  email: z.string().trim().email("Format email tidak valid"),
  role: z.enum(["admin", "doctor"]),
  phone: z.string().trim().optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  isActive: z.boolean().optional(),
});

export type UserInput = z.infer<typeof userSchema>;