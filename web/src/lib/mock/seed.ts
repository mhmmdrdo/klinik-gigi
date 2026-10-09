import type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Clinic,
  Patient,
  Payment,
  PaymentMethod,
  Profile,
  Treatment,
  Visit,
  VisitStatus,
  VisitTreatment,
} from "@/types";
import {
  formatPatientNumber,
  formatPaymentNumber,
  formatVisitNumber,
  SEED_VERSION,
  writeRawDb,
} from "./db";
import { addDays, setTimeOnDate, shiftDays } from "./seed-dates";
import { seededRandom } from "./db";

export const DEFAULT_CLINIC_ID = "clinic-0001";

export interface Db {
  seedVersion: number;
  clinicId: string;
  clinics: Clinic[];
  profiles: Profile[];
  patients: Patient[];
  appointments: Appointment[];
  visits: Visit[];
  treatments: Treatment[];
  visitTreatments: VisitTreatment[];
  payments: Payment[];
  auditLogs: AuditLog[];
}

export const DEMO_PASSWORD = "password123";

const FIRST_NAMES_M = [
  "Budi", "Agus", "Dedi", "Eko", "Fajar", "Gunawan", "Hendra", "Irfan",
  "Joko", "Kusuma", "Lukman", "Mardianto", "Nanda", "Oki", "Pranata",
  "Rizky", "Slamet", "Taufik", "Umar", "Wahyu", "Yusuf", "Zainuddin",
];

const FIRST_NAMES_F = [
  "Siti", "Ayu", "Bunga", "Citra", "Dewi", "Endah", "Fitri", "Gita",
  "Hana", "Indah", "Jihan", "Kartika", "Lina", "Maya", "Nadia",
  "Putri", "Rina", "Sari", "Tiara", "Wulan", "Yuni", "Zahra",
];

const LAST_NAMES = [
  "Santoso", "Aminah", "Hidayat", "Pratama", "Wijaya", "Nugroho",
  "Saputra", "Lestari", "Anggraini", "Kusuma", "Handoko", "Permata",
  "Simanjuntak", "Nasution", "Simbolon", "Halim", "Sari", "Maulana",
  "Firmansyah", "Ramadhan", "Utama", "Prasetya",
];

const ADDRESSES = [
  "Jl. Riau No. 12, Pekanbaru",
  "Jl. Sudirman No. 45, Pekanbaru",
  "Jl. Tuanku Abdul Rahman No. 8, Pekanbaru",
  "Jl. Gatot Subroto No. 210, Pekanbaru",
  "Jl. Ahmad Yani No. 3, Pekanbaru",
  "Jl. Viboyatani No. 17, Pekanbaru",
  "Jl. Hang Tuah No. 90, Pekanbaru",
  "Jl. Melati No. 5, Pekanbaru",
  "Jl. Chairman No. 22, Pekanbaru",
  "Jl. Arifin Ahmad No. 14, Pekanbaru",
];

const COMPLAINTS = [
  "Gigi belakang sakit",
  "Gigi berlubang",
  "Karang gigi",
  "Gigi sensitif ngilu",
  "Gigi goyang",
  "Bau mulut",
  "Sakit saat makan dingin",
  "Gigi depan berubah warna",
  "Bengkak di gusi",
  "Gigi patah",
];

const DIAGNOSES = [
  "Karies",
  "Karies profunda",
  "Gingivitis",
  "Periodontitis",
  "Gigi Pulpitis Irreversible",
  "Dentes Impacted",
  "Karies sekunder",
  "Abrasi",
];

const TREATMENT_SEED: {
  name: string;
  category: string;
  defaultPrice: number;
  description: string;
}[] = [
  { name: "Konsultasi", category: "Konsultasi", defaultPrice: 100000, description: "Pemeriksaan dan konsultasi dokter" },
  { name: "Scaling", category: "Preventif", defaultPrice: 300000, description: "Pembersihan karang gigi" },
  { name: "Tambal Gigi", category: "Restoratif", defaultPrice: 500000, description: "Penambalan karies satu permukaan" },
  { name: "Tambal Gigi 2 Muka", category: "Restoratif", defaultPrice: 750000, description: "Penambalan karies dua permukaan" },
  { name: "Cabut Gigi", category: "Bedah", defaultPrice: 400000, description: "Pencabutan gigi permanen" },
  { name: "Cabut Gigi Anak", category: "Bedah", defaultPrice: 350000, description: "Pencabutan gigi susu" },
  { name: "Perawanan Akar (Root Canal)", category: "Restoratif", defaultPrice: 1500000, description: "Perawatan saluran akar" },
  { name: "Tambal Gigi Fluro", category: "Preventif", defaultPrice: 200000, description: "Penambalan gigi dengan material fluro" },
  { name: "Crown / Mahkota Gigi", category: "Restoratif", defaultPrice: 2500000, description: "Pembuatan mahkota gigi" },
  { name: "Bleaching Gigi", category: "Estetika", defaultPrice: 1800000, description: "Pemutihan gigi" },
  { name: "Behel Gigi", category: "Ortodonti", defaultPrice: 7500000, description: "Perawatan gigi beruntun" },
  { name: "Tambal Gigi Komposit Estetik", category: "Estetika", defaultPrice: 650000, description: "Tambal komposit dengan warna natural" },
];

const TREATMENT_CATEGORY_LIST = [
  "Konsultasi",
  "Preventif",
  "Restoratif",
  "Bedah",
  "Ortodonti",
  "Estetika",
  "Lainnya",
];

const APPT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

const VISIT_STATUSES: VisitStatus[] = [
  "waiting",
  "in_progress",
  "completed",
  "completed",
  "completed",
  "cancelled",
];

const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "qris",
  "cash",
  "bank_transfer",
  "debit",
  "qris",
  "other",
];

/** Deterministic pseudo-random int in [min, max] from a seed. */
function randInt(seed: string, min: number, max: number): number {
  return min + Math.floor(seededRandom(seed) * (max - min + 1));
}

export function buildSeedDatabase(): Db {
  const createdAt = new Date("2026-01-05T08:00:00.000Z").toISOString();
  const now = new Date().toISOString();

  const clinic: Clinic = {
    id: DEFAULT_CLINIC_ID,
    name: "Klinik Gigi Sejahtera",
    address: "Jl. Riau No. 12, Pekanbaru, Riau 28112",
    phone: "(0761) 523456",
    whatsapp: "081234567890",
    email: "admin@klinikgigisejahtera.id",
    logoUrl: null,
    createdAt,
    updatedAt: now,
  };

  const profiles: Profile[] = [
    {
      id: "user-admin",
      clinicId: DEFAULT_CLINIC_ID,
      fullName: "Admin Klinik",
      email: "admin@klinik.id",
      role: "admin",
      phone: "081234567890",
      avatarUrl: null,
      isActive: true,
      createdAt,
      updatedAt: now,
    },
    {
      id: "user-doctor-1",
      clinicId: DEFAULT_CLINIC_ID,
      fullName: "drg. Andi Prasetyo",
      email: "dokter@klinik.id",
      role: "doctor",
      phone: "081298765432",
      avatarUrl: null,
      isActive: true,
      createdAt,
      updatedAt: now,
    },
    {
      id: "user-doctor-2",
      clinicId: DEFAULT_CLINIC_ID,
      fullName: "drg. Siti Rahma",
      email: "siti@klinik.id",
      role: "doctor",
      phone: "081377778888",
      avatarUrl: null,
      isActive: true,
      createdAt,
      updatedAt: now,
    },
    {
      id: "user-nurse",
      clinicId: DEFAULT_CLINIC_ID,
      fullName: "Sari Perawat",
      email: "perawat@klinik.id",
      role: "admin",
      phone: "081355554444",
      avatarUrl: null,
      isActive: false,
      createdAt,
      updatedAt: now,
    },
  ];

  const treatments: Treatment[] = TREATMENT_SEED.map((t, i) => ({
    id: `trt-${String(i + 1).padStart(3, "0")}`,
    clinicId: DEFAULT_CLINIC_ID,
    name: t.name,
    category: t.category,
    defaultPrice: t.defaultPrice,
    description: t.description,
    isActive: true,
    createdAt,
    updatedAt: now,
  }));

  const patients: Patient[] = [];
  const visits: Visit[] = [];
  const visitTreatments: VisitTreatment[] = [];
  const payments: Payment[] = [];
  const appointments: Appointment[] = [];

  const doctors = profiles.filter((p) => p.role === "doctor");
  const admin = profiles[0];

  // --- Patients -------------------------------------------------------------
  const patientCount = 48;
  for (let i = 0; i < patientCount; i += 1) {
    const seed = `patient-${i}`;
    const isMale = seededRandom(`${seed}-gender`) > 0.5;
    const first = isMale
      ? FIRST_NAMES_M[Math.floor(seededRandom(`${seed}-fn`) * FIRST_NAMES_M.length)]
      : FIRST_NAMES_F[Math.floor(seededRandom(`${seed}-fn`) * FIRST_NAMES_F.length)];
    const last = LAST_NAMES[Math.floor(seededRandom(`${seed}-ln`) * LAST_NAMES.length)];
    const birthYear = randInt(`${seed}-by`, 1975, 2020);
    const birthMonth = randInt(`${seed}-bm`, 1, 12);
    const birthDay = randInt(`${seed}-bd`, 1, 28);
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    const createdDaysAgo = randInt(`${seed}-ca`, 1, 240);

    patients.push({
      id: `pat-${String(i + 1).padStart(4, "0")}`,
      clinicId: DEFAULT_CLINIC_ID,
      medicalRecordNumber: formatPatientNumber(i + 1),
      fullName: `${first} ${last}`,
      nik: seededRandom(`${seed}-nik`) > 0.4
        ? `14${randInt(`${seed}-nik2`, 100000000000000, 999999999999999)}`
        : null,
      dateOfBirth: birthDate.toISOString(),
      gender: isMale ? "male" : "female",
      phone: `08${randInt(`${seed}-p1`, 11, 79)}${String(randInt(`${seed}-p2`, 1000000, 9999999)).padStart(7, "0")}`,
      email: seededRandom(`${seed}-em`) > 0.6
        ? `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`
        : null,
      address: ADDRESSES[Math.floor(seededRandom(`${seed}-ad`) * ADDRESSES.length)],
      notes: seededRandom(`${seed}-nt`) > 0.75 ? "Alergi penicillin" : null,
      isActive: seededRandom(`${seed}-ac`) > 0.12,
      // FIX: dihitung mundur dari hari ini, bukan dari tanggal lahir.
      createdAt: shiftDays(new Date(), createdDaysAgo).toISOString(),
      updatedAt: now,
      createdBy: admin.id,
    });
  }

  // --- Visits, visit treatments, payments -----------------------------------
  let visitCounter = 0;
  let paymentCounter = 0;
  const visitCounterByDay: Record<string, number> = {};
  const paymentCounterByDay: Record<string, number> = {};

  for (let dayOffset = 89; dayOffset >= 0; dayOffset -= 1) {
    const day = addDays(new Date(), -dayOffset);
    // Weekends busier, today lighter - mirrors the PRD's ~5 patients/day clinic.
    const dayOfWeek = day.getDay();
    const base = dayOfWeek === 0 ? 1 : dayOfWeek === 6 ? 3 : 2;
    const visitsToday = randInt(`day-${dayOffset}-n`, base, base + 3);

    for (let v = 0; v < visitsToday; v += 1) {
      const seed = `visit-${dayOffset}-${v}`;
      const patient = patients[Math.floor(seededRandom(`${seed}-p`) * patients.length)];
      const doctor = doctors[Math.floor(seededRandom(`${seed}-d`) * doctors.length)];
      const hour = randInt(`${seed}-h`, 9, 15);
      const minute = seededRandom(`${seed}-m`) > 0.5 ? 0 : 30;
      const visitDate = setTimeOnDate(day, hour, minute);
      const status: VisitStatus = dayOffset === 0
        ? VISIT_STATUSES[Math.floor(seededRandom(`${seed}-s`) * 2)]
        : VISIT_STATUSES[Math.floor(seededRandom(`${seed}-s`) * VISIT_STATUSES.length)];

      const dayKey = visitDate.toISOString().slice(0, 10);
      visitCounterByDay[dayKey] = (visitCounterByDay[dayKey] ?? 0) + 1;
      visitCounter += 1;

      const visitId = `vis-${String(visitCounter).padStart(4, "0")}`;
      visits.push({
        id: visitId,
        clinicId: DEFAULT_CLINIC_ID,
        visitNumber: formatVisitNumber(visitCounterByDay[dayKey], visitDate),
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentId: null,
        visitDate: visitDate.toISOString(),
        complaint: COMPLAINTS[Math.floor(seededRandom(`${seed}-c`) * COMPLAINTS.length)],
        examinationNotes: `Pemeriksaan pukul ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} - jaringan gingiva retraksi, karang tartar terlihat pada region posterior.`,
        diagnosis: DIAGNOSES[Math.floor(seededRandom(`${seed}-d2`) * DIAGNOSES.length)],
        notes: null,
        status,
        discount: seededRandom(`${seed}-disc`) > 0.85 ? 50000 : 0,
        createdBy: admin.id,
        createdAt: visitDate.toISOString(),
        updatedAt: visitDate.toISOString(),
      });

      // Treatments attached to this visit.
      const treatmentCount = randInt(`${seed}-tn`, 1, 3);
      let subtotal = 0;
      const used = new Set<string>();
      for (let t = 0; t < treatmentCount; t += 1) {
        const treatment = treatments[Math.floor(seededRandom(`${seed}-t${t}`) * treatments.length)];
        if (used.has(treatment.id)) continue;
        used.add(treatment.id);
        const qty = seededRandom(`${seed}-q${t}`) > 0.8 ? 2 : 1;
        const lineSubtotal = treatment.defaultPrice * qty;
        subtotal += lineSubtotal;
        visitTreatments.push({
          id: `vt-${visitId}-${t}`,
          visitId,
          treatmentId: treatment.id,
          toothNumber:
            treatment.category === "Restoratif" || treatment.category === "Bedah"
              ? String(randInt(`${seed}-tn${t}`, 11, 48))
              : null,
          quantity: qty,
          // Historical price snapshot - must not change when treatment price changes.
          unitPrice: treatment.defaultPrice,
          subtotal: lineSubtotal,
          notes: null,
          createdAt: visitDate.toISOString(),
        });
      }

      const total = Math.max(subtotal - (visits[visits.length - 1].discount ?? 0), 0);

      if (status === "cancelled") continue;

      // Payment: fully paid most of the time, partially sometimes, unpaid rarely.
      const payRoll = seededRandom(`${seed}-pay`);
      let amount = total;
      if (payRoll > 0.94) amount = 0;
      else if (payRoll > 0.82) amount = Math.round(total * 0.5 / 10000) * 10000;
      if (amount <= 0) continue;

      paymentCounterByDay[dayKey] = (paymentCounterByDay[dayKey] ?? 0) + 1;
      paymentCounter += 1;
      payments.push({
        id: `pay-${String(paymentCounter).padStart(4, "0")}`,
        clinicId: DEFAULT_CLINIC_ID,
        visitId,
        patientId: patient.id,
        paymentNumber: formatPaymentNumber(paymentCounterByDay[dayKey], visitDate),
        paymentDate: new Date(visitDate.getTime() + 20 * 60000).toISOString(),
        amount,
        paymentMethod: PAYMENT_METHODS[Math.floor(seededRandom(`${seed}-pm`) * PAYMENT_METHODS.length)],
        notes: null,
        createdBy: admin.id,
        createdAt: new Date(visitDate.getTime() + 20 * 60000).toISOString(),
      });
    }
  }

  // --- Appointments ---------------------------------------------------------
  let appointmentCounter = 0;
  for (let dayOffset = -7; dayOffset <= 14; dayOffset += 1) {
    const day = addDays(new Date(), dayOffset);
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0) continue;
    const count = dayOffset < 0 ? 2 : randInt(`appt-${dayOffset}-n`, 2, 5);
    for (let a = 0; a < count; a += 1) {
      const seed = `appt-${dayOffset}-${a}`;
      appointmentCounter += 1;
      const patient = patients[Math.floor(seededRandom(`${seed}-p`) * patients.length)];
      const doctor = doctors[Math.floor(seededRandom(`${seed}-d`) * doctors.length)];
      const hour = 9 + a;
      const appointmentDate = setTimeOnDate(day, hour, a % 2 === 0 ? 0 : 30);
      const status: AppointmentStatus =
        dayOffset < 0
          ? APPT_STATUSES[Math.floor(seededRandom(`${seed}-s`) * APPT_STATUSES.length)]
          : seededRandom(`${seed}-s2`) > 0.4
            ? "confirmed"
            : "pending";

      appointments.push({
        id: `apt-${String(appointmentCounter).padStart(4, "0")}`,
        clinicId: DEFAULT_CLINIC_ID,
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: appointmentDate.toISOString(),
        appointmentTime: `${String(hour).padStart(2, "0")}:${a % 2 === 0 ? "00" : "30"}`,
        complaint: COMPLAINTS[Math.floor(seededRandom(`${seed}-c`) * COMPLAINTS.length)],
        notes: null,
        status,
        createdBy: admin.id,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const auditLogs: AuditLog[] = [
    {
      id: "audit-0001",
      clinicId: DEFAULT_CLINIC_ID,
      userId: admin.id,
      userName: admin.fullName,
      action: "UPDATE_CLINIC",
      entityType: "clinic",
      entityId: clinic.id,
      description: `${admin.fullName} memperbarui profil klinik`,
      createdAt: now,
    },
    {
      id: "audit-0002",
      clinicId: DEFAULT_CLINIC_ID,
      userId: admin.id,
      userName: admin.fullName,
      action: "CREATE_TREATMENT",
      entityType: "treatment",
      entityId: treatments[2].id,
      description: `${admin.fullName} menambahkan tindakan ${treatments[2].name}`,
      createdAt: now,
    },
  ];

  return {
    seedVersion: SEED_VERSION,
    clinicId: DEFAULT_CLINIC_ID,
    clinics: [clinic],
    profiles,
    patients,
    appointments,
    visits,
    treatments,
    visitTreatments,
    payments,
    auditLogs,
  };
}

export function persistDb(db: Db): void {
  writeRawDb(JSON.stringify(db));
}

export { TREATMENT_CATEGORY_LIST };