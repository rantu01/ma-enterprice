"use client";

import { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/contexts/ToastContext";
import {
  FileText,
  Users,
  CreditCard,
  TrendingUp,
  Receipt,
  Route,
  Calendar,
  ClipboardList,
  Wallet,
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

export default function ReportsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [reportPage, setReportPage] = useState(1);
  const [dateRanges, setDateRanges] = useState(
    Object.fromEntries(reports.map((r) => [r.id, { start: "", end: "" }]))
  );
  const [reportData, setReportData] = useState({});

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

  return (
    <PageContainer title="Reports" breadcrumb={<nav aria-label="Breadcrumb"><span>Reports</span></nav>}>
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
                  data={activeRows}
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
    </PageContainer>
  );
}