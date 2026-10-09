import type { PaymentMethod, PaymentStatus, Role } from "@/types";
import type { Patient } from "@/types";

/**
 * Money is handled as integer rupiah throughout the app — no floats anywhere near
 * a total. Every arithmetic helper rounds defensively.
 */

export function roundRupiah(value: number): number {
  return Math.round(value);
}

export function lineSubtotal(quantity: number, unitPrice: number): number {
  return roundRupiah(quantity * unitPrice);
}

export interface VisitTotals {
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  outstanding: number;
  status: PaymentStatus;
  treatmentCount: number;
}

export function computeVisitTotals(
  lines: { quantity: number; unitPrice: number; subtotal: number }[],
  discount: number,
  paidAmount: number,
): VisitTotals {
  const subtotal = roundRupiah(
    lines.reduce((sum, line) => sum + (line.subtotal || lineSubtotal(line.quantity, line.unitPrice)), 0),
  );
  const safeDiscount = Math.min(Math.max(roundRupiah(discount), 0), subtotal);
  const total = roundRupiah(subtotal - safeDiscount);
  const paid = roundRupiah(paidAmount);
  const outstanding = roundRupiah(Math.max(total - paid, 0));

  return {
    subtotal,
    discount: safeDiscount,
    total,
    paid,
    outstanding,
    status: paymentStatusFor(outstanding, total),
    treatmentCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}

/** PRD section 21: 0 -> unpaid, < total -> partial, = total -> paid. */
export function paymentStatusFor(outstanding: number, total: number): PaymentStatus {
  if (total <= 0) return "unpaid";
  if (outstanding <= 0) return "paid";
  if (outstanding < total) return "partial";
  return "unpaid";
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export type Permission =
  | "patient:create"
  | "patient:update"
  | "patient:read"
  | "visit:create"
  | "visit:update"
  | "visit:read"
  | "payment:create"
  | "payment:read"
  | "treatment:manage"
  | "report:read"
  | "settings:manage"
  | "user:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "patient:create",
    "patient:update",
    "patient:read",
    "visit:create",
    "visit:update",
    "visit:read",
    "payment:create",
    "payment:read",
    "treatment:manage",
    "report:read",
    "settings:manage",
    "user:manage",
  ],
  doctor: ["patient:read", "visit:create", "visit:update", "visit:read", "payment:read", "report:read"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return can(role, permission);
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 6) return phone;
  return `${digits.slice(0, 5)}xxx`;
}

export function patientInitials(patient: Pick<Patient, "fullName">): string {
  return patient.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function doctorLabel(fullName: string): string {
  if (/^drg?\./i.test(fullName)) return fullName;
  return fullName.startsWith("dr") ? fullName : `drg. ${fullName}`;
}

export const PAYMENT_METHOD_ICON_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Transfer Bank",
  qris: "QRIS",
  debit: "Kartu Debit",
  other: "Lainnya",
};