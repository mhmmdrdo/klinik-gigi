import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const clinics = sqliteTable("clinics", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull().default(""),
  logoUrl: text("logo_url"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "doctor"] }).notNull(),
  phone: text("phone").notNull().default(""),
  avatarUrl: text("avatar_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  medicalRecordNumber: text("medical_record_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  nik: text("nik"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  createdBy: text("created_by").notNull(),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").notNull().references(() => profiles.id),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  complaint: text("complaint"),
  notes: text("notes"),
  status: text("status", {
    enum: ["pending", "confirmed", "completed", "cancelled", "no_show"],
  }).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const visits = sqliteTable("visits", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  visitNumber: text("visit_number").notNull().unique(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").notNull().references(() => profiles.id),
  appointmentId: text("appointment_id").references(() => appointments.id),
  visitDate: text("visit_date").notNull(),
  complaint: text("complaint"),
  examinationNotes: text("examination_notes"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  status: text("status", {
    enum: ["waiting", "in_progress", "completed", "cancelled"],
  }).notNull(),
  discount: integer("discount").notNull().default(0),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const treatments = sqliteTable("treatments", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  defaultPrice: integer("default_price").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const visitTreatments = sqliteTable("visit_treatments", {
  id: text("id").primaryKey(),
  visitId: text("visit_id").notNull().references(() => visits.id, { onDelete: "cascade" }),
  treatmentId: text("treatment_id").notNull().references(() => treatments.id),
  toothNumber: text("tooth_number"),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // snapshot harga saat kunjungan
  subtotal: integer("subtotal").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  visitId: text("visit_id").notNull().references(() => visits.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  paymentNumber: text("payment_number").notNull().unique(),
  paymentDate: text("payment_date").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method", {
    enum: ["cash", "bank_transfer", "qris", "debit", "other"],
  }).notNull(),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull().references(() => clinics.id),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  description: text("description").notNull(),
  createdAt: text("created_at").notNull(),
});