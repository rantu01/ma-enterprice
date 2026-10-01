"use client";

// Shared helpers for the Employee Management module.
// Mirrors the AdsBuzz vendor approach (selectable list + details pane +
// pay action + payment history) adapted to monthly staff salaries:
//   Salary Due (month) = Monthly Salary − Total Amount Paid (that month)

// Employee departments are managed on /employee-management/departments and read
// from the `departments` collection at runtime — see app/hooks/useDepartments.js.
// Do not hardcode a department list here; add it on the Departments page instead.

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

export function isActiveEmployee(employee) {
  return String(employee?.status || "").toLowerCase() === "active";
}

/**
 * Salary months that have fully elapsed before `month` — i.e. completed months
 * from the hire month up to (but not including) the given month.
 * An employee with no hire date has no completed months yet.
 */
export function employeeCompletedMonths(employee, month) {
  const end = String(month || "");
  if (!/^\d{4}-\d{2}$/.test(end)) return 0;
  const hire = monthCodeFromDate(employee?.hireDate);
  if (!hire || hire >= end) return 0;
  const [startYear, startMonth] = hire.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

/**
 * Salary carried over from completed months: everything the employee has
 * accrued up to the previous month, less every payment ever recorded for them.
 * Never below zero, so over-payment nets off against arrears.
 */
export function employeeOverdueSalary(employee, month, payments = []) {
  if (!employee) return 0;
  const months = employeeCompletedMonths(employee, month);
  if (months <= 0) return 0;
  const accrued = monthlySalary(employee) * months;
  const paid = employeeTotalPaid(employee.id, payments);
  return Math.max(0, Math.round((accrued - paid) * 100) / 100);
}

/**
 * Workforce payroll totals for the employee management summary boxes.
 * Every figure is derived from the live employee and salaryPayments records.
 */
export function computeSalarySummary(employees = [], payments = [], now = new Date()) {
  const month = getCurrentMonthCode(now);
  const active = (employees || []).filter(isActiveEmployee);

  const activeCount = active.length;
  const payrollTotal = active.reduce((sum, e) => sum + monthlySalary(e), 0);

  const dueRows = active.map((e) => employeeMonthDue(e, month, payments));
  const dueTotal = dueRows.reduce((sum, v) => sum + v, 0);
  const dueCount = dueRows.filter((v) => v > 0).length;

  const overdueRows = active.map((e) => employeeOverdueSalary(e, month, payments));
  const overdueTotal = overdueRows.reduce((sum, v) => sum + v, 0);
  const overdueCount = overdueRows.filter((v) => v > 0).length;

  return {
    month,
    monthLabel: formatMonthLabel(month),
    activeCount,
    totalCount: (employees || []).length,
    monthlySalary: payrollTotal,
    averageSalary: activeCount > 0 ? Math.round(payrollTotal / activeCount) : 0,
    dueTotal,
    dueCount,
    overdueTotal,
    overdueCount,
  };
}
