"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import FormField from "@/components/forms/FormField";
import StatCard from "@/components/dashboard/StatCard";
import { useToast } from "@/components/contexts/ToastContext";
import Badge from "@/components/ui/Badge";
import { Wallet, Hourglass, Pencil, Trash2, CreditCard } from "lucide-react";
import {
  SALARY_PAYMENT_METHODS,
  formatBDT,
  formatMonthLabel,
  getCurrentMonthCode,
  monthlySalary,
  employeeMonthPaid,
  employeeMonthDue,
  monthCodeFromDate,
  paymentMethodLabel,
} from "@/lib/employee-utils";

const ITEMS_PER_PAGE = 8;

const PAYMENT_STATUSES = [
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Paid" },
  { value: "Cancelled", label: "Cancelled" },
];

export default function SalaryDistributionPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [payrolls, setPayrolls] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [purpose, setPurpose] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [distributing, setDistributing] = useState(false);

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, payRes, payrollRes] = await Promise.all([
          fetch("/api/data?collection=employees", { cache: "no-store" }),
          fetch("/api/data?collection=salaryPayments", { cache: "no-store" }),
          fetch("/api/data?collection=payrolls", { cache: "no-store" }),
        ]);
        if (empRes.ok) setEmployees((await empRes.json()).data || []);
        if (payRes.ok) setDistributionData((await payRes.json()).data || []);
        if (payrollRes.ok) setPayrolls((await payrollRes.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load salary data." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const employeeSelectOptions = useMemo(
    () => [{ value: "", label: "Select Employee" }, ...employees.map((e) => ({ value: e.id, label: `${e.name} (${formatBDT(monthlySalary(e))}/mo)` }))],
    [employees]
  );

  const activeEmployee = useMemo(
    () => employees.find((e) => String(e.id) === String(selectedEmployee)) || null,
    [employees, selectedEmployee]
  );

  const payMonth = monthCodeFromDate(payDate) || getCurrentMonthCode();
  const salaryDue = activeEmployee ? employeeMonthDue(activeEmployee, payMonth, distributionData) : 0;
  const salaryPaid = activeEmployee ? employeeMonthPaid(activeEmployee.id, payMonth, distributionData) : 0;

  const currentMonth = getCurrentMonthCode();

  const monthOptions = useMemo(() => {
    const months = new Set([currentMonth]);
    distributionData.forEach((r) => {
      const m = monthCodeFromDate(r.date);
      if (m) months.add(m);
    });
    return [...months].sort().reverse().map((m) => ({ value: m, label: formatMonthLabel(m) }));
  }, [distributionData, currentMonth]);

  const summaryMonth = monthFilter || currentMonth;

  const handleSelectEmployee = (id) => {
    setSelectedEmployee(id);
    const emp = employees.find((e) => String(e.id) === String(id));
    if (emp) {
      const due = employeeMonthDue(emp, monthCodeFromDate(payDate) || getCurrentMonthCode(), distributionData);
      setAmount(due > 0 ? String(due) : "");
    } else {
      setAmount("");
    }
  };

  const getLinkedPayroll = (employeeId, payMonth) => {
    return payrolls.find((p) => String(p.employeeId) === String(employeeId) && p.month === payMonth && p.status !== "Paid");
  };

  const handleDistribute = async () => {
    if (!activeEmployee) {
      addToast({ type: "warning", title: "Missing Information", message: "Please select an employee." });
      return;
    }
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      addToast({ type: "warning", title: "Invalid amount", message: "Amount must be greater than zero." });
      return;
    }
    if (!paymentMethod) {
      addToast({ type: "warning", title: "Missing Information", message: "Please select a payment method." });
      return;
    }
    if (amt > salaryDue) {
      addToast({ type: "warning", title: "Exceeds salary due", message: `Amount exceeds salary due of ${formatBDT(salaryDue)} for ${formatMonthLabel(payMonth)}.` });
      return;
    }
    setDistributing(true);
    try {
      const linkedPayroll = getLinkedPayroll(activeEmployee.id, payMonth);
      const payload = {
        employeeId: activeEmployee.id,
        employeeName: activeEmployee.name,
        date: payDate,
        amount: amt,
        method: paymentMethod,
        purpose: purpose.trim() || `Salary payment - ${payMonth}`,
        transactionId: transactionId.trim(),
        note: note.trim(),
        status: paymentStatus,
        payrollId: linkedPayroll ? linkedPayroll.id : "",
      };
      const res = await fetch("/api/data?collection=salaryPayments", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("distribute failed");
      const data = await res.json();
      setDistributionData((prev) => [data.data, ...prev]);
      if (linkedPayroll) {
        setPayrolls((prev) => prev.map((p) => (p.id === linkedPayroll.id ? { ...p, status: "Paid" } : p)));
      }
      const remaining = salaryDue - amt;
      addToast({
        type: "success",
        title: "Salary Distributed",
        message: remaining <= 0
          ? `${activeEmployee.name} is fully paid for ${formatMonthLabel(payMonth)}.`
          : `${formatBDT(amt)} distributed. Remaining due: ${formatBDT(remaining)}.`,
      });
      setSelectedEmployee(""); setAmount(""); setPaymentMethod(""); setPurpose("");
      setTransactionId(""); setNote(""); setPaymentStatus("Paid");
      setPayDate(new Date().toISOString().slice(0, 10));
      setCurrentPage(1);
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to distribute salary." });
    } finally {
      setDistributing(false);
    }
  };

  const filtered = useMemo(() => {
    const byMonth = monthFilter
      ? distributionData.filter((r) => monthCodeFromDate(r.date) === monthFilter)
      : distributionData;
    if (!search.trim()) return byMonth;
    const q = search.toLowerCase();
    return byMonth.filter((r) => [r.employeeName, r.employee, r.method, r.purpose, r.date, r.transactionId].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [distributionData, search, monthFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const monthPaidTotal = useMemo(
    () => distributionData.filter((p) => monthCodeFromDate(p.date) === summaryMonth).reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [distributionData, summaryMonth]
  );
  const monthDueTotal = useMemo(
    () => employees.reduce((s, e) => s + employeeMonthDue(e, summaryMonth, distributionData), 0),
    [employees, distributionData, summaryMonth]
  );
  const summaryMonthLabel = formatMonthLabel(summaryMonth);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const payload = { ...editing, amount: Number(editing.amount) || 0 };
      const res = await fetch(`/api/data?id=${editing.id}&collection=salaryPayments`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("update failed");
      const data = await res.json();
      const updated = data.data || payload;
      setDistributionData((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
      setShowEditModal(false); setEditing(null);
      addToast({ type: "success", title: "Record Updated", message: "Salary record updated. Due amounts recalculated." });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to update record." });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=salaryPayments`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setDistributionData((prev) => prev.filter((x) => x.id !== deleting.id));
      setShowDeleteModal(false); setDeleting(null);
      addToast({ type: "success", title: "Record Deleted", message: "Salary record removed. Due amounts recalculated." });
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to delete record." });
    } finally {
      setConfirmingDelete(false);
    }
  };

  const columns = [
    {
      key: "employeeName", label: "Employee", accessor: "employeeName", sortable: true, minWidth: "180px",
      render: (val, row) => (
        <div>
          <span className="font-medium text-[var(--color-ink)]">{val || row.employee || "—"}</span>
          <p className="text-xs text-[var(--color-ink-3)]">{row.date ? String(row.date).slice(0, 10) : ""}</p>
        </div>
      ),
    },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "120px", render: (v) => formatBDT(v) },
    { key: "method", label: "Method", accessor: "method", sortable: true, minWidth: "120px", render: (v) => paymentMethodLabel(v) },
    { key: "purpose", label: "Purpose", accessor: "purpose", sortable: false, minWidth: "180px", render: (v) => <span className="block max-w-55 truncate" title={v}>{v || "—"}</span> },
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "120px", render: (v) => (v ? String(v).slice(0, 10) : "—") },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "100px", render: (v) => payrollStatusBadge(v) },
    {
      key: "actions", label: "Actions", accessor: "id", minWidth: "150px",
      render: (id, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...row }); setShowEditModal(true); }}><Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Edit</Button>
          <Button variant="ghost" size="sm" className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onClick={() => { setDeleting(row); setShowDeleteModal(true); }}><Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Delete</Button>
        </div>
      ),
    },
  ];

  function payrollStatusBadge(status) {
    const map = { Paid: "active", Pending: "pending", "Partially Paid": "info", Cancelled: "cancelled" };
    return <Badge variant={map[status] || "info"}>{status}</Badge>;
  }

  return (
    <PageContainer
      title="Salary Distribution"
      breadcrumb={<><span>Employee Management</span><span aria-hidden="true">/</span><span>Salary Distribution</span></>}
    >
      <section aria-label="Month summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title={monthFilter ? `Paid — ${summaryMonthLabel}` : "Paid This Month"} value={formatBDT(monthPaidTotal)} subtext={summaryMonthLabel} icon={<span aria-hidden="true">৳</span>} variant="success" />
          <StatCard title={monthFilter ? `Salary Due — ${summaryMonthLabel}` : "Salary Due This Month"} value={formatBDT(monthDueTotal)} subtext="Outstanding across all staff" icon={<Hourglass className="h-5 w-5" aria-hidden="true" />} variant="warning" />
        </div>
      </section>

      <section aria-label="Distribute salary" className="mt-6">
        <Card padding="5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Distribute Salary</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormField label="Select Employee" required id="dist-emp">
              <Select options={employeeSelectOptions} value={selectedEmployee} onChange={(e) => handleSelectEmployee(e.target.value)} placeholder="Select Employee" id="dist-emp" />
            </FormField>
            <FormField label={`Salary Due (${formatMonthLabel(payMonth)})`} id="dist-due">
              <Input id="dist-due" value={activeEmployee ? formatBDT(salaryDue) : ""} placeholder="Select an employee first" disabled />
            </FormField>
            <FormField label="Payment Date" required id="dist-date">
              <Input id="dist-date" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </FormField>
            <FormField label="Amount" required id="dist-amount">
              <Input id="dist-amount" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </FormField>
            <FormField label="Payment Method" required id="dist-method" className="sm:col-span-2">
              <Select options={SALARY_PAYMENT_METHODS} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Select payment method" id="dist-method" />
            </FormField>
            <FormField label="Transaction ID" id="dist-txn">
              <Input id="dist-txn" placeholder="Optional" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
            </FormField>
            <FormField label="Payment Status" id="dist-status">
              <Select options={PAYMENT_STATUSES} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} id="dist-status" />
            </FormField>
            <FormField label="Purpose" id="dist-purpose" className="sm:col-span-3">
              <Input id="dist-purpose" placeholder="e.g. Monthly salary" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </FormField>
            <FormField label="Note" id="dist-note" className="sm:col-span-3">
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
            </FormField>
          </div>
          {activeEmployee && (
            <div className="mt-3 rounded-lg bg-[var(--color-base)] px-3 py-2.5 text-sm" role="status" aria-live="polite">
              <p className="text-[var(--color-ink-2)]">
                {activeEmployee.name} · Monthly salary {formatBDT(monthlySalary(activeEmployee))} · Paid {formatBDT(salaryPaid)} · <strong className="text-[var(--color-ink)]">Due {formatBDT(salaryDue)}</strong>
                {(() => {
                  const linked = getLinkedPayroll(activeEmployee.id, payMonth);
                  return linked ? ` · <span className="text-[var(--color-primary)]">Linked payroll: ${formatMonthLabel(linked.month)} ${linked.year}</span>` : "";
                })()}
              </p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-[var(--color-line)]">
            <Button variant="secondary" size="sm" onClick={() => { setSelectedEmployee(""); setAmount(""); setPaymentMethod(""); setPurpose(""); setTransactionId(""); setNote(""); setPaymentStatus("Paid"); }}>Clear</Button>
            <Button variant="primary" size="sm" onClick={handleDistribute} loading={distributing}>{distributing ? "Distributing..." : "Distribute"}</Button>
          </div>
        </Card>
      </section>

      <section aria-label="Distribution history" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Distribution History</h2>
              <p className="text-xs text-[var(--color-ink-3)]">
                {filtered.length} record{filtered.length === 1 ? "" : "s"}
                {monthFilter ? ` · ${formatMonthLabel(monthFilter)}` : " · all months"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-48">
                <Select
                  options={[{ value: "", label: "All Months" }, ...monthOptions]}
                  value={monthFilter}
                  onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                  placeholder="All Months"
                  id="history-month-filter"
                  aria-label="Filter by month"
                />
              </div>
              <div className="w-full sm:w-56">
                <Input placeholder="Search distributions..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} aria-label="Search distributions" />
              </div>
            </div>
          </div>
          {loading ? <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div> : (
            <DataTable columns={columns} data={paginated} emptyMessage="No salary distributions yet. Distribute a salary above."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Salary Record"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Amount" id="edit-sal-amount"><Input type="number" min="0" step="0.01" value={editing.amount ?? ""} onChange={(e) => setEditing((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Method" id="edit-sal-method"><Select options={SALARY_PAYMENT_METHODS} value={editing.method || ""} onChange={(e) => setEditing((p) => ({ ...p, method: e.target.value }))} /></FormField>
            <FormField label="Date" id="edit-sal-date"><Input type="date" value={editing.date ? String(editing.date).slice(0, 10) : ""} onChange={(e) => setEditing((p) => ({ ...p, date: e.target.value }))} /></FormField>
            <FormField label="Transaction ID" id="edit-sal-txn"><Input value={editing.transactionId || ""} onChange={(e) => setEditing((p) => ({ ...p, transactionId: e.target.value }))} /></FormField>
            <FormField label="Status" id="edit-sal-status"><Select options={PAYMENT_STATUSES} value={editing.status || ""} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} /></FormField>
            <FormField label="Purpose" id="edit-sal-purpose" className="sm:col-span-2"><Textarea rows={2} value={editing.purpose || ""} onChange={(e) => setEditing((p) => ({ ...p, purpose: e.target.value }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Salary Record"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Delete the {formatBDT(deleting?.amount)} payment for <strong>{deleting?.employeeName || deleting?.employee}</strong>? Salary due will be recalculated.</p>
      </Modal>
    </PageContainer>
  );
}