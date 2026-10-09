const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID");

export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "Rp 0";
  return rupiahFormatter.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  return numberFormatter.format(value);
}

export function formatRupiahShort(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "Rp 0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `Rp ${trimZeros(value / 1_000_000_000)}M`;
  if (abs >= 1_000_000) return `Rp ${trimZeros(value / 1_000_000)}jt`;
  if (abs >= 1_000) return `Rp ${trimZeros(value / 1_000)}rb`;
  return rupiahFormatter.format(value);
}

function trimZeros(n: number): string {
  return numberFormatter.format(Number(n.toFixed(1)));
}

const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const SHORT_DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  // Bare date strings (YYYY-MM-DD) are parsed as UTC by Date; normalize to local.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 9 Oktober 2026 */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Kamis, 9 Oktober 2026 */
export function formatLongDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/** 09/10/2026 */
export function formatDateShort(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** 08/10/26 */
export function formatDateCompact(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
}

/** Senin */
export function formatDayName(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";
  return DAY_NAMES[d.getDay()];
}

/** Sen */
export function formatDayNameShort(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";
  return SHORT_DAY_NAMES[d.getDay()];
}

/** 09 Okt */
export function formatDayMonth(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

/** yyyy-MM-dd in local time, for <input type="date"> */
export function toDateInputValue(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** HH:mm (24h) from a date or "HH:mm" string */
export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }
  const d = toDate(value);
  if (!d) return "-";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "09:00 - 09:30" style duration, or humanized relative time */
export function formatTimeAgo(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return formatDate(d);
}

/** Age in years from a date of birth string. */
export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  const d = toDate(dateOfBirth);
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age < 0 ? null : age;
}

/** Parse a user-entered rupiah string ("Rp 1.250.000", "1250000") into a number. */
export function parseRupiah(input: string): number {
  if (!input) return 0;
  const digits = input.replace(/[^0-9]/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = toDate(a);
  const db = toDate(b);
  if (!da || !db) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function isToday(value: string | Date): boolean {
  return isSameDay(value, new Date());
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}