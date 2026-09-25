"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import FormField from "@/components/forms/FormField";
import { useToast } from "@/components/contexts/ToastContext";
import { Wallet, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const statusVariantMap = {
  Paid: "paid",
  Pending: "pending",
  Unpaid: "unpaid",
  Processing: "processing",
  Overdue: "overdue",
};

const salaryPeriodOptions = [
  { value: "January 2025", label: "January 2025" },
  { value: "February 2025", label: "February 2025" },
  { value: "March 2025", label: "March 2025" },
  { value: "April 2025", label: "April 2025" },
];

export default function SalaryDistributionPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [employees, setEmployees] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [search, setSearch] = useState("");
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
        const [empRes, salRes] = await Promise.all([
          fetch("/api/data?collection=employees", { cache: "no-store" }),
          fetch("/api/data?collection=salaries", { cache: "no-store" }),
        ]);
        if (empRes.ok) setEmployees((await empRes.json()).data || []);
        if (salRes.ok) setDistributionData((await salRes.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load salary data." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const employeeSelectOptions = [
    { value: "", label: "Select Employee" },
    ...employees.map((e) => ({ value: e.name, label: e.name })),
  ];

  const handleDistribute = async () => {
    if (!selectedEmployee || !selectedPeriod || !amount || !paymentStatus) {
      addToast({ type: "warning", title: "Missing Information", message: "Please fill in all fields to distribute salary." });
      return;
    }
    try {
      const payload = {
        employee: selectedEmployee,
        email: employees.find((e) => e.name === selectedEmployee)?.email || "",
        period: selectedPeriod,
        amount: parseFloat(amount) || 0,
        status: paymentStatus,
        date: new Date().toISOString().split("T")[0],
      };
      const res = await fetch("/api/data?collection=salaries", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setDistributionData((prev) => [data.data, ...prev]);
        addToast({ type: "success", title: "Salary Distributed", message: `Salary of $${amount} distributed successfully.` });
        setSelectedEmployee(""); setSelectedPeriod(""); setAmount(""); setPaymentStatus("");
        setCurrentPage(1);
      } else addToast({ type: "error", title: "Error", message: "Failed to distribute salary." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return distributionData;
    const q = search.toLowerCase();
    return distributionData.filter((r) => [r.employee, r.email, r.period, r.status].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [distributionData, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=salaries`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setDistributionData((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setShowEditModal(false); setEditing(null);
        addToast({ type: "success", title: "Record Updated", message: "Salary record has been updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to update record." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSavingEdit(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=salaries`, { method: "DELETE" });
      if (res.ok) {
        setDistributionData((prev) => prev.filter((x) => x.id !== deleting.id));
        setShowDeleteModal(false); setDeleting(null);
        addToast({ type: "success", title: "Record Deleted", message: "Salary record has been removed." });
      } else addToast({ type: "error", title: "Error", message: "Failed to delete record." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setConfirmingDelete(false); }
  };

  const columns = [
    {
      key: "employee", label: "Employee", accessor: "employee", sortable: true, minWidth: "180px",
      render: (val, row) => (
        <div>
          <span className="font-medium text-[var(--color-ink)]">{val || "—"}</span>
          <p className="text-xs text-[var(--color-ink-3)]">{row.email || ""}</p>
        </div>
      ),
    },
    { key: "period", label: "Salary Period", accessor: "period", sortable: true, minWidth: "150px", render: (v) => v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "120px", render: (v) => `$${Number(String(v).replace(/[^0-9.-]/g, "")) ? Number(String(v).replace(/[^0-9.-]/g, "")).toLocaleString() : (v || "—")}` },
    { key: "status", label: "Payment Status", accessor: "status", sortable: true, minWidth: "130px", render: (val) => <Badge variant={statusVariantMap[val] || "info"}>{val || "—"}</Badge> },
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "120px", render: (v) => v || "—" },
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

  return (
    <PageContainer title="Salary Distribution">
      <section aria-label="Distribute salary">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)] leading-tight">Distribute Salary</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Issue a salary payment to an employee.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select options={employeeSelectOptions} value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} placeholder="Select Employee" aria-label="Select employee" />
            <Select options={salaryPeriodOptions} value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} placeholder="Select Period" aria-label="Select salary period" />
            <Input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" aria-label="Salary amount" />
            <Select options={[{ value: "", label: "Payment Status" }, { value: "Paid", label: "Paid" }, { value: "Pending", label: "Pending" }, { value: "Processing", label: "Processing" }]} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} placeholder="Payment Status" aria-label="Payment status" />
            <Button onClick={handleDistribute} size="sm" className="lg:h-[40px]">Distribute</Button>
          </div>
        </Card>
      </section>

      <section aria-label="Distribution history" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)]">Distribution History</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <Input placeholder="Search distributions..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search distributions" />
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
            <FormField label="Employee" id="edit-sal-emp"><Input value={editing.employee || ""} onChange={(e) => setEditing((p) => ({ ...p, employee: e.target.value }))} /></FormField>
            <FormField label="Period" id="edit-sal-period"><Select options={salaryPeriodOptions} value={editing.period || ""} onChange={(e) => setEditing((p) => ({ ...p, period: e.target.value }))} /></FormField>
            <FormField label="Amount" id="edit-sal-amount"><Input type="number" value={String(editing.amount ?? "").replace(/[^0-9.-]/g, "")} onChange={(e) => setEditing((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Status" id="edit-sal-status">
              <Select options={[{ value: "Paid", label: "Paid" }, { value: "Pending", label: "Pending" }, { value: "Processing", label: "Processing" }, { value: "Unpaid", label: "Unpaid" }]} value={editing.status || ""} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} />
            </FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Salary Record"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete the salary record for <strong>{deleting?.employee}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
