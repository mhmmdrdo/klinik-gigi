export type Role = "admin" | "doctor";

export type Gender = "male" | "female";

export type VisitStatus = "waiting" | "in_progress" | "completed" | "cancelled";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentMethod = "cash" | "bank_transfer" | "qris" | "debit" | "other";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  clinicId: string;
  fullName: string;
  email: string;
  role: Role;
  phone: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  medicalRecordNumber: string;
  fullName: string;
  nik: string | null;
  dateOfBirth: string | null;
  gender: Gender;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  complaint: string | null;
  notes: string | null;
  status: AppointmentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  clinicId: string;
  visitNumber: string;
  patientId: string;
  doctorId: string;
  appointmentId: string | null;
  visitDate: string;
  complaint: string | null;
  examinationNotes: string | null;
  diagnosis: string | null;
  notes: string | null;
  status: VisitStatus;
  discount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  clinicId: string;
  name: string;
  category: string;
  defaultPrice: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VisitTreatment {
  id: string;
  visitId: string;
  treatmentId: string;
  toothNumber: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  clinicId: string;
  visitId: string;
  patientId: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export type AuditAction =
  | "CREATE_PATIENT"
  | "UPDATE_PATIENT"
  | "CREATE_VISIT"
  | "UPDATE_VISIT"
  | "CREATE_TREATMENT"
  | "UPDATE_TREATMENT"
  | "CREATE_PAYMENT"
  | "UPDATE_CLINIC"
  | "CREATE_USER"
  | "UPDATE_USER";

export interface AuditLog {
  id: string;
  clinicId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

export interface Session {
  user: Profile;
  clinic: Clinic;
  token: string;
}