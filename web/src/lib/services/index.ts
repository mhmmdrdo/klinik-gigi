import type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Clinic,
  Patient,
  Payment,
  PaymentMethod,
  Profile,
  Role,
  Treatment,
  Visit,
  VisitStatus,
  VisitTreatment,
} from "@/types";
import {
  formatPaymentNumber,
  formatVisitNumber,
  generateId,
  nowIso,
} from "@/lib/mock/db";
import { createAuditLog, delay, getDb, mutateDb } from "@/lib/mock/store";
import { DEMO_PASSWORD, TREATMENT_CATEGORY_LIST } from "@/lib/mock/seed";
import { computeVisitTotals, hasPermission, roundRupiah } from "@/lib/domain";
import type {
  AppointmentInput,
  ClinicInput,
  PatientInput,
  PaymentInput,
  TreatmentInput,
  UserInput,
  VisitInput,
} from "@/lib/validators/schemas";

export class ApiError extends Error {
  constructor(message: string, readonly code = "BAD_REQUEST") {
    super(message);
    this.name = "ApiError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Anda tidak memiliki akses untuk aksi ini.") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

function requirePermission(role: Role, permission: Parameters<typeof hasPermission>[1]) {
  if (!hasPermission(role, permission)) throw new ForbiddenError();
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

function paginate<T>(rows: T[], page: number, pageSize: number): Paginated<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function makePatientNumber(patients: Patient[]): string {
  const max = patients.reduce((acc, p) => {
    const n = Number.parseInt(p.medicalRecordNumber.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `P-${String(max + 1).padStart(6, "0")}`;
}

function withPayments(visitId: string) {
  return getDb().payments.filter((p) => p.visitId === visitId);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface Credentials {
  email: string;
  password: string;
  remember: boolean;
}

export const DEMO_ACCOUNTS: { email: string; password: string; role: Role; label: string }[] = [
  { email: "admin@klinik.id", password: DEMO_PASSWORD, role: "admin", label: "Admin / Perawat" },
  { email: "dokter@klinik.id", password: DEMO_PASSWORD, role: "doctor", label: "Dokter" },
];

export const authService = {
  async login(credentials: Credentials) {
    await delay(null, 500);
    const db = getDb();
    const profile = db.profiles.find(
      (p) => p.email.toLowerCase() === credentials.email.toLowerCase(),
    );

    if (!profile || credentials.password !== DEMO_PASSWORD) {
      throw new ApiError("Email atau password salah.", "INVALID_CREDENTIALS");
    }
    if (!profile.isActive) {
      throw new ApiError("Akun Anda sedang dinonaktifkan. Hubungi admin klinik.", "INACTIVE");
    }

    const clinic = db.clinics.find((c) => c.id === profile.clinicId) ?? db.clinics[0];
    return { user: profile, clinic, token: `mock-${profile.id}-${Date.now()}` };
  },
};

// ---------------------------------------------------------------------------
// Clinic
// ---------------------------------------------------------------------------

export const clinicService = {
  async get(): Promise<Clinic> {
    await delay(null, 120);
    return getDb().clinics[0];
  },

  async update(input: ClinicInput, actor: Profile): Promise<Clinic> {
    requirePermission(actor.role, "settings:manage");
    await delay(null, 350);
    return mutateDb((db) => {
      const clinic = db.clinics[0];
      clinic.name = input.name;
      clinic.address = input.address;
      clinic.phone = input.phone;
      clinic.whatsapp = input.whatsapp;
      clinic.email = input.email || "";
      clinic.updatedAt = nowIso();
      createAuditLog(
        db,
        actor,
        "UPDATE_CLINIC",
        "clinic",
        clinic.id,
        `${actor.fullName} memperbarui profil klinik`,
      );
      return clinic;
    });
  },
};

// ---------------------------------------------------------------------------
// Users / doctors
// ---------------------------------------------------------------------------

export const userService = {
  async list(): Promise<Profile[]> {
    await delay(null, 150);
    return [...getDb().profiles].sort((a, b) => a.fullName.localeCompare(b.fullName));
  },

  async doctors(): Promise<Profile[]> {
    await delay(null, 120);
    return getDb()
      .profiles.filter((p) => p.role === "doctor" && p.isActive)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  },

  async create(input: UserInput, actor: Profile): Promise<Profile> {
    requirePermission(actor.role, "user:manage");
    await delay(null, 400);
    return mutateDb((db) => {
      if (db.profiles.some((p) => p.email.toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError("Email tersebut sudah digunakan.", "DUPLICATE_EMAIL");
      }
      const profile: Profile = {
        id: generateId(),
        clinicId: db.clinicId,
        fullName: input.fullName,
        email: input.email,
        role: input.role,
        phone: input.phone ?? "",
        avatarUrl: null,
        isActive: input.isActive ?? true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.profiles.push(profile);
      createAuditLog(db, actor, "CREATE_USER", "profile", profile.id, `${actor.fullName} membuat user ${profile.fullName}`);
      return profile;
    });
  },

  async update(id: string, input: UserInput, actor: Profile): Promise<Profile> {
    requirePermission(actor.role, "user:manage");
    await delay(null, 400);
    return mutateDb((db) => {
      const profile = db.profiles.find((p) => p.id === id);
      if (!profile) throw new ApiError("Pengguna tidak ditemukan.", "NOT_FOUND");
      const duplicate = db.profiles.find(
        (p) => p.id !== id && p.email.toLowerCase() === input.email.toLowerCase(),
      );
      if (duplicate) throw new ApiError("Email tersebut sudah digunakan.", "DUPLICATE_EMAIL");

      profile.fullName = input.fullName;
      profile.email = input.email;
      profile.role = input.role;
      profile.phone = input.phone ?? "";
      profile.isActive = input.isActive ?? true;
      profile.updatedAt = nowIso();
      createAuditLog(db, actor, "UPDATE_USER", "profile", id, `${actor.fullName} memperbarui user ${profile.fullName}`);
      return profile;
    });
  },

  async setActive(id: string, isActive: boolean, actor: Profile): Promise<Profile> {
    requirePermission(actor.role, "user:manage");
    await delay(null, 350);
    return mutateDb((db) => {
      const profile = db.profiles.find((p) => p.id === id);
      if (!profile) throw new ApiError("Pengguna tidak ditemukan.", "NOT_FOUND");
      if (profile.id === actor.id && !isActive) {
        throw new ApiError("Anda tidak dapat menonaktifkan akun Anda sendiri.", "SELF_DISABLE");
      }
      profile.isActive = isActive;
      profile.updatedAt = nowIso();
      createAuditLog(
        db,
        actor,
        "UPDATE_USER",
        "profile",
        id,
        `${actor.fullName} ${isActive ? "mengaktifkan" : "menonaktifkan"} user ${profile.fullName}`,
      );
      return profile;
    });
  },
};

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export interface PatientFilters {
  search?: string;
  status?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
}

export interface PatientListItem extends Patient {
  lastVisitDate: string | null;
  visitCount: number;
  totalSpent: number;
  outstanding: number;
}

export const patientService = {
  async list(filters: PatientFilters = {}): Promise<Paginated<PatientListItem>> {
    await delay(null, 220);
    const db = getDb();
    const query = normalize(filters.search);
    const status = filters.status ?? "all";

    const enriched = db.patients
      .filter((p) => p.clinicId === db.clinicId)
      .map((patient) => {
        const visits = db.visits.filter(
          (v) => v.patientId === patient.id && v.status !== "cancelled",
        );
        let total = 0;
        let outstanding = 0;
        for (const visit of visits) {
          const visitPaid = db.payments
            .filter((pay) => pay.visitId === visit.id)
            .reduce((sum, pay) => sum + pay.amount, 0);
          const lines = db.visitTreatments.filter((vt) => vt.visitId === visit.id);
          const totals = computeVisitTotals(lines, visit.discount, visitPaid);
          total += totals.total;
          outstanding += totals.outstanding;
        }
        return {
          ...patient,
          lastVisitDate: visits.length
            ? visits.reduce((max, v) => (v.visitDate > max ? v.visitDate : max), visits[0].visitDate)
            : null,
          visitCount: visits.length,
          totalSpent: roundRupiah(total),
          outstanding: roundRupiah(outstanding),
        } satisfies PatientListItem;
      })
      .filter((p) => {
        if (status === "active" && !p.isActive) return false;
        if (status === "inactive" && p.isActive) return false;
        if (!query) return true;
        return (
          normalize(p.fullName).includes(query) ||
          normalize(p.phone).includes(query) ||
          normalize(p.medicalRecordNumber).includes(query)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return paginate(enriched, filters.page ?? 1, filters.pageSize ?? 10);
  },

  async get(id: string): Promise<PatientListItem> {
    await delay(null, 180);
    const db = getDb();
    const patient = db.patients.find((p) => p.id === id);
    if (!patient) throw new ApiError("Pasien tidak ditemukan.", "NOT_FOUND");
    return this.summarize(patient.id) as Promise<PatientListItem>;
  },

  async summarize(patientId: string) {
    const db = getDb();
    const patient = db.patients.find((p) => p.id === patientId);
    if (!patient) throw new ApiError("Pasien tidak ditemukan.", "NOT_FOUND");

    const visits = db.visits
      .filter((v) => v.patientId === patientId && v.status !== "cancelled")
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate));

    let total = 0;
    let outstanding = 0;
    for (const visit of visits) {
      const visitPaid = withPayments(visit.id).reduce((sum, pay) => sum + pay.amount, 0);
      const lines = db.visitTreatments.filter((vt) => vt.visitId === visit.id);
      const totals = computeVisitTotals(lines, visit.discount, visitPaid);
      total += totals.total;
      outstanding += totals.outstanding;
    }

    return {
      ...patient,
      lastVisitDate: visits[0]?.visitDate ?? null,
      visitCount: visits.length,
      totalSpent: roundRupiah(total),
      outstanding: roundRupiah(outstanding),
    } satisfies PatientListItem;
  },

  async create(input: PatientInput, actor: Profile): Promise<Patient> {
    requirePermission(actor.role, "patient:create");
    await delay(null, 450);
    return mutateDb((db) => {
      const patient: Patient = {
        id: generateId(),
        clinicId: db.clinicId,
        medicalRecordNumber: makePatientNumber(db.patients),
        fullName: input.fullName,
        nik: input.nik || null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth).toISOString() : null,
        gender: input.gender,
        phone: input.phone,
        email: input.email || null,
        address: input.address ?? null,
        notes: input.notes ?? null,
        isActive: input.isActive ?? true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        createdBy: actor.id,
      };
      db.patients.push(patient);
      createAuditLog(db, actor, "CREATE_PATIENT", "patient", patient.id, `${actor.fullName} membuat pasien ${patient.fullName}`);
      return patient;
    });
  },

  async update(id: string, input: PatientInput, actor: Profile): Promise<Patient> {
    requirePermission(actor.role, "patient:update");
    await delay(null, 400);
    return mutateDb((db) => {
      const patient = db.patients.find((p) => p.id === id);
      if (!patient) throw new ApiError("Pasien tidak ditemukan.", "NOT_FOUND");
      patient.fullName = input.fullName;
      patient.nik = input.nik || null;
      patient.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth).toISOString() : null;
      patient.gender = input.gender;
      patient.phone = input.phone;
      patient.email = input.email || null;
      patient.address = input.address ?? null;
      patient.notes = input.notes ?? null;
      patient.isActive = input.isActive ?? true;
      patient.updatedAt = nowIso();
      createAuditLog(db, actor, "UPDATE_PATIENT", "patient", id, `${actor.fullName} mengubah data pasien ${patient.fullName}`);
      return patient;
    });
  },

  /** PRD Rule 1: patients are never hard-deleted, only deactivated. */
  async setActive(id: string, isActive: boolean, actor: Profile): Promise<Patient> {
    requirePermission(actor.role, "patient:update");
    await delay(null, 350);
    return mutateDb((db) => {
      const patient = db.patients.find((p) => p.id === id);
      if (!patient) throw new ApiError("Pasien tidak ditemukan.", "NOT_FOUND");
      patient.isActive = isActive;
      patient.updatedAt = nowIso();
      createAuditLog(
        db,
        actor,
        "UPDATE_PATIENT",
        "patient",
        id,
        `${actor.fullName} ${isActive ? "mengaktifkan" : "menonaktifkan"} pasien ${patient.fullName}`,
      );
      return patient;
    });
  },
};

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

export interface TreatmentFilters {
  search?: string;
  category?: string;
  status?: "all" | "active" | "inactive";
}

export const treatmentService = {
  async list(filters: TreatmentFilters = {}): Promise<Treatment[]> {
    await delay(null, 220);
    const db = getDb();
    const query = normalize(filters.search);
    const status = filters.status ?? "all";
    return db.treatments
      .filter((t) => t.clinicId === db.clinicId)
      .filter((t) => {
        if (status === "active" && !t.isActive) return false;
        if (status === "inactive" && t.isActive) return false;
        if (!query) return true;
        return normalize(t.name).includes(query) || normalize(t.category).includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  categories(): string[] {
    const fromDb = getDb().treatments.map((t) => t.category);
    return Array.from(new Set([...TREATMENT_CATEGORY_LIST, ...fromDb])).filter(Boolean);
  },

  async create(input: TreatmentInput, actor: Profile): Promise<Treatment> {
    requirePermission(actor.role, "treatment:manage");
    await delay(null, 400);
    return mutateDb((db) => {
      const treatment: Treatment = {
        id: generateId(),
        clinicId: db.clinicId,
        name: input.name,
        category: input.category,
        defaultPrice: roundRupiah(input.defaultPrice),
        description: input.description ?? null,
        isActive: input.isActive ?? true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.treatments.push(treatment);
      createAuditLog(db, actor, "CREATE_TREATMENT", "treatment", treatment.id, `${actor.fullName} menambahkan tindakan ${treatment.name}`);
      return treatment;
    });
  },

  async update(id: string, input: TreatmentInput, actor: Profile): Promise<Treatment> {
    requirePermission(actor.role, "treatment:manage");
    await delay(null, 400);
    return mutateDb((db) => {
      const treatment = db.treatments.find((t) => t.id === id);
      if (!treatment) throw new ApiError("Tindakan tidak ditemukan.", "NOT_FOUND");
      treatment.name = input.name;
      treatment.category = input.category;
      treatment.defaultPrice = roundRupiah(input.defaultPrice);
      treatment.description = input.description ?? null;
      treatment.isActive = input.isActive ?? true;
      treatment.updatedAt = nowIso();
      createAuditLog(db, actor, "UPDATE_TREATMENT", "treatment", id, `${actor.fullName} memperbarui tindakan ${treatment.name}`);
      return treatment;
    });
  },

  async setActive(id: string, isActive: boolean, actor: Profile): Promise<Treatment> {
    requirePermission(actor.role, "treatment:manage");
    await delay(null, 300);
    return mutateDb((db) => {
      const treatment = db.treatments.find((t) => t.id === id);
      if (!treatment) throw new ApiError("Tindakan tidak ditemukan.", "NOT_FOUND");
      treatment.isActive = isActive;
      treatment.updatedAt = nowIso();
      return treatment;
    });
  },
};

// ---------------------------------------------------------------------------
// Visits
// ---------------------------------------------------------------------------

export interface VisitFilters {
  search?: string;
  doctorId?: string;
  status?: VisitStatus | "all";
  /** FIX: filter metode pembayaran (kunjungan yang punya pembayaran dengan metode ini). */
  method?: PaymentMethod | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface VisitListItem {
  visit: Visit;
  patient: Patient;
  doctor: Profile;
  treatments: VisitTreatment[];
  totals: ReturnType<typeof computeVisitTotals>;
}

function buildVisitListItem(visit: Visit): VisitListItem {
  const db = getDb();
  const patient = db.patients.find((p) => p.id === visit.patientId);
  const doctor = db.profiles.find((p) => p.id === visit.doctorId);
  if (!patient) throw new ApiError("Data pasien kunjungan tidak ditemukan.", "BROKEN_REF");
  if (!doctor) throw new ApiError("Data dokter kunjungan tidak ditemukan.", "BROKEN_REF");

  const treatments = db.visitTreatments.filter((vt) => vt.visitId === visit.id);
  const paid = withPayments(visit.id).reduce((sum, pay) => sum + pay.amount, 0);
  return {
    visit,
    patient,
    doctor,
    treatments,
    totals: computeVisitTotals(treatments, visit.discount, paid),
  };
}

export const visitService = {
  async list(filters: VisitFilters = {}): Promise<Paginated<VisitListItem>> {
    await delay(null, 250);
    const db = getDb();
    const query = normalize(filters.search);
    const doctorId = filters.doctorId ?? "all";
    const status = filters.status ?? "all";
    const methodFilter = filters.method ?? "all";

    const rows = db.visits
      .filter((v) => v.clinicId === db.clinicId)
      .filter((v) => {
        if (doctorId !== "all" && v.doctorId !== doctorId) return false;
        if (status !== "all" && v.status !== status) return false;
        if (filters.dateFrom && v.visitDate < filters.dateFrom) return false;
        if (filters.dateTo && v.visitDate > `${filters.dateTo}T23:59:59.999Z`) return false;
        // FIX: filter metode pembayaran.
        if (methodFilter !== "all") {
          const hasMethod = db.payments.some(
            (p) => p.visitId === v.id && p.paymentMethod === methodFilter,
          );
          if (!hasMethod) return false;
        }
        if (!query) return true;
        const patient = db.patients.find((p) => p.id === v.patientId);
        return (
          normalize(patient?.fullName ?? "").includes(query) ||
          normalize(v.visitNumber).includes(query) ||
          normalize(v.complaint ?? "").includes(query) ||
          normalize(v.diagnosis ?? "").includes(query)
        );
      })
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
      .map(buildVisitListItem);

    return paginate(rows, filters.page ?? 1, filters.pageSize ?? 10);
  },

  async get(id: string): Promise<VisitListItem> {
    await delay(null, 200);
    const visit = getDb().visits.find((v) => v.id === id);
    if (!visit) throw new ApiError("Kunjungan tidak ditemukan.", "NOT_FOUND");
    return buildVisitListItem(visit);
  },

  async paymentsFor(visitId: string): Promise<Payment[]> {
    await delay(null, 120);
    return withPayments(visitId).sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  },

  async create(input: VisitInput, actor: Profile): Promise<Visit> {
    requirePermission(actor.role, "visit:create");
    await delay(null, 500);
    return mutateDb((db) => {
      const visitDate = new Date(input.visitDate);
      const dayKey = visitDate.toISOString().slice(0, 10);
      const sameDay = db.visits.filter((v) => v.visitDate.slice(0, 10) === dayKey);
      const seq =
        sameDay.reduce((max, v) => {
          const n = Number.parseInt(v.visitNumber.split("-").pop() ?? "0", 10);
          return Number.isNaN(n) ? max : Math.max(max, n);
        }, 0) + 1;

      const visit: Visit = {
        id: generateId(),
        clinicId: db.clinicId,
        visitNumber: formatVisitNumber(seq, visitDate),
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointmentId: null,
        visitDate: visitDate.toISOString(),
        complaint: input.complaint ?? null,
        examinationNotes: input.examinationNotes ?? null,
        diagnosis: input.diagnosis ?? null,
        notes: input.notes ?? null,
        status: input.status,
        discount: roundRupiah(input.discount ?? 0),
        createdBy: actor.id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.visits.push(visit);

      // PRD section 41: snapshot unit_price so future price changes never rewrite history.
      for (const line of input.items) {
        const unitPrice = roundRupiah(line.unitPrice);
        db.visitTreatments.push({
          id: generateId(),
          visitId: visit.id,
          treatmentId: line.treatmentId,
          toothNumber: line.toothNumber || null,
          quantity: line.quantity,
          unitPrice,
          subtotal: roundRupiah(unitPrice * line.quantity),
          notes: line.notes ?? null,
          createdAt: nowIso(),
        });
      }

      createAuditLog(db, actor, "CREATE_VISIT", "visit", visit.id, `${actor.fullName} membuat kunjungan ${visit.visitNumber}`);
      return visit;
    });
  },

  async update(id: string, input: VisitInput, actor: Profile): Promise<Visit> {
    requirePermission(actor.role, "visit:update");
    await delay(null, 450);
    return mutateDb((db) => {
      const visit = db.visits.find((v) => v.id === id);
      if (!visit) throw new ApiError("Kunjungan tidak ditemukan.", "NOT_FOUND");

      visit.doctorId = input.doctorId;
      visit.complaint = input.complaint ?? null;
      visit.examinationNotes = input.examinationNotes ?? null;
      visit.diagnosis = input.diagnosis ?? null;
      visit.notes = input.notes ?? null;
      visit.status = input.status;
      visit.discount = roundRupiah(input.discount ?? 0);
      visit.updatedAt = nowIso();

      db.visitTreatments = db.visitTreatments.filter((vt) => vt.visitId !== id);
      for (const line of input.items) {
        const unitPrice = roundRupiah(line.unitPrice);
        db.visitTreatments.push({
          id: generateId(),
          visitId: id,
          treatmentId: line.treatmentId,
          toothNumber: line.toothNumber || null,
          quantity: line.quantity,
          unitPrice,
          subtotal: roundRupiah(unitPrice * line.quantity),
          notes: line.notes ?? null,
          createdAt: nowIso(),
        });
      }

      createAuditLog(db, actor, "UPDATE_VISIT", "visit", id, `${actor.fullName} memperbarui kunjungan ${visit.visitNumber}`);
      return visit;
    });
  },

  async setStatus(id: string, status: VisitStatus, actor: Profile): Promise<Visit> {
    requirePermission(actor.role, "visit:update");
    await delay(null, 250);
    return mutateDb((db) => {
      const visit = db.visits.find((v) => v.id === id);
      if (!visit) throw new ApiError("Kunjungan tidak ditemukan.", "NOT_FOUND");
      visit.status = status;
      visit.updatedAt = nowIso();
      createAuditLog(db, actor, "UPDATE_VISIT", "visit", id, `${actor.fullName} mengubah status kunjungan ke ${status}`);
      return visit;
    });
  },
};

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export interface PaymentFilters {
  search?: string;
  status?: "all" | "unpaid" | "partial" | "paid";
  method?: PaymentMethod | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaymentListItem {
  payment: Payment;
  patient: Patient;
  visit: Visit;
  total: number;
  paid: number;
  outstanding: number;
  status: ReturnType<typeof computeVisitTotals>["status"];
}

export const paymentService = {
  async list(filters: PaymentFilters = {}): Promise<Paginated<PaymentListItem>> {
    await delay(null, 260);
    const db = getDb();
    const query = normalize(filters.search);
    const status = filters.status ?? "all";
    const method = filters.method ?? "all";

    // Include visits with no payment at all so the "Belum Lunas" filter is meaningful.
    const rows = db.visits
      .filter((v) => v.clinicId === db.clinicId && v.status !== "cancelled")
      .map((visit) => {
        const visitPayments = db.payments.filter((p) => p.visitId === visit.id);
        const patient = db.patients.find((p) => p.id === visit.patientId);
        if (!patient) return null;
        const totals = computeVisitTotals(
          db.visitTreatments.filter((vt) => vt.visitId === visit.id),
          visit.discount,
          visitPayments.reduce((sum, p) => sum + p.amount, 0),
        );
        const representative: Payment = visitPayments[0] ?? {
          id: "",
          clinicId: visit.clinicId,
          visitId: visit.id,
          patientId: visit.patientId,
          paymentNumber: "—",
          paymentDate: visit.visitDate,
          amount: totals.paid,
          paymentMethod: "cash",
          notes: null,
          createdBy: visit.createdBy,
          createdAt: visit.visitDate,
        };
        return {
          payment: representative,
          patient,
          visit,
          total: totals.total,
          paid: totals.paid,
          outstanding: totals.outstanding,
          status: totals.status,
        } satisfies PaymentListItem;
      })
      .filter((row): row is PaymentListItem => row !== null)
      .filter((row) => {
        if (status !== "all" && row.status !== status) return false;
        if (method !== "all" && row.payment.paymentMethod !== method && row.paid > 0) return false;
        if (filters.dateFrom && row.visit.visitDate.slice(0, 10) < filters.dateFrom) return false;
        if (filters.dateTo && row.visit.visitDate.slice(0, 10) > filters.dateTo) return false;
        if (!query) return true;
        return (
          normalize(row.patient.fullName).includes(query) ||
          normalize(row.patient.medicalRecordNumber).includes(query) ||
          normalize(row.visit.visitNumber).includes(query) ||
          normalize(row.payment.paymentNumber).includes(query)
        );
      })
      .sort((a, b) => b.visit.visitDate.localeCompare(a.visit.visitDate));

    return paginate(rows, filters.page ?? 1, filters.pageSize ?? 10);
  },

  async create(input: PaymentInput, actor: Profile): Promise<Payment> {
    requirePermission(actor.role, "payment:create");
    await delay(null, 450);
    return mutateDb((db) => {
      const visit = db.visits.find((v) => v.id === input.visitId);
      if (!visit) throw new ApiError("Kunjungan tidak ditemukan.", "NOT_FOUND");

      const lines = db.visitTreatments.filter((vt) => vt.visitId === visit.id);
      const alreadyPaid = db.payments
        .filter((p) => p.visitId === visit.id)
        .reduce((sum, p) => sum + p.amount, 0);
      const totals = computeVisitTotals(lines, visit.discount, alreadyPaid);

      // PRD Rule 4: payment cannot exceed the outstanding balance in the MVP.
      const amount = roundRupiah(input.amount);
      if (amount > totals.outstanding) {
        throw new ApiError(
          `Jumlah bayar melebihi sisa tagihan (${totals.outstanding.toLocaleString("id-ID")}).`,
          "OVERPAYMENT",
        );
      }

      const paymentDate = new Date(input.paymentDate);
      const dayKey = paymentDate.toISOString().slice(0, 10);
      const sameDay = db.payments.filter((p) => p.paymentDate.slice(0, 10) === dayKey);
      const seq =
        sameDay.reduce((max, p) => {
          const n = Number.parseInt(p.paymentNumber.split("-").pop() ?? "0", 10);
          return Number.isNaN(n) ? max : Math.max(max, n);
        }, 0) + 1;

      const payment: Payment = {
        id: generateId(),
        clinicId: db.clinicId,
        visitId: visit.id,
        patientId: visit.patientId,
        paymentNumber: formatPaymentNumber(seq, paymentDate),
        paymentDate: paymentDate.toISOString(),
        amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? null,
        createdBy: actor.id,
        createdAt: nowIso(),
      };
      db.payments.push(payment);
      createAuditLog(
        db,
        actor,
        "CREATE_PAYMENT",
        "payment",
        payment.id,
        `${actor.fullName} mencatat pembayaran ${payment.paymentNumber} sebesar Rp${amount.toLocaleString("id-ID")}`,
      );
      return payment;
    });
  },

  async forVisit(visitId: string): Promise<Payment[]> {
    await delay(null, 120);
    return withPayments(visitId).sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  },

  async outstandingVisits() {
    const rows = (await this.list({ page: 1, pageSize: 1000 })).rows.filter(
      (row) => row.outstanding > 0,
    );
    return rows;
  },
};

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export interface AppointmentFilters {
  search?: string;
  doctorId?: string;
  status?: AppointmentStatus | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AppointmentListItem {
  appointment: Appointment;
  patient: Patient;
  doctor: Profile;
}

function buildAppointmentRow(appointment: Appointment): AppointmentListItem {
  const db = getDb();
  const patient = db.patients.find((p) => p.id === appointment.patientId);
  const doctor = db.profiles.find((p) => p.id === appointment.doctorId);
  if (!patient || !doctor) throw new ApiError("Data reservasi tidak lengkap.", "BROKEN_REF");
  return { appointment, patient, doctor };
}

export const appointmentService = {
  async list(filters: AppointmentFilters = {}): Promise<Paginated<AppointmentListItem>> {
    await delay(null, 240);
    const db = getDb();
    const query = normalize(filters.search);
    const doctorId = filters.doctorId ?? "all";
    const status = filters.status ?? "all";

    const rows = db.appointments
      .filter((a) => a.clinicId === db.clinicId)
      .filter((a) => {
        if (doctorId !== "all" && a.doctorId !== doctorId) return false;
        if (status !== "all" && a.status !== status) return false;
        const day = a.appointmentDate.slice(0, 10);
        if (filters.dateFrom && day < filters.dateFrom) return false;
        if (filters.dateTo && day > filters.dateTo) return false;
        if (!query) return true;
        const patient = db.patients.find((p) => p.id === a.patientId);
        return (
          normalize(patient?.fullName ?? "").includes(query) ||
          normalize(patient?.medicalRecordNumber ?? "").includes(query) ||
          normalize(a.appointmentTime).includes(query)
        );
      })
      .sort((a, b) =>
        `${a.appointmentDate}${a.appointmentTime}`.localeCompare(
          `${b.appointmentDate}${b.appointmentTime}`,
        ),
      )
      .map(buildAppointmentRow);

    return paginate(rows, filters.page ?? 1, filters.pageSize ?? 20);
  },

  async create(input: AppointmentInput, actor: Profile): Promise<Appointment> {
    await delay(null, 400);
    return mutateDb((db) => {
      const appointment: Appointment = {
        id: generateId(),
        clinicId: db.clinicId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointmentDate: new Date(input.appointmentDate).toISOString(),
        appointmentTime: input.appointmentTime,
        complaint: input.complaint ?? null,
        notes: input.notes ?? null,
        status: input.status,
        createdBy: actor.id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.appointments.push(appointment);
      return appointment;
    });
  },

  async update(id: string, input: AppointmentInput, actor: Profile): Promise<Appointment> {
    void actor;
    await delay(null, 400);
    return mutateDb((db) => {
      const appointment = db.appointments.find((a) => a.id === id);
      if (!appointment) throw new ApiError("Reservasi tidak ditemukan.", "NOT_FOUND");
      appointment.patientId = input.patientId;
      appointment.doctorId = input.doctorId;
      appointment.appointmentDate = new Date(input.appointmentDate).toISOString();
      appointment.appointmentTime = input.appointmentTime;
      appointment.complaint = input.complaint ?? null;
      appointment.notes = input.notes ?? null;
      appointment.status = input.status;
      appointment.updatedAt = nowIso();
      return appointment;
    });
  },

  async setStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    await delay(null, 250);
    return mutateDb((db) => {
      const appointment = db.appointments.find((a) => a.id === id);
      if (!appointment) throw new ApiError("Reservasi tidak ditemukan.", "NOT_FOUND");
      appointment.status = status;
      appointment.updatedAt = nowIso();
      return appointment;
    });
  },

  async remove(id: string): Promise<void> {
    await delay(null, 300);
    mutateDb((db) => {
      db.appointments = db.appointments.filter((a) => a.id !== id);
    });
  },
};

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export const auditService = {
  async list(limit = 100): Promise<AuditLog[]> {
    await delay(null, 200);
    return getDb().auditLogs.slice(0, limit);
  },
};