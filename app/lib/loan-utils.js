"use client";

export const ORGANIZATION_TYPES = [
  { value: "bank", label: "Bank" },
  { value: "ngo", label: "NGO" },
  { value: "private_somiti", label: "Private Somiti" },
];

export const LOAN_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const LOAN_PAYMENT_METHODS = [
  { value: "bank", label: "Bank" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
  { value: "cash_deposit", label: "Cash Deposit" },
];

export function orgTypeLabel(value) {
  return ORGANIZATION_TYPES.find((t) => t.value === value)?.label || value || "—";
}

export function paymentMethodLabel(value) {
  return LOAN_PAYMENT_METHODS.find((m) => m.value === value)?.label || value || "—";
}

/** Principal as stored on the loan. */
export function loanPrincipal(loan) {
  return Number(loan?.amount) || 0;
}

/** Flat interest amount = principal * rate / 100. */
export function loanInterestAmount(loan) {
  const principal = loanPrincipal(loan);
  const rate = Number(loan?.interestRate) || 0;
  return (principal * rate) / 100;
}

/** Total payable = principal + interest. Falls back to principal when no rate. */
export function loanTotalPayable(loan) {
  return loanPrincipal(loan) + loanInterestAmount(loan);
}

/** Sum of all recorded payments for a loan id. */
export function loanPaidAmount(loanId, payments = []) {
  if (!loanId) return 0;
  return payments
    .filter((p) => String(p.loanId) === String(loanId))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

/** Remaining = total payable - paid (never below 0 for display). */
export function loanDueAmount(loan, payments = []) {
  const due = loanTotalPayable(loan) - loanPaidAmount(loan?.id, payments);
  return Math.max(0, Math.round(due * 100) / 100);
}

/** Auto status derived from payments. */
export function loanAutoStatus(loan, payments = []) {
  if (loanDueAmount(loan, payments) <= 0 && loanPrincipal(loan) > 0) return "paid";
  return loan?.status === "paid" ? "paid" : "active";
}

/** "2026-09" for monthly, "2026-W39" style key for weekly. */
export function periodKey(dateStr, frequency = "monthly") {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  if (frequency === "weekly") {
    const onejan = new Date(y, 0, 1);
    const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    return `${y}-W${String(week).padStart(2, "0")}`;
  }
  return `${y}-${m}`;
}

export function periodLabel(dateStr, frequency = "monthly") {
  const key = periodKey(dateStr, frequency);
  if (!key) return "";
  if (frequency === "weekly") return `Week ${key}`;
  const [y, m] = key.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(m) - 1] || ""} ${y}`;
}

/** True when a payment already exists for the same loan + period (excluding an optional payment id). */
export function isPeriodAlreadyPaid(loanId, dateStr, frequency, payments = [], excludeId = null) {
  if (!loanId || !dateStr) return false;
  const key = periodKey(dateStr, frequency);
  if (!key) return false;
  return payments.some(
    (p) =>
      String(p.loanId) === String(loanId) &&
      periodKey(p.date || p.paymentDate, frequency) === key &&
      String(p.id) !== String(excludeId)
  );
}

export function formatMoney(n) {
  return `$${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
