import { formatDayMonth, isToday, isSameDay, startOfDay, toDate } from "@/lib/format";
import { computeVisitTotals, roundRupiah } from "@/lib/domain";
import { getDb } from "@/lib/mock/store";
import type { Profile } from "@/types";
import type { VisitListItem } from "@/lib/services";

export type RevenueRange = "today" | "7d" | "30d" | "month";

export const REVENUE_RANGE_LABEL: Record<RevenueRange, string> = {
  today: "Hari ini",
  "7d": "7 Hari",
  "30d": "30 Hari",
  month: "Bulan ini",
};

export interface RevenuePoint {
  key: string;
  label: string;
  value: number;
}

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  todayVisits: number;
  todayRevenue: number;
  outstandingAmount: number;
  outstandingCount: number;
  todayTransactions: number;
  newPatientsThisMonth: number;
  todayAppointments: number;
}

export interface TodayVisitRow {
  visitId: string;
  patientId: string;
  visitNumber: string;
  time: string;
  patientName: string;
  patientMrn: string;
  doctorName: string;
  treatments: string[];
  status: VisitListItem["visit"]["status"];
  total: number;
}

export interface DashboardData {
  stats: DashboardStats;
  todayVisits: TodayVisitRow[];
  revenueSeries: RevenuePoint[];
  outstandingList: {
    visitId: string;
    patientId: string;
    visitNumber: string;
    patientName: string;
    patientMrn: string;
    total: number;
    paid: number;
    outstanding: number;
    visitDate: string;
  }[];
  upcomingAppointments: {
    id: string;
    time: string;
    patientName: string;
    doctorName: string;
    status: string;
  }[];
}

export async function getDashboard(range: RevenueRange = "7d"): Promise<DashboardData> {
  await new Promise((resolve) => setTimeout(resolve, 260));
  const db = getDb();
  const now = new Date();

  const activeVisits = db.visits.filter((v) => v.status !== "cancelled");

  const todayVisitRecords = activeVisits
    .filter((v) => isToday(v.visitDate))
    .sort((a, b) => a.visitDate.localeCompare(b.visitDate));

  const todayRevenue = db.payments
    .filter((p) => isToday(p.paymentDate))
    .reduce((sum, p) => sum + p.amount, 0);

  let outstandingCount = 0;
  let outstandingAmount = 0;
  for (const visit of activeVisits) {
    const paid = db.payments
      .filter((p) => p.visitId === visit.id)
      .reduce((sum, p) => sum + p.amount, 0);
    const totals = computeVisitTotals(
      db.visitTreatments.filter((vt) => vt.visitId === visit.id),
      visit.discount,
      paid,
    );
    if (totals.outstanding > 0) {
      outstandingCount += 1;
      outstandingAmount += totals.outstanding;
    }
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats: DashboardStats = {
    totalPatients: db.patients.length,
    activePatients: db.patients.filter((p) => p.isActive).length,
    todayVisits: todayVisitRecords.length,
    todayRevenue: roundRupiah(todayRevenue),
    outstandingAmount: roundRupiah(outstandingAmount),
    outstandingCount,
    todayTransactions: db.payments.filter((p) => isToday(p.paymentDate)).length,
    newPatientsThisMonth: db.patients.filter((p) => {
      const created = toDate(p.createdAt);
      return created !== null && created >= monthStart;
    }).length,
    todayAppointments: db.appointments.filter(
      (a) => isToday(a.appointmentDate) && (a.status === "pending" || a.status === "confirmed"),
    ).length,
  };

  const todayVisits: TodayVisitRow[] = todayVisitRecords.map((visit) => {
    const patient = db.patients.find((p) => p.id === visit.patientId);
    const doctor = db.profiles.find((p) => p.id === visit.doctorId);
    const lines = db.visitTreatments.filter((vt) => vt.visitId === visit.id);
    const paid = db.payments.filter((p) => p.visitId === visit.id).reduce((s, p) => s + p.amount, 0);
    const totals = computeVisitTotals(lines, visit.discount, paid);
    return {
      visitId: visit.id,
      patientId: visit.patientId,
      visitNumber: visit.visitNumber,
      time: toDate(visit.visitDate)?.toTimeString().slice(0, 5) ?? "-",
      patientName: patient?.fullName ?? "-",
      patientMrn: patient?.medicalRecordNumber ?? "-",
      doctorName: doctor?.fullName ?? "-",
      treatments: lines.map(
        (line) => db.treatments.find((t) => t.id === line.treatmentId)?.name ?? "Tindakan",
      ),
      status: visit.status,
      total: totals.total,
    };
  });

  const outstandingList = activeVisits
    .map((visit) => {
      const patient = db.patients.find((p) => p.id === visit.patientId);
      const paid = db.payments.filter((p) => p.visitId === visit.id).reduce((s, p) => s + p.amount, 0);
      const totals = computeVisitTotals(
        db.visitTreatments.filter((vt) => vt.visitId === visit.id),
        visit.discount,
        paid,
      );
      if (totals.outstanding <= 0 || !patient) return null;
      return {
        visitId: visit.id,
        patientId: patient.id,
        visitNumber: visit.visitNumber,
        patientName: patient.fullName,
        patientMrn: patient.medicalRecordNumber,
        total: totals.total,
        paid: totals.paid,
        outstanding: totals.outstanding,
        visitDate: visit.visitDate,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 6);

  const upcomingAppointments = db.appointments
    .filter((a) => {
      const date = toDate(a.appointmentDate);
      return (
        date !== null &&
        date >= startOfDay(now) &&
        (a.status === "pending" || a.status === "confirmed")
      );
    })
    .sort((a, b) =>
      `${a.appointmentDate}${a.appointmentTime}`.localeCompare(
        `${b.appointmentDate}${b.appointmentTime}`,
      ),
    )
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      time: a.appointmentTime,
      patientName: db.patients.find((p) => p.id === a.patientId)?.fullName ?? "-",
      doctorName: db.profiles.find((p) => p.id === a.doctorId)?.fullName ?? "-",
      status: a.status,
    }));

  return {
    stats,
    todayVisits,
    revenueSeries: buildRevenueSeries(range),
    outstandingList,
    upcomingAppointments,
  };
}

function rangeStart(range: RevenueRange, now: Date): Date {
  switch (range) {
    case "today":
      return startOfDay(now);
    case "7d": {
      const d = startOfDay(now);
      d.setDate(d.getDate() - 6);
      return d;
    }
    case "30d": {
      const d = startOfDay(now);
      d.setDate(d.getDate() - 29);
      return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

function buildRevenueSeries(range: RevenueRange): RevenuePoint[] {
  const db = getDb();
  const now = new Date();
  const start = rangeStart(range, now);

  const buckets = new Map<string, number>();

  if (range === "today") {
    // FIX: key di-pad ("08:00") agar cocok dengan key pembayaran di bawah.
    for (let hour = 8; hour <= 17; hour += 1) {
      buckets.set(`${String(hour).padStart(2, "0")}:00`, 0);
    }
    for (const payment of db.payments) {
      const date = toDate(payment.paymentDate);
      if (!date || date < start) continue;
      const key = `${String(date.getHours()).padStart(2, "0")}:00`;
      buckets.set(key, (buckets.get(key) ?? 0) + payment.amount);
    }
    return Array.from(buckets.entries()).map(([key, value]) => ({
      key,
      label: key,
      value: roundRupiah(value),
    }));
  }

  const days = range === "month" ? now.getDate() : range === "7d" ? 7 : 30;
  for (let i = 0; i < days; i += 1) {
    const d = startOfDay(new Date(start));
    d.setDate(d.getDate() + i);
    buckets.set(dateKey(d), 0);
  }
  for (const payment of db.payments) {
    const date = toDate(payment.paymentDate);
    if (!date || date < start) continue;
    const key = dateKey(date);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + payment.amount);
  }

  return Array.from(buckets.entries()).map(([key, value]) => ({
    key,
    label: formatDayMonth(key),
    value: roundRupiah(value),
  }));
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface RevenueReport {
  totalTransaction: number;
  totalPayment: number;
  receivable: number;
  transactionCount: number;
  rows: {
    visitId: string;
    visitNumber: string;
    date: string;
    patientName: string;
    patientMrn: string;
    treatments: string;
    total: number;
    paid: number;
    outstanding: number;
    status: string;
    method: string;
  }[];
}

export async function getRevenueReport(dateFrom: string, dateTo: string): Promise<RevenueReport> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const db = getDb();
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T23:59:59`);

  const visits = db.visits
    .filter((v) => v.status !== "cancelled")
    .filter((v) => {
      const d = toDate(v.visitDate);
      return d !== null && d >= from && d <= to;
    })
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));

  let totalTransaction = 0;
  let totalPayment = 0;
  let receivable = 0;

  const rows = visits.map((visit) => {
    const patient = db.patients.find((p) => p.id === visit.patientId);
    const payments = db.payments.filter((p) => p.visitId === visit.id);
    const lines = db.visitTreatments.filter((vt) => vt.visitId === visit.id);
    const totals = computeVisitTotals(lines, visit.discount, payments.reduce((s, p) => s + p.amount, 0));
    totalTransaction += totals.total;
    totalPayment += totals.paid;
    receivable += totals.outstanding;

    return {
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      date: visit.visitDate,
      patientName: patient?.fullName ?? "-",
      patientMrn: patient?.medicalRecordNumber ?? "-",
      treatments: lines
        .map((l) => db.treatments.find((t) => t.id === l.treatmentId)?.name ?? "-")
        .join(", "),
      total: totals.total,
      paid: totals.paid,
      outstanding: totals.outstanding,
      status: totals.status,
      method: payments[0]?.paymentMethod ?? "—",
    };
  });

  return {
    totalTransaction: roundRupiah(totalTransaction),
    totalPayment: roundRupiah(totalPayment),
    receivable: roundRupiah(receivable),
    transactionCount: rows.length,
    rows,
  };
}

export interface VisitReport {
  totalVisits: number;
  newPatients: number;
  returningPatients: number;
  byDoctor: { doctorName: string; count: number }[];
  daily: { key: string; label: string; value: number }[];
}

export async function getVisitReport(dateFrom: string, dateTo: string): Promise<VisitReport> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const db = getDb();
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T23:59:59`);

  const visits = db.visits
    .filter((v) => v.status !== "cancelled")
    .filter((v) => {
      const d = toDate(v.visitDate);
      return d !== null && d >= from && d <= to;
    });

  const firstVisitByPatient = new Map<string, string>();
  for (const visit of [...db.visits].sort((a, b) => a.visitDate.localeCompare(b.visitDate))) {
    if (!firstVisitByPatient.has(visit.patientId)) {
      firstVisitByPatient.set(visit.patientId, visit.visitDate);
    }
  }

  let newPatients = 0;
  let returningPatients = 0;
  const doctorCount = new Map<string, number>();
  const daily = new Map<string, number>();

  for (const visit of visits) {
    const d = toDate(visit.visitDate);
    if (d && isSameDay(d, firstVisitByPatient.get(visit.patientId) ?? d)) newPatients += 1;
    else returningPatients += 1;

    const doctor = db.profiles.find((p) => p.id === visit.doctorId)?.fullName ?? "-";
    doctorCount.set(doctor, (doctorCount.get(doctor) ?? 0) + 1);
    if (d) daily.set(dateKey(d), (daily.get(dateKey(d)) ?? 0) + 1);
  }

  const days = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / 86_400_000),
  );
  const filled: { key: string; label: string; value: number }[] = [];
  for (let i = 0; i <= days; i += 1) {
    const d = startOfDay(new Date(from));
    d.setDate(d.getDate() + i);
    if (d > to) break;
    const key = dateKey(d);
    filled.push({ key, label: formatDayMonth(key), value: daily.get(key) ?? 0 });
  }

  return {
    totalVisits: visits.length,
    newPatients,
    returningPatients,
    byDoctor: Array.from(doctorCount.entries())
      .map(([doctorName, count]) => ({ doctorName, count }))
      .sort((a, b) => b.count - a.count),
    daily: filled,
  };
}

export interface TreatmentReportRow {
  treatmentId: string;
  name: string;
  category: string;
  count: number;
  revenue: number;
}

export async function getTreatmentReport(
  dateFrom: string,
  dateTo: string,
): Promise<TreatmentReportRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const db = getDb();
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T23:59:59`);

  const visits = db.visits.filter((v) => {
    const d = toDate(v.visitDate);
    return d !== null && d >= from && d <= to && v.status !== "cancelled";
  });
  const visitIds = new Set(visits.map((v) => v.id));

  const agg = new Map<string, { name: string; category: string; count: number; revenue: number }>();
  for (const line of db.visitTreatments) {
    if (!visitIds.has(line.visitId)) continue;
    const treatment = db.treatments.find((t) => t.id === line.treatmentId);
    const key = line.treatmentId;
    const entry = agg.get(key) ?? {
      name: treatment?.name ?? "Tindakan dihapus",
      category: treatment?.category ?? "-",
      count: 0,
      revenue: 0,
    };
    entry.count += line.quantity;
    entry.revenue += line.subtotal;
    agg.set(key, entry);
  }

  return Array.from(agg.entries())
    .map(([treatmentId, value]) => ({ treatmentId, ...value, revenue: roundRupiah(value.revenue) }))
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue);
}

// ---------------------------------------------------------------------------
// Patient-scoped helpers used by the patient detail tabs
// ---------------------------------------------------------------------------

export async function getPatientVisits(patientId: string) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const db = getDb();
  return db.visits
    .filter((v) => v.patientId === patientId && v.status !== "cancelled")
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
    .map((visit) => {
      const doctor = db.profiles.find((p) => p.id === visit.doctorId);
      const lines = db.visitTreatments.filter((vt) => vt.visitId === visit.id);
      const payments = db.payments.filter((p) => p.visitId === visit.id);
      const totals = computeVisitTotals(lines, visit.discount, payments.reduce((s, p) => s + p.amount, 0));
      return {
        visit,
        doctorName: doctor?.fullName ?? "-",
        treatments: lines.map((l) => ({
          ...l,
          name: db.treatments.find((t) => t.id === l.treatmentId)?.name ?? "-",
        })),
        totals,
        payments,
      };
    });
}

export async function getPatientPayments(patientId: string) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const db = getDb();
  return db.payments
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .map((payment) => {
      const visit = db.visits.find((v) => v.id === payment.visitId);
      const lines = visit ? db.visitTreatments.filter((vt) => vt.visitId === visit.id) : [];
      const allPayments = visit ? db.payments.filter((p) => p.visitId === visit.id) : [];
      const totals = visit
        ? computeVisitTotals(lines, visit.discount, allPayments.reduce((s, p) => s + p.amount, 0))
        : null;
      return {
        payment,
        visitNumber: visit?.visitNumber ?? "-",
        total: totals?.total ?? 0,
        outstanding: totals?.outstanding ?? 0,
        status: totals?.status ?? "unpaid",
      };
    });
}

export async function getPatientTreatmentHistory(patientId: string) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const db = getDb();
  const visits = db.visits.filter((v) => v.patientId === patientId && v.status !== "cancelled");
  const visitIds = new Set(visits.map((v) => v.id));
  return db.visitTreatments
    .filter((vt) => visitIds.has(vt.visitId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((line) => {
      const visit = db.visits.find((v) => v.id === line.visitId);
      const treatment = db.treatments.find((t) => t.id === line.treatmentId);
      return {
        ...line,
        treatmentName: treatment?.name ?? "-",
        category: treatment?.category ?? "-",
        visitNumber: visit?.visitNumber ?? "-",
        visitDate: visit?.visitDate ?? line.createdAt,
        doctorName: db.profiles.find((p) => p.id === visit?.doctorId)?.fullName ?? "-",
      };
    });
}

export async function getActiveDoctors(): Promise<Profile[]> {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return getDb()
    .profiles.filter((p) => p.role === "doctor" && p.isActive)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}