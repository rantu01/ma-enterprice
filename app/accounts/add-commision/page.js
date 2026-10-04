"use client";

import { useState, useEffect, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/contexts/ToastContext";
import { HandCoins, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const todayStr = () => new Date().toISOString().split("T")[0];
const emptyForm = { date: "", amount: "" };

export default function AddCommissionPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [formData, setFormData] = useState(() => ({ ...emptyForm, date: todayStr() }));
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
        const res = await fetch("/api/data?collection=commissions", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed");
        setCommissions((await res.json()).data || []);
      } catch {
        addToast({ type: "error", title: "Error", message: "Failed to load commissions." });
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
    if (!formData.date) e.date = "Date is required.";
    if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = "Amount must be greater than 0.";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev?.preventDefault?.();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/data?collection=commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          amount: parseFloat(formData.amount),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommissions((prev) => [data.data, ...prev]);
        setFormData({ ...emptyForm, date: todayStr() });
        setCurrentPage(1);
        addToast({ type: "success", title: "Commission Added", message: `Commission of ৳${formData.amount} has been recorded.` });
      } else addToast({ type: "error", title: "Error", message: "Failed to add commission." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSubmitting(false); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return commissions;
    const q = search.toLowerCase();
    return commissions.filter((c) => [c.date, String(c.amount)].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [commissions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const lifetimeTotal = useMemo(
    () => commissions.reduce((s, c) => s + (Number(c.amount) || 0), 0),
    [commissions]
  );

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/data?id=${editing.id}&collection=commissions`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data || editing;
        setCommissions((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setShowEditModal(false); setEditing(null);
        addToast({ type: "success", title: "Commission Updated", message: "Commission has been updated." });
      } else addToast({ type: "error", title: "Error", message: "Failed to update commission." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setSavingEdit(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(true);
    try {
      const res = await fetch(`/api/data?id=${deleting.id}&collection=commissions`, { method: "DELETE" });
      if (res.ok) {
        setCommissions((prev) => prev.filter((x) => x.id !== deleting.id));
        setShowDeleteModal(false); setDeleting(null);
        addToast({ type: "success", title: "Commission Deleted", message: "The commission has been removed." });
      } else addToast({ type: "error", title: "Error", message: "Failed to delete commission." });
    } catch { addToast({ type: "error", title: "Error", message: "Something went wrong." }); }
    finally { setConfirmingDelete(false); }
  };

  const columns = [
    { key: "date", label: "Date", accessor: "date", sortable: true, minWidth: "140px", render: (v) => v || "—" },
    { key: "amount", label: "Commission Amount", accessor: "amount", sortable: true, minWidth: "160px", render: (v) => `৳${(Number(v) || 0).toLocaleString()}` },
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
    <PageContainer title="Add Commission" breadcrumb={<nav aria-label="Breadcrumb"><span>Accounts</span><span aria-hidden="true">/</span><span>Add Commission</span></nav>}>
      <section aria-label="Add commission form">
        <Card padding="5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
              <HandCoins className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)] leading-tight">Add Commission</h2>
              <p className="text-xs text-[var(--color-ink-3)]">Record a new commission with its date and amount.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Date" error={formErrors.date} id="commission-date" required>
                <Input id="commission-date" type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} error={!!formErrors.date} required />
              </FormField>
              <FormField label="Commission Amount" error={formErrors.amount} id="commission-amount" required>
                <Input id="commission-amount" type="number" min="0" step="0.01" placeholder="Enter amount" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} error={!!formErrors.amount} required />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-[var(--color-line)]">
              <Button type="button" variant="secondary" size="sm" onClick={() => { setFormData({ ...emptyForm, date: todayStr() }); setFormErrors({}); }}>Clear</Button>
              <Button type="submit" size="sm" loading={submitting}>Submit</Button>
            </div>
          </form>
        </Card>
      </section>

      <section aria-label="Commission history" className="mt-6">
        <Card padding="0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
            <div>
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-ink)]">Commission History</h2>
              <p className="text-xs text-[var(--color-ink-3)]">{filtered.length} record{filtered.length === 1 ? "" : "s"} · lifetime total ৳{lifetimeTotal.toLocaleString()}</p>
            </div>
            <Input placeholder="Search commissions..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64" aria-label="Search commissions" />
          </div>
          {loading ? <div className="px-4 pb-4"><Skeleton count={5} height={48} /></div> : (
            <DataTable columns={columns} data={paginated} emptyMessage="No commissions found. Add your first commission above."
              pagination={{ currentPage: safePage, totalPages, onPageChange: setCurrentPage, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE }} />
          )}
        </Card>
      </section>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditing(null); }} title="Edit Commission"
        footer={<><Button variant="secondary" onClick={() => { setShowEditModal(false); setEditing(null); }}>Cancel</Button><Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Date" id="edit-comm-date"><Input type="date" value={editing.date || ""} onChange={(e) => setEditing((p) => ({ ...p, date: e.target.value }))} /></FormField>
            <FormField label="Commission Amount" id="edit-comm-amount"><Input type="number" min="0" step="0.01" value={editing.amount || ""} onChange={(e) => setEditing((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleting(null); }} title="Delete Commission"
        footer={<><Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleting(null); }}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={confirmingDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--color-ink-2)]">Are you sure you want to delete this commission of <strong>৳{Number(deleting?.amount || 0).toLocaleString()}</strong>? This action cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
