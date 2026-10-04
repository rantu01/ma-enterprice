"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import StatCard from "@/components/dashboard/StatCard";
import FormField from "@/components/forms/FormField";
import { useToast } from "@/components/contexts/ToastContext";
import { cn } from "@/lib/utils";
import {
  FileText,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Receipt,
  Route,
  Calendar,
  CalendarDays,
  ClipboardList,
  Wallet,
  Landmark,
  HandCoins,
  Building2,
} from "lucide-react";

const reports = [
  {
    id: "loan",
    title: "Loan Report",
    description: "Comprehensive overview of all loan transactions, approvals, and repayments across the organization.",
    icon: <FileText className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "employee",
    title: "Employee Report",
    description: "Detailed employee data including headcount, department breakdown, and staffing metrics.",
    icon: <Users className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "salary",
    title: "Salary Report",
    description: "Salary distribution, payroll summary, and compensation analysis for all employees.",
    icon: <CreditCard className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "investment",
    title: "Investment Report",
    description: "Investment portfolio performance, returns, and asset allocation overview.",
    icon: <TrendingUp className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "expense",
    title: "Expense Report",
    description: "Detailed breakdown of office expenses by category, department, and time period.",
    icon: <Receipt className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "route-cost",
    title: "Route Cost Report",
    description: "Show how much cost was incurred for each route, including the relevant route and cost details.",
    icon: <Route className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "employee-expense-item",
    title: "Employee Expense/Item Report",
    description: "Show which employee took/received which item or expense and on what date, including employee name, item/expense details, date, and relevant amount if applicable.",
    icon: <ClipboardList className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: "payroll",
    title: "Payroll Report",
    description: "Monthly payroll summary with basic salary, bonuses, allowances, deductions, net salary, and payment status.",
    icon: <Wallet className="h-6 w-6" aria-hidden="true" />,
  },
];

const reportIcons = {
  loan: <FileText className="h-6 w-6" aria-hidden="true" />,
  employee: <Users className="h-6 w-6" aria-hidden="true" />,
  salary: <CreditCard className="h-6 w-6" aria-hidden="true" />,
  investment: <TrendingUp className="h-6 w-6" aria-hidden="true" />,
  expense: <Receipt className="h-6 w-6" aria-hidden="true" />,
  "route-cost": <Route className="h-6 w-6" aria-hidden="true" />,
  "employee-expense-item": <ClipboardList className="h-6 w-6" aria-hidden="true" />,
  payroll: <Wallet className="h-6 w-6" aria-hidden="true" />,
};

const reportColumns = {
  loan: [
    { key: "organizationName", label: "Organization", accessor: "organizationName", sortable: true },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
    { key: "interestRate", label: "Interest Rate", accessor: "interestRate", sortable: true, render: (v) => `${Number(v || 0).toFixed(2)}%` },
    { key: "term", label: "Term (months)", accessor: "term", sortable: true },
    { key: "status", label: "Status", accessor: "status", sortable: true },
    { key: "startDate", label: "Start Date", accessor: "startDate", sortable: true },
  ],
  employee: [
    { key: "name", label: "Name", accessor: "name", sortable: true },
    { key: "email", label: "Email", accessor: "email", sortable: true },
    { key: "department", label: "Department", accessor: "department", sortable: true },
    { key: "phone", label: "Phone", accessor: "phone", sortable: true },
    { key: "status", label: "Status", accessor: "status", sortable: true },
    { key: "hireDate", label: "Hire Date", accessor: "hireDate", sortable: true },
  ],
  salary: [
    { key: "employee", label: "Employee", accessor: "employee", sortable: true },
    { key: "period", label: "Period", accessor: "period", sortable: true },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
    { key: "status", label: "Status", accessor: "status", sortable: true },
    { key: "date", label: "Date", accessor: "date", sortable: true },
  ],
  investment: [
    { key: "name", label: "Name", accessor: "name", sortable: true },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
    { key: "category", label: "Category", accessor: "category", sortable: true },
    { key: "status", label: "Status", accessor: "status", sortable: true },
    { key: "date", label: "Date", accessor: "date", sortable: true },
  ],
  expense: [
    { key: "category", label: "Category", accessor: "category", sortable: true },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
    { key: "month", label: "Month", accessor: "month", sortable: true },
    { key: "status", label: "Status", accessor: "status", sortable: true },
    { key: "notes", label: "Notes", accessor: "notes", sortable: false },
  ],
  "route-cost": [
    { key: "route", label: "Route", accessor: "route", sortable: true },
    { key: "vehicle", label: "Vehicle", accessor: "vehicle", sortable: true },
    { key: "distance", label: "Distance (km)", accessor: "distance", sortable: true },
    { key: "cost", label: "Cost", accessor: "cost", sortable: true, render: (v) => formatMoney(v) },
    { key: "status", label: "Status", accessor: "status", sortable: true },
  ],
  "employee-expense-item": [
    { key: "employeeName", label: "Employee", accessor: "employeeName", sortable: true },
    { key: "item", label: "Item / Expense", accessor: "item", sortable: true },
    { key: "category", label: "Category", accessor: "category", sortable: true },
    { key: "date", label: "Date", accessor: "date", sortable: true },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => v != null ? formatMoney(v) : "—" },
  ],
  payroll: [
    { key: "employeeName", label: "Employee", accessor: "employeeName", sortable: true },
    { key: "basicSalary", label: "Basic Salary", accessor: "basicSalary", sortable: true, render: (v) => formatMoney(v) },
    { key: "bonusTotal", label: "Bonus", accessor: "bonusTotal", sortable: true, render: (v) => formatMoney(v) },
    { key: "allowanceTotal", label: "Allowance", accessor: "allowanceTotal", sortable: true, render: (v) => formatMoney(v) },
    { key: "deductionTotal", label: "Deduction", accessor: "deductionTotal", sortable: true, render: (v) => formatMoney(v) },
    { key: "net", label: "Net Salary", accessor: "net", sortable: true, render: (v) => formatMoney(v) },
    { key: "status", label: "Status", accessor: "status", sortable: true },
  ],
};

function formatMoney(n) {
  return `৳${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const todayStr = () => new Date().toISOString().split("T")[0];
const currentMonthStr = () => todayStr().slice(0, 7);

function formatMonthLabel(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return month || "";
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** "2026-10-05" from a date/datetime string; "" when unusable. */
function dateOnly(value) {
  return String(value || "").slice(0, 10);
}

/** "2026-10" from a date/datetime string; "" when unusable. */
function monthOfDate(value) {
  const m = /^(\d{4})-(\d{2})/.exec(String(value || "").trim());
  return m ? `${m[1]}-${m[2]}` : "";
}

/** Completed loan payments count as income; pending/processing do not. */
function isIncomePayment(p) {
  const s = String(p?.status || "").toLowerCase();
  if (!s) return true;
  return s === "completed" || s === "paid" || s === "approved";
}

/** Approved entries (and legacy docs without a status) count toward costs. */
function isApprovedCost(e) {
  const s = e?.approvalStatus || e?.status;
  return !s || s === "Approved";
}

/** Actual transaction month: the record's date first, legacy `month` field as fallback. */
function entryMonth(e) {
  return monthOfDate(e?.date) || e?.month || "";
}

const TABS = [
  { id: "monthly", label: "Monthly Report", icon: CalendarDays },
  { id: "daily", label: "Daily Expense Summary", icon: Calendar },
  { id: "collections", label: "Collection Reports", icon: FileText },
];

function SectionCard({ icon, title, total, countLabel, children }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2">
          <span className="text-[var(--color-primary)]" aria-hidden="true">{icon}</span> {title}
        </h3>
        <div className="flex items-center gap-2">
          {countLabel && <span className="text-[11px] text-[var(--color-ink-3)]">{countLabel}</span>}
          <Badge variant="info">{total}</Badge>
        </div>
      </div>
      {children}
    </Card>
  );
}

/* Detail table with its own independent pagination (page resets when rows change,
   controls render only when more than one page is needed). */
const DETAIL_PAGE_SIZE = 8;

function PaginatedTable({ columns, data, emptyMessage }) {
  const [page, setPage] = useState(1);
  const [seenData, setSeenData] = useState(data);
  // Reset to page 1 whenever a new row set arrives (e.g. month/date changed).
  if (seenData !== data) {
    setSeenData(data);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(data.length / DETAIL_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = data.slice((safePage - 1) * DETAIL_PAGE_SIZE, safePage * DETAIL_PAGE_SIZE);
  return (
    <DataTable
      columns={columns}
      data={paged}
      emptyMessage={emptyMessage}
      pagination={data.length > DETAIL_PAGE_SIZE ? {
        currentPage: safePage,
        totalPages,
        onPageChange: setPage,
        totalItems: data.length,
        itemsPerPage: DETAIL_PAGE_SIZE,
      } : undefined}
    />
  );
}

export default function ReportsPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("monthly");
  const [month, setMonth] = useState(() => currentMonthStr());
  const [day, setDay] = useState(() => todayStr());

  // Monthly/daily report data (live collections, fetched once)
  const [dataLoading, setDataLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [routeEntries, setRouteEntries] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [salaryPayments, setSalaryPayments] = useState([]);

  // Existing collection-report state (unchanged functionality)
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [reportPage, setReportPage] = useState(1);
  const [dateRanges, setDateRanges] = useState(
    Object.fromEntries(reports.map((r) => [r.id, { start: "", end: "" }]))
  );
  const [reportData, setReportData] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const collections = ["loans", "payments", "investments", "investors", "deposits", "commissions", "expenseEntries", "routeEntries", "payrolls", "payroll_adjustments", "salaryPayments"];
        const results = await Promise.all(
          collections.map((c) => fetch(`/api/data?collection=${c}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })))
        );
        const byName = Object.fromEntries(collections.map((c, i) => [c, results[i]?.data || []]));
        setLoans(byName.loans);
        setPayments(byName.payments);
        setInvestments(byName.investments);
        setInvestors(byName.investors);
        setDeposits(byName.deposits);
        setCommissions(byName.commissions);
        setExpenseEntries(byName.expenseEntries);
        setRouteEntries(byName.routeEntries);
        setPayrolls(byName.payrolls);
        setAdjustments(byName.payroll_adjustments);
        setSalaryPayments(byName.salaryPayments);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load report data." });
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const loanById = useMemo(() => {
    const map = {};
    loans.forEach((l) => { if (l?.id) map[String(l.id)] = l; });
    return map;
  }, [loans]);

  const investorById = useMemo(() => {
    const map = {};
    investors.forEach((i) => { if (i?.id) map[String(i.id)] = i; });
    return map;
  }, [investors]);

  const investorNameOf = (inv) => {
    if (inv?.investorId && investorById[String(inv.investorId)]) return investorById[String(inv.investorId)].name;
    return inv?.investor || inv?.name || "—";
  };

  /* ---------------- Monthly report (selected YYYY-MM) ---------------- */

  const monthly = useMemo(() => {
    const inMonth = (dateStr) => monthOfDate(dateStr) === month;

    const monthPayments = payments.filter((p) => isIncomePayment(p) && inMonth(p.date || p.paymentDate));
    const income = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const monthCommissions = commissions.filter((c) => inMonth(c.date));
    const commissionTotal = monthCommissions.reduce((s, c) => s + (Number(c.amount) || 0), 0);

    const monthInvestments = investments.filter((i) => inMonth(i.date));
    const investmentTotal = monthInvestments.reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const monthDeposits = deposits.filter((d) => inMonth(d.date));
    const depositTotal = monthDeposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);

    const monthOffice = expenseEntries.filter((e) => isApprovedCost(e) && entryMonth(e) === month);
    const officeTotal = monthOffice.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const monthRoute = routeEntries.filter((e) => isApprovedCost(e) && entryMonth(e) === month);
    const routeTotal = monthRoute.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // Salary: monthly payroll nets + Pay Staff distributions dated in this month.
    const monthPayrolls = payrolls
      .filter((p) => p.month === month)
      .map((p) => {
        const adj = adjustments.filter((a) => String(a.payrollId) === String(p.id));
        const bonus = adj.filter((a) => a.type === "Bonus").reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const allowance = adj.filter((a) => a.type === "Allowance").reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const deduction = adj.filter((a) => a.type === "Deduction").reduce((s, a) => s + (Number(a.amount) || 0), 0);
        return { ...p, bonusTotal: bonus, allowanceTotal: allowance, deductionTotal: deduction, net: Math.round(((Number(p.basicSalary) || 0) + bonus + allowance - deduction) * 100) / 100 };
      });
    const payrollTotal = monthPayrolls.reduce((s, p) => s + (Number(p.net) || 0), 0);

    const monthPayStaff = salaryPayments.filter((p) => inMonth(p.date));
    const payStaffTotal = monthPayStaff.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const salaryTotal = Math.round((payrollTotal + payStaffTotal) * 100) / 100;
    const costing = Math.round((officeTotal + routeTotal + salaryTotal) * 100) / 100;
    const profit = Math.round((income - costing) * 100) / 100;

    return {
      monthPayments, income,
      monthCommissions, commissionTotal,
      monthInvestments, investmentTotal,
      monthDeposits, depositTotal,
      monthOffice, officeTotal,
      monthRoute, routeTotal,
      monthPayrolls, payrollTotal,
      monthPayStaff, payStaffTotal,
      salaryTotal, costing, profit,
    };
  }, [month, payments, commissions, investments, deposits, expenseEntries, routeEntries, payrolls, adjustments, salaryPayments]);

  const isProfit = monthly.profit >= 0;

  /* ---------------- Daily expense summary (selected YYYY-MM-DD) ---------------- */

  const daily = useMemo(() => {
    const onDay = (dateStr) => dateOnly(dateStr) === day;

    const office = expenseEntries.filter((e) => isApprovedCost(e) && onDay(e.date));
    const officeTotal = office.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const route = routeEntries.filter((e) => isApprovedCost(e) && onDay(e.date));
    const routeTotal = route.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const loan = payments.filter((p) => isIncomePayment(p) && onDay(p.date || p.paymentDate));
    const loanTotal = loan.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const salary = salaryPayments.filter((p) => onDay(p.date));
    const salaryTotal = salary.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const grandTotal = Math.round((officeTotal + routeTotal + loanTotal + salaryTotal) * 100) / 100;
    return { office, officeTotal, route, routeTotal, loan, loanTotal, salary, salaryTotal, grandTotal };
  }, [day, expenseEntries, routeEntries, payments, salaryPayments]);

  /* ---------------- Existing collection reports (unchanged) ---------------- */

  const handleDateChange = (reportId, field, value) => {
    setDateRanges((prev) => ({ ...prev, [reportId]: { ...prev[reportId], [field]: value } }));
  };

  const handleGenerate = async (reportId) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, start: dateRanges[reportId]?.start || "", end: dateRanges[reportId]?.end || "" }),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      const json = await res.json();
      setReportData((prev) => ({ ...prev, [reportId]: json.data || json }));
      setActiveReport(reportId);
      setReportPage(1);
      addToast({ type: "success", title: "Report Generated", message: `${report.title} has been generated.` });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to generate report." });
    } finally {
      setLoading(false);
    }
  };

  const activeReportDef = reports.find((r) => r.id === activeReport);
  const activeRows = activeReport ? reportData[activeReport] || [] : [];
  const activeColumns = activeReport ? reportColumns[activeReport] || [] : [];
  const ITEMS_PER_PAGE = 10;
  const reportTotalPages = Math.max(1, Math.ceil(activeRows.length / ITEMS_PER_PAGE));
  const safeReportPage = Math.min(reportPage, reportTotalPages);
  const paginatedReportRows = activeRows.slice(
    (safeReportPage - 1) * ITEMS_PER_PAGE,
    safeReportPage * ITEMS_PER_PAGE
  );

  /* ---------------- Column definitions for detail tables ---------------- */

  const commissionColumns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, render: (v) => dateOnly(v) || "—" },
    { key: "amount", label: "Commission Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
  ];

  const investmentColumns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, render: (v) => dateOnly(v) || "—" },
    { key: "investor", label: "Investor", accessor: "investorId", sortable: true, render: (v, row) => investorNameOf({ ...row, investorId: v }) },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
    { key: "notes", label: "Note", accessor: "notes", sortable: false, render: (v, row) => v || row.description || "—" },
  ];

  const depositColumns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, render: (v) => dateOnly(v) || "—" },
    { key: "type", label: "Type", accessor: "type", sortable: true, render: (v) => v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
    { key: "description", label: "Description", accessor: "description", sortable: true, render: (v) => v || "—" },
  ];

  const officeColumns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, render: (v) => dateOnly(v) || "—" },
    { key: "category", label: "Category / Sub", accessor: "category", sortable: true, render: (v, row) => `${v || "—"}${row.subCategory ? ` / ${row.subCategory}` : ""}` },
    { key: "voucherNo", label: "Voucher", accessor: "voucherNo", sortable: true, render: (v) => v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
  ];

  const routeColumns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, render: (v) => dateOnly(v) || "—" },
    { key: "category", label: "Category / Sub", accessor: "category", sortable: true, render: (v, row) => `${v || "—"}${row.subCategory ? ` / ${row.subCategory}` : ""}` },
    { key: "voucherNo", label: "Voucher", accessor: "voucherNo", sortable: true, render: (v) => v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
  ];

  const payrollColumns = [
    { key: "employeeName", label: "Employee", accessor: "employeeName", sortable: true, render: (v) => v || "—" },
    { key: "basicSalary", label: "Basic", accessor: "basicSalary", sortable: true, render: (v) => formatMoney(v) },
    { key: "bonusTotal", label: "Bonus", accessor: "bonusTotal", sortable: true, render: (v) => formatMoney(v) },
    { key: "allowanceTotal", label: "Allowance", accessor: "allowanceTotal", sortable: true, render: (v) => formatMoney(v) },
    { key: "deductionTotal", label: "Deduction", accessor: "deductionTotal", sortable: true, render: (v) => formatMoney(v) },
    { key: "net", label: "Net", accessor: "net", sortable: true, render: (v) => formatMoney(v) },
    { key: "status", label: "Status", accessor: "status", sortable: true, render: (v) => v || "—" },
  ];

  const payStaffColumns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, render: (v) => dateOnly(v) || "—" },
    { key: "employeeName", label: "Employee", accessor: "employeeName", sortable: true, render: (v, row) => v || row.employee || "—" },
    { key: "purpose", label: "Purpose", accessor: "purpose", sortable: false, render: (v) => v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
  ];

  const loanPaymentColumns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, render: (v, row) => dateOnly(row.paymentDate || v) || "—" },
    { key: "loanOrganization", label: "Organization", accessor: "loanOrganization", sortable: true, render: (v, row) => row.organizationName || v || loanById[String(row.loanId)]?.organizationName || row.loanId || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
    { key: "method", label: "Method", accessor: "method", sortable: true, render: (v) => v || "—" },
  ];

  return (
    <PageContainer title="Reports" breadcrumb={<nav aria-label="Breadcrumb"><span>Reports</span></nav>}>
      {/* AdsBuzz-style tab bar */}
      <div className="flex gap-1 mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-sm overflow-x-auto" role="tablist" aria-label="Report types">
        {TABS.map((t) => {
          const Icon = t.icon;
          const selected = activeTab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition",
                selected
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow"
                  : "text-[var(--color-ink-2)] hover:bg-[var(--color-base)]"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "monthly" && (
        <section aria-label="Monthly report">
          <Card padding="5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Monthly Report — {formatMonthLabel(month)}</h2>
                <p className="text-xs text-[var(--color-ink-3)]">Complete month report · updates automatically when the month changes</p>
              </div>
              <FormField label="Select Month" id="report-month" className="w-full sm:w-52">
                <Input id="report-month" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Select month" />
              </FormField>
            </div>
          </Card>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (<Card key={i}><Skeleton height={96} /></Card>))}
            </div>
          ) : (
            <>
              {/* 1. Profit & Loss */}
              <div className="mt-6">
                <h3 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)] mb-3">1. Profit &amp; Loss</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Income (Loan Payments)" value={formatMoney(monthly.income)} subtext={`${monthly.monthPayments.length} payments`} icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />} variant="success" />
                  <StatCard title="Total Costing" value={formatMoney(monthly.costing)} subtext="Office + Route + Salary" icon={<Receipt className="h-5 w-5" aria-hidden="true" />} variant="warning" />
                  <StatCard title={isProfit ? "Profit" : "Loss"} value={formatMoney(monthly.profit)} subtext={`Status: ${isProfit ? "Profit" : "Loss"}`} icon={isProfit ? <TrendingUp className="h-5 w-5" aria-hidden="true" /> : <TrendingDown className="h-5 w-5" aria-hidden="true" />} variant={isProfit ? "success" : "error"} />
                  <StatCard title="Commission Earned" value={formatMoney(monthly.commissionTotal)} subtext={`${monthly.monthCommissions.length} records`} icon={<HandCoins className="h-5 w-5" aria-hidden="true" />} variant="info" />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
                {/* 2. Commission */}
                <SectionCard icon={<HandCoins className="h-4 w-4" />} title="2. Commission" total={formatMoney(monthly.commissionTotal)} countLabel={`${monthly.monthCommissions.length} records`}>
                  <PaginatedTable columns={commissionColumns} data={monthly.monthCommissions} emptyMessage={`No commission records for ${formatMonthLabel(month)}.`} />
                </SectionCard>

                {/* 3. Investment */}
                <SectionCard icon={<TrendingUp className="h-4 w-4" />} title="3. Investment" total={formatMoney(monthly.investmentTotal)} countLabel={`${monthly.monthInvestments.length} records`}>
                  <PaginatedTable columns={investmentColumns} data={monthly.monthInvestments} emptyMessage={`No investments for ${formatMonthLabel(month)}.`} />
                </SectionCard>

                {/* 4. Company Deposit */}
                <SectionCard icon={<Building2 className="h-4 w-4" />} title="4. Company Deposit" total={formatMoney(monthly.depositTotal)} countLabel={`${monthly.monthDeposits.length} records`}>
                  <PaginatedTable columns={depositColumns} data={monthly.monthDeposits} emptyMessage={`No deposits for ${formatMonthLabel(month)}.`} />
                </SectionCard>

                {/* 5. Office Expense */}
                <SectionCard icon={<Receipt className="h-4 w-4" />} title="5. Office Expense" total={formatMoney(monthly.officeTotal)} countLabel={`${monthly.monthOffice.length} vouchers`}>
                  <PaginatedTable columns={officeColumns} data={monthly.monthOffice} emptyMessage={`No office expenses for ${formatMonthLabel(month)}.`} />
                </SectionCard>

                {/* 7. Route Cost */}
                <SectionCard icon={<Route className="h-4 w-4" />} title="7. Route Cost" total={formatMoney(monthly.routeTotal)} countLabel={`${monthly.monthRoute.length} vouchers`}>
                  <PaginatedTable columns={routeColumns} data={monthly.monthRoute} emptyMessage={`No route costs for ${formatMonthLabel(month)}.`} />
                </SectionCard>

                {/* 8. Loan Payments */}
                <SectionCard icon={<Landmark className="h-4 w-4" />} title="8. Loan Payments" total={formatMoney(monthly.income)} countLabel={`${monthly.monthPayments.length} payments`}>
                  <PaginatedTable columns={loanPaymentColumns} data={monthly.monthPayments} emptyMessage={`No loan payments for ${formatMonthLabel(month)}.`} />
                </SectionCard>
              </div>

              {/* 6. Salary (payroll + Pay Staff) */}
              <div className="mt-4">
                <SectionCard
                  icon={<Wallet className="h-4 w-4" />}
                  title="6. Salary"
                  total={formatMoney(monthly.salaryTotal)}
                  countLabel={`Payroll ${formatMoney(monthly.payrollTotal)} · Pay Staff ${formatMoney(monthly.payStaffTotal)}`}
                >
                  <p className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wide mb-2">Payroll — {formatMonthLabel(month)}</p>
                  <PaginatedTable columns={payrollColumns} data={monthly.monthPayrolls} emptyMessage={`No payroll records for ${formatMonthLabel(month)}.`} />
                  <p className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wide mt-4 mb-2">Pay Staff payments — {formatMonthLabel(month)}</p>
                  <PaginatedTable columns={payStaffColumns} data={monthly.monthPayStaff} emptyMessage={`No Pay Staff payments for ${formatMonthLabel(month)}.`} />
                </SectionCard>
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === "daily" && (
        <section aria-label="Daily expense summary">
          <Card padding="5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Daily Expense Summary — {day}</h2>
                <p className="text-xs text-[var(--color-ink-3)]">Matched by actual transaction date · updates automatically when the date changes</p>
              </div>
              <FormField label="Select Date" id="report-day" className="w-full sm:w-52">
                <Input id="report-day" type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Select date" />
              </FormField>
            </div>
          </Card>

          {dataLoading ? (
            <Card><Skeleton count={5} height={48} /></Card>
          ) : (
            <>
              <Card>
                <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-3">Expense Summary — {day}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full" role="table" aria-label={`Daily expense summary for ${day}`}>
                    <thead>
                      <tr className="bg-[var(--color-base)] border-b border-[var(--color-line)]">
                        <th scope="col" className="px-4 py-3 text-[13px] font-semibold text-left text-[var(--color-ink-2)]">Expense Type</th>
                        <th scope="col" className="px-4 py-3 text-[13px] font-semibold text-right text-[var(--color-ink-2)]">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Office Expense", daily.officeTotal],
                        ["Route Cost", daily.routeTotal],
                        ["Loan Payment", daily.loanTotal],
                        ["Salary / Pay Staff", daily.salaryTotal],
                      ].map(([label, amount]) => (
                        <tr key={label} className="border-b border-[var(--color-line)]">
                          <td className="px-4 py-3 text-[13px] text-[var(--color-ink)]">{label}</td>
                          <td className="px-4 py-3 text-[13px] text-right font-medium text-[var(--color-ink)]">{formatMoney(amount)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[var(--color-base)]">
                        <td className="px-4 py-3 text-[13px] font-bold text-[var(--color-ink)]">Total Expense</td>
                        <td className="px-4 py-3 text-[13px] text-right font-bold text-[var(--color-ink)]">{formatMoney(daily.grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
                <SectionCard icon={<Receipt className="h-4 w-4" />} title="Office Expense Details" total={formatMoney(daily.officeTotal)} countLabel={`${daily.office.length} records`}>
                  <PaginatedTable
                    columns={[
                      { key: "category", label: "Category", accessor: "category", sortable: true, render: (v) => v || "—" },
                      { key: "subCategory", label: "Spent On", accessor: "subCategory", sortable: true, render: (v) => v || "—" },
                      { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
                    ]}
                    data={daily.office}
                    emptyMessage={`No office expenses on ${day}.`}
                  />
                </SectionCard>

                <SectionCard icon={<Route className="h-4 w-4" />} title="Route Cost Details" total={formatMoney(daily.routeTotal)} countLabel={`${daily.route.length} records`}>
                  <PaginatedTable
                    columns={[
                      { key: "category", label: "Category", accessor: "category", sortable: true, render: (v) => v || "—" },
                      { key: "subCategory", label: "Spent On", accessor: "subCategory", sortable: true, render: (v) => v || "—" },
                      { key: "amount", label: "Amount", accessor: "amount", sortable: true, render: (v) => formatMoney(v) },
                    ]}
                    data={daily.route}
                    emptyMessage={`No route costs on ${day}.`}
                  />
                </SectionCard>

                <SectionCard icon={<Landmark className="h-4 w-4" />} title="Loan Payment Details" total={formatMoney(daily.loanTotal)} countLabel={`${daily.loan.length} records`}>
                  <PaginatedTable columns={loanPaymentColumns} data={daily.loan} emptyMessage={`No loan payments on ${day}.`} />
                </SectionCard>

                <SectionCard icon={<Wallet className="h-4 w-4" />} title="Salary / Pay Staff Details" total={formatMoney(daily.salaryTotal)} countLabel={`${daily.salary.length} records`}>
                  <PaginatedTable columns={payStaffColumns} data={daily.salary} emptyMessage={`No salary payments on ${day}.`} />
                </SectionCard>
              </div>

              <Card className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Grand Total for {day}</p>
                  <p className="text-lg font-bold text-[var(--color-ink)]">{formatMoney(daily.grandTotal)}</p>
                </div>
              </Card>
            </>
          )}
        </section>
      )}

      {activeTab === "collections" && (
        <section aria-label="Report center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} hover className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-[48px] h-[48px] rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]" aria-hidden="true">
                    {reportIcons[report.id]}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">{report.title}</h3>
                    <p className="text-[0.75rem] text-[var(--color-ink-3)] uppercase tracking-[0.05em]">{report.id.replace("-", " ")} Report</p>
                  </div>
                </div>
                <p className="text-[0.875rem] text-[var(--color-ink-2)] mb-4 flex-1">{report.description}</p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`${report.id}-start`} className="text-[0.75rem] font-semibold text-[var(--color-ink)] leading-[1.4]">
                        From
                      </label>
                      <Input
                        type="date"
                        value={dateRanges[report.id]?.start || ""}
                        onChange={(e) => handleDateChange(report.id, "start", e.target.value)}
                        className="h-[36px] text-[0.8125rem]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`${report.id}-end`} className="text-[0.75rem] font-semibold text-[var(--color-ink)] leading-[1.4]">
                        To
                      </label>
                      <Input
                        type="date"
                        value={dateRanges[report.id]?.end || ""}
                        onChange={(e) => handleDateChange(report.id, "end", e.target.value)}
                        className="h-[36px] text-[0.8125rem]"
                      />
                    </div>
                  </div>
                  <Button
                    variant={activeReport === report.id ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handleGenerate(report.id)}
                    loading={loading && activeReport === report.id}
                    className="w-full"
                    aria-label={`Generate ${report.title}`}
                  >
                    <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
                    {activeReport === report.id ? "Re-generate" : "Generate Report"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {activeReport && (
            <section aria-label="Report results" className="mt-8">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
                  <div>
                    <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)] flex items-center gap-2">
                      {reportIcons[activeReport]} {activeReportDef?.title} Report
                    </h2>
                    <p className="text-xs text-[var(--color-ink-3)]">
                      {activeRows.length} record{activeRows.length === 1 ? "" : "s"}
                      {dateRanges[activeReport]?.start || dateRanges[activeReport]?.end ? ` · ${dateRanges[activeReport]?.start || "—"} to ${dateRanges[activeReport]?.end || "—"}` : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveReport(null)}>Close</Button>
                </div>
                {loading && activeRows.length === 0 ? (
                  <div className="px-4 pb-4"><Skeleton count={6} height={48} /></div>
                ) : activeColumns.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-3)] py-8 text-center">No report columns available.</p>
                ) : (
                  <DataTable
                    columns={activeColumns}
                    data={paginatedReportRows}
                    emptyMessage="No records found for this report."
                    pagination={{
                      currentPage: safeReportPage,
                      totalPages: reportTotalPages,
                      onPageChange: setReportPage,
                      totalItems: activeRows.length,
                      itemsPerPage: ITEMS_PER_PAGE,
                    }}
                  />
                )}
              </Card>
            </section>
          )}
        </section>
      )}
    </PageContainer>
  );
}
