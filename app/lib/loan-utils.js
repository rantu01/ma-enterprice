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
  return `৳${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-09" for a Date, or an empty string when the input is not usable. */
export function monthCode(date = new Date()) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "September 2026" from a "2026-09" code. */
export function monthLabel(code) {
  if (!code || !/^\d{4}-\d{2}$/.test(code)) return "";
  const [y, m] = code.split("-");
  return `${MONTH_NAMES[Number(m) - 1] || ""} ${y}`;
}

/** Number of scheduled repayments on a loan. `terms` and `term` are duplicates in the data. */
export function loanTermCount(loan) {
  const terms = Number(loan?.terms ?? loan?.term) || 0;
  return terms > 0 ? Math.floor(terms) : 0;
}

/** Per-installment amount: the stored value, else total payable spread across the terms. */
export function loanInstallmentAmount(loan) {
  const stored = Number(loan?.installmentAmount) || 0;
  if (stored > 0) return stored;
  return computeInstallmentAmount(loan);
}

/**
 * Flat-rate installment, always recomputed from the loan terms and never from a
 * stored value: interest = amount * rate / 100, total repayable = amount + interest,
 * installment = total repayable / terms. Matches loanTotalPayable so installments
 * always sum to the loan's displayed total.
 */
export function computeInstallmentAmount(loan) {
  const terms = loanTermCount(loan);
  if (terms <= 0) return 0;
  return round2(loanTotalPayable(loan) / terms);
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * The next `count` recurring installment dates for a loan that is repaid on the
 * same day of every month, starting no earlier than `startDate`.
 * Short months clamp to their last day (31st -> 30th in April, 28th/29th in February).
 */
export function installmentSchedule(startDate, day, count = 3) {
  const target = Number(day);
  if (!startDate || !Number.isInteger(target) || target < 1 || target > 31) return [];
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return [];
  const out = [];
  let year = start.getFullYear();
  let month = start.getMonth();
  for (let guard = 0; guard < 480 && out.length < count; guard++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const candidate = new Date(year, month, Math.min(target, daysInMonth));
    if (candidate.getTime() >= new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) {
      out.push(toDateStr(candidate));
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return out;
}

/** The first due date of the recurring schedule, or "" when it cannot be derived. */
export function firstInstallmentDate(startDate, day) {
  return installmentSchedule(startDate, day, 1)[0] || "";
}

/** "5th" / "21st" — English ordinal used by the recurring installment labels. */
export function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = Number(n) % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

/** Day-of-month (1-31) a loan is repaid on, from the stored value or its first due date. */
export function loanInstallmentDay(loan) {
  const day = Number(loan?.installmentDay) || 0;
  if (day >= 1 && day <= 31) return day;
  const source = loan?.installmentDate || loan?.startDate || loan?.dueDate;
  if (!source) return 0;
  const d = new Date(source);
  return Number.isNaN(d.getTime()) ? 0 : d.getDate();
}

/** First month the loan starts paying. */
export function loanScheduleStart(loan) {
  const start = loan?.installmentDate || loan?.startDate || loan?.dueDate;
  return start ? periodKey(start, "monthly") : "";
}

/** True when the loan has a repayment falling inside the given "YYYY-MM" month. */
export function hasInstallmentInMonth(loan, code) {
  const startKey = loanScheduleStart(loan);
  if (!startKey || !code) return false;
  if (code < startKey) return false;
  const terms = loanTermCount(loan);
  if (terms <= 0) return true;
  const [startYear, startMonth] = startKey.split("-").map(Number);
  const [year, m] = code.split("-").map(Number);
  return (year - startYear) * 12 + (m - startMonth) < terms;
}

/**
 * Portfolio totals for the loan overview boxes.
 * `enrichedLoans` are loans decorated with paidAmount/dueAmount/autoStatus.
 */
export function computeLoanSummary(enrichedLoans = [], payments = [], now = new Date()) {
  const code = monthCode(now);
  const activeLoans = enrichedLoans.filter((l) => (l.autoStatus || l.status) === "active");
  const paidLoans = enrichedLoans.filter((l) => (l.autoStatus || l.status) === "paid");

  const scheduledLoans = activeLoans.filter((l) => hasInstallmentInMonth(l, code));
  const totalInstallmentAmount = round2(
    scheduledLoans.reduce((sum, l) => sum + loanInstallmentAmount(l), 0)
  );

  const scheduledIds = new Set(scheduledLoans.map((l) => String(l.id)));
  const totalInstallmentPaid = round2(
    payments
      .filter(
        (p) =>
          scheduledIds.has(String(p.loanId)) &&
          periodKey(p.date || p.paymentDate, "monthly") === code
      )
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  );

  return {
    monthCode: code,
    monthLabel: monthLabel(code),
    active: {
      count: activeLoans.length,
      amount: round2(activeLoans.reduce((sum, l) => sum + loanPrincipal(l), 0)),
    },
    paid: {
      count: paidLoans.length,
      amount: round2(paidLoans.reduce((sum, l) => sum + (Number(l.paidAmount) || 0), 0)),
    },
    installments: {
      count: scheduledLoans.length,
      totalAmount: totalInstallmentAmount,
      paidAmount: totalInstallmentPaid,
      dueAmount: round2(Math.max(0, totalInstallmentAmount - totalInstallmentPaid)),
    },
  };
}
