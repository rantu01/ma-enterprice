"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/contexts/ToastContext";
import {
  Wallet,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  History,
} from "lucide-react";
import {
  formatBDT,
  formatMonthLabel,
  getCurrentMonthCode,
  monthlySalary,
  employeeMonthPaid,
  monthCodeFromDate,
  paymentMethodLabel,
} from "@/lib/employee-utils";

const ITEMS_PER_PAGE = 10;

const PAYMENT_STATUSES = [
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Paid" },
  { value: "Cancelled", label: "Cancelled" },
];

function payrollStatusBadge(status) {
  const map = { Paid: "active", Pending: "pending", "Partially Paid": "info", Cancelled: "cancelled" };
  return <Badge variant={map[status] || "info"}>{status}</Badge>;
}

export default function PayrollReportsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [distributions, setDistributions] = useState([]);

  const [month, setMonth] = useState(() => getCurrentMonthCode());
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [historyEmployee, setHistoryEmployee] = useState("");
  const [historyData, setHistoryData] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, payRes, adjRes, distRes] = await Promise.all([
          fetch("/api/data?collection=employees", { cache: "no-store" }),
          fetch("/api/data?collection=payrolls", { cache: "no-store" }),
          fetch("/api/data?collection=payroll_adjustments", { cache: "no-store" }),
          fetch("/api/data?collection=salaryPayments", { cache: "no-store" }),
        ]);
        if (empRes.ok) setEmployees((await empRes.json()).data || []);
        if (payRes.ok) setPayrolls((await payRes.json()).data || []);
        if (adjRes.ok) setAdjustments((await adjRes.json()).data || []);
        if (distRes.ok) setDistributions((await distRes.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load data." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const monthOptions = useMemo(() => {
    const set = new Set([month]);
    payrolls.forEach((p) => { if (p.month) set.add(p.month); });
    return [...set].sort().map((m) => ({ value: m, label: formatMonthLabel(m) }));
  }, [month, payrolls]);

  const yearOptions = useMemo(() => {
    const set = new Set([year]);
    payrolls.forEach((p) => { if (p.year) set.add(String(p.year)); });
    return [...set].sort().map((y) => ({ value: y, label: y }));
  }, [year, payrolls]);

  const departmentOptions = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return [...set].sort().map((d) => ({ value: d, label: d }));
  }, [employees]);

  const employeeOptions = useMemo(() => {
    return [{ value: "", label: "All Employees" }, ...employees.map((e) => ({ value: e.id, label: e.name }))];
  }, [employees]);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => p.month === month && String(p.year) === year);
  }, [payrolls, month, year]);

  const activeEmployeeMap = useMemo(() => {
    const map = {};
    employees.forEach((e) => { map[e.id] = e; });
    return map;
  }, [employees]);

  const payrollWithDetails = useMemo(() => {
    return filteredPayrolls.map((p) => {
      const emp = activeEmployeeMap[p.employeeId];
      const empAdjustments = adjustments.filter((a) => a.payrollId === p.id);
      const bonusTotal = empAdjustments.filter((a) => a.type === "Bonus").reduce((s, a) => s + (Number(a.amount) || 0), 0);
      const allowanceTotal = empAdjustments.filter((a) => a.type === "Allowance").reduce((s, a) => s + (Number(a.amount) || 0), 0);
      const deductionTotal = empAdjustments.filter((a) => a.type === "Deduction").reduce((s, a) => s + (Number(a.amount) || 0), 0);
      const net = Math.round(((p.basicSalary || 0) + bonusTotal + allowanceTotal - deductionTotal) * 100) / 100;
      const paidAmount = distributions
        .filter((d) => d.employeeId === p.employeeId && monthCodeFromDate(d.date) === p.month)
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);
      return { ...p, emp, bonusTotal, allowanceTotal, deductionTotal, net, paidAmount, adjustments: empAdjustments };
    });
  }, [filteredPayrolls, adjustments, distributions, activeEmployeeMap]);

  const applyFilters = (rows) => {
    let result = rows;
    if (employeeFilter) result = result.filter((r) => r.employeeId === employeeFilter);
    if (departmentFilter) result = result.filter((r) => r.emp?.department === departmentFilter);
    if (statusFilter) result = result.filter((r) => r.status === statusFilter);
    return result;
  };

  const handleGenerateReport = () => {
    setReportLoading(true);
    setTimeout(() => {
      const data = applyFilters(payrollWithDetails);
      setReportData(data);
      setReportLoading(false);
      setCurrentPage(1);
    }, 300);
  };

  const totalPages = Math.max(1, Math.ceil((reportData?.length || 0) / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedData = (reportData || []).slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const reportSummary = useMemo(() => {
    if (!reportData) return null;
    const totalBasic = reportData.reduce((s, r) => s + (r.basicSalary || 0), 0);
    const totalBonus = reportData.reduce((s, r) => s + (r.bonusTotal || 0), 0);
    const totalAllowance = reportData.reduce((s, r) => s + (r.allowanceTotal || 0), 0);
    const totalDeduction = reportData.reduce((s, r) => s + (r.deductionTotal || 0), 0);
    const totalNet = reportData.reduce((s, r) => s + (r.net || 0), 0);
    const totalPaid = reportData.reduce((s, r) => s + (r.paidAmount || 0), 0);
    const pendingAmount = reportData.filter((r) => r.status !== "Paid").reduce((s, r) => s + (r.net || 0), 0);
    return { totalBasic, totalBonus, totalAllowance, totalDeduction, totalNet, totalPaid, pendingAmount, count: reportData.length };
  }, [reportData]);

  /* ---------- Yearly Report ---------- */
  const yearlyReport = useMemo(() => {
    if (!reportData) return null;
    const months = [...new Set(reportData.map((r) => r.month).filter(Boolean))].sort();
    return months.map((m) => {
      const rows = reportData.filter((r) => r.month === m);
      const totalBasic = rows.reduce((s, r) => s + (r.basicSalary || 0), 0);
      const totalBonus = rows.reduce((s, r) => s + (r.bonusTotal || 0), 0);
      const totalAllowance = rows.reduce((s, r) => s + (r.allowanceTotal || 0), 0);
      const totalDeduction = rows.reduce((s, r) => s + (r.deductionTotal || 0), 0);
      const totalNet = rows.reduce((s, r) => s + (r.net || 0), 0);
      const totalPaid = rows.reduce((s, r) => s + (r.paidAmount || 0), 0);
      const paidCount = rows.filter((r) => r.status === "Paid").length;
      const pendingCount = rows.filter((r) => r.status === "Pending").length;
      return { month: m, totalBasic, totalBonus, totalAllowance, totalDeduction, totalNet, totalPaid, paidCount, pendingCount, count: rows.length };
    });
  }, [reportData]);

  /* ---------- Department Report ---------- */
  const departmentReport = useMemo(() => {
    if (!reportData) return null;
    const deptMap = {};
    reportData.forEach((r) => {
      const dept = r.emp?.department || "Unassigned";
      if (!deptMap[dept]) deptMap[dept] = { totalBasic: 0, totalBonus: 0, totalAllowance: 0, totalDeduction: 0, totalNet: 0, totalPaid: 0, paidCount: 0, pendingCount: 0, count: 0, employeeCount: new Set() };
      const d = deptMap[dept];
      d.totalBasic += r.basicSalary || 0;
      d.totalBonus += r.bonusTotal || 0;
      d.totalAllowance += r.allowanceTotal || 0;
      d.totalDeduction += r.deductionTotal || 0;
      d.totalNet += r.net || 0;
      d.totalPaid += r.paidAmount || 0;
      if (r.status === "Paid") d.paidCount++;
      if (r.status === "Pending") d.pendingCount++;
      d.count++;
      d.employeeCount.add(r.employeeId);
    });
    return Object.entries(deptMap).map(([dept, d]) => ({
      department: dept,
      employeeCount: d.employeeCount.size,
      totalBasic: d.totalBasic,
      totalBonus: d.totalBonus,
      totalAllowance: d.totalAllowance,
      totalDeduction: d.totalDeduction,
      totalNet: d.totalNet,
      totalPaid: d.totalPaid,
      paidCount: d.paidCount,
      pendingCount: d.pendingCount,
      count: d.count,
    })).sort((a, b) => b.totalNet - a.totalNet);
  }, [reportData]);

  /* ---------- Employee History ---------- */
  const employeeHistory = useMemo(() => {
    if (!historyEmployee) return [];
    return payrolls
      .filter((p) => String(p.employeeId) === String(historyEmployee))
      .sort((a, b) => String(b.year || "").localeCompare(String(a.year || "")) || String(b.month || "").localeCompare(String(a.month || "")));
  }, [payrolls, historyEmployee]);

  const historyAdjustmentsMap = useMemo(() => {
    const map = {};
    adjustments.forEach((a) => {
      if (!map[a.payrollId]) map[a.payrollId] = { bonus: 0, allowance: 0, deduction: 0 };
      if (a.type === "Bonus") map[a.payrollId].bonus += Number(a.amount) || 0;
      if (a.type === "Allowance") map[a.payrollId].allowance += Number(a.amount) || 0;
      if (a.type === "Deduction") map[a.payrollId].deduction += Number(a.amount) || 0;
    });
    return map;
  }, [adjustments]);

  const historyColumns = [
    { key: "month", label: "Month", accessor: "month", sortable: true, render: (v) => formatMonthLabel(v) },
    { key: "year", label: "Year", accessor: "year", sortable: true },
    { key: "basicSalary", label: "Basic", accessor: "basicSalary", sortable: true, render: (v) => formatBDT(v) },
    { key: "bonusTotal", label: "Bonus", accessor: "bonusTotal", sortable: true, render: (v) => `+${formatBDT(v)}` },
    { key: "allowanceTotal", label: "Allowance", accessor: "allowanceTotal", sortable: true, render: (v) => `+${formatBDT(v)}` },
    { key: "deductionTotal", label: "Deduction", accessor: "deductionTotal", sortable: true, render: (v) => `-${formatBDT(v)}` },
    { key: "net", label: "Net", accessor: "net", sortable: true, render: (v) => formatBDT(v) },
    { key: "status", label: "Status", accessor: "status", sortable: true, render: (v) => payrollStatusBadge(v) },
  ];

  const reportColumns = [
    { key: "employeeName", label: "Employee", accessor: "employeeName", sortable: true, minWidth: "150px", render: (v, row) => (
      <div className="min-w-0">
        <p className="font-medium text-[var(--color-ink)] truncate">{v || "—"}</p>
        <p className="text-xs text-[var(--color-ink-3)] truncate">{row.emp?.department || ""}</p>
      </div>
    )},
    { key: "basicSalary", label: "Basic", accessor: "basicSalary", sortable: true, minWidth: "100px", render: (v) => formatBDT(v) },
    { key: "bonusTotal", label: "Bonus", accessor: "bonusTotal", sortable: true, minWidth: "90px", render: (v) => `+${formatBDT(v)}` },
    { key: "allowanceTotal", label: "Allowance", accessor: "allowanceTotal", sortable: true, minWidth: "100px", render: (v) => `+${formatBDT(v)}` },
    { key: "deductionTotal", label: "Deduction", accessor: "deductionTotal", sortable: true, minWidth: "110px", render: (v) => `-${formatBDT(v)}` },
    { key: "net", label: "Net", accessor: "net", sortable: true, minWidth: "100px", render: (v) => formatBDT(v) },
    { key: "paidAmount", label: "Paid", accessor: "paidAmount", sortable: true, minWidth: "100px", render: (v) => formatBDT(v) },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "100px", render: (v) => payrollStatusBadge(v) },
  ];

  return (
    <PageContainer
      title="Payroll Reports"
      breadcrumb={<><span>Employee Management</span><span aria-hidden="true">/</span><span>Payroll Reports</span></>}
    >
      <section aria-label="Report filters">
        <Card padding="5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Report Filters</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FormField label="Month" id="rpt-month">
              <Select value={month} onChange={(e) => setMonth(e.target.value)} options={monthOptions} id="rpt-month" />
            </FormField>
            <FormField label="Year" id="rpt-year">
              <Select value={year} onChange={(e) => setYear(e.target.value)} options={yearOptions} id="rpt-year" />
            </FormField>
            <FormField label="Employee" id="rpt-employee">
              <Select options={employeeOptions} value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} placeholder="All Employees" id="rpt-employee" />
            </FormField>
            <FormField label="Department" id="rpt-dept">
              <Select options={[{ value: "", label: "All Departments" }, ...departmentOptions]} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} placeholder="All Departments" id="rpt-dept" />
            </FormField>
            <FormField label="Payment Status" id="rpt-status">
              <Select options={[{ value: "", label: "All Statuses" }, ...PAYMENT_STATUSES]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="All Statuses" id="rpt-status" />
            </FormField>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[var(--color-line)]">
            <Button variant="secondary" size="sm" onClick={() => { setMonth(getCurrentMonthCode()); setYear(String(new Date().getFullYear())); setEmployeeFilter(""); setDepartmentFilter(""); setStatusFilter(""); setReportData(null); }}>Reset</Button>
            <Button variant="primary" size="sm" onClick={handleGenerateReport} loading={reportLoading}><RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> Generate Report</Button>
          </div>
        </Card>
      </section>

      {reportData !== null && (
        <section aria-label="Report results" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Basic Salary" value={formatBDT(reportSummary?.totalBasic || 0)} subtext={`${reportSummary?.count || 0} records`} icon={<Wallet className="h-5 w-5" aria-hidden="true" />} variant="info" />
            <StatCard title="Total Bonus" value={formatBDT(reportSummary?.totalBonus || 0)} subtext="Bonuses" icon={<Wallet className="h-5 w-5" aria-hidden="true" />} variant="success" />
            <StatCard title="Total Deduction" value={formatBDT(reportSummary?.totalDeduction || 0)} subtext="Deductions" icon={<Wallet className="h-5 w-5" aria-hidden="true" />} variant="warning" />
            <StatCard title="Total Net Salary" value={formatBDT(reportSummary?.totalNet || 0)} subtext={`Paid: ${formatBDT(reportSummary?.totalPaid || 0)}`} icon={<Wallet className="h-5 w-5" aria-hidden="true" />} variant="default" />
          </div>

          <Card padding="0">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
              <div>
                <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Payroll Report</h2>
                <p className="text-xs text-[var(--color-ink-3)]">{reportData.length} record{reportData.length === 1 ? "" : "s"} · {formatMonthLabel(month)} {year}</p>
              </div>
            </div>
            {reportLoading ? (
              <div className="px-4 pb-4"><Skeleton count={6} height={48} /></div>
            ) : reportData.length === 0 ? (
              <div className="px-4 pb-8 text-center text-sm text-[var(--color-ink-3)] py-8">No records match the selected filters.</div>
            ) : (
              <DataTable columns={reportColumns} data={pagedData} emptyMessage="No records found."
                pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: reportData.length, itemsPerPage: ITEMS_PER_PAGE }} />
            )}
          </Card>
        </section>
      )}

      {/* Yearly Report */}
      {yearlyReport && yearlyReport.length > 0 && (
        <section aria-label="Yearly payroll report" className="mt-6">
          <Card padding="0">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
              <div>
                <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Yearly Payroll Summary</h2>
                <p className="text-xs text-[var(--color-ink-3)]">Monthly breakdown for {year}</p>
              </div>
            </div>
            <DataTable columns={[
              { key: "month", label: "Month", accessor: "month", sortable: true, render: (v) => formatMonthLabel(v) },
              { key: "totalBasic", label: "Total Basic", accessor: "totalBasic", sortable: true, render: (v) => formatBDT(v) },
              { key: "totalBonus", label: "Total Bonus", accessor: "totalBonus", sortable: true, render: (v) => `+${formatBDT(v)}` },
              { key: "totalAllowance", label: "Total Allowance", accessor: "totalAllowance", sortable: true, render: (v) => `+${formatBDT(v)}` },
              { key: "totalDeduction", label: "Total Deduction", accessor: "totalDeduction", sortable: true, render: (v) => `-${formatBDT(v)}` },
              { key: "totalNet", label: "Total Net", accessor: "totalNet", sortable: true, render: (v) => formatBDT(v) },
              { key: "paidCount", label: "Paid", accessor: "paidCount", sortable: true },
              { key: "pendingCount", label: "Pending", accessor: "pendingCount", sortable: true },
            ]} data={yearlyReport} emptyMessage="No yearly data." />
          </Card>
        </section>
      )}

      {/* Department Report */}
      {departmentReport && departmentReport.length > 0 && (
        <section aria-label="Department payroll report" className="mt-6">
          <Card padding="0">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
              <div>
                <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Department Payroll Summary</h2>
                <p className="text-xs text-[var(--color-ink-3)]">Grouped by department · {formatMonthLabel(month)} {year}</p>
              </div>
            </div>
            <DataTable columns={[
              { key: "department", label: "Department", accessor: "department", sortable: true, minWidth: "140px" },
              { key: "employeeCount", label: "Employees", accessor: "employeeCount", sortable: true },
              { key: "totalBasic", label: "Total Basic", accessor: "totalBasic", sortable: true, render: (v) => formatBDT(v) },
              { key: "totalBonus", label: "Total Bonus", accessor: "totalBonus", sortable: true, render: (v) => `+${formatBDT(v)}` },
              { key: "totalAllowance", label: "Total Allowance", accessor: "totalAllowance", sortable: true, render: (v) => `+${formatBDT(v)}` },
              { key: "totalDeduction", label: "Total Deduction", accessor: "totalDeduction", sortable: true, render: (v) => `-${formatBDT(v)}` },
              { key: "totalNet", label: "Total Net", accessor: "totalNet", sortable: true, render: (v) => formatBDT(v) },
              { key: "paidCount", label: "Paid", accessor: "paidCount", sortable: true },
              { key: "pendingCount", label: "Pending", accessor: "pendingCount", sortable: true },
            ]} data={departmentReport} emptyMessage="No department data." />
          </Card>
        </section>
      )}

      {/* Employee Payroll History */}
      <section aria-label="Employee payroll history" className="mt-6">
        <Card padding="5">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Employee Payroll History</h2>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <FormField label="Select Employee" id="hist-employee" className="w-full sm:w-64">
              <Select options={[{ value: "", label: "Select an employee" }, ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.department || "—"})` }))]} value={historyEmployee} onChange={(e) => { setHistoryEmployee(e.target.value); setHistoryData(null); setShowHistoryModal(false); }} placeholder="Select employee" id="hist-employee" />
            </FormField>
            <Button variant="primary" size="sm" onClick={() => {
              if (!historyEmployee) {
                addToast({ type: "warning", title: "Select Employee", message: "Please select an employee to view history." });
                return;
              }
              const emp = employees.find((e) => e.id === historyEmployee);
              const history = payrolls.filter((p) => String(p.employeeId) === String(historyEmployee)).sort((a, b) => String(b.year || "").localeCompare(String(a.year || "")) || String(b.month || "").localeCompare(String(a.month || "")));
              setHistoryData({ employee: emp, history });
              setShowHistoryModal(true);
            }}>View History</Button>
          </div>
        </Card>
      </section>

      {/* Employee History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => { setShowHistoryModal(false); setHistoryData(null); setHistoryEmployee(""); }} title="Employee Payroll History"
        footer={<Button variant="secondary" onClick={() => { setShowHistoryModal(false); setHistoryData(null); setHistoryEmployee(""); }}>Close</Button>}>
        {historyData && (
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-[var(--color-ink-3)]">Employee: </span>
              <strong className="text-[var(--color-ink)]">{historyData.employee?.name}</strong>
              <span className="text-[var(--color-ink-3)] ml-3">Department: </span>
              <strong className="text-[var(--color-ink)]">{historyData.employee?.department || "—"}</strong>
              <span className="text-[var(--color-ink-3)] ml-3">Monthly Salary: </span>
              <strong className="text-[var(--color-ink)]">{formatBDT(monthlySalary(historyData.employee))}</strong>
            </div>
            {historyData.history.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-3)]">No payroll records for this employee.</p>
            ) : (
              <DataTable columns={historyColumns} data={historyData.history} emptyMessage="No payroll records." />
            )}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}