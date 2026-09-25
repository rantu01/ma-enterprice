"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/forms/FormField";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/contexts/ToastContext";
import { Wallet, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const depositTypeOptions = [
  { value: "savings", label: "Savings Account" },
  { value: "checking", label: "Checking Account" },
  { value: "fixed", label: "Fixed Deposit" },
  { value: "recurring", label: "Recurring Deposit" },
];

const emptyForm = { type: "", amount: "", description: "" };

export default function CompanyDepositPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
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
        const res = await fetch("/api/data?collection=deposits", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed");
        setDeposits((await res.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load deposits." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!formData.type) e.type = "Please select a deposit type.";
    if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = "Amount must be greater than 0.";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddDeposit = async (ev) => {
    ev?.preventDefault?.();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/data?collection=deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date().toISOString().split("T")[0],
          status: "processing",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits((prev) => [data.data, ...prev]);
        setFormData(emptyForm);
        setCurrentPage(1);
        addToast({ type: "success", title: "Deposit Added", message: `Deposit of $${formData.amount} has been recorded.` });
      } else addToast({ type: "error", title: "Error", message: "Failed to add deposit." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSubmitting(false); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return deposits;
    const q = search.toLowerCase();
    return deposits.filter((d) => [d.type, d.description, d.status].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [deposits, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=deposits`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setDeposits((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setShowEditModal(false); setEditing(null);
        addToast({ type: "success", title: "Deposit Updated", message: "Deposit has been updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to update deposit." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSavingEdit(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=deposits`, { method: "DELETE" });
      if (res.ok) {
        setDeposits((prev) => prev.filter((x) => x.id !== deleting.id));
        setShowDeleteModal(false); setDeleting(null);
        addToast({ type: "success", title: "Deposit Deleted", message: "The deposit has been removed." });
      } else addToast({ type: "error", title: "Error", message: "Failed to delete deposit." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setConfirmingDelete(false); }
  };

  const columns = [
    { key: "type", label: "Deposit Type", accessor: "type", sortable: true, minWidth: "160px", render: (v) => depositTypeOptions.find((o) => o.value === v)?.label || v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "120px", render: (v) => `$${(Number(v) || 0).toLocaleString()}` },
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "120px", render: (v) => v || "—" },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "130px", render: (v) => <Badge variant={v === "completed" ? "completed" : v === "pending" ? "pending" : "processing"}>{v || "—"}</Badge> },
    { key: "description", label: "Description", accessor: "description", sortable: true, minWidth: "200px", render: (v) => v || "—" },
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
    <PageContainer title="Company Deposit" breadcrumb={<nav aria-label="Breadcrumb"><span>Accounts</span><span aria-hidden="true">/</span><span>Company Deposit</span></nav>}>
      <section aria-label="Add deposit form">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)] leading-tight">Add Deposit</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Record a new company deposit.</p>
            </div>
          </div>
          <form onSubmit={handleAddDeposit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Deposit Type" error={formErrors.type} id="deposit-type" required>
                <Select options={depositTypeOptions} value={formData.type} onChange={(e) => handleChange("type", e.target.value)} placeholder="Select type" error={!!formErrors.type} />
              </FormField>
              <FormField label="Amount" error={formErrors.amount} id="deposit-amount" required>
                <Input id="deposit-amount" type="number" placeholder="Enter amount" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} error={!!formErrors.amount} required />
              </FormField>
              <FormField label="Description" id="deposit-description" className="sm:col-span-2 lg:col-span-1">
                <Input id="deposit-description" placeholder="Short description (optional)" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-[var(--color-line)]">
              <Button type="button" variant="secondary" size="sm" onClick={() => { setFormData(emptyForm); setFormErrors({}); }}>Clear</Button>
              <Button type="submit" size="sm" loading={submitting}>Add Deposit</Button>
            </div>
          </form>
        </Card>
      </section>

      <section aria-label="Deposit history" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)]">Deposit History</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <Input placeholder="Search deposits..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search deposits" />
          </div>
          {loading ? <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div> : (
            <DataTable columns={columns} data={paginated} emptyMessage="No deposits found. Add your first deposit above."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Deposit"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Type" id="edit-dep-type"><Select options={depositTypeOptions} value={editing.type || ""} onChange={(e) => setEditing((p) => ({ ...p, type: e.target.value }))} /></FormField>
            <FormField label="Amount" id="edit-dep-amount"><Input type="number" value={editing.amount || ""} onChange={(e) => setEditing((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Status" id="edit-dep-status">
              <Select options={[{ value: "processing", label: "Processing" }, { value: "pending", label: "Pending" }, { value: "completed", label: "Completed" }]} value={editing.status || ""} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} />
            </FormField>
            <FormField label="Description" id="edit-dep-desc"><Input value={editing.description || ""} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Deposit"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete this deposit of <strong>${Number(deleting?.amount || 0).toLocaleString()}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
