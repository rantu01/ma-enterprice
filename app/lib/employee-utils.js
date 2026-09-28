"use client";

// Shared helpers for the Employee Management module.
// Mirrors the AdsBuzz vendor approach (selectable list + details pane +
// pay action + payment history) adapted to monthly staff salaries:
//   Salary Due (month) = Monthly Salary − Total Amount Paid (that month)

export const EMPLOYEE_DEPARTMENTS = [
  { value: "Management", label: "Management" },
  { value: "Marketing", label: "Marketing" },
  { value: "SR", label: "SR" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "IT", label: "IT" },
  { value: "Manager", label: "Manager" },
];

export const EMPLOYEE_STATUSES = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Terminated", label: "Terminated" },
];

export const SALARY_PAYMENT_METHODS = [
  { value: "Bank", label: "Bank" },
  { value: "Cash", label: "Cash" },
  { value: "Nagad", label: "Nagad" },
  { value: "bKash", label: "bKash" },
  { value: "Upay", label: "Upay" },
];

export function formatBDT(n) {
  return `৳${Math.round(Number(n) || 0).toLocaleString()}`;
}

export function getCurrentMonthCode(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function monthCodeFromDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(String(dateStr || "").trim());
  return m ? `${m[1]}-${m[2]}` : "";
}

export function formatMonthLabel(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return month || "";
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function monthlySalary(employee) {
  return Number(employee?.salary) || 0;
}

/** Payments for one employee inside one YYYY-MM month. */
export function employeeMonthPayments(employeeId, month, payments = []) {
  if (!employeeId || !month) return [];
  return (payments || []).filter(
    (p) => String(p.employeeId) === String(employeeId) && String(p.date || "").startsWith(month)
  );
}

export function employeeMonthPaid(employeeId, month, payments = []) {
  return employeeMonthPayments(employeeId, month, payments).reduce((s, p) => s + (Number(p.amount) || 0), 0);
}

/** Salary Due = Monthly Salary − Total Amount Paid (never below 0 for display). */
export function employeeMonthDue(employee, month, payments = []) {
  if (!employee) return 0;
  return Math.max(0, Math.round((monthlySalary(employee) - employeeMonthPaid(employee.id, month, payments)) * 100) / 100);
}

export function employeeTotalPaid(employeeId, payments = []) {
  if (!employeeId) return 0;
  return (payments || [])
    .filter((p) => String(p.employeeId) === String(employeeId))
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
}

export function paymentMethodLabel(value) {
  return SALARY_PAYMENT_METHODS.find((m) => m.value === value)?.label || value || "—";
}
