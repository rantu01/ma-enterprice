"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/contexts/ToastContext";
import { TrendingUp, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const categoryOptions = [
  { value: "stocks", label: "Stocks" },
  { value: "bonds", label: "Bonds" },
  { value: "real-estate", label: "Real Estate" },
  { value: "mutual-funds", label: "Mutual Funds" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const emptyForm = { name: "", amount: "", category: "", date: "", status: "", notes: "" };

export default function AddInvestmentPage() {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const res = await fetch("/api/data?collection=investments", { cache: "no-store" });
        if (res.ok) setInvestments((await res.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load investments." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Investment name is required.";
    if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = "Amount must be greater than 0.";
    if (!formData.category) e.category = "Please select a category.";
    if (!formData.date) e.date = "Date is required.";
    if (!formData.status) e.status = "Please select a status.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/data?collection=investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvestments((prev) => [data.data, ...prev]);
        setFormData(emptyForm);
        setCurrentPage(1);
        addToast({ type: "success", title: "Investment Added", message: `${data.data.name} has been added successfully.` });
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to add investment." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return investments;
    const q = search.toLowerCase();
    return investments.filter((i) => [i.name, i.category, i.status].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [investments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=investments`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setInvestments((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setShowEditModal(false); setEditing(null);
        addToast({ type: "success", title: "Investment Updated", message: "Investment has been updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to update investment." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSavingEdit(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=investments`, { method: "DELETE" });
      if (res.ok) {
        setInvestments((prev) => prev.filter((x) => x.id !== deleting.id));
        setShowDeleteModal(false); setDeleting(null);
        addToast({ type: "success", title: "Investment Deleted", message: "The investment has been removed." });
      } else addToast({ type: "error", title: "Error", message: "Failed to delete investment." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setConfirmingDelete(false); }
  };

  const columns = [
    { key: "name", label: "Investment", accessor: "name", sortable: true, minWidth: "180px", render: (v) => v || "—" },
    { key: "amount", label: "Amount", accessor: "amount", sortable: true, minWidth: "120px", render: (v) => `$${(Number(v) || 0).toLocaleString()}` },
    { key: "category", label: "Category", accessor: "category", sortable: true, minWidth: "130px", render: (v) => v || "—" },
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "120px", render: (v) => v || "—" },
    { key: "status", label: "Status", accessor: "status", sortable: true, minWidth: "110px", render: (v) => <Badge variant={v === "active" ? "active" : v === "completed" ? "completed" : "pending"}>{v || "—"}</Badge> },
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
    <PageContainer title="Add Investment" breadcrumb={<nav aria-label="Breadcrumb"><span>Accounts</span><span aria-hidden="true">/</span><span>Add Investment</span></nav>}>
      <section aria-label="Add investment form">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)] leading-tight">Add Investment</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Record a new company investment.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Investment Name" error={errors.name} id="investment-name" required>
                <Input id="investment-name" placeholder="Enter investment name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} error={!!errors.name} required />
              </FormField>
              <FormField label="Amount" error={errors.amount} id="investment-amount" required>
                <Input id="investment-amount" type="number" placeholder="Enter amount" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} error={!!errors.amount} required />
              </FormField>
              <FormField label="Category" error={errors.category} id="investment-category" required>
                <Select options={categoryOptions} value={formData.category} onChange={(e) => handleChange("category", e.target.value)} placeholder="Select category" error={!!errors.category} />
              </FormField>
              <FormField label="Date" error={errors.date} id="investment-date" required>
                <Input id="investment-date" type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} error={!!errors.date} required />
              </FormField>
              <FormField label="Status" error={errors.status} id="investment-status" required>
                <Select options={statusOptions} value={formData.status} onChange={(e) => handleChange("status", e.target.value)} placeholder="Select status" error={!!errors.status} />
              </FormField>
              <FormField label="Notes" id="investment-notes">
                <Textarea id="investment-notes" placeholder="Notes (optional)" rows={2} value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-4 mt-1 border-t border-[var(--color-line)]">
              <Button type="button" variant="secondary" size="sm" onClick={() => { setFormData(emptyForm); setErrors({}); }}>Clear</Button>
              <Button type="submit" size="sm" loading={submitting}>Add Investment</Button>
            </div>
          </form>
        </Card>
      </section>

      <section aria-label="Existing investments" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-ink)]">Investments</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
            </div>
            <Input placeholder="Search investments..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search investments" />
          </div>
          {loading ? <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div> : (
            <DataTable columns={columns} data={paginated} emptyMessage="No investments found. Add your first investment above."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Investment"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Name" id="edit-inv-name"><Input value={editing.name || ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} /></FormField>
            <FormField label="Amount" id="edit-inv-amount"><Input type="number" value={editing.amount || ""} onChange={(e) => setEditing((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></FormField>
            <FormField label="Category" id="edit-inv-cat"><Select options={categoryOptions} value={editing.category || ""} onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))} /></FormField>
            <FormField label="Status" id="edit-inv-status"><Select options={statusOptions} value={editing.status || ""} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} /></FormField>
            <FormField label="Date" id="edit-inv-date"><Input type="date" value={editing.date || ""} onChange={(e) => setEditing((p) => ({ ...p, date: e.target.value }))} /></FormField>
            <FormField label="Notes" id="edit-inv-notes"><Input value={editing.notes || ""} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Investment"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
