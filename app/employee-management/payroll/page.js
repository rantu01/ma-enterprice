"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import StatCard from "@/components/dashboard/StatCard";
import { useToast } from "@/components/contexts/ToastContext";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Download,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  History,
  Filter,
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

const ADJUSTMENT_TYPES = [
  { value: "Bonus", label: "Bonus" },
  { value: "Allowance", label: "Allowance" },
  { value: "Deduction", label: "Deduction" },
];

const BONUS_CATEGORIES = [
  "Performance Bonus",
  "Festival Bonus",
  "Project Bonus",
  "Attendance Bonus",
  "Special Bonus",
  "Other",
];

const ALLOWANCE_CATEGORIES = [
  "Transport Allowance",
  "Food Allowance",
  "Mobile Allowance",
  "Housing Allowance",
  "Other",
];

const DEDUCTION_CATEGORIES = [
  "Unpaid Leave",
  "Late/Attendance Deduction",
  "Loan Installment",
  "Salary Advance",
  "Other",
];

const PAYMENT_METHODS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
  { value: "bKash", label: "bKash" },
  { value: "Other", label: "Other" },
];

const PAYMENT_STATUSES = [
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Paid" },
  { value: "Cancelled", label: "Cancelled" },
];

function payrollStatusBadge(status) {
  const map = { Paid: "active", Pending: "pending", "Partially Paid": "info", Cancelled: "cancelled" };
  return <Badge variant={map[status] || "info"}>{status}</Badge>;
}

export default function PayrollPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [distributions, setDistributions] = useState([]);

  const [month, setMonth] = useState(() => getCurrentMonthCode());
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [generating, setGenerating] = useState(false);

  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddBonusModal, setShowAddBonusModal] = useState(false);
  const [addingBonus, setAddingBonus] = useState(false);

  const [adjustForm, setAdjustForm] = useState({ type: "Bonus", category: "", amount: "", reason: "" });
  const [addBonusForm, setAddBonusForm] = useState({ employeeId: "", type: "Bonus", category: "", amount: "", reason: "" });
  const [payForm, setPayForm] = useState({ method: "", amount: "", date: "", transactionId: "", note: "" });

  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [genResult, setGenResult] = useState(null);

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
        addToast({ type: "error", title: "Error", message: "Failed to load payroll data." });
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

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => p.month === month && String(p.year) === year);
  }, [payrolls, month, year]);

  const activeEmployeeMap = useMemo(() => {
    const map = {};
    employees.forEach((e) => { map[e.id] = e; });
    return map;
  }, [employees]);

  const payrollRows = useMemo(() => {
    return filteredPayrolls
      .map((p) => {
        const emp = activeEmployeeMap[p.employeeId];
        const empAdjustments = adjustments.filter((a) => a.payrollId === p.id);
        const bonusTotal = empAdjustments.filter((a) => a.type === "Bonus").reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const allowanceTotal = empAdjustments.filter((a) => a.type === "Allowance").reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const deductionTotal = empAdjustments.filter((a) => a.type === "Deduction").reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const net = Math.round(((p.basicSalary || 0) + bonusTotal + allowanceTotal - deductionTotal) * 100) / 100;
        // Amount paid through "Pay Staff" (employees page) / salary distributions
        // for this employee in this payroll month. Matched by employee + YYYY-MM
        // derived from the payment date so Pay Staff payments are deducted and
        // reflected here even when no payrollId was stored.
        const paidStaff = (distributions || [])
          .filter(
            (d) =>
              String(d.employeeId) === String(p.employeeId) &&
              monthCodeFromDate(d.date) === p.month
          )
          .reduce((s, d) => s + (Number(d.amount) || 0), 0);
        const due = Math.max(0, Math.round((net - paidStaff) * 100) / 100);
        // Reflect Pay Staff payments in the displayed status without mutating DB.
        let displayStatus = p.status;
        if (displayStatus !== "Cancelled") {
          if (net > 0 && paidStaff >= net) displayStatus = "Paid";
          else if (paidStaff > 0) displayStatus = "Partially Paid";
        }
        return { ...p, emp, bonusTotal, allowanceTotal, deductionTotal, net, paidStaff, due, displayStatus, adjustments: empAdjustments };
      })
      .sort((a, b) => String(a.employeeName || "").localeCompare(String(b.employeeName || "")));
  }, [filteredPayrolls, adjustments, distributions, activeEmployeeMap]);

  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payrollRows;
    return payrollRows.filter((r) =>
      [r.employeeName, r.employeeId, r.status, r.displayStatus].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
    );
  }, [payrollRows, search]);

  const totalPages = Math.max(1, Math.ceil(searchFiltered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = searchFiltered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const summary = useMemo(() => {
    const totalBasic = payrollRows.reduce((s, r) => s + (r.basicSalary || 0), 0);
    const totalBonus = payrollRows.reduce((s, r) => s + (r.bonusTotal || 0), 0);
    const totalAllowance = payrollRows.reduce((s, r) => s + (r.allowanceTotal || 0), 0);
    const totalDeduction = payrollRows.reduce((s, r) => s + (r.deductionTotal || 0), 0);
    const totalNet = payrollRows.reduce((s, r) => s + (r.net || 0), 0);
    const totalPaidStaff = payrollRows.reduce((s, r) => s + (r.paidStaff || 0), 0);
    const totalDue = payrollRows.reduce((s, r) => s + (r.due || 0), 0);
    const paidCount = payrollRows.filter((r) => (r.displayStatus || r.status) === "Paid").length;
    const pendingCount = payrollRows.filter((r) => (r.displayStatus || r.status) !== "Paid").length;
    return { totalBasic, totalBonus, totalAllowance, totalDeduction, totalNet, totalPaidStaff, totalDue, paidCount, pendingCount, total: payrollRows.length };
  }, [payrollRows]);

  const handleGenerate = async () => {
    if (!month || !year) {
      addToast({ type: "warning", title: "Missing info", message: "Please select month and year." });
      return;
    }
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", month, year }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generate failed");
      }
      const data = await res.json();
      const result = data.data;
      if (result.generated && result.generated.length > 0) {
        setPayrolls((prev) => [...result.generated, ...prev]);
      }
      const messages = [];
      if (result.generated && result.generated.length > 0) {
        messages.push(`${result.generated.length} payroll record(s) generated.`);
      }
      if (result.skipped && result.skipped.length > 0) {
        messages.push(`${result.skipped.length} employee(s) skipped (already have payroll for ${formatMonthLabel(month)} ${year}).`);
      }
      if (result.errors && result.errors.length > 0) {
        messages.push(`${result.errors.length} error(s) occurred.`);
        result.errors.forEach((e) => addToast({ type: "error", title: "Error", message: `Failed to generate payroll for ${e.employeeName}: ${e.error}` }));
      }
      if (messages.length > 0) {
        addToast({ type: "success", title: "Payroll Generated", message: messages.join(" ") });
      } else {
        addToast({ type: "warning", title: "No Changes", message: `All active employees already have payroll for ${formatMonthLabel(month)} ${year}.` });
      }
    } catch (err) {
      addToast({ type: "error", title: "Error", message: `Failed to generate payroll: ${err.message}` });
    } finally {
      setGenerating(false);
    }
  };

  const handleAddAdjustment = async () => {
    if (!adjustForm.category || !adjustForm.amount || Number(adjustForm.amount) <= 0) {
      addToast({ type: "warning", title: "Missing info", message: "Category and amount are required." });
      return;
    }
    const payroll = payrollRows.find((r) => r.id === selectedPayroll);
    if (!payroll) return;
    const payload = {
      payrollId: selectedPayroll,
      employeeId: payroll.employeeId,
      employeeName: payroll.employeeName,
      month: payroll.month,
      year: payroll.year,
      type: adjustForm.type,
      category: adjustForm.category,
      amount: Number(adjustForm.amount),
      reason: adjustForm.reason.trim(),
    };
    try {
      const res = await fetch("/api/data?collection=payroll_adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      setAdjustments((prev) => [data.data, ...prev]);
      setShowAdjustModal(false);
      setAdjustForm({ type: "Bonus", category: "", amount: "", reason: "" });
      addToast({ type: "success", title: "Adjustment Added", message: `${adjustForm.type} of ${formatBDT(adjustForm.amount)} added.` });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to add adjustment." });
    }
  };

  const handleDeleteAdjustment = async (adjId) => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${adjId}&collection=payroll_adjustments`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setAdjustments((prev) => prev.filter((a) => a.id !== adjId));
      setShowDeleteModal(false);
      setDeleting(null);
      addToast({ type: "success", title: "Adjustment Deleted", message: "Payroll adjustment removed." });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to delete adjustment." });
    } finally {
      setConfirmingDelete(false);
    }
  };

  const handlePaySubmit = async () => {
    if (!payForm.method || !payForm.amount || Number(payForm.amount) <= 0) {
      addToast({ type: "warning", title: "Missing info", message: "Payment method and amount are required." });
      return;
    }
    const payroll = payrollRows.find((r) => r.id === selectedPayroll);
    if (!payroll) return;
    const payload = {
      payrollId: selectedPayroll,
      employeeId: payroll.employeeId,
      employeeName: payroll.employeeName,
      date: payForm.date || new Date().toISOString().slice(0, 10),
      amount: Number(payForm.amount),
      method: payForm.method,
      purpose: payForm.note.trim() || `Salary payment - ${payroll.month}`,
      transactionId: payForm.transactionId.trim(),
      note: payForm.note.trim(),
    };
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "distribute", ...payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment failed");
      }
      const data = await res.json();
      setDistributions((prev) => [data.data, ...prev]);
      const totalPaidAfter = (payroll.paidStaff || 0) + Number(payload.amount);
      const nextStatus = payroll.net > 0 && totalPaidAfter >= payroll.net ? "Paid" : totalPaidAfter > 0 ? "Partially Paid" : payroll.status;
      setPayrolls((prev) => prev.map((p) => (p.id === selectedPayroll ? { ...p, status: nextStatus === "Partially Paid" ? "Pending" : nextStatus } : p)));
      setShowPayModal(false);
      setPayForm({ method: "", amount: "", date: new Date().toISOString().slice(0, 10), transactionId: "", note: "" });
      addToast({ type: "success", title: "Payment Recorded", message: `${formatBDT(payload.amount)} paid to ${payroll.employeeName}.` });
    } catch (err) {
      addToast({ type: "error", title: "Error", message: `Failed to record payment: ${err.message}` });
    }
  };

  const openAdjustModal = (payrollId) => {
    setSelectedPayroll(payrollId);
    setAdjustForm({ type: "Bonus", category: "", amount: "", reason: "" });
    setShowAdjustModal(true);
  };

  const openPayModal = (payrollId) => {
    setSelectedPayroll(payrollId);
    const payroll = payrollRows.find((r) => r.id === payrollId);
    const due = payroll ? Math.max(0, (payroll.net || 0) - (payroll.paidStaff || 0)) : 0;
    setPayForm({ method: "", amount: due > 0 ? String(due) : "", date: new Date().toISOString().slice(0, 10), transactionId: "", note: "" });
    setShowPayModal(true);
  };

  const openDetailModal = (payrollId) => {
    setSelectedPayroll(payrollId);
    setShowDetailModal(true);
  };

  const openHistoryModal = (employeeId) => {
    setSelectedPayroll(employeeId);
    setShowHistoryModal(true);
  };

  const openAddBonusModal = () => {
    setAddBonusForm({ employeeId: "", type: "Bonus", category: "", amount: "", reason: "" });
    setShowAddBonusModal(true);
  };

  const employeeSelectOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: `${e.name}${e.status && e.status !== "Active" ? ` (${e.status})` : ""}` })),
    [employees]
  );

  const addBonusTargetPayroll = useMemo(() => {
    if (!addBonusForm.employeeId) return null;
    return payrolls.find(
      (p) => String(p.employeeId) === String(addBonusForm.employeeId) && p.month === month && String(p.year) === year
    ) || null;
  }, [payrolls, addBonusForm.employeeId, month, year]);

  const addBonusEmployee = useMemo(
    () => employees.find((e) => String(e.id) === String(addBonusForm.employeeId)) || null,
    [employees, addBonusForm.employeeId]
  );

  const handleAddBonusSubmit = async () => {
    if (!addBonusForm.employeeId) {
      addToast({ type: "warning", title: "Missing info", message: "Please select an employee." });
      return;
    }
    if (!addBonusForm.category || !addBonusForm.amount || Number(addBonusForm.amount) <= 0) {
      addToast({ type: "warning", title: "Missing info", message: "Category and amount are required." });
      return;
    }
    const emp = employees.find((e) => String(e.id) === String(addBonusForm.employeeId));
    if (!emp) {
      addToast({ type: "error", title: "Error", message: "Selected employee not found." });
      return;
    }
    setAddingBonus(true);
    try {
      let payroll = payrolls.find(
        (p) => String(p.employeeId) === String(emp.id) && p.month === month && String(p.year) === year
      );
      if (!payroll) {
        const payrollPayload = {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email || "",
          department: emp.department || "",
          month,
          year: String(year),
          basicSalary: Number(emp.salary) || 0,
          bonus: 0,
          allowance: 0,
          deduction: 0,
          netSalary: Number(emp.salary) || 0,
          status: "Pending",
        };
        const payRes = await fetch("/api/data?collection=payrolls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payrollPayload),
        });
        if (!payRes.ok) throw new Error("Failed to create payroll record");
        const payData = await payRes.json();
        payroll = payData.data;
        setPayrolls((prev) => [payroll, ...prev]);
      }
      const payload = {
        payrollId: payroll.id,
        employeeId: emp.id,
        employeeName: emp.name,
        month: payroll.month,
        year: payroll.year,
        type: addBonusForm.type,
        category: addBonusForm.category,
        amount: Number(addBonusForm.amount),
        reason: addBonusForm.reason.trim(),
      };
      const res = await fetch("/api/data?collection=payroll_adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save adjustment");
      const data = await res.json();
      setAdjustments((prev) => [data.data, ...prev]);
      setShowAddBonusModal(false);
      setAddBonusForm({ employeeId: "", type: "Bonus", category: "", amount: "", reason: "" });
      addToast({ type: "success", title: "Adjustment Added", message: `${payload.type} of ${formatBDT(payload.amount)} added for ${emp.name}.` });
    } catch (err) {
      addToast({ type: "error", title: "Error", message: err.message || "Failed to add bonus." });
    } finally {
      setAddingBonus(false);
    }
  };

  const employeePayrollHistory = useMemo(() => {
    if (!selectedPayroll) return [];
    return payrolls
      .filter((p) => String(p.employeeId) === String(selectedPayroll))
      .sort((a, b) => String(b.year || "").localeCompare(String(a.year || "")) || String(b.month || "").localeCompare(String(a.month || "")));
  }, [payrolls, selectedPayroll]);

  const historyAdjMap = useMemo(() => {
    const map = {};
    adjustments.forEach((a) => {
      if (!map[a.payrollId]) map[a.payrollId] = { bonus: 0, allowance: 0, deduction: 0 };
      if (a.type === "Bonus") map[a.payrollId].bonus += Number(a.amount) || 0;
      if (a.type === "Allowance") map[a.payrollId].allowance += Number(a.amount) || 0;
      if (a.type === "Deduction") map[a.payrollId].deduction += Number(a.amount) || 0;
    });
    return map;
  }, [adjustments]);

  const historyPaidMap = useMemo(() => {
    const map = {};
    (distributions || []).forEach((d) => {
      const m = monthCodeFromDate(d.date);
      if (!m) return;
      const key = `${String(d.employeeId)}__${m}`;
      map[key] = (map[key] || 0) + (Number(d.amount) || 0);
    });
    return map;
  }, [distributions]);

  const columns = [
    { key: "employeeName", label: "Employee", accessor: "employeeName", sortable: true, minWidth: "160px", render: (v, row) => (
      <div className="min-w-0">
        <p className="font-medium text-[var(--color-ink)] truncate">{v || "—"}</p>
        <p className="text-xs text-[var(--color-ink-3)] truncate">{row.employeeId || ""}</p>
      </div>
    )},
    { key: "basicSalary", label: "Basic Salary", accessor: "basicSalary", sortable: true, minWidth: "120px", render: (v) => formatBDT(v) },
    { key: "bonusTotal", label: "Bonus", accessor: "bonusTotal", sortable: true, minWidth: "100px", render: (v) => `+${formatBDT(v)}` },
    { key: "allowanceTotal", label: "Allowance", accessor: "allowanceTotal", sortable: true, minWidth: "120px", render: (v) => `+${formatBDT(v)}` },
    { key: "deductionTotal", label: "Deduction", accessor: "deductionTotal", sortable: true, minWidth: "120px", render: (v) => `-${formatBDT(v)}` },
    { key: "net", label: "Net Salary", accessor: "net", sortable: true, minWidth: "120px", render: (v) => formatBDT(v) },
    { key: "paidStaff", label: "Paid (Pay Staff)", accessor: "paidStaff", sortable: true, minWidth: "130px", render: (v) => formatBDT(v) },
    { key: "status", label: "Status", accessor: "displayStatus", sortable: true, minWidth: "110px", render: (v, row) => payrollStatusBadge(v || row.status) },
    {
      key: "actions", label: "Action", accessor: "id", minWidth: "200px",
      render: (id, row) => (
        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => openHistoryModal(row.employeeId)} aria-label={`History ${row.employeeName}`} title="History"><History className="h-3.5 w-3.5" aria-hidden="true" /></Button>
          <Button variant="ghost" size="sm" onClick={() => openDetailModal(id)} aria-label={`View ${row.employeeName}`}><Eye className="h-3.5 w-3.5" aria-hidden="true" /></Button>
          <Button variant="ghost" size="sm" onClick={() => openAdjustModal(id)} aria-label={`Adjust ${row.employeeName}`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" /></Button>
          <Button variant="ghost" size="sm" onClick={() => openPayModal(id)} aria-label={`Pay ${row.employeeName}`}><Wallet className="h-3.5 w-3.5" aria-hidden="true" /></Button>
        </div>
      ),
    },
  ];

  const emp = activeEmployeeMap[selectedPayroll];
  const selectedHistory = employeePayrollHistory;
  const selectedHistoryAdj = adjustments.filter((a) => selectedHistory.some((h) => h.id === a.payrollId));

  return (
    <PageContainer
      title="Monthly Payroll"
      breadcrumb={<><span>Employee Management</span><span aria-hidden="true">/</span><span>Monthly Payroll</span></>}
    >
      <section aria-label="Payroll controls">
        <Card padding="5">
          <div className="flex flex-wrap items-end gap-3">
            <FormField label="Month" id="payroll-month" className="w-full sm:w-44">
              <Select value={month} onChange={(e) => { setMonth(e.target.value); setCurrentPage(1); }} options={monthOptions} id="payroll-month" />
            </FormField>
            <FormField label="Year" id="payroll-year" className="w-full sm:w-36">
              <Select value={year} onChange={(e) => { setYear(e.target.value); setCurrentPage(1); }} options={yearOptions} id="payroll-year" />
            </FormField>
            <Button variant="primary" size="sm" onClick={handleGenerate} loading={generating}>
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> Generate Payroll
            </Button>
            <Button variant="secondary" size="sm" onClick={openAddBonusModal}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Add Bonus / Payroll
            </Button>
          </div>
        </Card>
      </section>

      <section aria-label="Payroll summary" className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Basic Salary" value={formatBDT(summary.totalBasic)} subtext={`${summary.total} employees`} icon={<Wallet className="h-5 w-5" aria-hidden="true" />} variant="info" />
          <StatCard title="Paid (Pay Staff)" value={formatBDT(summary.totalPaidStaff)} subtext={`${summary.paidCount} paid · ${formatMonthLabel(month)} ${year}`} icon={<ArrowUpCircle className="h-5 w-5" aria-hidden="true" />} variant="success" />
          <StatCard title="Total Deduction" value={formatBDT(summary.totalDeduction)} subtext={`${summary.pendingCount} pending`} icon={<ArrowDownCircle className="h-5 w-5" aria-hidden="true" />} variant="warning" />
          <StatCard title="Total Net Salary" value={formatBDT(summary.totalNet)} subtext={`Due ${formatBDT(summary.totalDue)} · ${formatMonthLabel(month)} ${year}`} icon={<Wallet className="h-5 w-5" aria-hidden="true" />} variant="default" />
        </div>
      </section>

      <section aria-label="Payroll table" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Payroll Records</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{searchFiltered.length} record{searchFiltered.length === 1 ? "" : "s"} · {formatMonthLabel(month)} {year}</p>
            </div>
            <Input placeholder="Search employees..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} aria-label="Search payroll" className="w-full sm:w-56" />
          </div>
          {loading ? (
            <div className="px-4 pb-4"><Skeleton count={6} height={48} /></div>
          ) : pagedRows.length === 0 ? (
            <div className="px-4 pb-8 text-center text-sm text-[var(--color-ink-3)] py-8">
              No payroll records for {formatMonthLabel(month)} {year}. Click &quot;Generate Payroll&quot; to create records.
            </div>
          ) : (
            <DataTable columns={columns} data={pagedRows} emptyMessage="No payroll records."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: searchFiltered.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      {/* Add Bonus / Payroll Modal */}
      <Modal isOpen={showAddBonusModal} onClose={() => setShowAddBonusModal(false)} title={`Add Bonus / Payroll — ${formatMonthLabel(month)} ${year}`}
        footer={<><Button variant="secondary" onClick={() => setShowAddBonusModal(false)}>Cancel</Button><Button onClick={handleAddBonusSubmit} loading={addingBonus}>Add Adjustment</Button></>}>
        <div className="space-y-3">
          <FormField label="Select Employee" id="add-bonus-emp" required>
            <Select options={employeeSelectOptions} value={addBonusForm.employeeId} onChange={(e) => setAddBonusForm((p) => ({ ...p, employeeId: e.target.value }))} placeholder="Select employee" id="add-bonus-emp" />
          </FormField>
          {addBonusEmployee && (
            <div className="rounded-lg bg-[var(--color-base)] px-3 py-2.5 text-sm" role="status" aria-live="polite">
              {addBonusTargetPayroll ? (
                <p className="text-[var(--color-ink-2)]">Payroll exists for <strong className="text-[var(--color-ink)]">{addBonusEmployee.name}</strong> · Basic {formatBDT(addBonusTargetPayroll.basicSalary)} · Status {addBonusTargetPayroll.status}</p>
              ) : (
                <p className="text-[var(--color-ink-2)]">No payroll yet for <strong className="text-[var(--color-ink)]">{addBonusEmployee.name}</strong> in {formatMonthLabel(month)} {year}. A payroll record will be created automatically.</p>
              )}
            </div>
          )}
          <FormField label="Adjustment Type" id="add-bonus-type">
            <Select options={ADJUSTMENT_TYPES} value={addBonusForm.type} onChange={(e) => setAddBonusForm((p) => ({ ...p, type: e.target.value, category: "" }))} id="add-bonus-type" />
          </FormField>
          <FormField label="Category" id="add-bonus-category" required>
            <Select options={[{ value: "", label: "Select category" }, ...(addBonusForm.type === "Bonus" ? BONUS_CATEGORIES : addBonusForm.type === "Allowance" ? ALLOWANCE_CATEGORIES : DEDUCTION_CATEGORIES).map((c) => ({ value: c, label: c }))]} value={addBonusForm.category} onChange={(e) => setAddBonusForm((p) => ({ ...p, category: e.target.value }))} placeholder="Select category" id="add-bonus-category" />
          </FormField>
          <FormField label="Amount" id="add-bonus-amount" required>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={addBonusForm.amount} onChange={(e) => setAddBonusForm((p) => ({ ...p, amount: e.target.value }))} id="add-bonus-amount" />
          </FormField>
          <FormField label="Reason" id="add-bonus-reason">
            <Input placeholder="Reason for adjustment" value={addBonusForm.reason} onChange={(e) => setAddBonusForm((p) => ({ ...p, reason: e.target.value }))} id="add-bonus-reason" />
          </FormField>
        </div>
      </Modal>

      {/* Adjust Modal */}
      <Modal isOpen={showAdjustModal} onClose={() => { setShowAdjustModal(false); setSelectedPayroll(null); }} title="Add Payroll Adjustment"
        footer={<><Button variant="secondary" onClick={() => { setShowAdjustModal(false); setSelectedPayroll(null); }}>Cancel</Button><Button onClick={handleAddAdjustment}>Add Adjustment</Button></>}>
        <div className="space-y-3">
          <FormField label="Adjustment Type" id="adj-type">
            <Select options={ADJUSTMENT_TYPES} value={adjustForm.type} onChange={(e) => setAdjustForm((p) => ({ ...p, type: e.target.value, category: "" }))} id="adj-type" />
          </FormField>
          <FormField label="Category" id="adj-category">
            <Select options={[{ value: "", label: "Select category" }, ...(adjustForm.type === "Bonus" ? BONUS_CATEGORIES : adjustForm.type === "Allowance" ? ALLOWANCE_CATEGORIES : DEDUCTION_CATEGORIES).map((c) => ({ value: c, label: c }))]} value={adjustForm.category} onChange={(e) => setAdjustForm((p) => ({ ...p, category: e.target.value }))} placeholder="Select category" id="adj-category" />
          </FormField>
          <FormField label="Amount" id="adj-amount">
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={adjustForm.amount} onChange={(e) => setAdjustForm((p) => ({ ...p, amount: e.target.value }))} />
          </FormField>
          <FormField label="Reason" id="adj-reason">
            <Input placeholder="Reason for adjustment" value={adjustForm.reason} onChange={(e) => setAdjustForm((p) => ({ ...p, reason: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Pay Modal */}
      <Modal isOpen={showPayModal} onClose={() => { setShowPayModal(false); setSelectedPayroll(null); }} title="Record Salary Payment"
        footer={<><Button variant="secondary" onClick={() => { setShowPayModal(false); setSelectedPayroll(null); }}>Cancel</Button><Button onClick={handlePaySubmit}>Record Payment</Button></>}>
        <div className="space-y-3">
          {selectedPayroll && (() => {
            const pr = payrollRows.find((r) => r.id === selectedPayroll);
            if (!pr) return null;
            return (
              <div className="rounded-lg bg-[var(--color-base)] px-3 py-2.5 text-sm" role="status" aria-live="polite">
                <p className="text-[var(--color-ink-2)]">
                  {pr.employeeName} · Net {formatBDT(pr.net)} · Paid (Pay Staff) {formatBDT(pr.paidStaff)} · <strong className="text-[var(--color-ink)]">Due {formatBDT(pr.due)}</strong>
                </p>
              </div>
            );
          })()}
          <FormField label="Payment Method" id="pay-method">
            <Select options={PAYMENT_METHODS} value={payForm.method} onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value }))} placeholder="Select method" id="pay-method" />
          </FormField>
          <FormField label="Amount" id="pay-amount">
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} />
          </FormField>
          <FormField label="Payment Date" id="pay-date">
            <Input type="date" value={payForm.date} onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))} />
          </FormField>
          <FormField label="Transaction ID" id="pay-txn">
            <Input placeholder="Optional" value={payForm.transactionId} onChange={(e) => setPayForm((p) => ({ ...p, transactionId: e.target.value }))} />
          </FormField>
          <FormField label="Note" id="pay-note">
            <Input placeholder="Optional note" value={payForm.note} onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedPayroll(null); }} title="Payroll Details"
        footer={<Button variant="secondary" onClick={() => { setShowDetailModal(false); setSelectedPayroll(null); }}>Close</Button>}>
        {selectedPayroll && (() => {
          const p = payrollRows.find((r) => r.id === selectedPayroll);
          if (!p) return null;
          return (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-[var(--color-ink-3)] text-xs">Employee</p><p className="font-semibold">{p.employeeName}</p></div>
                <div><p className="text-[var(--color-ink-3)] text-xs">Month</p><p className="font-semibold">{formatMonthLabel(p.month)} {p.year}</p></div>
                <div><p className="text-[var(--color-ink-3)] text-xs">Basic Salary</p><p className="font-semibold">{formatBDT(p.basicSalary)}</p></div>
                <div><p className="text-[var(--color-ink-3)] text-xs">Net Salary</p><p className="font-semibold">{formatBDT(p.net)}</p></div>
                <div><p className="text-[var(--color-ink-3)] text-xs">Paid (Pay Staff)</p><p className="font-semibold">{formatBDT(p.paidStaff)}</p></div>
                <div><p className="text-[var(--color-ink-3)] text-xs">Remaining Due (Net − Paid)</p><p className="font-semibold">{formatBDT(p.due)}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink-3)] uppercase mb-2">Adjustments</p>
                {p.adjustments && p.adjustments.length > 0 ? (
                  <div className="space-y-2">
                    {p.adjustments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded-lg border border-[var(--color-line)]">
                        <div>
                          <span className="font-medium">{a.type}: {a.category}</span>
                          {a.reason && <p className="text-[var(--color-ink-3)]">{a.reason}</p>}
                        </div>
                        <span className={a.type === "Deduction" ? "text-[var(--color-error)] font-bold" : "text-[var(--color-success-text)] font-bold"}>
                          {a.type === "Deduction" ? "-" : "+"} {formatBDT(a.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--color-ink-3)]">No adjustments.</p>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => { setShowHistoryModal(false); setSelectedPayroll(null); }} title="Payroll History"
        footer={<Button variant="secondary" onClick={() => { setShowHistoryModal(false); setSelectedPayroll(null); }}>Close</Button>}>
        {emp && (
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-[var(--color-ink-3)]">Employee: </span>
              <strong className="text-[var(--color-ink)]">{emp.name}</strong>
              <span className="text-[var(--color-ink-3)] ml-3">Basic Salary: </span>
              <strong className="text-[var(--color-ink)]">{formatBDT(monthlySalary(emp))}</strong>
            </div>
            {selectedHistory.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-3)]">No payroll records for this employee.</p>
            ) : (
              <div className="space-y-2">
                {selectedHistory.map((h) => {
                  const adj = historyAdjMap[h.id] || { bonus: 0, allowance: 0, deduction: 0 };
                  const net = Math.round(((h.basicSalary || 0) + adj.bonus + adj.allowance - adj.deduction) * 100) / 100;
                  const paidStaff = historyPaidMap[`${String(h.employeeId)}__${h.month}`] || 0;
                  const due = Math.max(0, Math.round((net - paidStaff) * 100) / 100);
                  const displayStatus = h.status !== "Cancelled" ? (net > 0 && paidStaff >= net ? "Paid" : paidStaff > 0 ? "Partially Paid" : h.status) : h.status;
                  return (
                    <div key={h.id} className="p-3 rounded-lg border border-[var(--color-line)] text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[var(--color-ink)]">{formatMonthLabel(h.month)} {h.year}</span>
                        {payrollStatusBadge(displayStatus)}
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-[var(--color-ink-3)]">
                        <span>Basic: {formatBDT(h.basicSalary)}</span>
                        <span className="text-[var(--color-success-text)]">+{formatBDT(adj.bonus)}</span>
                        <span className="text-[var(--color-error)]">-{formatBDT(adj.deduction)}</span>
                        <span className="font-bold text-[var(--color-ink)]">Net: {formatBDT(net)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                        <span className="text-[var(--color-ink-2)]">Paid (Pay Staff): <strong className="text-[var(--color-ink)]">{formatBDT(paidStaff)}</strong></span>
                        <span className="text-[var(--color-ink-2)]">Due: <strong className="text-[var(--color-ink)]">{formatBDT(due)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Adjustment"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleDeleteAdjustment} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Delete this payroll adjustment? This cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}