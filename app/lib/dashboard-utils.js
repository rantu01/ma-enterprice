"use client";

// Dashboard aggregations — every figure is derived from existing real
// collections, no dummy data:
//
//   Income (per month)    = completed loan payments plus commission records.
//                           Pending / processing payments are NOT income yet.
//   Commission (per month)= sum of the commission collection when present.
//                           The payment-derived interest fallback is retained
//                           for legacy databases without commission records.
//   Costing (per month)   = approved expenseEntries + approved routeEntries
//                           + monthly payroll accruals and unmatched salary
//                           payments.
//   Profit (per month)    = Income + Commission − Costing.
//   Investment / Deposit  = sums from investments / deposits by YYYY-MM date.
//   Loans                 = computed with app/lib/loan-utils helpers.

export function formatMoney(n) {
  return `৳${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function monthCodeFromDateStr(dateStr) {
  const m = /^(\d{4})-(\d{2})/.exec(String(dateStr || "").trim());
  return m ? `${m[1]}-${m[2]}` : "";
}

export function currentMonthCode(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function prevMonthCode(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(code) {
  if (!code || !/^\d{4}-\d{2}$/.test(code)) return code || "";
  const [y, m] = code.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function shortMonthLabel(code) {
  if (!code || !/^\d{4}-\d{2}$/.test(code)) return code || "";
  const [y, m] = code.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(m) - 1] || ""}`;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Completed loan payments count as income; pending/processing do not. */
export function isIncomePayment(p) {
  const s = String(p?.status || "").toLowerCase();
  if (!s) return true;
  return s === "completed" || s === "paid" || s === "approved";
}

function paymentMonth(p) {
  return monthCodeFromDateStr(p?.date || p?.paymentDate || "");
}

/** Approved entries (and legacy docs without a status) count toward costing. */
function isApprovedCost(e) {
  const s = e?.approvalStatus || e?.status;
  return !s || s === "Approved";
}

function loanInterestRatio(loan) {
  const principal = Number(loan?.amount) || 0;
  const rate = Number(loan?.interestRate) || 0;
  if (principal <= 0) return 0;
  const interest = (principal * rate) / 100;
  const total = principal + interest;
  if (total <= 0) return 0;
  return interest / total;
}

function dedupePayrolls(payrolls = [], validEmployeeIds = new Set()) {
  const byKey = new Map();
  for (const payroll of payrolls) {
    const name = String(payroll.employeeName || "").trim().toLowerCase();
    const key = `${payroll.month || ""}|${name || payroll.employeeId}`;
    const candidate = {
      payroll,
      valid: validEmployeeIds.has(String(payroll.employeeId)),
      created: new Date(payroll.createdAt || 0).getTime(),
    };
    const existing = byKey.get(key);
    if (
      !existing ||
      (candidate.valid && !existing.valid) ||
      (candidate.valid === existing.valid && candidate.created > existing.created)
    ) {
      byKey.set(key, candidate);
    }
  }
  return [...byKey.values()].map(({ payroll }) => payroll);
}

function payrollCostByMonth(payrolls, adjustments, salaryPayments, employees) {
  const validEmployeeIds = new Set((employees || []).map((employee) => String(employee.id)));
  const uniquePayrolls = dedupePayrolls(payrolls, validEmployeeIds);
  const payrollIds = new Set((payrolls || []).map((payroll) => String(payroll.id)));
  const salaryKeys = new Set();
  const totals = {};

  uniquePayrolls.forEach((payroll) => {
    const payrollId = String(payroll.id || "");
    const related = (adjustments || []).filter(
      (adjustment) => String(adjustment.payrollId) === payrollId
    );
    const bonus = related
      .filter((adjustment) => adjustment.type === "Bonus")
      .reduce((sum, adjustment) => sum + (Number(adjustment.amount) || 0), 0);
    const allowance = related
      .filter((adjustment) => adjustment.type === "Allowance")
      .reduce((sum, adjustment) => sum + (Number(adjustment.amount) || 0), 0);
    const deduction = related
      .filter((adjustment) => adjustment.type === "Deduction")
      .reduce((sum, adjustment) => sum + (Number(adjustment.amount) || 0), 0);
    const total = (Number(payroll.basicSalary) || 0) + bonus + allowance - deduction;
    const month = String(payroll.month || "");
    addPayrollTotal(totals, month, total);
    salaryKeys.add(`${payroll.employeeId || ""}|${month}`);
    salaryKeys.add(`${String(payroll.employeeName || "").trim().toLowerCase()}|${month}`);
  });

  (salaryPayments || [])
    .filter((payment) => {
      if (payment.payrollId && payrollIds.has(String(payment.payrollId))) return false;
      const month = paymentMonth(payment);
      const idKey = `${payment.employeeId || ""}|${month}`;
      const nameKey = `${String(payment.employeeName || "").trim().toLowerCase()}|${month}`;
      return !salaryKeys.has(idKey) && !salaryKeys.has(nameKey);
    })
    .forEach((payment) => addPayrollTotal(totals, paymentMonth(payment), payment.amount));

  return totals;
}

function addPayrollTotal(totals, month, amount) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return;
  totals[month] = round2((totals[month] || 0) + (Number(amount) || 0));
}

/**
 * Aggregate all dashboard figures from the live collections.
 * Returns per-month maps plus the year list found in the data.
 */
export function computeDashboard({
  loans = [],
  payments = [],
  investments = [],
  deposits = [],
  expenseEntries = [],
  routeEntries = [],
  salaryPayments = [],
  commissions = [],
  payrolls = [],
  adjustments = [],
  employees = [],
  now = new Date(),
} = {}) {
  const loanById = {};
  (loans || []).forEach((l) => {
    if (l?.id) loanById[String(l.id)] = l;
  });

  const incomeByMonth = {};
  const commissionByMonth = {};
  const costingByMonth = {};
  const investmentByMonth = {};
  const depositByMonth = {};
  const salaryByMonth = payrollCostByMonth(payrolls, adjustments, salaryPayments, employees);

  const addTo = (map, month, amt) => {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return;
    map[month] = round2((map[month] || 0) + (Number(amt) || 0));
  };

  // Completed payments are income independently of whether commission records
  // also exist. Commission records are separate revenue and must not suppress
  // the payment income stream.
  (payments || []).forEach((p) => {
    if (!isIncomePayment(p)) return;
    const m = paymentMonth(p);
    if (!m) return;
    addTo(incomeByMonth, m, Number(p.amount) || 0);
  });

  if (Array.isArray(commissions) && commissions.length > 0) {
    (commissions || []).forEach((c) => {
      const m = monthCodeFromDateStr(c?.date || c?.month || c?.commissionDate);
      if (!m) return;
      addTo(commissionByMonth, m, Number(c.amount) || 0);
    });
  } else {
    // Legacy fallback when no commission collection exists.
    (payments || []).forEach((p) => {
      if (!isIncomePayment(p)) return;
      const m = paymentMonth(p);
      if (!m) return;
      const amt = Number(p.amount) || 0;
      const loan = loanById[String(p.loanId)] || null;
      addTo(commissionByMonth, m, round2(amt * loanInterestRatio(loan)));
    });
  }

  // Costing: approved office expenses + approved route costs + salary paid.
  (expenseEntries || []).forEach((e) => {
    if (!isApprovedCost(e)) return;
    const m = monthCodeFromDateStr(e.date) || e.month;
    addTo(costingByMonth, m, Number(e.amount) || 0);
  });
  (routeEntries || []).forEach((e) => {
    if (!isApprovedCost(e)) return;
    const m = monthCodeFromDateStr(e.date) || e.month;
    addTo(costingByMonth, m, Number(e.amount) || 0);
  });
  Object.entries(salaryByMonth).forEach(([month, amount]) => {
    addTo(costingByMonth, month, amount);
  });

  (investments || []).forEach((i) => {
    const m = monthCodeFromDateStr(i?.date);
    addTo(investmentByMonth, m, Number(i.amount) || 0);
  });
  (deposits || []).forEach((d) => {
    const m = monthCodeFromDateStr(d?.date);
    addTo(depositByMonth, m, Number(d.amount) || 0);
  });

  const allMonths = new Set([
    ...Object.keys(incomeByMonth),
    ...Object.keys(costingByMonth),
    ...Object.keys(commissionByMonth),
    ...Object.keys(investmentByMonth),
    ...Object.keys(depositByMonth),
  ]);
  const years = [...new Set([...allMonths].map((m) => m.slice(0, 4)))].sort();

  const profitByMonth = {};
  allMonths.forEach((m) => {
    profitByMonth[m] = round2(
      (incomeByMonth[m] || 0) +
      (commissionByMonth[m] || 0) -
      (costingByMonth[m] || 0)
    );
  });

  const sumValues = (map) => round2(Object.values(map).reduce((s, v) => s + (Number(v) || 0), 0));

  const cur = currentMonthCode(now);
  const prev = prevMonthCode(now);
  const curYear = String((now instanceof Date ? now : new Date(now)).getFullYear());

  return {
    incomeByMonth,
    commissionByMonth,
    costingByMonth,
    investmentByMonth,
    depositByMonth,
    salaryByMonth,
    profitByMonth,
    years,
    totals: {
      lifetimeInvestment: sumValues(investmentByMonth),
      currentMonthInvestment: round2(investmentByMonth[cur] || 0),
      lifetimeDeposit: sumValues(depositByMonth),
      currentMonthDeposit: round2(depositByMonth[cur] || 0),
      lifetimeCommission: sumValues(commissionByMonth),
      lastMonthCommission: round2(commissionByMonth[prev] || 0),
      thisMonthExpense: round2(costingByMonth[cur] || 0),
      lastMonthProfit: round2(profitByMonth[prev] || 0),
    },
    months: { current: cur, previous: prev, currentYear: curYear },
  };
}

/** Build the 12 month codes for a year: ["2026-01", ..., "2026-12"]. */
export function yearMonthCodes(year) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

/** Profit/Loss month counts for a year (profit > 0 vs loss < 0; zeros ignored). */
export function yearlyProfitCounts(profitByMonth = {}, year) {
  const codes = yearMonthCodes(year);
  let profitMonths = 0;
  let lossMonths = 0;
  codes.forEach((m) => {
    const v = Number(profitByMonth[m] || 0);
    if (v > 0) profitMonths += 1;
    else if (v < 0) lossMonths += 1;
  });
  return { profitMonths, lossMonths };
}
