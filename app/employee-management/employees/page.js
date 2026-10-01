"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import SummaryBox from "@/components/dashboard/SummaryBox";
import { useToast } from "@/components/contexts/ToastContext";
import { Plus, Pencil, Trash2, History, FileEdit, Calendar, Wallet, TriangleAlert } from "lucide-react";
import useDepartments from "@/hooks/useDepartments";
import {
  EMPLOYEE_STATUSES,
  SALARY_PAYMENT_METHODS,
  formatBDT,
  formatMonthLabel,
  getCurrentMonthCode,
  monthlySalary,
  employeeMonthPaid,
  employeeMonthDue,
  employeeOverdueSalary,
  employeeTotalPaid,
  computeSalarySummary,
  monthCodeFromDate,
} from "@/lib/employee-utils";

const EMPLOYEE_PAGE_SIZE = 10;
const LEDGER_PAGE_SIZE = 5;
const HISTORY_PAGE_SIZE = 10;

/** "September 2026" -> "September - 2026" */
const monthHeading = (month) => formatMonthLabel(month).replace(/(\d{4})$/, " - $1");

const statusBadge = (s) => (s === "Active" ? "active" : s === "Terminated" ? "cancelled" : s === "Inactive" ? "unpaid" : "info");

const emptyEmployeeForm = { name: "", email: "", phone: "", department: "", salary: "", status: "Active" };

export default function EmployeesPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [payments, setPayments] = useState([]);

  const { options: departmentOptions } = useDepartments();

  const [search, setSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeePage, setEmployeePage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [detailMonth, setDetailMonth] = useState(() => getCurrentMonthCode());

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyEmployeeForm);
  const [adding, setAdding] = useState(false);

  const [editing, setEditing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [payTarget, setPayTarget] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payDate, setPayDate] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payPurpose, setPayPurpose] = useState("");
  const [paying, setPaying] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, payRes] = await Promise.all([
          fetch("/api/data?collection=employees", { cache: "no-store" }),
          fetch("/api/data?collection=salaryPayments", { cache: "no-store" }),
        ]);
        if (empRes.ok) {
          const list = (await empRes.json()).data || [];
          setEmployees(list);
          if (list.length > 0) setSelectedEmployeeId(list[0].id);
        }
        if (payRes.ok) setPayments((await payRes.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load employees." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const currentMonth = getCurrentMonthCode();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.name, e.email, e.phone, e.department, e.status].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
    );
  }, [employees, search]);

  const employeeTotalPages = Math.max(1, Math.ceil(filtered.length / EMPLOYEE_PAGE_SIZE));
  const safeEmployeePage = Math.min(employeePage, employeeTotalPages);
  const pagedEmployees = filtered.slice((safeEmployeePage - 1) * EMPLOYEE_PAGE_SIZE, safeEmployeePage * EMPLOYEE_PAGE_SIZE);

  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0] || null;

  const activeLedger = useMemo(() => {
    if (!activeEmployee) return [];
    return payments
      .filter((p) => String(p.employeeId) === String(activeEmployee.id))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }, [payments, activeEmployee]);

  const ledgerTotalPages = Math.max(1, Math.ceil(activeLedger.length / LEDGER_PAGE_SIZE));
  const safeLedgerPage = Math.min(ledgerPage, ledgerTotalPages);
  const pagedLedger = activeLedger.slice((safeLedgerPage - 1) * LEDGER_PAGE_SIZE, safeLedgerPage * LEDGER_PAGE_SIZE);

  const historyTotalPages = Math.max(1, Math.ceil(activeLedger.length / HISTORY_PAGE_SIZE));
  const safeHistoryPage = Math.min(historyPage, historyTotalPages);
  const pagedHistory = activeLedger.slice((safeHistoryPage - 1) * HISTORY_PAGE_SIZE, safeHistoryPage * HISTORY_PAGE_SIZE);

  const monthOptions = useMemo(() => {
    const set = new Set([currentMonth, detailMonth]);
    payments.forEach((p) => {
      const m = monthCodeFromDate(p.date);
      if (m) set.add(m);
    });
    return [...set].sort().map((m) => ({ value: m, label: formatMonthLabel(m) }));
  }, [payments, currentMonth, detailMonth]);

  const activePaidMonth = activeEmployee ? employeeMonthPaid(activeEmployee.id, detailMonth, payments) : 0;
  const activeDueMonth = activeEmployee ? employeeMonthDue(activeEmployee, detailMonth, payments) : 0;
  const activeTotalPaid = activeEmployee ? employeeTotalPaid(activeEmployee.id, payments) : 0;

  const totalPaidAll = useMemo(() => payments.reduce((s, p) => s + (Number(p.amount) || 0), 0), [payments]);

  const summary = useMemo(
    () => computeSalarySummary(employees, payments),
    [employees, payments]
  );

  const activeOverdue = useMemo(
    () => (activeEmployee ? employeeOverdueSalary(activeEmployee, currentMonth, payments) : 0),
    [activeEmployee, currentMonth, payments]
  );

  const payTargetOverdue = useMemo(
    () => (payTarget ? employeeOverdueSalary(payTarget, currentMonth, payments) : 0),
    [payTarget, currentMonth, payments]
  );

  const handleAddEmployee = async () => {
    if (!addForm.name.trim() || !addForm.email.trim()) {
      addToast({ type: "warning", title: "Missing information", message: "Name and email are required." });
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/data?collection=employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim(),
          phone: addForm.phone.trim(),
          department: addForm.department,
          salary: parseFloat(addForm.salary) || 0,
          status: addForm.status || "Active",
          hireDate: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) throw new Error("create failed");
      const data = await res.json();
      setEmployees((prev) => [data.data, ...prev]);
      setSelectedEmployeeId(data.data.id);
      setEmployeePage(1);
      setAddForm(emptyEmployeeForm);
      setShowAddModal(false);
      addToast({ type: "success", title: "Employee Added", message: `${data.data.name} has been added.` });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to add employee." });
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing?.name?.trim()) {
      addToast({ type: "warning", title: "Missing information", message: "Name is required." });
      return;
    }
    setSavingEdit(true);
    try {
      const payload = { ...editing, salary: Number(editing.salary) || 0 };
      const res = await fetch(`/api/data?id=${editing.id}&collection=employees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("update failed");
      const data = await res.json();
      const updated = data.data || payload;
      setEmployees((prev) => prev.map((e) => (e.id === editing.id ? { ...e, ...updated } : e)));
      setShowEditModal(false);
      setEditing(null);
      addToast({ type: "success", title: "Employee Updated", message: `${updated.name} has been updated.` });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to update employee." });
    } finally {
      setSavingEdit(false);
    }
  };

  const openPayModal = (employee) => {
    setPayTarget(employee);
    setPayDate(new Date().toISOString().slice(0, 10));
    const due = employeeMonthDue(employee, monthCodeFromDate(new Date().toISOString().slice(0, 10)) || currentMonth, payments);
    setPayAmount(due > 0 ? String(due) : "");
    setPayMethod("");
    setPayPurpose("");
    setShowPayModal(true);
  };

  const handlePaySubmit = async () => {
    if (!payTarget) return;
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) {
      addToast({ type: "warning", title: "Invalid amount", message: "Payment amount must be greater than zero." });
      return;
    }
    if (!payDate) {
      addToast({ type: "warning", title: "Missing date", message: "Payment date is required." });
      return;
    }
    if (!payMethod) {
      addToast({ type: "warning", title: "Missing method", message: "Please select a payment method." });
      return;
    }
    const payMonth = monthCodeFromDate(payDate);
    const due = employeeMonthDue(payTarget, payMonth, payments);
    if (amt > due) {
      addToast({ type: "warning", title: "Exceeds salary due", message: `Amount exceeds salary due of ${formatBDT(due)} for ${formatMonthLabel(payMonth)}.` });
      return;
    }
    setPaying(true);
    try {
      const res = await fetch("/api/data?collection=salaryPayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: payTarget.id,
          employeeName: payTarget.name,
          date: payDate,
          amount: amt,
          method: payMethod,
          purpose: payPurpose.trim(),
        }),
      });
      if (!res.ok) throw new Error("pay failed");
      const data = await res.json();
      setPayments((prev) => [data.data, ...prev]);
      setLedgerPage(1);
      setShowPayModal(false);
      setPayTarget(null);
      const remaining = due - amt;
      addToast({
        type: "success",
        title: "Payment Recorded",
        message: remaining <= 0 ? `${payTarget.name} is fully paid for ${formatMonthLabel(payMonth)}.` : `Paid ${formatBDT(amt)}. Remaining due: ${formatBDT(remaining)}.`,
      });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to record payment." });
    } finally {
      setPaying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=employees`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setEmployees((prev) => prev.filter((e) => e.id !== deleting.id));
      if (selectedEmployeeId === deleting.id) {
        const remaining = employees.filter((e) => e.id !== deleting.id);
        setSelectedEmployeeId(remaining[0]?.id || "");
      }
      setShowDeleteModal(false);
      setDeleting(null);
      addToast({ type: "success", title: "Employee Deleted", message: `${deleting.name} has been removed.` });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to delete employee." });
    } finally {
      setConfirmingDelete(false);
    }
  };

  const payDuePreview = payTarget ? employeeMonthDue(payTarget, monthCodeFromDate(payDate) || currentMonth, payments) : 0;

  return (
    <PageContainer
      title="Employees"
      breadcrumb={<><span>Employee Management</span><span aria-hidden="true">/</span><span>Employees</span></>}
    >
      <section aria-label="Salary summary">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><Skeleton count={4} height={160} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryBox
              title="Total Salary Paid"
              variant="info"
              icon={<span aria-hidden="true">৳</span>}
              rows={[
                { label: "All-time staff payments", value: formatBDT(totalPaidAll) },
                { label: "Active Staff", value: summary.activeCount.toLocaleString(), tone: "muted" },
              ]}
            />
            <SummaryBox
              title="Current Month"
              variant="default"
              icon={<Calendar className="h-5 w-5" aria-hidden="true" />}
              rows={[
                { label: "Salary cycle", value: monthHeading(summary.month) || "—" },
                { label: "Active Staff", value: summary.activeCount.toLocaleString(), tone: "muted" },
              ]}
            />
            <SummaryBox
              title="Due Current Month"
              caption={monthHeading(summary.month) || "—"}
              variant={summary.dueTotal > 0 ? "warning" : "success"}
              icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
              rows={[
                { label: "Unpaid This Month", value: formatBDT(summary.dueTotal), tone: summary.dueTotal > 0 ? "error" : "muted" },
                { label: "Employees Unpaid", value: `${summary.dueCount} of ${summary.activeCount}`, tone: "muted" },
              ]}
            />
            <SummaryBox
              title="Total Overdue Amount"
              caption="Carried over arrears"
              variant={summary.overdueTotal > 0 ? "error" : "success"}
              icon={<TriangleAlert className="h-5 w-5" aria-hidden="true" />}
              rows={[
                { label: "Arrears Outstanding", value: formatBDT(summary.overdueTotal), tone: summary.overdueTotal > 0 ? "error" : "muted" },
                { label: "Employees With Arrears", value: `${summary.overdueCount} of ${summary.activeCount}`, tone: "muted" },
              ]}
            />
          </div>
        )}
      </section>

      <section aria-label="Employees and details" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <Card padding="0" className="lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
              <div>
                <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Employees</h2>
                <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"} · click to view details</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => { setAddForm(emptyEmployeeForm); setShowAddModal(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Add Employee
              </Button>
            </div>
            <div className="px-4 sm:px-5 pb-3">
              <Input placeholder="Search employees..." value={search} onChange={(e) => { setSearch(e.target.value); setEmployeePage(1); }} aria-label="Search employees" />
            </div>
            {loading ? (
              <div className="px-4 pb-4"><Skeleton count={5} height={56} /></div>
            ) : pagedEmployees.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-3)] text-center px-4 pb-8">No employees match your search.</p>
            ) : (
              <div className="px-2 pb-2 space-y-1">
                {pagedEmployees.map((emp) => {
                  const isActive = activeEmployee?.id === emp.id;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => { setSelectedEmployeeId(emp.id); setLedgerPage(1); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setSelectedEmployeeId(emp.id); setLedgerPage(1); } }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${emp.name}`}
                      className={`p-3.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors border-l-4 ${isActive ? "bg-[var(--color-base)] border-[var(--color-primary)]" : "border-transparent hover:bg-[var(--color-base)]"}`}
                    >
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-semibold text-[var(--color-ink)] truncate">{emp.name}</h4>
                        <p className="text-[11px] text-[var(--color-ink-3)] mt-0.5 truncate">Department: <span className="font-medium text-[var(--color-ink-2)]">{emp.department || "—"}</span> · {formatBDT(monthlySalary(emp))}/mo</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statusBadge(emp.status)}>{emp.status || "—"}</Badge>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditing({ ...emp }); setShowEditModal(true); }} aria-label={`Edit ${emp.name}`}>
                          <FileEdit className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {employeeTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-5 pb-4 text-xs text-[var(--color-ink-3)]">
                <span>Page {safeEmployeePage} of {employeeTotalPages}</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={safeEmployeePage <= 1} onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}>Prev</Button>
                  <Button variant="secondary" size="sm" disabled={safeEmployeePage >= employeeTotalPages} onClick={() => setEmployeePage((p) => Math.min(employeeTotalPages, p + 1))}>Next</Button>
                </div>
              </div>
            )}
          </Card>

          {activeEmployee && (
            <Card padding="5" className="lg:col-span-7">
              <div className="pb-4 border-b border-[var(--color-line)] flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center text-[length:var(--text-lg)] font-bold shrink-0" aria-hidden="true">
                    {String(activeEmployee.name || "?").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)] truncate">{activeEmployee.name}</h2>
                    <p className="text-xs text-[var(--color-ink-3)] mt-0.5 truncate">{activeEmployee.department || "—"} · <Badge variant={statusBadge(activeEmployee.status)}>{activeEmployee.status || "—"}</Badge></p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => { setHistoryPage(1); setShowHistoryModal(true); }}>
                    <History className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> View Payments
                  </Button>
<Button variant="primary" size="sm" onClick={() => openPayModal(activeEmployee)}>
                     <span aria-hidden="true" className="mr-1">৳</span> Pay Staff
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...activeEmployee }); setShowEditModal(true); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => { setDeleting(activeEmployee); setShowDeleteModal(true); }}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Delete
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                <div className="rounded-xl bg-[var(--color-base)] p-3.5">
                  <p className="text-[10px] uppercase font-bold text-[var(--color-ink-3)]">Monthly Salary</p>
                  <p className="text-sm font-extrabold text-[var(--color-ink)] mt-1">{formatBDT(monthlySalary(activeEmployee))}</p>
                </div>
                <div className="rounded-xl bg-[var(--color-base)] p-3.5">
                  <p className="text-[10px] uppercase font-bold text-[var(--color-ink-3)]">Total Paid (All-time)</p>
                  <p className="text-sm font-extrabold text-[var(--color-ink)] mt-1">{formatBDT(activeTotalPaid)}</p>
                </div>
                <div className={`rounded-xl p-3.5 ${activeOverdue > 0 ? "bg-[var(--color-error-bg)]" : "bg-[var(--color-base)]"}`}>
                  <p className="text-[10px] uppercase font-bold text-[var(--color-ink-3)]">Overdue Amount</p>
                  <p className={`text-sm font-extrabold mt-1 ${activeOverdue > 0 ? "text-[var(--color-error-text)]" : "text-[var(--color-ink)]"}`}>
                    {formatBDT(activeOverdue)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3 mt-4">
                <FormField label="Salary Month" id="detail-month" className="w-full sm:w-52">
                  <Select value={detailMonth} onChange={(e) => { setDetailMonth(e.target.value); setLedgerPage(1); }} options={monthOptions} id="detail-month" />
                </FormField>
                <div className="rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-sm">
                  <span className="text-[var(--color-ink-3)]">Paid: </span>
                  <strong className="text-[var(--color-ink)]">{formatBDT(activePaidMonth)}</strong>
                  <span className="text-[var(--color-ink-3)]"> · Due: </span>
                  <strong className={activeDueMonth > 0 ? "text-[var(--color-error)]" : "text-[var(--color-ink)]"}>{formatBDT(activeDueMonth)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                <div className="rounded-xl border border-[var(--color-line)] p-3">
                  <p className="text-[10px] uppercase font-bold text-[var(--color-ink-3)]">Email</p>
                  <p className="mt-1 text-[var(--color-ink)] break-all">{activeEmployee.email || "—"}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-line)] p-3">
                  <p className="text-[10px] uppercase font-bold text-[var(--color-ink-3)]">Phone Number</p>
                  <p className="mt-1 text-[var(--color-ink)]">{activeEmployee.phone || "—"}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-line)] p-3">
                  <p className="text-[10px] uppercase font-bold text-[var(--color-ink-3)]">Department</p>
                  <p className="mt-1 text-[var(--color-ink)]">{activeEmployee.department || "—"}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-line)] p-3">
                  <p className="text-[10px] uppercase font-bold text-[var(--color-ink-3)]">Hire Date</p>
                  <p className="mt-1 text-[var(--color-ink)]">{activeEmployee.hireDate ? String(activeEmployee.hireDate).slice(0, 10) : "—"}</p>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-bold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">Salary Payment Ledger</h4>
                {pagedLedger.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-3)] italic">No salary payments recorded for this employee.</p>
                ) : (
                  <div className="space-y-2">
                    {pagedLedger.map((p) => (
                      <div key={p.id} className="p-3 rounded-lg border border-[var(--color-line)] flex flex-wrap justify-between items-center gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--color-ink)]">{p.method || "—"} · {p.date ? String(p.date).slice(0, 10) : "—"}</p>
                          <p className="text-[11px] text-[var(--color-ink-3)] mt-0.5 truncate">{p.purpose || "Salary payment"}</p>
                        </div>
                        <span className="font-bold text-[var(--color-ink)]">{formatBDT(p.amount)}</span>
                      </div>
                    ))}
                    {ledgerTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-1 text-xs text-[var(--color-ink-3)]">
                        <span>Page {safeLedgerPage} of {ledgerTotalPages}</span>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" disabled={safeLedgerPage <= 1} onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}>Prev</Button>
                          <Button variant="secondary" size="sm" disabled={safeLedgerPage >= ledgerTotalPages} onClick={() => setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1))}>Next</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </section>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Employee"
        footer={<><Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button><Button onClick={handleAddEmployee} loading={adding}>Add Employee</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Name" required id="add-emp-name"><Input id="add-emp-name" placeholder="Full name" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} /></FormField>
          <FormField label="Email" required id="add-emp-email"><Input id="add-emp-email" type="email" placeholder="name@company.com" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} /></FormField>
          <FormField label="Phone Number" id="add-emp-phone"><Input id="add-emp-phone" type="tel" placeholder="+880..." value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))} /></FormField>
          <FormField label="Department" id="add-emp-dept"><Select options={departmentOptions} value={addForm.department} onChange={(e) => setAddForm((p) => ({ ...p, department: e.target.value }))} placeholder="Select department" id="add-emp-dept" /></FormField>
          <FormField label="Salary" id="add-emp-salary"><Input id="add-emp-salary" type="number" min="0" step="0.01" placeholder="0.00" value={addForm.salary} onChange={(e) => setAddForm((p) => ({ ...p, salary: e.target.value }))} /></FormField>
          <FormField label="Status" id="add-emp-status"><Select options={EMPLOYEE_STATUSES} value={addForm.status} onChange={(e) => setAddForm((p) => ({ ...p, status: e.target.value }))} id="add-emp-status" /></FormField>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Employee"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Name" required id="edit-emp-name"><Input value={editing.name || ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label="Email" id="edit-emp-email"><Input value={editing.email || ""} onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))} /></FormField>
            <FormField label="Phone Number" id="edit-emp-phone"><Input value={editing.phone || ""} onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))} /></FormField>
            <FormField label="Department" id="edit-emp-dept"><Select options={departmentOptions} value={editing.department || ""} onChange={(e) => setEditing((p) => ({ ...p, department: e.target.value }))} /></FormField>
            <FormField label="Salary" id="edit-emp-salary"><Input type="number" min="0" step="0.01" value={editing.salary ?? ""} onChange={(e) => setEditing((p) => ({ ...p, salary: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Status" id="edit-emp-status"><Select options={EMPLOYEE_STATUSES} value={editing.status || ""} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => { setShowPayModal(false); setPayTarget(null); }} title="Pay Staff"
        footer={<><Button variant="secondary" onClick={() => { setShowPayModal(false); setPayTarget(null); }}>Cancel</Button><Button onClick={handlePaySubmit} loading={paying}>Record Payment</Button></>}>
        <div className="space-y-3">
          <div className="rounded-lg bg-[var(--color-base)] px-3 py-2.5 text-sm" role="status" aria-live="polite">
            <p className="text-[var(--color-ink-2)]">Paying <strong className="text-[var(--color-ink)]">{payTarget?.name}</strong> · Salary due for {formatMonthLabel(monthCodeFromDate(payDate) || currentMonth)}: <strong className="text-[var(--color-ink)]">{formatBDT(payDuePreview)}</strong></p>
            <p className={`mt-1.5 flex items-baseline justify-between gap-2 rounded-md border px-2.5 py-2 ${payTargetOverdue > 0 ? "border-[var(--color-error)] bg-[var(--color-error-bg)]" : "border-[var(--color-line)]"}`}>
              <span className="text-[var(--color-ink-2)]">Overdue amount (previous months)</span>
              <strong className={payTargetOverdue > 0 ? "text-[var(--color-error-text)]" : "text-[var(--color-ink)]"}>
                {formatBDT(payTargetOverdue)}
              </strong>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Payment Date" required id="pay-date"><Input id="pay-date" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></FormField>
            <FormField label="Amount" required id="pay-amount"><Input id="pay-amount" type="number" min="0" step="0.01" placeholder="0.00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></FormField>
            <FormField label="Payment Method" required id="pay-method" className="sm:col-span-2">
              <Select options={SALARY_PAYMENT_METHODS} value={payMethod} onChange={(e) => setPayMethod(e.target.value)} placeholder="Select payment method" id="pay-method" />
            </FormField>
          </div>
          <FormField label="Purpose" id="pay-purpose"><Textarea id="pay-purpose" rows={2} placeholder="e.g. Monthly salary, advance, bonus..." value={payPurpose} onChange={(e) => setPayPurpose(e.target.value)} /></FormField>
        </div>
      </Modal>

      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Payment History — ${activeEmployee?.name || ""}`}
        footer={<Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Close</Button>}>
        {pagedHistory.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-3)]">No payment records on file.</p>
        ) : (
          <div className="space-y-2">
            {pagedHistory.map((p) => (
              <div key={p.id} className="p-3 rounded-lg border border-[var(--color-line)] flex flex-wrap justify-between items-center gap-2 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-ink)]">{p.date ? String(p.date).slice(0, 10) : "—"} · {p.method || "—"}</p>
                  <p className="text-[11px] text-[var(--color-ink-3)] mt-0.5 truncate">{p.purpose || "Salary payment"}</p>
                </div>
                <span className="font-bold text-[var(--color-ink)]">{formatBDT(p.amount)}</span>
              </div>
            ))}
            {historyTotalPages > 1 && (
              <div className="flex items-center justify-between pt-1 text-xs text-[var(--color-ink-3)]">
                <span>Page {safeHistoryPage} of {historyTotalPages}</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={safeHistoryPage <= 1} onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}>Prev</Button>
                  <Button variant="secondary" size="sm" disabled={safeHistoryPage >= historyTotalPages} onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}>Next</Button>
                </div>
              </div>
            )}
            <p className="text-xs text-[var(--color-ink-2)] text-right pt-2 border-t border-[var(--color-line)]">Total paid: <strong>{formatBDT(activeTotalPaid)}</strong></p>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Employee"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
